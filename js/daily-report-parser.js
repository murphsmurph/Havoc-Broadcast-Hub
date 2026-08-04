/* SPHL Daily Report parser — shared by the browser (manual import + rendering)
   and the GitHub Action (scripts/fetch-daily-report.mjs).
   Input: the daily report HTML string (from
   cluster.leaguestat.com/download.php?client_code=sphl&file_path=daily-report/daily-report.html).
   Output: { generatedDate, standings[], skaters[], goalies[], specialTeams:{pp[],pk[]},
             leaders:{points[],goals[],assists[]}, sections[], parsed:{...} }
   Defensive by design: sections that can't be found are skipped, never thrown on. */
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
    const chunk=html.slice(Math.max(0,idx-2500),idx);
    let last='';
    const re=/<(h[1-6]|caption|strong|b|font)[^>]*>([\s\S]*?)<\/\1>/gi;let m;
    while((m=re.exec(chunk))){const t=decode(m[2]);if(t&&t.length<120)last=t;}
    return last;
  }
  // header-row detection: the first row whose cells look like column labels
  function headerRow(rows){
    for(let i=0;i<Math.min(rows.length,4);i++){
      const r=rows[i];
      const labely=r.filter(c=>c&&/^[A-Za-z .%#\/+-]{1,22}$/.test(c)&&!/^\d/.test(c)).length;
      if(r.length>=3&&labely>=Math.max(2,r.length-2))return i;
    }
    return -1;
  }
  function idxOf(headers,aliases){
    const H=headers.map(h=>String(h).toUpperCase().replace(/[^A-Z%#]/g,''));
    for(const a of aliases){
      const i=H.indexOf(a);
      if(i>=0)return i;
    }
    return -1;
  }
  function cleanTeam(s){
    return String(s||'')
      .replace(/^\s*\d+[.)]?\s*/,'')          // rank number
      .replace(/^\s*[xyze*]{1,2}\s*[-–]\s*/i,'') // clinch markers like "x - "
      .replace(/^\s*\*+\s*/,'')
      .replace(/\s*[*]+\s*$/,'')
      .trim();
  }
  function cleanName(s){
    return String(s||'').replace(/^\s*\d+[.)]?\s*/,'').replace(/^\*+\s*/,'').replace(/\s*\((total|[0-9]+)\)\s*$/i,'').trim();
  }

  function parse(html){
    html=String(html||'');
    const out={generatedDate:'',standings:[],skaters:[],goalies:[],
      specialTeams:{pp:[],pk:[]},leaders:{points:[],goals:[],assists:[]},
      sections:[],parsed:{}};
    // generated date: first long-form or numeric date near the top of the document text
    const head=decode(html.slice(0,6000));
    const dm=head.match(/([A-Z][a-z]+ \d{1,2},? \d{4})/)||head.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
    if(dm)out.generatedDate=dm[1];

    const seenStand={};const seenGoalie={};const seenSkater={};
    for(const tb of tables(html)){
      const hi=headerRow(tb.rows);
      if(hi<0)continue;
      const headers=tb.rows[hi];
      const data=tb.rows.slice(hi+1).filter(r=>r.length>=3);
      if(!data.length)continue;
      const title=headingBefore(html,tb.start);
      out.sections.push({title:title||'(untitled)',headers:headers.slice(0,14),rows:data.length});

      const iTeam=idxOf(headers,['TEAM','CLUB']);
      const iName=idxOf(headers,['PLAYER','NAME','GOALTENDER','GOALIE','SKATER']);
      const iGP=idxOf(headers,['GP','GAMES']);
      const iW=idxOf(headers,['W','WINS']);
      const iL=idxOf(headers,['L','LOSSES']);
      const iOTL=idxOf(headers,['OTL','OT','OTLOSSES']);
      const iSOL=idxOf(headers,['SOL','SL','SO L'.replace(' ','')]);
      const iPTS=idxOf(headers,['PTS','P','POINTS']);
      const iG=idxOf(headers,['G','GOALS']);
      const iA=idxOf(headers,['A','ASSISTS']);
      const iGF=idxOf(headers,['GF','GOALSFOR']);
      const iGA=idxOf(headers,['GA','GOALSAGAINST']);
      const iPIM=idxOf(headers,['PIM','PIMS']);
      const iGAA=idxOf(headers,['GAA']);
      const iSV=idxOf(headers,['SV%','SVPCT','SVS%','SP']);
      const iSO=idxOf(headers,['SO','SHUTOUTS']);
      const iPct=idxOf(headers,['PCT','%','PP%','PK%']);
      const T=title.toUpperCase();

      // --- standings: team + GP + W + L + PTS, no player column
      if(iTeam>=0&&iName<0&&iGP>=0&&iW>=0&&iL>=0&&iPTS>=0){
        for(const r of data){
          const team=cleanTeam(r[iTeam]);
          if(!team||/TOTAL/i.test(team))continue;
          const row={team,gp:num(r[iGP])||0,w:num(r[iW])||0,l:num(r[iL])||0,
            otl:iOTL>=0?(num(r[iOTL])||0):0,sol:iSOL>=0?(num(r[iSOL])||0):0,
            pts:num(r[iPTS])||0,gf:iGF>=0?(num(r[iGF])||0):0,ga:iGA>=0?(num(r[iGA])||0):0};
          const k=team.toUpperCase();
          // conference + league tables overlap — keep the most complete row per team
          if(!seenStand[k]||(row.gf&&!seenStand[k].gf)){
            if(seenStand[k])out.standings.splice(out.standings.indexOf(seenStand[k]),1);
            seenStand[k]=row;out.standings.push(row);
          }
        }
        continue;
      }
      // --- goaltending: name + GAA or SV%
      if(iName>=0&&(iGAA>=0||iSV>=0)){
        for(const r of data){
          const name=cleanName(r[iName]);
          if(!name)continue;
          const k=name.toUpperCase();
          if(seenGoalie[k])continue;
          seenGoalie[k]=1;
          out.goalies.push({name,team:iTeam>=0?cleanTeam(r[iTeam]):'',
            gp:iGP>=0?(num(r[iGP])||0):0,w:iW>=0?(num(r[iW])||0):0,l:iL>=0?(num(r[iL])||0):0,
            otl:iOTL>=0?(num(r[iOTL])||0):0,so:iSO>=0?(num(r[iSO])||0):0,
            ga:iGA>=0?(num(r[iGA])||0):0,
            gaa:iGAA>=0?String(r[iGAA]||'').trim():'',
            svpct:iSV>=0?String(r[iSV]||'').trim():''});
        }
        continue;
      }
      // --- skaters: name + G + A + PTS
      if(iName>=0&&iG>=0&&iA>=0&&iPTS>=0){
        const isLeaders=/LEADER|TOP|SCORING/i.test(T)||data.length<=15;
        for(const r of data){
          const name=cleanName(r[iName]);
          if(!name)continue;
          const row={name,team:iTeam>=0?cleanTeam(r[iTeam]):'',
            gp:iGP>=0?(num(r[iGP])||0):0,g:num(r[iG])||0,a:num(r[iA])||0,pts:num(r[iPTS])||0,
            pim:iPIM>=0?(num(r[iPIM])||0):0};
          const k=name.toUpperCase()+'|'+row.team.toUpperCase();
          if(!seenSkater[k]){seenSkater[k]=1;out.skaters.push(row);}
          if(isLeaders&&out.leaders.points.length<10&&/POINT|SCORING|LEADER/i.test(T))
            out.leaders.points.push({name,team:row.team,val:String(row.pts)});
        }
        continue;
      }
      // --- single-stat leader tables (goals / assists)
      if(iName>=0&&iTeam>=0&&(iG>=0||iA>=0||iPTS>=0)&&data.length<=15){
        const bucket=/GOAL/i.test(T)?'goals':(/ASSIST/i.test(T)?'assists':(/POINT/i.test(T)?'points':''));
        if(bucket){
          for(const r of data.slice(0,10)){
            const name=cleanName(r[iName]);if(!name)continue;
            const vi=iG>=0?iG:(iA>=0?iA:iPTS);
            out.leaders[bucket].push({name,team:cleanTeam(r[iTeam]),val:String(num(r[vi])!=null?num(r[vi]):'')});
          }
        }
        continue;
      }
      // --- special teams: team + a percentage, under a PP/PK heading
      if(iTeam>=0&&iName<0&&(/POWER ?PLAY|\bPP\b/i.test(T)||/PENALTY ?KILL|\bPK\b/i.test(T))){
        const bucket=/PENALTY ?KILL|\bPK\b/i.test(T)?'pk':'pp';
        for(const r of data){
          const team=cleanTeam(r[iTeam]);if(!team||/TOTAL/i.test(team))continue;
          let pct='';
          if(iPct>=0)pct=String(r[iPct]||'').trim();
          if(!pct){const p=r.find(c=>/^\d{1,3}\.\d%?$/.test(String(c).trim()));pct=p?String(p).trim():'';}
          if(pct&&!/%$/.test(pct))pct+='%';
          out.specialTeams[bucket].push({team,pct});
        }
        continue;
      }
    }

    out.parsed={
      standings:out.standings.length>0,
      skaters:out.skaters.length>0,
      goalies:out.goalies.length>0,
      specialTeams:out.specialTeams.pp.length>0||out.specialTeams.pk.length>0,
      leaders:out.leaders.points.length>0||out.leaders.goals.length>0||out.leaders.assists.length>0
    };
    return out;
  }

  return {parse:parse,_internals:{decode:decode,tables:tables,headerRow:headerRow}};
});
