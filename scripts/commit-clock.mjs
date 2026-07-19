// Renders commit-clock.svg: distribution of recent public commits by time of day.
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
  for (const iso of dates) {
    const hour = Number(hourFmt.format(new Date(iso))) % 24;
    const bucket = BUCKETS.find((b) => hour >= b.from && hour < b.to);
    counts[bucket.key]++;
  }
  return counts;
}

const PALETTES = {
  dark: {
    bg: "#161a20", border: "#2a2f38", verdict: "#e8c37e", subtext: "#8b93a1",
    label: "#e6e1d6", count: "#e8c37e", pct: "#8b93a1", track: "#2a2f38",
  },
  light: {
    bg: "#fdfaf4", border: "#e3d9c6", verdict: "#b5471f", subtext: "#6f6a5f",
    label: "#20242c", count: "#b5471f", pct: "#6f6a5f", track: "#ece5d4",
  },
};

function renderSVG(counts, total, p) {
  const dayCount = counts.morning + counts.daytime;
  const verdict =
    dayCount >= total - dayCount
      ? "I'm an early bird \u{1F424}"
      : "I'm a night owl \u{1F989}";

  const W = 880;
  const rowH = 34;
  const top = 78;
  const H = top + BUCKETS.length * rowH + 24;
  const barX = 150;
  const barMax = W - 280;
  const maxCount = Math.max(...Object.values(counts), 1);

  const rows = BUCKETS.map((b, i) => {
    const y = top + i * rowH;
    const count = counts[b.key];
    const pct = total ? ((count / total) * 100).toFixed(1) : "0.0";
    const w = Math.max(3, Math.round((count / maxCount) * barMax));
    const fill = i % 2 === 0 ? "#d76233" : "#c08a52";
    return `
    <text x="24" y="${y + 17}" class="label">${b.emoji} ${b.label}</text>
    <rect x="${barX}" y="${y + 4}" width="${barMax}" height="16" rx="8" fill="${p.track}" />
    <rect x="${barX}" y="${y + 4}" width="${w}" height="16" rx="8" fill="${fill}" />
    <text x="${barX + barMax + 16}" y="${y + 17}" class="count">${count}</text>
    <text x="${W - 24}" y="${y + 17}" text-anchor="end" class="pct">${pct}%</text>`;
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>
    .verdict { font: 600 18px "Segoe UI", Ubuntu, sans-serif; fill: ${p.verdict}; }
    .subtext { font: 400 12px "Segoe UI", Ubuntu, sans-serif; fill: ${p.subtext}; }
    .label   { font: 600 14px "Segoe UI", Ubuntu, sans-serif; fill: ${p.label}; }
    .count   { font: 600 13px "Segoe UI", Ubuntu, sans-serif; fill: ${p.count}; }
    .pct     { font: 400 13px "Segoe UI", Ubuntu, sans-serif; fill: ${p.pct}; }
  </style>
  <rect width="${W}" height="${H}" rx="10" fill="${p.bg}" stroke="${p.border}" stroke-width="1" />
  <text x="24" y="36" class="verdict">${verdict}</text>
  <text x="24" y="58" class="subtext">last ${total}${scope === "public" ? " public" : ""} commits by local time (${TIME_ZONE})</text>
${rows}
</svg>
`;
}

const dates = await fetchCommitDates();
const counts = bucketize(dates);
console.log(`Fetched ${dates.length} commits:`, counts);
const lightOutput = output.replace(/\.svg$/, "-light.svg");
writeFileSync(output, renderSVG(counts, dates.length, PALETTES.dark));
writeFileSync(lightOutput, renderSVG(counts, dates.length, PALETTES.light));
console.log(`wrote ${output} and ${lightOutput}`);
