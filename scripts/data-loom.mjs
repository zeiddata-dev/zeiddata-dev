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
  const groups=data.categories.filter(c=>c.count>0);
  const cols=30, rows=20, cells=cols*rows;
  const unit=Math.max(1,Math.ceil(data.total/cells));
  const bx=700, by=86, bw=270, bh=170, cy=171;
  const out=[`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="360" viewBox="0 0 1000 360" role="img" aria-labelledby="title desc">`,
    `<title id="title">Data Loom: ${data.total} public commits woven into one fabric</title>`,
    `<desc id="desc">${esc(groups.map(c=>`${c.label}: ${c.count}`).join('; '))}. One central loom feeds one shared block. Each cell represents ${unit} commit(s); category colors divide the fabric. Moving signals illustrate flow, not live commits.</desc>`,
    `<defs><linearGradient id="paper" x2="0" y2="1"><stop stop-color="#d6dcd5"/><stop offset="1" stop-color="#cbd3cc"/></linearGradient></defs>`,
    `<rect width="1000" height="360" fill="url(#paper)"/>`,
    `<g font-family="ui-monospace, SFMono-Regular, Consolas, monospace" fill="#35443f">`,
    `<text x="30" y="28" font-size="12" letter-spacing="1">Z / DATA LOOM</text>`,
    `<text x="970" y="28" text-anchor="end" font-size="12">${data.total.toLocaleString('en-US')} PUBLIC COMMITS / ONE WOVEN HISTORY</text>`,
    `<path d="M30 44H970" stroke="#a9b6a9" stroke-width=".6"/>`,
    `<text x="30" y="66" font-size="10">PUBLIC HISTORY / ${esc(data.firstDate?.slice(0,10)||'EMPTY')} — ${esc(data.lastDate?.slice(0,10)||'EMPTY')}</text>`,
    `<text x="970" y="66" text-anchor="end" font-size="10">1 CELL = ${unit} COMMIT${unit===1?'':'S'}</text>`];
  // Every strand passes through the same throat, then spreads into the fabric.
  for(let j=0;j<32;j++){
    const v=j/31, y=by+v*bh, mid=cy+(v-.5)*60;
    const color=(groups[j%Math.max(1,groups.length)]||{color:'#738779'}).color;
    const start=cy+(v-.5)*155+Math.sin(j*1.7)*14;
    const path=`M32 ${start} C130 ${cy+Math.sin(j*.77)*100} 220 ${mid} 424 ${mid} L550 ${mid} C608 ${mid} 643 ${y} 700 ${y}`;
    out.push(`<path d="${path}" fill="none" stroke="${color}" stroke-width=".65" opacity=".78"/>`);
    if(j%5===0) out.push(`<circle r="1.8" fill="#fff1ce"><animateMotion dur="8s" begin="-${j*.23}s" repeatCount="indefinite" path="${path}"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.08;.94;1" dur="8s" begin="-${j*.23}s" repeatCount="indefinite"/></circle>`);
  }
  out.push('<g id="central-loom">');
  for(let k=0;k<21;k++){
    const x=426+k*6.1, extent=34+Math.sin(k/20*Math.PI)*21;
    out.push(`<path d="M${x} ${cy-extent} C${x-13} ${cy-13} ${x+13} ${cy+13} ${x} ${cy+extent}" fill="none" stroke="#7a907e" stroke-width=".65"/>`);
  }
  for(const x of [420,554]) out.push(`<path d="M${x} 100V242 M${x-4} 100h8 M${x-4} 242h8" fill="none" stroke="#8e9f90" stroke-width=".6"/>`);
  out.push('</g><g id="woven-block">');
  let offset=0;
  const ranges=groups.map(c=>{const r={...c,start:offset,end:offset+c.count};offset=r.end;return r;});
  // Column-major fill; exact overlap preserves category totals even in shared cells.
  for(let n=0;n<cells;n++){
    const x=bx+Math.floor(n/rows)*bw/cols,y=by+n%rows*bh/rows;
    const w=bw/cols,h=bh/rows;
    out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#a6b5a7" stroke-width=".35"/>`);
    for(const c of ranges){
      const a=Math.max(n*unit,c.start),b=Math.min((n+1)*unit,c.end);
      if(b<=a) continue;
      out.push(`<rect data-commits="${b-a}" data-category="${esc(c.id||c.label)}" x="${x+(a-n*unit)/unit*w}" y="${y}" width="${(b-a)/unit*w}" height="${h}" fill="${c.color}" opacity=".85"/>`);
      out.push(`<path d="M${x+1} ${y+h/2}h${w-2} M${x+w/2} ${y+1}v${h-2}" stroke="#d6ddd3" opacity=".35" stroke-width=".5"/>`);
    }
  }
  out.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="none" stroke="#536b5f" stroke-width=".7"/></g>`);
  for(const x of [bx,bx+bw]) for(const y of [by,by+bh]) out.push(`<rect x="${x-1.5}" y="${y-1.5}" width="3" height="3" fill="#35443f"/>`);
  out.push('<path d="M30 278H970" stroke="#a9b6a9" stroke-width=".6"/>');
  data.categories.filter(c=>c.count>0 || c.id!=='other').forEach((c,i)=>{
    const x=30+(i%2)*485,y=301+Math.floor(i/2)*19;
    out.push(`<rect x="${x}" y="${y-7}" width="7" height="7" fill="${c.color}"/><text x="${x+15}" y="${y}" font-size="11">${esc(c.label)} / ${c.count.toLocaleString('en-US')}</text>`);
  });
  out.push(`<text x="30" y="347" font-size="9" fill="#68796c">${data.repositories.length} PUBLIC REPOSITORIES / DAILY SNAPSHOT / CATEGORY = REPOSITORY WORK AREA</text>`,
    `<text x="970" y="347" text-anchor="end" font-size="9" fill="#68796c">CHECKED ${esc(data.checkedAt.slice(0,10))} UTC</text></g></svg>`);
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
  writeFileSync(resolve(root,'data/data-loom.md'),`# Data Loom sources\n\nChecked ${data.checkedAt}. **${data.total} unique public commits**.\n\n${data.scope}\n\nRepository topics determine the work-area category, with explicit overrides in [the generator](../scripts/data-loom.mjs). This classifies projects, not individual commit intent. Commits shared across forks count once, preferring non-forks, then repository name. Private work, other owners' repositories, unmatched author identities, and commits only on non-default branches are outside this view. Commits measure activity, not effort or completed deliverables. Default-branch history or visibility changes can lower totals.\n\nOne shared woven block stores the counts, filled down columns from left to right. Category colors occupy proportional portions of the same fabric. Each cell has the displayed commit weight; partial cells preserve exact counts. Empty cells are spare capacity, not a completion target. The cell weight grows when needed. Moving highlights are decorative and never add counts. Refresh runs daily; API errors fail the run rather than publishing a partial result.\n\n| Work area | Commits |\n| --- | ---: |\n${totals.map(c=>`| ${c.label} | ${c.count} |`).join('\n')}\n\n| Repository | Category | Commits |\n| --- | --- | ---: |\n${included.map(r=>`| [${r.name}](${r.url}) | ${categories.find(c=>c.id===r.category).label} | ${r.count} |`).join('\n')}\n`);
  console.log(`Total: ${seen.size} unique commits across ${included.length} repositories`);
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) await main();
