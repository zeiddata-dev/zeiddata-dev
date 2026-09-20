// Public default-branch commits attributed by GitHub to this account.
// Local: node scripts/data-loom.mjs zeiddata-dev --gh
// Actions: GH_TOKEN=... node scripts/data-loom.mjs zeiddata-dev
import {execFileSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';

const owner=process.argv[2] || 'zeiddata-dev';
const useGh=process.argv.includes('--gh');
const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const categories=[
  {id:'research',label:'Security & Research',color:'#506b65'},
  {id:'apps',label:'Apps & Automation',color:'#738779'},
  {id:'design',label:'Web & Design',color:'#8c806d'},
  {id:'publishing',label:'Reports & Publishing',color:'#687c8d'},
  {id:'other',label:'Other / Unclassified',color:'#8b8d87'},
];
const overrides={
  'zdesign':'design', 'aac-email-assets':'publishing',
  'invisible-playwright-report':'publishing',
};
export function classify(repo){
  if(overrides[repo.name]) return overrides[repo.name];
  const topics=new Set(repo.topics || []);
  const has=(...xs)=>xs.some(x=>topics.has(x));
  if(has('reporting','email-assets','email-signature','test-report','marketing-analytics')) return 'publishing';
  if(has('security-research','cybersecurity','security-tools','osint','ai-research','ai-governance','research')) return 'research';
  if(has('frontend','print-design','static-site','web-layout','web-animation','ui-components','dashboard-template','product-gallery')) return 'design';
  if(has('automation','developer-tools','desktop-app','cli','mcp','python','typescript','javascript','c','rust','kotlin','ai','llm','matrix','sdk')) return 'apps';
  return 'other';
}
async function api(path){
  if(useGh) return JSON.parse(execFileSync('gh',['api',path],{encoding:'utf8',maxBuffer:32*1024*1024}));
  const token=process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if(!token) throw new Error('GH_TOKEN is required');
  const r=await fetch('https://api.github.com/'+path,{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','User-Agent':'zeid-data-loom'}});
  if(!r.ok) throw new Error(`GitHub ${r.status} at ${path}: refresh aborted; existing art preserved`);
  return r.json();
}
async function pages(path){
  let all=[];
  for(let page=1;;page++){
    const values=await api(`${path}${path.includes('?')?'&':'?'}per_page=100&page=${page}`);
    if(!Array.isArray(values)) throw new Error('Expected a paginated list');
    all.push(...values);
    if(values.length<100) return all;
  }
}
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function render(data){
  const rows=data.categories.filter(c=>c.count>0);
  if(!rows.length) rows.push({...categories[0],count:0});
  const max=Math.max(1,...rows.map(c=>c.count));
  // Shared scale. Each tile has a precise weight; last tile may be partial.
  const unit=Math.max(1,Math.ceil(max/40));
  const H=150+rows.length*49;
  let out=[`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${H}" viewBox="0 0 1000 ${H}" role="img" aria-labelledby="title desc">`,
    `<title id="title">Data Loom: ${data.total} public commits by work area</title>`,
    `<desc id="desc">${esc(rows.map(c=>`${c.label}: ${c.count}`).join('; '))}. All available default-branch history in owned public repositories, including personal commits in forks. Tile equals ${unit} commits. Categories describe repositories, not the purpose of individual commits. Animated highlights are illustrative.</desc>`,
    `<defs><linearGradient id="paper" x2="0" y2="1"><stop stop-color="#d6dcd5"/><stop offset="1" stop-color="#cbd3cc"/></linearGradient></defs>`,
    `<rect width="1000" height="${H}" fill="url(#paper)"/>`,
    `<g font-family="ui-monospace, SFMono-Regular, Consolas, monospace" fill="#35443f">`,
    `<text x="30" y="29" font-size="13" letter-spacing="1">Z / DATA LOOM</text>`,
    `<text x="970" y="29" text-anchor="end" font-size="12">${data.total.toLocaleString('en-US')} PUBLIC COMMITS</text>`,
    `<path d="M30 45H970" stroke="#a9b6a9" stroke-width=".6"/>`,
    `<text x="30" y="69" font-size="10">PUBLIC HISTORY / ${esc(data.firstDate?.slice(0,10)||'EMPTY')} — ${esc(data.lastDate?.slice(0,10)||'EMPTY')}</text>`,
    `<text x="970" y="69" text-anchor="end" font-size="10">1 TILE = ${unit} COMMIT${unit===1?'':'S'} / PARTIAL TILE = REMAINDER</text>`];
  rows.forEach((c,i)=>{
    const y=108+i*49, color=c.color;
    // Uneven input resolves into a horizontal warp, then an exact tile row.
    for(let j=0;j<7;j++){
      const dy=(j-3)*2.8, sy=y+Math.sin(j*1.7+i)*14;
      const path=`M32 ${sy} C110 ${y+Math.sin(j+i)*26} 220 ${y+dy} 310 ${y+dy} S405 ${y+dy} 464 ${y+dy} C480 ${y+dy} 486 ${y} 506 ${y}`;
      out.push(`<path d="${path}" fill="none" stroke="${color}" stroke-width=".65" opacity=".8"/>`);
      if(j===3) out.push(`<circle r="2" fill="#f9f0d8"><animateMotion dur="7s" begin="-${i*1.6}s" repeatCount="indefinite" path="${path}"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.08;.9;1" dur="7s" begin="-${i*1.6}s" repeatCount="indefinite"/></circle>`);
    }
    for(let k=0;k<12;k++) out.push(`<path d="M${325+k*6} ${y-14} q-6 14 0 28" fill="none" stroke="${color}" stroke-width=".5" opacity=".7"/>`);
    out.push(`<text x="506" y="${y-13}" font-size="11">${esc(c.label)}</text><text x="970" y="${y-13}" text-anchor="end" font-size="11">${c.count.toLocaleString('en-US')}</text>`);
    for(let k=0;k<40;k++){
      const x=506+k*11.6, frac=Math.max(0,Math.min(1,(c.count-k*unit)/unit));
      out.push(`<rect x="${x}" y="${y-5}" width="9.5" height="13" fill="none" stroke="#a7b4a7" stroke-width=".6"/>`);
      if(frac>0) out.push(`<rect x="${x}" y="${y-5}" width="${9.5*frac}" height="13" fill="${color}"/>`);
    }
  });
  out.push(`<path d="M30 ${H-47}H970" stroke="#a9b6a9" stroke-width=".6"/>`,
    `<text x="30" y="${H-25}" font-size="10">${data.repositories.length} REPOSITORIES / UNIQUE AUTHOR COMMITS / DAILY SNAPSHOT</text>`,
    `<text x="970" y="${H-25}" text-anchor="end" font-size="10">CHECKED ${esc(data.checkedAt.slice(0,10))} UTC</text></g></svg>`);
  return out.join('\n');
}

async function main(){
  let repos=(await pages(`users/${encodeURIComponent(owner)}/repos?type=owner&sort=full_name`))
    .filter(r=>!r.private && r.owner.login.toLowerCase()===owner.toLowerCase() && r.name.toLowerCase()!==owner.toLowerCase() && r.size>0)
    .sort((a,b)=>Number(a.fork)-Number(b.fork)||a.name.localeCompare(b.name));
  const seen=new Set(), included=[], dates=[];
  for(const repo of repos){
    const commits=await pages(`repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo.name)}/commits?author=${encodeURIComponent(owner)}&sha=${encodeURIComponent(repo.default_branch)}`);
    let count=0;
    for(const commit of commits){
      if(commit.author?.login?.toLowerCase()!==owner.toLowerCase() || seen.has(commit.sha)) continue;
      seen.add(commit.sha);count++;dates.push(commit.commit.author.date);
    }
    if(count) included.push({name:repo.name,url:repo.html_url,category:classify(repo),count,fork:repo.fork,branch:repo.default_branch});
    console.log(`${repo.name}: ${count}`);
  }
  dates.sort();
  const totals=categories.map(c=>({...c,count:included.filter(r=>r.category===c.id).reduce((n,r)=>n+r.count,0)}));
  const data={schema:1,owner,checkedAt:new Date().toISOString(),scope:'Unique commits attributed to owner on the current default branches of owned public repositories, including forks; profile repository excluded.',firstDate:dates[0]||null,lastDate:dates.at(-1)||null,total:seen.size,categories:totals,repositories:included};
  mkdirSync(resolve(root,'assets'),{recursive:true});
  mkdirSync(resolve(root,'data'),{recursive:true});
  writeFileSync(resolve(root,'assets/data-loom.svg'),render(data));
  writeFileSync(resolve(root,'data/data-loom.json'),JSON.stringify(data,null,2)+'\n');
  writeFileSync(resolve(root,'data/data-loom.md'),`# Data Loom sources\n\nChecked ${data.checkedAt}. **${data.total} unique public commits**.\n\n${data.scope}\n\nRepository topics determine the work-area category, with explicit overrides in [the generator](../scripts/data-loom.mjs). This classifies projects, not individual commit intent. Commits shared across forks count once, preferring non-forks, then repository name. Private work, other owners' repositories, unmatched author identities, and commits only on non-default branches are outside this view. Commits measure activity, not effort or completed deliverables. Default-branch history or visibility changes can lower totals.\n\nFilled tiles are the stored counts, not a completion target. All rows share a scale; a final partial tile represents the remainder. The scale grows when needed. Moving highlights are decorative and never add counts. Refresh runs daily; API errors fail the run rather than publishing a partial result.\n\n| Work area | Commits |\n| --- | ---: |\n${totals.map(c=>`| ${c.label} | ${c.count} |`).join('\n')}\n\n| Repository | Category | Commits |\n| --- | --- | ---: |\n${included.map(r=>`| [${r.name}](${r.url}) | ${categories.find(c=>c.id===r.category).label} | ${r.count} |`).join('\n')}\n`);
  console.log(`Total: ${seen.size} unique commits across ${included.length} repositories`);
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) await main();
