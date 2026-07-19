// Renders commit-clock.svg: an animated 24-hour radar dial of recent commits by
// time of day — spoke length is commits per hour, and a rotating sweep flares
// each spoke as it passes.
// Usage: GITHUB_TOKEN=... node scripts/commit-clock.mjs <username> <output.svg>
// Data: GitHub commit search API (public commits only), latest 300 by author date.

import { writeFileSync } from "node:fs";

const [username, output] = process.argv.slice(2);
const token = process.env.GITHUB_TOKEN;
// "all" when the token can see private repos, "public" otherwise; drives the card label
const scope = process.env.CLOCK_SCOPE === "all" ? "all" : "public";
const TIME_ZONE = "America/Chicago";
const PAGES = 3;

if (!username || !output) {
  console.error("Usage: node commit-clock.mjs <username> <output.svg>");
  process.exit(1);
}
if (!token) {
  console.error("GITHUB_TOKEN environment variable is required");
  process.exit(1);
}

const hourFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  hour12: false,
});

async function fetchCommitDates() {
  const dates = [];
  for (let page = 1; page <= PAGES; page++) {
    const url =
      `https://api.github.com/search/commits?q=author:${username}` +
      `&sort=author-date&order=desc&per_page=100&page=${page}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": username,
      },
    });
    if (!res.ok) {
      throw new Error(`commit search failed: ${res.status} ${await res.text()}`);
    }
    const body = await res.json();
    for (const item of body.items) {
      dates.push(item.commit.author.date);
    }
    if (body.items.length < 100) break;
  }
  return dates;
}

const BUCKETS = [
  { key: "morning", label: "Morning", emoji: "\u{1F305}", from: 6, to: 12 },
  { key: "daytime", label: "Daytime", emoji: "\u{1F3D9}", from: 12, to: 18 },
  { key: "evening", label: "Evening", emoji: "\u{1F306}", from: 18, to: 24 },
  { key: "night", label: "Night", emoji: "\u{1F319}", from: 0, to: 6 },
];

function bucketize(dates) {
  const counts = { morning: 0, daytime: 0, evening: 0, night: 0 };
  const hours = new Array(24).fill(0);
  for (const iso of dates) {
    const hour = Number(hourFmt.format(new Date(iso))) % 24;
    hours[hour]++;
    const bucket = BUCKETS.find((b) => hour >= b.from && hour < b.to);
    counts[bucket.key]++;
  }
  return { counts, hours };
}

const PALETTES = {
  dark: {
    bg: "#161a20", border: "#2a2f38", verdict: "#e8c37e", subtext: "#8b93a1",
    label: "#e6e1d6", count: "#e8c37e", pct: "#8b93a1", track: "#2a2f38",
    spoke: "#d76233", spokeBright: "#e8c37e", sweep: "#e8c37e",
  },
  light: {
    bg: "#fdfaf4", border: "#e3d9c6", verdict: "#b5471f", subtext: "#6f6a5f",
    label: "#20242c", count: "#b5471f", pct: "#6f6a5f", track: "#ece5d4",
    spoke: "#d76233", spokeBright: "#b5471f", sweep: "#b5471f",
  },
};

// One full radar revolution, in seconds. Spoke afterglow timing derives from this.
const SWEEP_SECONDS = 12;

function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

const fmt = (n) => Number(n.toFixed(1));

function renderSVG(counts, hours, total, p) {
  const dayCount = counts.morning + counts.daytime;
  const verdict =
    dayCount >= total - dayCount
      ? "I'm an early bird \u{1F424}"
      : "I'm a night owl \u{1F989}";

  // full readme width: radar dial on the left, bucket bars on the right
  const W = 880;
  const H = 424;
  const cx = 250;
  const cy = 240;
  const R = 145;      // outer grid ring
  const r0 = 22;      // spoke inner radius
  const rMax = 137;   // spoke outer radius at max count
  const maxCount = Math.max(...hours, 1);
  // hour 0 (midnight) points up; hours advance clockwise like a 24h dial
  const angle = (h) => h * 15 - 90;

  const grid = [R, (R * 2) / 3, R / 3]
    .map((r) => `  <circle cx="${cx}" cy="${cy}" r="${fmt(r)}" fill="none" stroke="${p.track}" stroke-width="1" />`)
    .join("\n");

  const crosshair =
    `  <line x1="${cx - R}" y1="${cy}" x2="${cx + R}" y2="${cy}" stroke="${p.track}" stroke-width="1" opacity="0.6" />\n` +
    `  <line x1="${cx}" y1="${cy - R}" x2="${cx}" y2="${cy + R}" stroke="${p.track}" stroke-width="1" opacity="0.6" />`;

  const ticks = hours
    .map((_, h) => {
      const [x1, y1] = polar(cx, cy, R - 4, angle(h));
      const [x2, y2] = polar(cx, cy, R, angle(h));
      return `  <line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" stroke="${p.subtext}" stroke-width="1" opacity="0.5" />`;
    })
    .join("\n");

  const spokes = hours
    .map((count, h) => {
      const len = r0 + Math.max(4, (count / maxCount) * (rMax - r0));
      const [x1, y1] = polar(cx, cy, r0, angle(h));
      const [x2, y2] = polar(cx, cy, len, angle(h));
      const line = (stroke, extra) =>
        `  <line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" stroke="${stroke}" stroke-width="8" stroke-linecap="round"${extra} />`;
      // dim base spoke, plus a bright copy that flares when the sweep passes
      // this hour and decays over the rest of the revolution
      const begin = fmt((h / 24) * SWEEP_SECONDS);
      const glow =
        `  <line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" stroke="${p.spokeBright}" stroke-width="8" stroke-linecap="round" opacity="0">\n` +
        `    <animate attributeName="opacity" values="1;0.25;0" keyTimes="0;0.3;1" dur="${SWEEP_SECONDS}s" begin="${begin}s" repeatCount="indefinite" />\n` +
        `  </line>`;
      return line(p.spoke, ' opacity="0.45"') + "\n" + glow;
    })
    .join("\n");

  // trailing wedges behind the sweep line, fading with distance
  const wedges = [0.3, 0.18, 0.1, 0.04]
    .map((op, i) => {
      const lead = -90 - i * 10;
      const trail = lead - 10;
      const [lx, ly] = polar(cx, cy, R, lead);
      const [tx, ty] = polar(cx, cy, R, trail);
      return `    <path d="M ${cx} ${cy} L ${fmt(tx)} ${fmt(ty)} A ${R} ${R} 0 0 1 ${fmt(lx)} ${fmt(ly)} Z" fill="${p.sweep}" opacity="${op}" />`;
    })
    .join("\n");

  const [sx, sy] = polar(cx, cy, R, -90);
  const sweep = `  <g>
${wedges}
    <line x1="${cx}" y1="${cy}" x2="${fmt(sx)}" y2="${fmt(sy)}" stroke="${p.sweep}" stroke-width="2" />
    <animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="${SWEEP_SECONDS}s" repeatCount="indefinite" />
  </g>`;

  // quadrant markers: midnight up, 06 right, 12 down, 18 left
  const markers = [
    { h: 0, label: "00" },
    { h: 6, label: "06" },
    { h: 12, label: "12" },
    { h: 18, label: "18" },
  ]
    .map(({ h, label }) => {
      const [x, y] = polar(cx, cy, R + 14, angle(h));
      return `  <text x="${fmt(x)}" y="${fmt(y + 4)}" text-anchor="middle" class="marker">${label}</text>`;
    })
    .join("\n");

  const rowH = 42;
  const labelX = 520;
  const barX = 650;
  const barMax = W - barX - 130;
  const rowTop = cy - (BUCKETS.length * rowH) / 2 + 4;
  const maxBucket = Math.max(...Object.values(counts), 1);
  const legend = BUCKETS.map((b, i) => {
    const y = rowTop + i * rowH;
    const count = counts[b.key];
    const pct = total ? ((count / total) * 100).toFixed(1) : "0.0";
    const w = Math.max(3, Math.round((count / maxBucket) * barMax));
    const fill = i % 2 === 0 ? "#d76233" : "#c08a52";
    return `  <text x="${labelX}" y="${y + 17}" class="label">${b.emoji} ${b.label}</text>
  <rect x="${barX}" y="${y + 4}" width="${barMax}" height="16" rx="8" fill="${p.track}" />
  <rect x="${barX}" y="${y + 4}" width="${w}" height="16" rx="8" fill="${fill}" />
  <text x="${barX + barMax + 14}" y="${y + 17}" class="count">${count}</text>
  <text x="${W - 24}" y="${y + 17}" text-anchor="end" class="pct">${pct}%</text>`;
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>
    .verdict { font: 600 18px "Segoe UI", Ubuntu, sans-serif; fill: ${p.verdict}; }
    .subtext { font: 400 12px "Segoe UI", Ubuntu, sans-serif; fill: ${p.subtext}; }
    .label   { font: 600 13px "Segoe UI", Ubuntu, sans-serif; fill: ${p.label}; }
    .count   { font: 600 13px "Segoe UI", Ubuntu, sans-serif; fill: ${p.count}; }
    .pct     { font: 400 13px "Segoe UI", Ubuntu, sans-serif; fill: ${p.pct}; }
    .marker  { font: 600 11px "Segoe UI", Ubuntu, sans-serif; fill: ${p.subtext}; }
  </style>
  <rect width="${W}" height="${H}" rx="10" fill="${p.bg}" stroke="${p.border}" stroke-width="1" />
  <text x="24" y="36" class="verdict">${verdict}</text>
  <text x="24" y="58" class="subtext">last ${total}${scope === "public" ? " public" : ""} commits by local time (${TIME_ZONE})</text>
${grid}
${crosshair}
${ticks}
${spokes}
${sweep}
${markers}
${legend}
</svg>
`;
}

const dates = await fetchCommitDates();
const { counts, hours } = bucketize(dates);
console.log(`Fetched ${dates.length} commits:`, counts);
const lightOutput = output.replace(/\.svg$/, "-light.svg");
writeFileSync(output, renderSVG(counts, hours, dates.length, PALETTES.dark));
writeFileSync(lightOutput, renderSVG(counts, hours, dates.length, PALETTES.light));
console.log(`wrote ${output} and ${lightOutput}`);
