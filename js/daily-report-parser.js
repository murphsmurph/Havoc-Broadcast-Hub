/* SPHL Daily Report parser — shared by the browser (manual import + rendering)
   and the GitHub Action (scripts/fetch-daily-report.mjs).
   Input: the daily report HTML string (from
   cluster.leaguestat.com/download.php?client_code=sphl&file_path=daily-report/daily-report.html).
   Output: { generatedDate, standings[], skaters[], goalies[], specialTeams:{pp[],pk[]},
             leaders:{points[],goals[],assists[]}, sections[], parsed:{...} }
   Written against the real report format (h2 sections, .drtable tables,
   per-team "<Team> Statistics" blocks). Defensive: sections that can't be
   classified are skipped, never thrown on. */
(function(root,factory){
  if(typeof module!=='undefined'&&module.exports)module.exports=factory();
  else root.SPHLDailyReport=factory();
})(typeof self!=='undefined'?self:this,function(){

  function decode(s){
    return String(s==null?'':s)
      .replace(/<\s*br[^>]*>/gi,' ')
      .replace(/<[^>]*>/g,' ')
      .replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<')
      .replace(/&gt;/gi,'>').replace(/&#0?39;|&apos;|&rsquo;/gi,"'").replace(/&quot;/gi,'"')
      .replace(/\s+/g,' ').trim();
  }
  function num(v){
    const n=parseFloat(String(v==null?'':v).replace(/[,%]/g,''));
    return isNaN(n)?null:n;
  }
  function tables(html){
    const out=[];const re=/<table[\s\S]*?<\/table>/gi;let m;
    while((m=re.exec(html))){
      const rows=[];const rr=/<tr[\s\S]*?<\/tr>/gi;let r;
      while((r=rr.exec(m[0]))){
        const cells=[];const cr=/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;let c;
        while((c=cr.exec(r[0])))cells.push(decode(c[1]));
        if(cells.some(x=>x!==''))rows.push(cells);
      }
      if(rows.length)out.push({rows,start:m.index});
    }
    return out;
  }
  function headingBefore(html,idx){
    const chunk=html.slice(Math.max(0,idx-3000),idx);
    let last='';
    const re=/<(h[1-6]|caption)[^>]*>([\s\S]*?)<\/\1>/gi;let m;
    while((m=re.exec(chunk))){const t=decode(m[2]);if(t&&t.length<120)last=t;}
    return last;
  }
  function headerRow(rows){
    for(let i=0;i<Math.min(rows.length,4);i++){
      const r=rows[i];
      const labely=r.filter(c=>/^[A-Za-z .%#\/+-]{0,24}$/.test(c)&&!/^\d/.test(c)).length;
      if(r.length>=3&&labely>=Math.max(2,r.length-2))return i;
    }
    return -1;
  }
  function idxOf(headers,aliases){
    const raw=headers.map(h=>String(h).toUpperCase().trim());
    const H=raw.map(h=>h.replace(/[^A-Z%#]/g,''));
    for(const a of aliases){
      let i=raw.indexOf(a);
      if(i<0)i=H.indexOf(a.replace(/[^A-Z%#]/g,''));
      if(i>=0)return i;
    }
    return -1;
  }
  // first column whose data cells are mostly words (the team/name column when unheadered)
  function firstAlphaCol(data){
    if(!data.length)return -1;
    const w=data[0].length;
    for(let c=0;c<w;c++){
      let alpha=0;
      for(const r of data){const v=String(r[c]||'');if(/[A-Za-z]{3,}/.test(v)&&!/^\d+[\d.\-]*$/.test(v))alpha++;}
      if(alpha>=data.length*0.6)return c;
    }
    return -1;
  }
  function cleanTeam(s){
    return String(s||'')
      .replace(/^\s*\d+[.)]?\s*/,'')
      .replace(/^\s*[xyze*]{1,2}\s*[-–]\s*/i,'')
      .replace(/^\s*\*+\s*/,'')
      .replace(/\s*[*]+\s*$/,'')
      .trim();
  }
  function cleanName(s){
    return String(s||'').replace(/^\s*\d+[.)]?\s*/,'').replace(/^\*+\s*/,'')
      .replace(/^\s*[x*]\s+/i,'') // rookie/clinch marker
      .replace(/\s*\((total|[0-9]+)\)\s*$/i,'').trim();
  }
  function junkRow(name){
    return /^(BENCH|TOTALS?|EMPTY NET|TEAM)$/i.test(String(name).trim());
  }

  var NAME_ALIASES=['PLAYER','NAME','GOALTENDER','GOALIE','SKATER',
    // leader tables title the name column with the category
    'POINTS','GOALS','ASSISTS','PENALTY MINUTES','ROOKIE','DEFENSEMAN'];

  function parse(html){
    html=String(html||'');
    const out={generatedDate:'',standings:[],skaters:[],goalies:[],
      specialTeams:{pp:[],pk:[]},leaders:{points:[],goals:[],assists:[]},
      sections:[],parsed:{}};

    // date: <title>SPHL 2026-05-11</title>, else a date near the top
    const tm=html.match(/<title>[^<]*?(\d{4}-\d{2}-\d{2})[^<]*<\/title>/i);
    if(tm)out.generatedDate=tm[1];
    else{
      const head=decode(html.slice(0,6000));
      const dm=head.match(/([A-Z][a-z]+ \d{1,2},? \d{4})/)||head.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
      if(dm)out.generatedDate=dm[1];
    }

    const seenStand={};const seenGoalie={};const seenSkater={};
    const ppBest={};const pkBest={};
    let carryTeam=''; // set by "<Team> Statistics" headings, used by their goalie tables

    for(const tb of tables(html)){
      const hi=headerRow(tb.rows);
      if(hi<0)continue;
      const headers=tb.rows[hi];
      const data=tb.rows.slice(hi+1).filter(r=>r.length>=3);
      if(!data.length)continue;
      const title=headingBefore(html,tb.start);
      const T=title.toUpperCase();
      out.sections.push({title:title||'(untitled)',headers:headers.slice(0,14),rows:data.length});
      const sm=title.match(/^(.+?)\s+Statistics$/i);
      if(sm)carryTeam=sm[1].trim();

      const iTeam=idxOf(headers,['TEAM','CLUB']);
      const iName=idxOf(headers,NAME_ALIASES);
      const iGP=idxOf(headers,['GP']);
      const iW=idxOf(headers,['W']);
      const iL=idxOf(headers,['L']);
      const iOTL=idxOf(headers,['OTL','OT L']);
      const iSOL=idxOf(headers,['SOL','SL']);
      const iPTS=idxOf(headers,['PTS','POINTS']);
      const iG=idxOf(headers,['G']);
      const iA=idxOf(headers,['A']);
      const iGF=idxOf(headers,['GF']);
      const iGA=idxOf(headers,['GA']);
      const iPIM=idxOf(headers,['PIM']);
      const iPM=idxOf(headers,['+/-']);
      const iPP=idxOf(headers,['PP','PPG']);
      const iSHG=idxOf(headers,['SHG']);
      const iGW=idxOf(headers,['GW','GWG']);
      const iGAA=idxOf(headers,['GAA']);
      const iSV=idxOf(headers,['SV%','SVPCT']);
      const iSO=idxOf(headers,['SO']);
      const iSA=idxOf(headers,['SA']);
      const iSVS=idxOf(headers,['SVS']);
      const iPct=idxOf(headers,['PCT','%']);
      const iADV=idxOf(headers,['ADV','PPGF']);
      const iTSH=idxOf(headers,['TSH','PPGA']);

      // --- special teams (headers are unambiguous): TEAM + PCT + ADV/PPGF or TSH/PPGA
      if(iTeam>=0&&iName<0&&iPct>=0&&(iADV>=0||iTSH>=0)){
        const bucket=iTSH>=0&&iADV<0?'pk':(iADV>=0&&iTSH<0?'pp':(/(KILL|PK)/i.test(T)?'pk':'pp'));
        const best=bucket==='pp'?ppBest:pkBest;
        for(const r of data){
          const team=cleanTeam(r[iTeam]);if(!team||/TOTAL/i.test(team))continue;
          let pct=String(r[iPct]||'').trim();
          if(pct&&!/%$/.test(pct))pct+='%';
          const gp=iGP>=0?(num(r[iGP])||0):0;
          const k=team.toUpperCase();
          // home/road/overall variants exist — keep the biggest sample (overall)
          if(!best[k]||gp>=best[k].gp)best[k]={team,pct,gp};
        }
        continue;
      }
      // --- standings: team-ish column + GP/W/L/PTS, and clearly a standings table
      if(iName<0&&iGP>=0&&iW>=0&&iL>=0&&iPTS>=0&&(/STANDINGS/i.test(T)||(iGF>=0&&iGA>=0&&iOTL>=0))){
        if(/RECORD|STREAK|HIGHS|OVERTIME|SHOOTOUT|VS\.|BREAKDOWN|PERIOD/i.test(T))continue;
        const iT=iTeam>=0?iTeam:firstAlphaCol(data);
        if(iT<0)continue;
        for(const r of data){
          const team=cleanTeam(r[iT]);
          if(!team||/TOTAL/i.test(team))continue;
          const row={team,gp:num(r[iGP])||0,w:num(r[iW])||0,l:num(r[iL])||0,
            otl:iOTL>=0?(num(r[iOTL])||0):0,sol:iSOL>=0?(num(r[iSOL])||0):0,
            pts:num(r[iPTS])||0,gf:iGF>=0?(num(r[iGF])||0):0,ga:iGA>=0?(num(r[iGA])||0):0};
          const k=team.toUpperCase();
          if(!seenStand[k]||(row.gf&&!seenStand[k].gf)){
            if(seenStand[k])out.standings.splice(out.standings.indexOf(seenStand[k]),1);
            seenStand[k]=row;out.standings.push(row);
          }
        }
        continue;
      }
      // --- goalies: name column + GAA or SV% (per-team tables carry no TEAM column)
      if(iName>=0&&(iGAA>=0||iSV>=0)){
        for(const r of data){
          const name=cleanName(r[iName]);
          if(!name||!/[A-Za-z]/.test(name)||junkRow(name))continue;
          const team=iTeam>=0?cleanTeam(r[iTeam]):carryTeam;
          const k=name.toUpperCase()+'|'+String(team).toUpperCase();
          if(seenGoalie[k])continue;
          seenGoalie[k]=1;
          out.goalies.push({name,team,
            gp:iGP>=0?(num(r[iGP])||0):0,w:iW>=0?(num(r[iW])||0):0,l:iL>=0?(num(r[iL])||0):0,
            otl:iOTL>=0?(num(r[iOTL])||0):0,so:iSO>=0?(num(r[iSO])||0):0,
            ga:iGA>=0?(num(r[iGA])||0):0,sa:iSA>=0?(num(r[iSA])||0):0,svs:iSVS>=0?(num(r[iSVS])||0):0,
            gaa:iGAA>=0?String(r[iGAA]||'').trim():'',
            svpct:iSV>=0?String(r[iSV]||'').trim():''});
        }
        continue;
      }
      // --- skaters: name column + G + A + PTS (leaders and per-team tables alike)
      if(iName>=0&&iG>=0&&iA>=0&&iPTS>=0){
        for(const r of data){
          const name=cleanName(r[iName]);
          if(!name||!/[A-Za-z]/.test(name)||junkRow(name))continue;
          const team=iTeam>=0?cleanTeam(r[iTeam]):carryTeam;
          const row={name,team,
            gp:iGP>=0?(num(r[iGP])||0):0,g:num(r[iG])||0,a:num(r[iA])||0,pts:num(r[iPTS])||0,
            pm:iPM>=0?(num(r[iPM])||0):0,pim:iPIM>=0?(num(r[iPIM])||0):0,
            pp:iPP>=0?(num(r[iPP])||0):0,shg:iSHG>=0?(num(r[iSHG])||0):0,gw:iGW>=0?(num(r[iGW])||0):0};
          const k=name.toUpperCase()+'|'+String(team).toUpperCase();
          const ex=seenSkater[k];
          if(ex){ // per-team rows are richer than leader rows — keep the richest
            if((row.pim||row.pm||row.pp)&&!(ex.pim||ex.pm||ex.pp))Object.assign(ex,row);
          }else{seenSkater[k]=row;out.skaters.push(row);}
          if(/LEADER/i.test(T)&&iTeam>=0&&out.leaders.points.length<20&&/POINT|OVERALL/i.test(T))
            out.leaders.points.push({name,team,val:String(row.pts)});
        }
        continue;
      }
      // --- single-stat leader tables (goals / assists)
      if(iName>=0&&iTeam>=0&&data.length<=25&&(iG>=0||iA>=0)){
        const H=headers.map(h=>String(h).toUpperCase());
        const bucket=H.some(h=>/^GOALS$/.test(h))?'goals':(H.some(h=>/^ASSISTS$/.test(h))?'assists':'');
        if(bucket){
          for(const r of data.slice(0,10)){
            const name=cleanName(r[iName]);if(!name)continue;
            const vi=bucket==='goals'?(iG>=0?iG:iPTS):(iA>=0?iA:iPTS);
            const v=num(r[vi]);
            out.leaders[bucket].push({name,team:cleanTeam(r[iTeam]),val:String(v!=null?v:'')});
          }
        }
        continue;
      }
    }

    Object.values(ppBest).forEach(x=>out.specialTeams.pp.push({team:x.team,pct:x.pct}));
    Object.values(pkBest).forEach(x=>out.specialTeams.pk.push({team:x.team,pct:x.pct}));

    out.parsed={
      standings:out.standings.length>0,
      skaters:out.skaters.length>0,
      goalies:out.goalies.length>0,
      specialTeams:out.specialTeams.pp.length>0||out.specialTeams.pk.length>0,
      leaders:out.leaders.points.length>0||out.leaders.goals.length>0||out.leaders.assists.length>0
    };
    return out;
  }

  return {parse:parse,_internals:{decode:decode,tables:tables,headerRow:headerRow,firstAlphaCol:firstAlphaCol}};
});
