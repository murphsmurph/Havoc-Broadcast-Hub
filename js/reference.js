/* League and franchise reference data, extracted verbatim from the index.html
   data script (P3 split): SPHL_REF (cups, coaches, head-to-head, record book)
   and FRANCHISES (the per-club files). Authored prose — Law §11 keeps it in git,
   and the nomenclature pass does not touch it. Plain script for file:// support. */

const SPHL_REF = {
  /* Presidents Cup championships per current team */
  cups:{ /* updated thru the 2026 President's Cup (verified research file, Aug 5 2026) */
    "Athens Rock Lobsters":[],
    "Birmingham Bulls":[],
    "Evansville Thunderbolts":["2025","2026"],
    "Fayetteville Marksmen":[], /* the 2007 FireAntz cup is a separate franchise lineage */
    "Huntsville Havoc":["2010","2018","2019"],
    "Knoxville Ice Bears":["2006","2008","2009","2015"],
    "Macon Mayhem":["2017"],
    "Pee Dee IceCats":[],
    "Pensacola Ice Flyers":["2013","2014","2016","2021"],
    "Peoria Rivermen":["2022","2024"],
    "Quad City Storm":[],
    "Roanoke Rail Yard Dawgs":["2023"]
  },
  cupNote:{
    "Fayetteville Marksmen":"The FireAntz won the 2007 President's Cup; the current Marksmen franchise has yet to win.",
    "Birmingham Bulls":"Finalists in 2019 and 2023.",
    "Evansville Thunderbolts":"Back-to-back champions, 2025 & 2026."
  },
  cupDefunct:"Defunct franchises also won titles: Columbus 2 · Mississippi 1.",

  /* Huntsville all-time vs each current club (regular season + playoff) from the guide */
  hsvVs:{
    "Birmingham Bulls":{rs:"71 GP · 41-27-3", po:"2 series (1-1) · 5 GP, 3-2"},
    "Evansville Thunderbolts":{rs:"52 GP · 32-13-7", po:"2 series (1-1) · 5 GP, 3-2"},
    "Fayetteville Marksmen":{rs:"119 GP · 64-52-3", po:"3 series (2-1) · 6 GP, 4-2"},
    "Knoxville Ice Bears":{rs:"193 GP · 89-91-13", po:"4 series (3-1) · 11 GP, 8-3"},
    "Macon Mayhem":{rs:"107 GP · 62-38-7", po:"3 series (2-1) · 8 GP, 4-4"},
    "Pensacola Ice Flyers":{rs:"123 GP · 72-37-14", po:"4 series (2-2) · 11 GP, 5-6"},
    "Peoria Rivermen":{rs:"59 GP · 23-32-4", po:"3 series (1-2) · 9 GP, 4-5"},
    "Quad City Storm":{rs:"20 GP · 15-3-2", po:"No playoff meetings"},
    "Roanoke Rail Yard Dawgs":{rs:"46 GP · 23-16-7", po:"2 series (1-1) · 5 GP, 2-3"},
    /* 2026-27 expansion clubs — no history exists; first:true renders as
       "first meeting in franchise history", never as blank dashes */
    "Athens Rock Lobsters":{first:true},
    "Pee Dee IceCats":{first:true}
  },
  /* where two published books disagree, say so rather than picking one */
  hsvVsNote:{
    "Fayetteville Marksmen":"Books conflict: the Havoc media guide has Huntsville 64-52-3 in 119 GP, while Fayetteville's own record book publishes 55-48-16 in its favor over the same 119 games (Havoc 48-55-16). Both totals reconcile to 119 — the win/loss split does not. Verify before quoting either ⚠️."
  },

  /* Huntsville franchise records (Club + Players + Goalies) */
  hsvRecords:{
    career:[
      ["Games","379 — Stuart Stefan (2011-18)"],
      ["Goals","115 — Sy Nutkevitch (2016-23)"],
      ["Assists","256 — Sy Nutkevitch (2016-23)"],
      ["Points","371 — Sy Nutkevitch (2016-23)"],
      ["Penalty minutes","994 — Luke Phillips (2004-07)"],
      ["Wins (goalie)","92 — Matt Carmichael (2004-08)"],
      ["Shutouts","8 — Brian Wilson (2023–present)"], /* active holder — passed McWhinney/Milosek (7) in 2025-26 */
      ["Games (goalie)","167 — Matt Carmichael (2004-08)"],
      ["Saves (goalie)","4,988 — Matt Carmichael (2004-08)"]
    ],
    team:[
      ["Most points","84 (2021-22)"],["Fewest points","29 (2014-15)"],
      ["Most wins","41 (2021-22)"],["Most goals scored","221 (2006-07)"],
      ["Fewest goals allowed","124 (2021-22)"],["Longest win streak","12 (Oct 15–Nov 19, 2021)"]
    ],
    players:[
      ["Most points, season","78 — James Patterson (2006-07)"],
      ["Most goals, season","37 — Travis Kauffeldt (2008-09)"],
      ["Most assists, season","52 — James Patterson (2006-07)"],
      ["Most PIM, season","396 — Luke Phillips (2005-06)"]
    ],
    goalies:[
      ["Lowest GAA, season","1.93 — Hunter Vorva (2021-22)"],
      ["Best SV%, season",".934 — Hunter Vorva (2021-22)"],
      ["Most wins, season","26 — Mike Robinson / Matt Carmichael (2024-25 / 2004-05, 2006-07)"],
      ["Most shutouts, season","4 — Max Milosek / Dan McWhinney / Brian Wilson (2019-20 / 2010-11 / 2025-26)"]
    ]
  },

  /* Head coach blurbs from the guide (editable in-app). Blank = not cleanly in guide text; paste from packet. */
  coaches:{
    "Huntsville Havoc":{name:"Stuart Stefan",bio:"Named head coach in May 2023, the sixth in franchise history. A longtime Havoc defenseman (2011-12 on), Stefan played 305 regular-season SPHL games with 196 points (57G, 139A) and added 32 points in 55 playoff games. Team captain and later player-assistant coach; part of the 2017-18 SPHL championship team. Retired in 2018 and moved into full-time coaching before his 2023 promotion."},
    "Birmingham Bulls":{name:"Craig Simchuk",bio:"Captained the Bulls in 2017-18 and 2018-19. A lefty forward, he played five pro seasons in the SPHL with 46G and 75A in 238 games (Columbus, Birmingham). Assistant under Jamey Hicks before taking over as head coach. Three-time SPHL Coach of the Year, leading Birmingham to the 2023-24 William B. Coffey Trophy with a franchise-record 38-9-9."},
    "Evansville Thunderbolts":{name:"Jeff Bes",bio:"In his sixth season as head coach/director of hockey operations. Franchise leader in games coached (270) and wins (132); led Evansville to its first Presidents Cup in 2024-25. Began coaching in 2011-12 with the Mississippi Surge (SPHL Coach of the Year). A 19-year pro player with 1,000+ career points, two CHL titles with Laredo, drafted by Minnesota in 1992, and a 1993 World Junior gold with Canada."},
    "Fayetteville Marksmen":{name:"Garrett Rutledge",bio:"Hired May 29, 2026, straight from the FPHL's Athens Rock Lobsters — the team he coached to the 2025-26 Continental Division title (44-11-1, 124 points) before the sides parted ways in April. Now behind an SPHL bench in the same league as his old club: Fayetteville-Athens is an instant storyline, and both are on the Havoc schedule."},
    "Athens Rock Lobsters":{name:"Scott Burt",bio:"Named GM and head coach May 29, 2026 as Athens jumps from the FPHL to the SPHL. Arrives with ECHL head-coaching experience in Idaho and Rapid City plus a stop in Greensboro. Inherits a club that won the 2025-26 FPHL Continental Division (44-11-1, 124 points) under Garrett Rutledge — who now coaches SPHL rival Fayetteville."},
    "Pee Dee IceCats":{name:"Chris Bernard",bio:"Hired July 5, 2026 — his first professional head-coaching job after 17 years at SUNY Potsdam (NCAA D-III). Succeeds Gary Graham, who retired after coaching the IceCats' Cardiac Cats run to the 2026 FPHL Commissioner's Cup Final in the franchise's first Florence season."},
    "Knoxville Ice Bears":{name:"John Gurskis",bio:"Hired as the ninth head coach in Ice Bears history ahead of 2024-25. A Brockton, Mass. native, he spent five seasons as an ECHL assistant with Wichita and 11 with the South Shore Kings. Played 536 pro games, including SPHL time with Macon, Florida and Pee Dee/Twin City. Remains St. Michael's College all-time leader in points (234) and assists (141)."},
    "Macon Mayhem":{name:"Dave Pszenyczny",bio:"A Sterling Heights, Mich. native who coached six years in the SPHL with Quad City before joining the Mayhem. Played 13 years of pro hockey (AHL, ECHL, CHL, SPHL), reaching three Presidents Cup finals with Peoria and named SPHL Defenseman of the Year in 2017-18. Won a CHL Ray Miron Cup with Bossier-Shreveport in 2011."},
    "Pensacola Ice Flyers":{name:"Jeremy Gates",bio:"Head coach/DOHO, returning to the franchise where he was a hard-nosed defenseman and three-time Presidents Cup champion (2013, 2014, 2016). Appeared in 95 regular-season games with 60 points plus 14 playoff points for the Ice Flyers. Coached as an assistant under Rod Aldoff and with the ECHL's Rapid City Rush before returning."},
    "Peoria Rivermen":{name:"Jean-Guy Trudel",bio:""},
    "Quad City Storm":{name:"Shayne Toporowski",bio:""},
    "Roanoke Rail Yard Dawgs":{name:"Dan Bremner",bio:"In his ninth year with Roanoke, eighth as head coach/GM. The Sarnia, Ontario native led the Rail Yard Dawgs to two Presidents Cup finals, winning it in 2023. Since taking over early in 2017-18 he has a 186-136-42 regular-season record (eighth-most wins in league history) and a 19-15 postseason mark. Played 281 pro games (48 goals) before coaching."}
  }
};

/* ============ FRANCHISE FILES ============
   Deep per-team reference, researched Aug 5 2026 and arithmetic-checked against
   StatsCrew / the SPHL Media Guide / Elite Prospects. Reliability marks travel
   with the text: ✅ renders clean, while ➗ (computed by summing season tables),
   ⚠️ (single source) and ❌ (unverified/disputed) render the manual-edit •.
   DO NOT refresh these from Wikipedia or Grokipedia — both were caught in
   factual errors during the research (fabricated opponents, impossible
   arithmetic). Sync only from the HockeyTech feed and the SPHL daily report. */
const FRANCHISES={
"Huntsville Havoc":{
 basics:[[`Founded`,`2004 — SPHL charter member ✅`],[`Owner`,`Keith Jeffries (HSV Sports LLC) ✅`],[`Arena`,`Propst Arena at the Von Braun Center — opened 1975, ~6,600 ⚠️`],[`Colors`,`Black / red / white / silver ✅`],[`Mascots`,`Chaos (wolf) and Rukus ✅`],[`Predecessor`,`Huntsville Channel Cats (SEHL / CHL) ✅`]],
 allTime:`633-477-100 in 1,210 GP ➗ — through 2024-25 the figure 601-457-94 is double-confirmed ✅`,
 titles:`3 President's Cups — tied for the most in league history: 2010 (d. Mississippi 3-0) · 2018 (d. Peoria 2-1 — the first #4 seed ever to win the Cup) · 2019 (d. Birmingham 2-0, back-to-back) ✅. Finals losses: 2013 (Pensacola) and 2024 (Peoria 2-3) ✅.`,
 seasons:[[`2004-05`,`29-27-0`,`58`,`6th`,`Lost R1 (Jacksonville)`],[`2005-06`,`32-21-3`,`67`,`5th`,`Lost 1-2 (Florida)`],[`2006-07`,`29-23-4`,`62`,`4th`,`Lost 0-2 (Fayetteville)`],[`2007-08`,`23-27-2`,`48`,`7th`,`DNQ`],[`2008-09`,`29-24-7`,`65`,`4th`,`Lost 2-3 (Knoxville)`],[`2009-10`,`31-16-9`,`71`,`2nd`,`WON CUP`],[`2010-11`,`30-26-0`,`60`,`3rd`,`Lost 0-2 (Columbus)`],[`2011-12`,`22-28-6`,`50`,`8th`,`Lost 0-2 (Columbus)`],[`2012-13`,`21-29-6`,`48`,`8th`,`Lost 1-2 (Pensacola)`],[`2013-14`,`31-21-4`,`66`,`5th`,`Lost 0-2 (Columbus)`],[`2014-15`,`11-38-7`,`29`,`8th`,`DNQ — worst season`],[`2015-16`,`26-26-4`,`56`,`7th`,`Lost 0-2 (Pensacola)`],[`2016-17`,`34-16-6`,`74`,`4th`,`Lost 1-2 (Peoria)`],[`2017-18`,`30-16-10`,`70`,`4th`,`WON CUP`],[`2018-19`,`36-17-3`,`75`,`3rd`,`WON CUP`],[`2019-20`,`27-14-5`,`59`,`3rd`,`Cancelled (COVID)`],[`2020-21`,`19-22-1`,`39`,`4th`,`Lost 0-2 (Pensacola)`],[`2021-22`,`41-13-2`,`84`,`2nd`,`Lost 0-2 (Roanoke)`],[`2022-23`,`34-19-3`,`71`,`3rd`,`Lost 1-2 (Birmingham)`],[`2023-24`,`30-19-7`,`67`,`—`,`Lost FINAL 2-3 (Peoria)`],[`2024-25`,`36-15-5`,`77`,`—`,`Lost R1 (Evansville)`],[`2025-26`,`32-20-5-1`,`70`,`2nd`,`Lost R1 (Knoxville)`]],
 leaders:`GP Stuart Stefan 379 · Goals / assists / points Sy Nutkevitch 115 / 256 / 371 in 352 GP · #2 points James Patterson 289 · #3 Rob Darrar 249 · PIM Luke Phillips 994 · Goalie wins Matt Carmichael 92 (Milosek 77) · Shutouts McWhinney & Milosek 7 ✅`,
 records:`Single-season — goals 37 (Kauffeldt, 2008-09) · points 78 (Patterson, 2006-07) · assists 52 (Patterson) · PIM 396 (Phillips, 2005-06) · GAA 1.93 and SV% .934 (Hunter Vorva, 2021-22) ✅. Team — most points 84 and most wins 41 (2021-22) · longest win streak 12 games, Oct 15–Nov 19, 2021 ✅.`,
 attendance:`The franchise's signature stat: 2024-25 drew 6,247 a game — the all-time SPHL record, with every home game sold out. Previous high 4,932 (2018-19). Led the league four straight years, 2015-16 through 2018-19 ✅.`,
 retired:`7 Stefan · 10 Kaiser · 14 Piacentini · 19 Nutkevitch (Nov 2, 2024) · 17 George · 23 Gibson · 29 Carmichael · 33 DeGurse. Glenn Detulleo also honored with a banner, Oct 27, 2023 ✅.`,
 coach:`Stuart Stefan — named May 1, 2023 ✅; a Havoc player 2011-18, then assistant. Record 98-54-18 in 170 GP ➗. Replaced Glenn Detulleo (10 seasons, 337 wins, 2 Cups). On-air caution: Wikipedia's infobox saying Stefan coached "2018–present" is wrong — 2018 is when he stopped playing ⚠️.`,
 story:`Attendance is the calling card: the 2024-25 average of 6,247 is the all-time SPHL record. Rivalry with Birmingham runs both ways — BHM won the 2023 semifinal, HSV won the 2019 Cup over them. Redemption arc for 2026-27 after finishing 2nd and getting upset in Round 1 by #7 Knoxville.`
},
"Peoria Rivermen":{
 basics:[[`Founded`,`SPHL entry announced May 15, 2013 — a NEW franchise that inherited the name after the AHL Rivermen moved to Utica, not a relocation ✅`],[`Owner`,`CSH International (Bill Yuill), since 2017 ✅`],[`Arena`,`Carver Arena at the Peoria Civic Center — opened 1982, 9,919, the biggest in the league ($45M renovation, 2024) ✅`],[`Mascots`,`Rocky and The Captain ✅`]],
 allTime:`440-154-71 in 665 GP ➗ (through 2024-25: 402-137-68 ✅). Thirteen seasons, never a losing record — the best win percentage in the modern SPHL. Seven Coffey Trophies, the most in the league ✅.`,
 titles:`2 President's Cups: 2022 (d. Roanoke 3-1, Game 4 OT winner May 3) and 2024 (d. Huntsville 3-2) ✅. Finals losses in 2016, 2017, 2018 and 2026 — six Finals in all ✅.`,
 seasons:[[`2013-14`,`30-18-8`,`68`,`3rd West`,`Lost R1 (Columbus)`],[`2014-15`,`36-17-3`,`75`,`1st West`,`Coffey Trophy`],[`2015-16`,`39-12-5`,`83`,`1st West`,`Lost Final 0-3 (Pensacola)`],[`2016-17`,`32-13-11`,`75`,`2nd West`,`Lost Final 0-2 (Macon)`],[`2017-18`,`38-13-5`,`81`,`1st`,`Lost Final 1-2 (Huntsville)`],[`2018-19`,`40-7-9`,`89`,`1st`,`Lost R2 0-2 (Roanoke)`],[`2019-20`,`33-8-5`,`71`,`1st`,`Cancelled`],[`2021-22`,`38-11-7`,`83`,`3rd`,`WON CUP 3-1 (Roanoke)`],[`2022-23`,`39-14-4`,`82`,`1st`,`Lost Semis 0-2 (Roanoke)`],[`2023-24`,`37-14-5`,`79`,`2nd`,`WON CUP 3-2 (Huntsville)`],[`2024-25`,`40-10-6`,`86`,`1st`,`Lost Semis 0-2 (Evansville)`],[`2025-26`,`38-17-3`,`79`,`1st`,`Lost Final 2-3 (Evansville)`]],
 leaders:`SPHL-era: Alec Hagaman 437 points (181G-256A) in 447 GP, 2014-2024 ✅ · Alec Baer 284 points in 235 GP ✅. TRAP: Elite Prospects' Peoria page merges every Rivermen era back to 1982 and reports Doug Evans (720 points, 1984-99) as the franchise leader — that is the IHL/AHL club, not this team. Never use EP for Peoria's SPHL-era records ⚠️.`,
 records:`Franchise-record 89 points in 2018-19 (40-7-9) ✅. Retired numbers and the goalie-wins leader are not published anywhere ❌.`,
 attendance:`Holds the SPHL single-game record: 9,509 vs Pensacola in 2024-25 ✅. That season drew 123,173 for a 4,399 average ✅.`,
 retired:`Not published ❌ — do not name one on air.`,
 coach:`Jean-Guy Trudel — GM and head coach since inception, the only head coach in franchise history ✅. Record 440-154-71 ➗. Four-time Coach of the Year (2014-15, 2015-16, 2017-18, 2024-25) and the SPHL's all-time wins leader (389+ across his career, per league releases) ✅.`,
 story:`The measuring stick: never a losing season in 13 years, seven Coffey Trophies, six Finals. Trudel is the only coach the franchise has ever had and the league's all-time wins leader. The Havoc lost the 2024 Final to Peoria and beat them in the 2018 Final. Quad City calls their series "the Cold War on 74."`
},
"Roanoke Rail Yard Dawgs":{
 basics:[[`Founded`,`Bought the dormant Mississippi Surge franchise — move announced Oct 20, 2015, named Nov 19, 2015, first season 2016-17 (home opener Oct 21, 2016, a 6,188 sellout) ✅`],[`Owners`,`The McGinn family — Bob and Cori plus NHL sons Jamie, Tye and Brock — with five local co-owner couples ✅`],[`Arena`,`Berglund Center Coliseum — opened October 1971, 7,975 ✅`],[`Mascots`,`Diesel (2016) and Daisy (2023) ✅`],[`Culture`,`Fan section "the Dawg Pound"; self-styled "Cardiac Canines." Traditions: Teddy Bear Toss (2,000+ in 2025), Stick It to Cancer, Star Wars Night ✅`]],
 allTime:`241-198-58 in 497 GP ➗. Wikipedia's published all-time line is arithmetically impossible (265 GP against 206-167-53) — ignore it ⚠️. Note for air: Roanoke sat out 2020-21 entirely, a common on-air error ✅.`,
 titles:`1 President's Cup: 2023, d. Birmingham 3-1, clinched May 2, 2023 on Mac Jansen's overtime goal in Game 4 — the path there swept Evansville and beat Peoria 2-1 ✅. Also lost the 2022 Final to Peoria 1-3 ✅.`,
 seasons:[[`2016-17`,`17-30-9`,`43`,`9th`,`DNQ`],[`2017-18`,`26-26-4`,`56`,`8th`,`Lost R1 (Peoria)`],[`2018-19`,`28-24-4`,`60`,`5th`,`Lost Semis (Birmingham)`],[`2019-20`,`16-22-9`,`41`,`7th`,`Cancelled`],[`2020-21`,`—`,`—`,`—`,`Did not participate`],[`2021-22`,`23-24-9`,`55`,`8th`,`Lost FINAL 1-3 (Peoria)`],[`2022-23`,`32-19-5`,`69`,`4th`,`WON CUP 3-1 (Birmingham)`],[`2023-24`,`33-15-8`,`74`,`3rd`,`Lost Semis (Huntsville)`],[`2024-25`,`34-17-5`,`73`,`3rd`,`Lost R1 (Knoxville)`],[`2025-26`,`32-21-3-2`,`69`,`3rd`,`Lost Semis 1-3 (Evansville)`]],
 leaders:`Use Elite Prospects, not the team site — its About page is stale and internally contradictory ⚠️. GP Mac Jansen 284 · goals Jansen 107 · assists Matt O'Dea 135 in 269 GP · points Jansen 234 · Nick Ford 183 (1.12 per game, the franchise best) · CJ Stubbs 170 ✅. Austyn Roudebush became the all-time SPHL career wins leader on Nov 21, 2025 with win #112 — a 41-save shutout, his 15th; 2022-23 Playoffs MVP ✅.`,
 records:`Awards: Joe Widmar 2026 SPHL MVP, the franchise's first ✅ · Nick Ford 2024-25 scoring title (72) · Gallagher 2024-25 Rookie of the Year · Pepe 2023-24 Defenseman of the Year · Barone 2017-18 Goalie of the Year ✅.`,
 attendance:`2024-25: 153,230 total for a 5,473 average, third in the SPHL ✅.`,
 retired:`None as of 2025 ✅.`,
 coach:`Dan Bremner — took over during 2017-18 and won the 2023 Cup ✅. Record roughly 198-142-45 ➗ ⚠️ (an estimate; no published figure exists).`,
 story:`"Cardiac Canines" is their own nickname and it fits — the 2023 Cup came on Mac Jansen's OT goal in Game 4. Roudebush is the SPHL's all-time wins leader. They sat out 2020-21 entirely, which trips up broadcasters every year.`
},
"Knoxville Ice Bears":{
 basics:[[`Founded`,`2002 (ACHL) → SEHL 2003-04 → SPHL charter member 2004-05. The only remaining charter franchise still in its original city under its original name, and it has never missed a season ✅`],[`Owner`,`Mike Murray, since 2006 ✅`],[`Arena`,`Knoxville Civic Coliseum — opened 1961, 6,500 (~$11M renovation, 2019) ✅`],[`Mascot`,`Chilly Bear ✅`],[`Colors`,`Unverified — confirm visually before using ❌`]],
 allTime:`654-447-80-21 for 1,409 points in 1,202 GP ➗, arithmetic-checked. Including the pre-SPHL years: 716-498-103 ➗.`,
 titles:`4 President's Cups: 2006, 2008, 2009, 2015 ✅ — tied with Pensacola for the most. Five Coffey Trophies (2004-05, 2005-06, 2007-08, 2008-09, 2021-22) ✅. Five Finals; lost the 2025 Final to Evansville 0-2, with Game 1 a 4-3 double-overtime loss at home ✅.`,
 seasons:[],
 keySeasons:`2005-06: 36-14-5-1, 78 points, Cup ✅ · 2008-09: 35-16-5-4, 79 points, Cup ✅ · 2021-22: 42-10-2-2, 88 points — the franchise record ✅ · 2023-24: 16-36-3-1, 36 points, last place and the worst season ✅ · 2024-25: 25-24-5-2, 57 points, 6th — then a run to the Final ✅ · 2025-26: 27-26-2-3, 59 points, 7th — swept Huntsville in Round 1, then lost the semis 0-3 to Peoria ✅.`,
 leaders:`SPHL-only (QuantHockey): Kevin Swider 693 points (255G-438A) in 381 GP · Mark Van Vliet 239 · Berkley Scott 234 · Tim Vitek 212 · Emery Olauson 199 ✅. Goalies: Bryan Hince 90 wins in 169 GP (2.59, .916, 9 SO) · Gallant 50 · Stead 40 ✅. Careful with Swider: 693 is SPHL regular season only ✅, 772 was his Ice Bears total at his jersey retirement ✅, and 858 as an all-league franchise total is single-sourced ⚠️. The club's own all-time list folds in the ACHL/SEHL years — say "SPHL leader" or "franchise leader" precisely, because they are different lists ⚠️.`,
 records:`Single-season: Swider 106 points (33-73) in 52 GP, 2004-05 ✅ · goals 44 (Voorhees 2004-05, Olauson 2011-12) · assists Swider 73 ✅. Swider's honors: seven First-Team All-SPHL selections, seven scoring titles, three MVPs ✅.`,
 attendance:`No single-game figure has been verified — do not quote one ❌.`,
 retired:`Kevin Swider, jersey retired Jan 4, 2014 ✅ — the NUMBER is unconfirmed, so say "his jersey was retired" ❌. Separate from retired numbers, the "Pillar of Champions" honor ring includes Van Vliet, Don LaBelle, Mike Murray, Wes McCauley (now a top NHL referee — a great note), Vitek, Menzul, Hince and Voorhees ✅.`,
 coach:`John Gurskis — hired 2024, the ninth in franchise history, re-signed to a two-year extension ✅. Record 52-50-7-5 in 114 GP ➗. Career: 536 pro games; all-time points leader at St. Michael's College (234); five years as an ECHL assistant in Wichita ✅.`,
 story:`The league's constant — the only charter club still in its original city under its original name, never missing a season. Wes McCauley, now one of the NHL's top referees, is in their honor ring. They swept the Havoc out of the 2026 playoffs as the #7 seed.`
},
"Pensacola Ice Flyers":{
 basics:[[`Founded`,`2009. The name honors both NAS Pensacola / the Blue Angels and founding owner Tim Kerr — 11 NHL seasons with the Philadelphia Flyers ✅`],[`Owner`,`Greg Harris, since April 2013 ✅`],[`Arena`,`Pensacola Bay Center — opened Jan 21, 1985, 8,082 for hockey ✅`],[`Mascot`,`"Maverick," a bald eagle ⚠️`],[`Colors`,`Navy / Columbia blue / gray / white ⚠️`]],
 allTime:`465-351-82-28 for 1,040 points in 926 GP ➗. Grokipedia's 441-331-101 conflicts with this — use the computed figure and say "approximately," or skip the all-time record on air ⚠️.`,
 titles:`4 President's Cups: 2013, 2014, 2016, 2021 ✅ — tied with Knoxville for the most. The 2013 title was the City of Pensacola's first pro sports championship ✅. Three titles in four years (2013, 2014, 2016). Finals loss in 2012 to Columbus; one Coffey Trophy (2013-14) ✅.`,
 seasons:[],
 keySeasons:`2013-14: 38-13-5, 81 points — the franchise record, Coffey Trophy and Cup ✅ · 2016: Cup, sweeping Peoria 3-0 ✅ · 2021: Cup from fourth place at 14-17-2-4, sweeping Knoxville and then Macon ✅ · 2024-25: 15-28-5-8, 43 points, LAST — their first missed playoffs since COVID ✅ · 2025-26: 28-21-6-3, 65 points, 5th, lost the quarterfinal 1-2 to Evansville ✅.`,
 leaders:`Garrett Milan 276 points (89G-187A) in 260 GP — leads games, goals, assists and points ✅ · Corey Banfield 206 · Bondarenko 188 · Adam Pawlick 169 ✅. Goalies: Ross MacKinnon 36 wins on a 36-5 record with a 2.04 GAA and .931 SV% ✅ · shutouts Brian Billett 6 ✅.`,
 records:`Playoff hex worth noting: Peoria eliminated Pensacola three years running — 2022, 2023 and 2024 ✅.`,
 attendance:`A franchise record four straight years: 2025-26 drew 168,493 with five sellouts · 2024-25: 152,702 · 2023-24: 148,588 for a 5,307 average ✅. Single-game: an 8,049 sellout on Jan 26, 2020 vs Roanoke ✅. The club billed a 7,325 crowd (Dec 28, 2024) as a "record," which conflicts — safe phrasing is "the Bay Center has been sold out at 8,049 for Ice Flyers hockey" ⚠️.`,
 retired:`Unverified — Grokipedia claims #25 Pawlick and #47 Buccella; do not state either as fact ❌.`,
 coach:`Jeremy Gates — named May 14, 2025 ✅. Record 28-21-6-3 in 58 GP ➗. A former Ice Flyers defenseman (95 GP) and one of only three players in franchise history with three President's Cups (2013, 2014, 2016) ✅. Predecessors were a revolving door: Gary Graham (2012-13 title, left for Fort Wayne, rehired July 12, 2023 exactly 11 years later, fired Feb 2025) and Rod Aldoff in four separate stints (titles in 2014 and 2016) ✅.`,
 story:`Tied with Knoxville for the most Cups. The 2013 title was Pensacola's first pro sports championship of any kind. Their coach won three Cups in the same building as a player. Peoria has been their playoff wall — three straight eliminations, 2022 through 2024.`
},
"Birmingham Bulls":{
 basics:[[`Founded`,`2017 as an expansion team — NOT a relocation. Revives the name from the WHA Bulls (1976-79) and ECHL Bulls (1992-2001) ✅`],[`Founder`,`Art Clarkson — stepped down May 2019, died October 2019 ✅`],[`Arena`,`Pelham Civic Complex — opened 1997, 4,100, the smallest in the league, about 15 miles south of downtown ✅`],[`Colors`,`Red / black / grey / white ✅`],[`Mascot`,`None found ❌`],[`For air`,`Named "Birmingham," plays in Pelham ✅`]],
 allTime:`243-188-37-15 for 538 points in 483 GP ➗. Wikipedia's all-time line has a wrong losses figure (166; the correct number is 146) — don't repeat it ⚠️.`,
 titles:`No President's Cups. Two Finals — 2019 (lost 0-2 to Huntsville) and 2023 (lost 1-3 to Roanoke) ✅. One Coffey Trophy (2023-24) ✅.`,
 seasons:[[`2017-18`,`22-28-5-1`,`50`,`9th`,`DNQ`],[`2018-19`,`39-15-2-0`,`80`,`2nd`,`Lost FINAL 0-2 (Huntsville)`],[`2019-20`,`17-23-4-2`,`40`,`T-9th`,`Cancelled`],[`2020-21`,`12-23-7-0`,`31`,`5th`,`DNQ — worst season`],[`2021-22`,`18-32-5-1`,`42`,`9th`,`DNQ`],[`2022-23`,`37-16-2-2`,`78`,`2nd`,`Lost FINAL 1-3 (Roanoke)`],[`2023-24`,`38-9-6-3`,`85`,`1st (Coffey)`,`Lost QF 1-2 (Evansville)`],[`2024-25`,`32-19-4-1`,`69`,`4th`,`Lost SF 1-2 (Knoxville)`],[`2025-26`,`28-23-2-5`,`63`,`6th`,`Lost QF 0-2 (Roanoke)`]],
 leaders:`Points Carson Rose 179 in 167 GP · goals Mike Davis 97 in 246 GP · assists Josh Harris 100 ⚠️. Goalies: Hayden Stewart 80 wins in 166 GP with 11 shutouts — he leads all three ⚠️. Grokipedia wrongly names Mavric Parks the wins leader (he is third) and its career totals are stale, written mid-season — treat every Birmingham career number as approximate ⚠️.`,
 records:`The cruel stat: the one year they won the regular season (2023-24, 85 points, first overall) they were eliminated in round one, and both Finals runs came from second place ✅. Awards: Josh Harris 2018-19 MVP · Mavric Parks 2018-19 Goalie of the Year · Jamey Hicks 2018-19 Coach of the Year · Carson Rose 2023-24 MVP ⚠️ · Drake Glover 2025-26 All-SPHL First Team with a league-leading 15 power-play goals · Matt Wood 2025-26 All-Rookie ✅.`,
 attendance:`Not published ❌.`,
 retired:`None found ❌.`,
 coach:`Craig Simchuk — hired November 2020, signed a multi-year extension June 30, 2026 ✅. Record 165-122-38 in 325 GP ➗, which cross-checks against the league's report of his 150th win during 2025-26 ✅. Three-time Coach of the Year (2022-23, 2023-24, 2025-26), joining Peoria's Jean-Guy Trudel (four) as the only coaches to win it more than twice ✅. Born April 21, 1989 in Winnipeg. Turnarounds: +36 points in 2022-23 (42 to 78, ninth to the Final), and in 2025-26 last place on Christmas Day into the second-best record in the league (22-12-2) the rest of the way ✅. He is also 19th on his own team's all-time scoring list — 106 GP, 17-39-56 as a player ✅.`,
 story:`Craig Simchuk is 19th on his own team's all-time scoring list — 106 GP, 17-39-56 as a player. The Huntsville rivalry is real and two-sided: Birmingham won the 2023 semifinal, Huntsville won the 2019 Cup over them. Smallest building in the league, and the club is named for a city it doesn't play in.`
},
"Evansville Thunderbolts":{
 basics:[[`Founded`,`Feb 8, 2016 as an expansion team; began play 2016-17 ✅`],[`Name`,`For the P-47 Thunderbolt, built in Evansville during World War II ✅`],[`Owner`,`VW Sports / VenuWorks ✅`],[`Arena`,`Ford Center — opened 2011, about 9,400 ✅`],[`Mascot`,`Aero ✅`],[`Colors`,`Red / blue / gray / white ✅`]],
 allTime:`216-225-55 in 496 GP ➗ — independently corroborated ✅.`,
 titles:`2 President's Cups — 2025 and 2026, back-to-back ✅. The fourth franchise ever to repeat, joining Knoxville (2008-09), Pensacola (2013-14) and Huntsville (2018-19) ✅. 2025: won it from the 7 seed at exactly .500 (24-24-8), one of the unlikeliest runs in league history, sweeping Knoxville in the Final — Game 1 a 4-3 double overtime, Game 2 a 2-1 OT on Aidan Litke's goal 1:30 in; Cole Ceci Playoff MVP, .962, 29-of-30 in the clincher ✅. 2026: rallied from 0-2 down on Peoria to win 3-2 — G3 2-1, G4 4-1, G5 6-4 at Carver Arena on Saturday May 9, 2026, with goals from Isaac Chapman (2), MacPhee, Kirton, Hobbs and Contessa and 24 saves from Kristian Stead; Matthew Hobbs Playoff MVP with 1G-9A-10P and a +10 in 12 GP ✅. Three outlets print three different Game 5 dates; May 9 matches the league's scheduled Saturday and is almost certainly right — confirm before putting it in a graphic ⚠️.`,
 seasons:[[`2016-17`,`14-32-10`,`38`,`10th`,`Missed`],[`2017-18`,`27-20-9`,`63`,`6th`,`Lost Challenge Round`],[`2018-19`,`12-38-6`,`30`,`10th`,`Missed — worst season`],[`2019-20`,`25-14-7`,`57`,`5th`,`Cancelled`],[`2020-21`,`—`,`—`,`—`,`Opted out`],[`2021-22`,`28-26-2`,`58`,`7th`,`Lost QF`],[`2022-23`,`32-22-2`,`66`,`5th`,`Lost QF`],[`2023-24`,`23-29-4`,`50`,`8th`,`Lost SF`],[`2024-25`,`24-24-8`,`56`,`7th`,`CHAMPION`],[`2025-26`,`31-20-7`,`69`,`4th`,`CHAMPION`]],
 leaders:`Scott Kirton 188 points (85G-103A) in 215 GP — leads points, goals and games ✅. Assists are disputed: Elite Prospects says Austin Plevy 84, QuantHockey says Kirton 103 ⚠️. Goalies: Cole Ceci 30 wins; shutouts Brian Billett 5 ✅.`,
 records:`Most points 66 and most wins 32 (2022-23) · win streak 7 (Nov 29–Dec 20, 2019) · winless streak 13 (2018) · single-season points Austin Plevy 63 (2019-20) · goalie wins Billett 21 (2021-22) · most PIM 998 (2024-25) ✅.`,
 attendance:`Single-game 7,758 on Education Day, Oct 29, 2024 ✅.`,
 retired:`None found ❌.`,
 coach:`Jeff Bes — head coach since 2019 ✅. Joined the SPHL's 300-win club Feb 16, 2025, fourth all-time behind Trudel (389), Bechard (368) and Detulleo (312) ✅. Franchise leader in games coached (270) and wins (132) through 2024-25 ✅. Also coached Fayetteville 2015-17, going 66-38-8 — a good note when those two meet ✅.`,
 story:`Back-to-back champions, and the 2025 title came from the 7 seed at exactly .500 — one of the unlikeliest runs the league has seen. In 2026 they became the first team to win the Final after trailing 0-2. Jeff Bes coached Fayetteville before Evansville and sits fourth on the SPHL all-time wins list.`
},
"Macon Mayhem":{
 basics:[[`Founded`,`2010 as the Augusta RiverHawks (2010-13); an ice plant failure ended Augusta, the move to Macon was announced June 25, 2014, the club sat dormant in 2014-15 and debuted as the Mayhem in 2015-16 ✅`],[`Owner`,`Chuck Norris Jr. — who also owns Fayetteville ✅`],[`Arena`,`Macon Coliseum — opened 1968, Georgia's first such facility, 7,182 for hockey ✅`],[`Identity`,`2024 rebrand to black / Mayhem red / ice blue with a Viking logo hiding an "M" in the beard ⚠️; mascot Mac the Barbarian ⚠️`],[`Earlier Macon hockey`,`Whoopees (SHL 1973-74), Whoopee (CHL 1996-2001, coached by John Paris Jr. and Graeme Townshend — both Black head coaches), Trax, Whoopee (ECHL 2001-02) ✅`]],
 allTime:`254-280-62 in 596 GP ➗ ⚠️ — not published anywhere.`,
 titles:`1 President's Cup: 2017 — quarterfinal d. Columbus 2-1, semifinal swept Pensacola, Final swept Peoria 2-0 with a 2-1 clincher at the Macon Coliseum on goals by Sicard and Trask; Jordan Ruby Playoff MVP at 6-1, 1.53, .952 ✅. Two Coffey Trophies (2016-17, 2020-21) ✅. The 2021 Final: swept by Pensacola despite going 10-0-2 against them in the regular season ✅.`,
 seasons:[[`2015-16`,`24-27-5`,`53`,`8th`,`Lost QF`],[`2016-17`,`37-13-6`,`80`,`1st`,`CHAMPION`],[`2017-18`,`33-16-7`,`73`,`2nd`,`Lost SF`],[`2018-19`,`27-24-5`,`59`,`6th`,`Lost QF`],[`2019-20`,`17-24-6`,`40`,`T-8th`,`Cancelled`],[`2020-21`,`32-6-4`,`68`,`1st`,`Lost Final`],[`2021-22`,`10-40-6`,`26`,`10th`,`Missed — worst season`],[`2022-23`,`13-39-5`,`31`,`10th`,`Missed`],[`2023-24`,`15-34-7`,`37`,`9th`,`Missed`],[`2024-25`,`20-31-5`,`45`,`9th`,`Missed`],[`2025-26`,`26-26-6`,`58`,`8th`,`Lost QF`]],
 leaders:`Jake Trask leads goals, assists and points either way, but the sources disagree on his totals — QuantHockey says 211 points, Grokipedia says 229 in 211 GP (the "211" there is likely his games). Needs a third source before it goes in a graphic ❌. Goalies: Josh Boyko 27 wins in 80 GP · shutouts Bartus 4 · best GAA Theut 1.74 ⚠️.`,
 records:`Elite Prospects renders Macon's 2018-19 and 2016-17 seasons incorrectly — the table above is the reconciled version ⚠️.`,
 attendance:`Single-game 5,716 on Mar 20, 2025 vs Birmingham ⚠️.`,
 retired:`#10 Caleb Cameron ✅.`,
 coach:`Dave Pszenyczny — hired July 25, 2024, the seventh in team history ✅. Record 46-57-11 ➗. Was Quad City's inaugural coach for six seasons (2018-19 through 2023-24) — a storyline whenever those two meet ✅. SPHL Defenseman of the Year in 2017-18 as a player ✅.`,
 story:`Notable predecessor: Leo Thomas (2018-19) was the first Black head coach in SPHL history, and Macon's CHL past includes two more in John Paris Jr. and Graeme Townshend. Kevin Kerr won Coach of the Year here in 2017 and 2020-21. Owner Chuck Norris Jr. also owns Fayetteville.`
},
"Fayetteville Marksmen":{
 basics:[[`Founded`,`2002 as the Cape Fear FireAntz (ACHL) → SEHL → SPHL in 2004-05 as the Fayetteville FireAntz → rebranded the Marksmen in 2017, referencing Fort Bragg and the native Carolina red fox ✅`],[`Owner`,`Chuck Norris Jr. — who also owns Macon ✅`],[`Arena`,`Crown Coliseum — opened 1997, 8,920. The 4,500 figure on Wikipedia is the separate, older Crown Arena ✅`],[`Identity`,`Mascot Marky; slogan #FearTheFox ✅`]],
 allTime:`583-475-110 in 1,168 GP for 1,276 points ➗.`,
 titles:`1 President's Cup: 2006-07 — quarterfinal d. Huntsville 2-0, semifinal d. Knoxville 2-0, Final d. Jacksonville 3-1 (Apr 13-18, 2007) under coach John Marks, who played 657 NHL games for Chicago. It was Fayetteville's first pro sports championship in 51 years ✅. Also lost the 2009 Final to Knoxville 4-3, and won one Coffey Trophy (2012-13) ✅. Opted out of 2020-21 over arena capacity restrictions ✅.`,
 seasons:[],
 keySeasons:`Best: 2021-22 at 40-14-2, 82 points ✅ · 2019-20 at 31-6-9, 71 points (.772) ✅ · 2016-17 at 36-17-3, 75 points ✅. Worst: 2017-18 at 12-38-6, 30 points — four coaches that season ✅. 2025-26: 23-28-5-2, 53 points, 10th ✅.`,
 leaders:`Rob Sich 362 points (198G-164A) in 245 GP, leading points and goals · assists Chris Leveille 173 · games Bobby Reed 275 ✅. Single-season: Sich 98 points and 63 goals (2009-10) · Leveille 65 assists (2009-10) · goalie wins Sean Bonar 32 with a 2.07 GAA (2016-17) ✅.`,
 records:`Single-game: 6 points — Josh Welter (twice) and Rob Whidden · 5 goals — Sich (Mar 6, 2010) and Steve Roberts (Feb 4, 2005) · 39 PIM by Caleb Moffat vs Huntsville (Dec 11, 2004) ✅. Streaks: 11 wins (Feb 17–Mar 16, 2007) · 13 straight home wins (2005) · winless 13 (2018) ✅. Head-to-head all-time from the official record book: vs Knoxville 92-73-16 · vs Macon 106-62-11 · vs Huntsville 55-48-16 in 119 GP ✅.`,
 attendance:`Not published ❌.`,
 retired:`None found ❌.`,
 coach:`Garrett Rutledge — hired May 29, 2026, the ninth in franchise history, also Director of Hockey Operations ✅. Zero games coached for Fayetteville so far. Immediately prior: the Athens Rock Lobsters in 2025-26 (44-11-1 and the FPHL Continental Division title); before that the Carolina Thunderbirds of the FPHL (71-38-9, 2022-23 FPHL Coach of the Year); and on the Saginaw Spirit OHL staff for the 2024 Memorial Cup win ✅. Replaces Kyle Sharkey (53-47-14) ✅.`,
 story:`The best-documented club in the league — their record book publishes head-to-heads, including 55-48-16 against Huntsville. Owner Chuck Norris Jr. also owns Macon. New coach Garrett Rutledge ran Athens last season, so Fayetteville-Athens is a live storyline all year. Jeff Bes coached here before Evansville.`
},
"Quad City Storm":{
 basics:[[`Founded`,`May 24, 2018, filling the void left by the folding of the ECHL Quad City Mallards ✅`],[`Owners`,`Ryan Mosley and John Dawson (Red Sky Sports); consultant Howard Cornfield, the original Mallards owner ✅`],[`Arena`,`Vibrant Arena at The MARK, Moline IL — opened May 1993, 9,810 ⚠️; renamed from the TaxSlayer Center on Sept 1, 2022 ✅`],[`Mascot`,`Radar, a black-and-white fox ✅`],[`Colors`,`Not documented ❌`]],
 allTime:`170-178-35 in 383 GP ➗. No Cup appearances and no championships; three playoff berths in eight seasons ✅.`,
 titles:`None ✅.`,
 seasons:[[`2018-19`,`18-33-5`,`41`,`9th`,`Missed`],[`2019-20`,`16-20-8`,`40`,`7th-8th`,`Cancelled`],[`2020-21`,`—`,`—`,`—`,`Opted out`],[`2021-22`,`32-15-9`,`73`,`5th`,`Upset Fayetteville 2-1, lost SF to Peoria 1-2`],[`2022-23`,`23-32-2`,`48`,`9th`,`Missed`],[`2023-24`,`32-23-1`,`65`,`6th`,`Lost QF 1-2 (Roanoke)`],[`2024-25`,`24-27-5`,`53`,`8th`,`Lost R1 (Peoria)`],[`2025-26`,`25-28-5`,`55`,`9th`,`Missed`]],
 leaders:`Leif Mattson 204 points (88G-116A) in 177 GP, 1.15 per game ✅ · games Tommy Tsicos 369 — extraordinary given the franchise has played only 383, worth confirming ⚠️. Goalies: Brent Moran 42 wins with 7 shutouts ✅. Single-season: Mattson 68 points (2024-25); Moran 21 wins ✅. Elite Prospects renders 2018-19 as 14-33-5, which doesn't sum — 18-33-5 is correct ⚠️.`,
 records:`Best season 2021-22 at 73 points, which included the only playoff series win in franchise history ✅.`,
 attendance:`Single-game 8,181 on Feb 24, 2025 vs Peoria (Dollar Beer Night), breaking 7,042 from 2023-24 ✅. Best season 103,672 for a 3,703 average (2023-24) ✅.`,
 retired:`None found ❌.`,
 coach:`Shayne Toporowski — named May 30, 2024, the second in franchise history ✅. Record 49-55-10 ➗. Eighteen pro seasons as a player (NHL/AHL/Europe), finishing with the Quad City Mallards; six seasons as head coach at Worcester State, where his 58 wins made him the school's winningest in 42 years ✅. Brother of Mallards legend Kerry Toporowski ✅.`,
 story:`"The Cold War on 74" against Peoria, named for the interstate ⚠️ — and Peoria has knocked them out twice. Dave Pszenyczny built this team from scratch over six seasons and now coaches Macon.`
},
"Athens Rock Lobsters":{
 basics:[[`Founded`,`2022 in the FPHL, debuted 2024-25; SPHL entry announced May 13, 2026 ✅`],[`Arena`,`Akins Ford Arena, "The Tank," Athens GA — opened Dec 13, 2024, 5,500 for hockey ✅`],[`Owner`,`Spire Hockey (Todd Mackin) ✅`],[`Identity`,`Named for the B-52s' "Rock Lobster" — the band formed in Athens in 1976 and members attended the opener. Mascot Clawdius, a fan-named red lobster. Colors crimson, sapphire, Norfolk sky, white ✅`]],
 allTime:`FPHL: 87-21-4 across two seasons ➗ — 2024-25 at 43-10-3 (121 points) and 2025-26 at 44-11-1 (124 points, Continental Division champions) ✅. No SPHL games played yet ✅.`,
 titles:`None. Lost the 2025 first round 1-2 to Columbus in a best-of-three; swept 0-2 by Pee Dee in 2026 despite an 11-3 season series ✅.`,
 seasons:[[`2024-25 (FPHL)`,`43-10-3`,`121`,`—`,`Lost R1 1-2 (Columbus)`],[`2025-26 (FPHL)`,`44-11-1`,`124`,`Division champs`,`Swept 0-2 (Pee Dee)`]],
 leaders:`2024-25: Garrett Milan 37-64-101 in 56 GP — FPHL MVP and the league's only 100-point player · Shinkaruk 77 · Virgili 68 · Kayson Gallant 67 with 40 goals to lead the FPHL ✅. 2025-26: Milan 31-56-87 in 51 GP as a player-assistant coach · Shinkaruk 72 · Neiley 60 · Bandurkin 56 · Mack 56 ✅. Goalies 2024-25: Rosenzweig 21-7, 2.21, .926 · Lavallière 12-2, 2.38, .935 ✅. Goalies 2025-26: McPhail 24-7, 2.93, .923 · Lavallière 15-3, 3.14, .907 ⚠️.`,
 records:`See the League Reference FPHL file for the full two-season detail.`,
 attendance:`229,000+ over two FPHL seasons; 125,611 in 2025-26 for about 4,486 a game, with 10 sellouts of 5,500+ ✅.`,
 retired:`None ✅.`,
 coach:`Scott Burt — named GM and head coach May 29, 2026 ✅. Arrives with ECHL head-coaching experience in Idaho and Rapid City plus a stop in Greensboro. Zero SPHL games coached. Predecessors: Steve Martinson (2024-25, FPHL Coach of the Year, left for ECHL Allen) and Garrett Rutledge (2025-26, parted ways April 24, 2026) ✅.`,
 story:`Cross-reference: last season's coach Garrett Rutledge now runs Fayetteville, so both are on the Havoc schedule this year. Named for a B-52s song, with the band's hometown ties baked into the identity. Their 2026-27 home and season opener is Oct 16 vs Macon at The Tank — the same night the Havoc open in Florence.`
},
"Pee Dee IceCats":{
 basics:[[`Founded`,`Lineage: Elmira River Sharks (2023) → Hudson Valley Venom (2024) → HC Venom → relocated to Florence as the Pee Dee IceCats for 2025-26; SPHL entry approved June 24, 2026 ✅`],[`Arena`,`Florence Center, Florence SC — about 7,600 for hockey, 10,000 total ⚠️`],[`Owner`,`Kevin Cuppia, managing partner and president — majority owner Parker Moskal was removed Oct 22, 2025, four games into the season ✅`],[`GM`,`Tom Callahan, who is also the team broadcaster ✅`],[`Identity`,`Colors electric blue / red / navy / sky blue / silver / black; palmetto-moon claw alternate logo. IG @peedeeicecats · PeeDeeProHockey.com ✅`],[`Arena history`,`The Pee Dee Pride (ECHL, 1997-2005) played in Florence — pro hockey returns ✅`]],
 allTime:`FPHL 2025-26: 24-25-2-5, fourth in the Continental Division, about 81 points ➗. No SPHL games played yet ✅.`,
 titles:`None. Reached the 2026 FPHL Commissioner's Cup Final in year one and lost it 3-1 to Binghamton ✅.`,
 seasons:[[`2025-26 (FPHL)`,`24-25-2-5`,`~81`,`4th Continental`,`Lost Commissioner's Cup Final 1-3 (Binghamton)`]],
 leaders:`Patriks Marcinkevics 42-48-90 in 53 GP, co-leading the FPHL scoring race late · Dominiks Marcinkevics 28-35-63 in 40 GP · Houston Wilson 18-41-59 in 48 GP, since departed to Port Huron · Alexander Legkov 19-31-50 in 30 GP with PD, FPHL Rookie of the Year (91 points league-wide) · Zaychik 41 · Lord 35 · Rasulov 35 ✅. Goalies: playoff starter Breandan Colgan (departed, Watertown), Parker Rutherford (returning for 2026-27), Rahul Sharma 6-6-1, .890 (departed) ⚠️.`,
 records:`The "Cardiac Cats" run: swept top-seeded Athens 2-0 after going 3-11 against them in the regular season — the first playoff series win in franchise history; beat Columbus 2-1 on back-to-back overtime wins, including a Houston Wilson hat trick with the tying goal at 1:01 and the series-winner in OT ✅.`,
 attendance:`FPHL single-season record 126,841 for a 4,698 average, and the FPHL single-game record 7,837 vs Athens on Jan 17, 2026 ✅.`,
 retired:`None ✅.`,
 coach:`Chris Bernard — hired July 5, 2026, his first professional head-coaching job after 17 years at SUNY Potsdam (NCAA D-III) ✅. Succeeds Gary Graham, who retired after the Commissioner's Cup Final run. Zero SPHL games coached. Known 2026-27 signings so far: Rutherford (G) and Charlie Bedard (D) returning, plus Asp, Fechko and Shaporev ⚠️.`,
 story:`The Havoc open the season in Florence, Oct 16-17 — the first meeting in history. Home playoff games were "White Out" nights. Pro hockey returns to a building that housed the ECHL Pride for eight seasons.`
}};
