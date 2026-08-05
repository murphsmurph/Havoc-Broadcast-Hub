// Fetch the SPHL daily report (public, NO KEY NEEDED), parse it with the
// shared parser, and write data/sphl-daily.json (+ the raw HTML for
// debugging/manual-import testing). Run by .github/workflows/sphl-daily.yml.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const ROOT=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const {parse}=require(path.join(ROOT,'js','daily-report-parser.js'));

const URLS=[
  'https://cluster.leaguestat.com/download.php?client_code=sphl&file_path=daily-report/daily-report.html',
  'https://lsadmin.hockeytech.com/download.php?client_code=sphl&file_path=daily-report/daily-report.html'
];

async function fetchText(u,ms){
  const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),ms||30000);
  try{
    const res=await fetch(u,{signal:ctl.signal,headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36','Accept':'*/*'}});
    if(!res.ok)throw new Error('HTTP '+res.status);
    return await res.text();
  }finally{clearTimeout(t);}
}

let html='',sourceUrl='';
for(const u of URLS){
  try{
    const t=await fetchText(u);
    if(t&&t.length>2000&&/<table/i.test(t)){html=t;sourceUrl=u;break;}
    console.warn('Fetched but not report-like ('+(t?t.length:0)+' bytes): '+u);
  }catch(e){console.warn('Fetch failed: '+u+' — '+e.message);}
}
if(!html){console.error('Could not fetch the daily report from any URL.');process.exit(1);}

fs.mkdirSync(path.join(ROOT,'data'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'data','sphl-daily.html'),html);
console.log('Raw report saved ('+html.length+' bytes) from '+sourceUrl);

const rep=parse(html);
const summary=Object.entries(rep.parsed).map(([k,v])=>k+(v?' ✓':' ✗')).join(' · ');
console.log('Parse: '+summary);
console.log('Counts: standings='+rep.standings.length+' skaters='+rep.skaters.length+' goalies='+rep.goalies.length
  +' pp='+rep.specialTeams.pp.length+' pk='+rep.specialTeams.pk.length+' sections='+rep.sections.length);
rep.sections.forEach(s=>console.log('  section: "'+s.title+'" ['+s.headers.join('|')+'] rows='+s.rows));

if(Object.values(rep.parsed).some(Boolean)){
  fs.writeFileSync(path.join(ROOT,'data','sphl-daily.json'),
    JSON.stringify({fetchedAt:new Date().toISOString(),sourceUrl,...rep},null,1)+'\n');
  console.log('Wrote data/sphl-daily.json (generatedDate: '+(rep.generatedDate||'unknown')+')');
}else{
  console.warn('No sections parsed — keeping the previous sphl-daily.json; raw HTML committed for parser debugging.');
}
