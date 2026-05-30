import os
import json
import urllib.request
from datetime import datetime, timezone


def graphql(token, query, variables=None):
    payload = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        "https://api.github.com/graphql",
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "stats-generator",
        },
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


TOKEN = os.environ["GITHUB_TOKEN"]
USERNAME = os.environ.get("STATS_USER", "zeiddata-dev")

QUERY = """
query($login: String!) {
  user(login: $login) {
    repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC) {
      totalCount
      nodes {
        stargazerCount
        primaryLanguage { name }
      }
    }
    pullRequests(states: MERGED) { totalCount }
    contributionsCollection {
      totalCommitContributions
      totalIssueContributions
    }
  }
}
"""

data = graphql(TOKEN, QUERY, {"login": USERNAME})
user = data["data"]["user"]

repos      = user["repositories"]["nodes"]
total_repos   = user["repositories"]["totalCount"]
total_stars   = sum(r["stargazerCount"] for r in repos)
total_commits = user["contributionsCollection"]["totalCommitContributions"]
total_prs     = user["pullRequests"]["totalCount"]

lang_counts = {}
for r in repos:
    if r["primaryLanguage"]:
        n = r["primaryLanguage"]["name"]
        lang_counts[n] = lang_counts.get(n, 0) + 1
top_langs = "  ·  ".join(k for k, _ in sorted(lang_counts.items(), key=lambda x: -x[1])[:3]) or "—"

now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

svg = f"""<svg width="495" height="200" viewBox="0 0 495 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .lbl  {{ font: 600 10px 'Courier New', monospace; fill: #7B61FF; letter-spacing: 1px; }}
    .val  {{ font: 700 22px 'Courier New', monospace; fill: #e6edf3; }}
    .sub  {{ font: 400 10px 'Courier New', monospace; fill: #6e7681; }}
    .ttl  {{ font: 700 12px 'Courier New', monospace; fill: #00B8A9; letter-spacing: 3px; }}
    .lng  {{ font: 400 12px 'Courier New', monospace; fill: #FFB800; }}
  </style>
  <rect width="495" height="200" rx="8" fill="#0d1117"/>
  <rect x="0.5" y="0.5" width="494" height="199" rx="7.5" fill="transparent" stroke="#00B8A9" stroke-opacity="0.25"/>
  <rect width="495" height="38" rx="8" fill="#00B8A9" fill-opacity="0.07"/>
  <rect x="0" y="35" width="495" height="3" fill="#00B8A9" fill-opacity="0.4"/>
  <text x="18" y="24" class="ttl">ZEID DATA  //  SIGNAL STATS</text>
  <text x="30"  y="72" class="lbl">COMMITS</text>
  <text x="30"  y="96" class="val">{total_commits:,}</text>
  <text x="30"  y="111" class="sub">this year</text>
  <text x="155" y="72" class="lbl">STARS</text>
  <text x="155" y="96" class="val">{total_stars:,}</text>
  <text x="155" y="111" class="sub">across repos</text>
  <text x="275" y="72" class="lbl">PRS MERGED</text>
  <text x="275" y="96" class="val">{total_prs:,}</text>
  <text x="275" y="111" class="sub">all time</text>
  <text x="400" y="72" class="lbl">REPOS</text>
  <text x="400" y="96" class="val">{total_repos}</text>
  <text x="400" y="111" class="sub">public</text>
  <line x1="18" y1="127" x2="477" y2="127" stroke="#21262d" stroke-width="1"/>
  <text x="30"  y="148" class="sub">TOP LANGUAGES</text>
  <text x="30"  y="166" class="lng">{top_langs}</text>
  <text x="477" y="189" class="sub" text-anchor="end">updated {now}</text>
</svg>"""

os.makedirs("dist", exist_ok=True)
with open("dist/stats.svg", "w") as f:
    f.write(svg)

print(f"PASS commits={total_commits} stars={total_stars} prs={total_prs} repos={total_repos}")
