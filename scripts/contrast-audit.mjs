// Contrast audit: every visible text element on every tab, measured against the
// background actually painted behind it. WCAG AA: 4.5:1 normal, 3:1 large/bold.
// WCAG AA contrast audit of the app UI in both themes at iPhone size.
//   node scripts/contrast-audit.mjs        (needs playwright + a chromium build)
// Paper previews are skipped — they are printed output and always a white sheet.
import {chromium,devices} from 'playwright';
import path from 'node:path';
const AUDIT=`(()=>{
  const lum=c=>{const [r,g,b]=c.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*r+0.7152*g+0.0722*b;};
  const parse=s=>{const m=String(s).match(/rgba?\\(([^)]+)\\)/);if(!m)return null;
    const p=m[1].split(',').map(x=>parseFloat(x));return {rgb:[p[0],p[1],p[2]],a:p.length>3?p[3]:1};};
  const over=(fg,bg)=>fg.rgb.map((c,i)=>c*fg.a+bg[i]*(1-fg.a));
  const bgOf=el=>{
    let node=el,acc=null;
    while(node&&node!==document.documentElement){
      const c=parse(getComputedStyle(node).backgroundColor);
      if(c&&c.a>0){ acc=acc?over({rgb:acc,a:1},c.rgb):c.rgb.slice(); if(c.a===1)return acc; }
      node=node.parentElement;
    }
    const b=parse(getComputedStyle(document.body).backgroundColor)||{rgb:[255,255,255],a:1};
    return acc||b.rgb;
  };
  const out=[];
  document.querySelectorAll('.panel.active *, .app-header *, #tabs *').forEach(el=>{
    if(el.closest('.page'))return;                      // paper previews are printed output, always white
    const txt=[...el.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).map(n=>n.textContent.trim()).join(' ');
    if(!txt)return;
    const r=el.getBoundingClientRect();
    const st=getComputedStyle(el);
    if(r.width<1||r.height<1||st.visibility==='hidden'||st.display==='none'||+st.opacity===0)return;
    const fg=parse(st.color);if(!fg)return;
    const bg=bgOf(el);
    const c=over(fg,bg);
    const L1=lum(c),L2=lum(bg);
    const ratio=(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
    const size=parseFloat(st.fontSize),bold=+st.fontWeight>=700;
    const need=(size>=24||(size>=18.66&&bold))?3:4.5;
    out.push({txt:txt.slice(0,42),ratio:+ratio.toFixed(2),need,size,
      sel:el.tagName.toLowerCase()+(el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\\s+/)[0]:'')});
  });
  return out;
})()`;
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const tabs=['game','import','rosters','reference','print','postgame','calllog','opening','settings'];
  let bad=0,checked=0;
  for(const scheme of ['dark','light']){
    const page=await b.newPage({...devices['iPhone 13'],colorScheme:scheme});
    page.on('pageerror',e=>console.log('PAGEERROR:',e.message));
    await page.goto('file://'+path.resolve('index.html'));
    await page.waitForTimeout(900);
    const theme=await page.evaluate(()=>document.documentElement.dataset.theme);
    console.log('\n=== '+scheme.toUpperCase()+' (app theme: '+theme+') ===');
    for(const t of tabs){
      await page.evaluate(t=>showTab(t),t);
      await page.waitForTimeout(320);
      const res=await page.evaluate(AUDIT);
      checked+=res.length;
      const fails=res.filter(r=>r.ratio<r.need);
      if(fails.length){
        bad+=fails.length;
        console.log(' '+t+': '+fails.length+' low-contrast of '+res.length);
        fails.slice(0,6).forEach(f=>console.log('    '+String(f.ratio).padStart(5)+':1 (need '+f.need+') '+f.sel.padEnd(22)+' "'+f.txt+'"'));
      }else console.log(' '+t+': ok ('+res.length+' text elements)');
    }
    await page.close();
  }
  console.log('\nchecked '+checked+' text elements · '+bad+' below AA');
  await b.close();
  process.exit(bad?1:0);
})();
