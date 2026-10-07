/* Preseason vs PEN — the researched data for the Fri Oct 9, 2026 exhibition,
   verbatim from PRESEASON_PEN_TAB.md (research as of Oct 5, 2026). A classic
   script so the tab renders offline and from file://. Seeded values are never
   edited in place: anything typed lives under DATA.preseasonPen. */
const PRESEASON_PEN = {
  "meta": {
    "id": "preseason-2026-pen",
    "title": "Preseason vs. Pensacola Ice Flyers",
    "asOf": "2026-10-05",
    "date": "2026-10-09",
    "puckDropCT": "7:00 PM",
    "venue": null,
    "venueNote": "Havoc ticket page lists '2026 Havoc Exhibition Game,' 10/9/26 at 7:00 PM, with no rink named. WKRG says the Ice Flyers play 'on Friday, Oct. 9, on the road against the Huntsville Havoc.' The Ice Flyers' Oct. 5 'Flight Prep' post says 'Friday, October 11' (Oct. 11 is a Sunday, so that is a typo).",
    "stream": "Radio & YouTube Live",
    "gameType": "Preseason",
    "opponent": "Pensacola Ice Flyers",
    "ticketUrl": "https://www.gofevo.com/event/26Havoc1009"
  },
  "quickFacts": [
    "2025-26 series: Havoc 5-2-1, outscored Pensacola 32-24. All 8 games were played by Dec. 27.",
    "2025-26 finish: Havoc 2nd (70 pts), Ice Flyers 5th (65 pts). Both lost in the first round.",
    "Next meeting that counts: Oct. 23 in Huntsville (Havoc home opener), then Oct. 24 in Pensacola.",
    "Same matchup opened the 2025 preseason too: Oct. 11, 2025, in Pensacola.",
    "Havoc bring back 4 of last year's top 11 scorers; Pensacola brings back 3, and its top 3 are all gone."
  ],
  "storylines": [
    {"title": "The Sciarrino trade", "text": "Pensacola sent Dawson Sciarrino to Huntsville in February for Matt Allen. Sciarrino had 13 points in 14 Havoc games. He faces his UW-Stevens Point teammates Tyler German and Andrew Poulias."},
    {"title": "Alger is back", "text": "30 goals, All-SPHL Second Team, two hat tricks. Scored both Havoc goals in the last meeting, a 2-1 win in Pensacola on Dec. 27."},
    {"title": "Pensacola reloads", "text": "The Ice Flyers' top 3 scorers are gone: Sam Rhodes (38 pts), Shane Bull and Cooper Jones (now at Tahoe's ECHL camp). Only German, Poulias and Burnie return from the top 10. Coach Jeremy Gates enters year two after a 22-point jump."},
    {"title": "Havoc depth at ECHL camps", "text": "Four Havoc signees are at ECHL camps on tryouts: Brian Wilson (New Mexico), Ben Schultheis and Brayden Stannard (Greensboro), Landry Schmuck (Orlando). Any who are cut come back before opening night."},
    {"title": "Brothers", "text": "Tanner and Porter Schachle, from Wasilla, Alaska, are both in Pensacola's camp. Gio Procopio starts his first Havoc season without older brother Dom, the retired captain."},
    {"title": "Goalie auditions at both ends", "text": "With Brian Wilson at New Mexico's ECHL camp, the Havoc have Alex Proctor (2-0, .967 in two pro starts) and rookie Eric Ward. Pensacola: Rico DiMatteo (team-high 10 wins, 12 ECHL games at Rapid City) vs. newcomers Kilian Bernasconi and Keenan Rancier."},
    {"title": "Unfinished business", "text": "The No. 2 Havoc were swept by No. 7 Knoxville last spring. Pensacola lost Game 3 in overtime to eventual champion Evansville."}
  ],
  "topScorers": {
    "havoc": {
      "summary": "4 of 11 back (tie at No. 10). Biggest losses: Josh Kestner (50 pts) and Cole Reginato (161 PIM), neither with a new team listed.",
      "rows": [
        {"rank": 1, "name": "Austin Alger", "pos": "F", "gp": 54, "g": 30, "a": 23, "pts": 53, "plusMinus": 13, "plusMinusPerGP": 0.24, "status": "back", "where": "Havoc camp"},
        {"rank": 2, "name": "Josh Kestner", "pos": "F", "gp": 56, "g": 22, "a": 28, "pts": 50, "plusMinus": -2, "plusMinusPerGP": -0.04, "status": "unsure", "where": "No new team or retirement found"},
        {"rank": 3, "name": "Gio Procopio", "pos": "F", "gp": 58, "g": 12, "a": 22, "pts": 34, "plusMinus": 19, "plusMinusPerGP": 0.33, "status": "back", "where": "Havoc camp"},
        {"rank": 4, "name": "Cole Reginato", "pos": "LW", "gp": 52, "g": 14, "a": 19, "pts": 33, "plusMinus": 11, "plusMinusPerGP": 0.21, "status": "unsure", "where": "On the Havoc protected list (May 22) but never re-signed"},
        {"rank": 5, "name": "Connor Fries", "pos": "C", "gp": 54, "g": 12, "a": 16, "pts": 28, "plusMinus": 4, "plusMinusPerGP": 0.07, "status": "back", "where": "Havoc camp"},
        {"rank": 6, "name": "Matt Allen", "pos": "F", "gp": 44, "g": 10, "a": 15, "pts": 25, "plusMinus": 7, "plusMinusPerGP": 0.16, "status": "unsure", "where": "Traded to Pensacola in February; Pensacola protected him but he is not at their camp"},
        {"rank": 7, "name": "Kevin Weaver-Vitale", "pos": "D", "gp": 56, "g": 5, "a": 18, "pts": 23, "plusMinus": 7, "plusMinusPerGP": 0.13, "status": "unsure", "where": "On the Havoc protected list, never re-signed"},
        {"rank": 8, "name": "Connor Galloway", "pos": "F", "gp": 32, "g": 8, "a": 12, "pts": 20, "plusMinus": 3, "plusMinusPerGP": 0.09, "status": "new-team", "where": "Athens Rock Lobsters (SPHL expansion), per Elite Prospects only; no team release yet"},
        {"rank": 9, "name": "Ben Schultheis", "pos": "D", "gp": 51, "g": 5, "a": 14, "pts": 19, "plusMinus": 5, "plusMinusPerGP": 0.10, "status": "echl-camp", "where": "Re-signed with Havoc; at Greensboro Gargoyles (ECHL) camp on a tryout"},
        {"rank": 10, "name": "Ethan Lindsay", "pos": "LW", "gp": 53, "g": 8, "a": 9, "pts": 17, "plusMinus": 7, "plusMinusPerGP": 0.13, "status": "back", "where": "Havoc camp"},
        {"rank": 10, "name": "Dom Procopio", "pos": "D", "gp": 58, "g": 2, "a": 15, "pts": 17, "plusMinus": 5, "plusMinusPerGP": 0.09, "status": "retired", "where": "Retired June 15, 2026; now Director of Youth Travel Hockey at TPH Huntsville"}
      ]
    },
    "pensacola": {
      "summary": "3 of 11 back (tie at No. 10). The top 3 scorers are all gone.",
      "rows": [
        {"rank": 1, "name": "Sam Rhodes", "pos": "C", "gp": 58, "g": 24, "a": 14, "pts": 38, "plusMinus": -5, "plusMinusPerGP": -0.09, "status": "unsure", "where": "Pensacola protected him (May 22); not at camp"},
        {"rank": 2, "name": "Shane Bull", "pos": "F", "gp": 50, "g": 11, "a": 19, "pts": 30, "plusMinus": 2, "plusMinusPerGP": 0.04, "status": "unsure", "where": "Not protected; no new team found"},
        {"rank": 3, "name": "Cooper Jones", "pos": "D", "gp": 48, "g": 9, "a": 21, "pts": 30, "plusMinus": -4, "plusMinusPerGP": -0.08, "status": "echl-camp", "where": "Tahoe Knight Monsters (ECHL) preseason roster, Oct. 5; contract or tryout not stated"},
        {"rank": 4, "name": "Tyler German", "pos": "F", "gp": 58, "g": 16, "a": 12, "pts": 28, "plusMinus": -1, "plusMinusPerGP": -0.02, "status": "back", "where": "Ice Flyers camp"},
        {"rank": 5, "name": "Andrew Poulias", "pos": "C", "gp": 57, "g": 10, "a": 17, "pts": 27, "plusMinus": -9, "plusMinusPerGP": -0.16, "status": "back", "where": "Ice Flyers camp"},
        {"rank": 6, "name": "Tyler Burnie", "pos": "RW", "gp": 54, "g": 5, "a": 22, "pts": 27, "plusMinus": -2, "plusMinusPerGP": -0.04, "status": "back", "where": "Ice Flyers camp"},
        {"rank": 7, "name": "Tyrone Bronte", "pos": "F", "gp": 45, "g": 11, "a": 15, "pts": 26, "plusMinus": -9, "plusMinusPerGP": -0.20, "status": "new-team", "where": "Pee Dee IceCats (SPHL expansion), signed Aug. 26; Pee Dee hosts the Havoc on opening night, Oct. 16"},
        {"rank": 8, "name": "Zack Bross", "pos": "F", "gp": 58, "g": 12, "a": 10, "pts": 22, "plusMinus": -8, "plusMinusPerGP": -0.14, "status": "unsure", "where": "No new team found"},
        {"rank": 9, "name": "Michael Moran", "pos": "F", "gp": 33, "g": 7, "a": 14, "pts": 21, "plusMinus": -3, "plusMinusPerGP": -0.09, "status": "unsure", "where": "Traded to Peoria March 2; not on Peoria's roster now. Had 2 G, 1 A vs. the Havoc on Dec. 26"},
        {"rank": 10, "name": "Ethan Price", "pos": "RW", "gp": 57, "g": 8, "a": 12, "pts": 20, "plusMinus": 8, "plusMinusPerGP": 0.14, "status": "unsure", "where": "No new team found"},
        {"rank": 10, "name": "Cam Gaudette", "pos": "D", "gp": 42, "g": 7, "a": 13, "pts": 20, "plusMinus": -4, "plusMinusPerGP": -0.10, "status": "unsure", "where": "Signed an ECHL contract with Atlanta in February; not on Atlanta's Oct. 2 camp roster"}
      ]
    }
  },
  "echlCamps": [
    {"name": "Brian Wilson", "sphlTeam": "HSV", "pos": "G", "echlTeam": "New Mexico Goatheads", "type": "Pro tryout (PTO), announced Sept. 11", "note": "Re-signed with Havoc Aug. 20. Last year: 24-16-5, 2.35 GAA, .924, 4 SO"},
    {"name": "Ben Schultheis", "sphlTeam": "HSV", "pos": "D", "echlTeam": "Greensboro Gargoyles", "type": "Tryout (camp roster Oct. 4)", "note": "Re-signed Sept. 16. 6-foot-3 right shot; 5-14-19 last year"},
    {"name": "Brayden Stannard", "sphlTeam": "HSV", "pos": "F", "echlTeam": "Greensboro Gargoyles", "type": "Tryout (camp roster Oct. 4)", "note": "Signed Sept. 8. Knoxville: 29 GP, 6-8-14; 8 GP with Cincinnati (ECHL)"},
    {"name": "Landry Schmuck", "sphlTeam": "HSV", "pos": "F", "echlTeam": "Orlando Solar Bears", "type": "Amateur tryout (ATO); camp Oct. 2-12", "note": "Signed Aug. 24. Huntsville native, Aurora University"}
  ],
  "formerFlyersAtEchl": [
    "Cooper Jones (D, last year's No. 3 PEN scorer): Tahoe Knight Monsters preseason roster.",
    "Jonathan Ziskie (D): signed with Tahoe Sept. 22.",
    "Also on ECHL camp lists: Jordan Stock (Rapid City, PTO), Blake Wells (Reading), Christian Propp (Maine)."
  ],
  "transactionsForGameNotes": {
    "havoc": [
      "G Brian Wilson at New Mexico (ECHL) camp, PTO",
      "D Ben Schultheis at Greensboro (ECHL) camp, tryout",
      "F Brayden Stannard at Greensboro (ECHL) camp, tryout",
      "F Landry Schmuck at Orlando (ECHL) camp, ATO"
    ],
    "pensacola": [
      "No Ice Flyers signees at ECHL camps",
      "Former D Cooper Jones at Tahoe (ECHL) camp"
    ]
  },
  "h2h2025_26": {
    "summary": {"havocRecord": "5-2-1", "goalsFor": 32, "goalsAgainst": 24, "homeRecord": "3-1", "roadRecord": "2-1-1"},
    "games": [
      {"date": "2025-10-24", "site": "HSV", "final": "Havoc 6-2", "havocResult": "W", "notes": "Havoc home opener; attendance 6,065"},
      {"date": "2025-11-21", "site": "HSV", "final": "Havoc 7-1", "havocResult": "W", "notes": "Connor Galloway 2 goals in his Havoc debut; Connor Fries scored; Matt Allen shorthanded goal"},
      {"date": "2025-11-22", "site": "HSV", "final": "Havoc 7-3", "havocResult": "W", "notes": "Attendance 5,923"},
      {"date": "2025-11-26", "site": "PEN", "final": "Ice Flyers 8-1", "havocResult": "L", "notes": "Connor Fries scored the lone Havoc goal on the power play; Havoc 1-for-10 on the PP; sellout of 8,082"},
      {"date": "2025-12-11", "site": "PEN", "final": "Ice Flyers 4-3 (OT)", "havocResult": "OTL", "notes": "Matt Allen 2 goals; Ethan Lindsay tied it at 11:38 of the 3rd; Pensacola go-ahead goal was shorthanded; OT winner at 2:57"},
      {"date": "2025-12-20", "site": "PEN", "final": "Havoc 5-1", "havocResult": "W", "notes": "Galloway and Nathan Berke scored; Cole Reginato empty-netter; Brian Wilson 37 saves on 38 shots; Pensacola's first regulation home loss"},
      {"date": "2025-12-26", "site": "HSV", "final": "Ice Flyers 4-1", "havocResult": "L", "notes": "Ethan Lindsay scored (catfish thrown on the ice); Mike Moran 2 G, 1 A for Pensacola; attendance 6,273"},
      {"date": "2025-12-27", "site": "PEN", "final": "Havoc 2-1", "havocResult": "W", "notes": "Austin Alger scored both, both on the power play; winner with about a minute left; sellout of 8,082"}
    ]
  },
  "playoffHistory": [
    {"year": 2021, "round": "Semifinal", "winner": "Pensacola", "series": "2-0", "note": "Pensacola went on to win the 2021 President's Cup"},
    {"year": 2016, "round": "First round", "winner": "Pensacola", "series": "2-0", "note": "Sweep"},
    {"year": 2013, "round": "President's Cup Final", "winner": "Pensacola", "series": "2-1", "note": "Pensacola won the title over Huntsville"},
    {"year": 2010, "round": "First round", "winner": "Huntsville", "series": "2-1", "note": "Havoc went on to win their first Cup"}
  ],
  "trophyCase": {
    "havoc": "3 President's Cups (2010, 2018, 2019). 2018 team was the first No. 4 seed to win it.",
    "pensacola": "4 President's Cups, tied with Knoxville for the most in SPHL history."
  },
  "lastThreeSeasons": [
    {"season": "2025-26", "havoc": "32-20-5-1, 70 pts, 2nd. League-best 179 goals. Lost 0-2 to No. 7 Knoxville in the quarterfinals.", "pensacola": "28-21-6-3, 65 pts, 5th. Lost 1-2 to No. 4 Evansville (eventual champion); Game 3 in OT."},
    {"season": "2024-25", "havoc": "36-15-4-1, 77 pts.", "pensacola": "43 pts, 10th, missed playoffs."},
    {"season": "2023-24", "havoc": "30-19-6-1, 67 pts. Lost in the President's Cup Final.", "pensacola": "25-27-2-2, 54 pts."}
  ],
  "meetings2026_27": [
    {"date": "2026-10-23", "site": "HSV", "note": "Havoc home opener"},
    {"date": "2026-10-24", "site": "PEN"},
    {"date": "2026-11-25", "site": "PEN"},
    {"date": "2026-11-27", "site": "HSV"},
    {"date": "2027-01-22", "site": "HSV"},
    {"date": "2027-02-07", "site": "PEN"}
  ],
  "teams": {
    "havoc": {
      "name": "Huntsville Havoc",
      "coaches": [
        {"number": null, "name": "Stuart Stefan", "role": "Head coach", "notes": "No. 7 retired. Played for the Havoc 2011-18; franchise record 379 games played. Won the 2018 President's Cup as a player. On the Havoc bench since 2018. Led the team to 32-20-5-1 (2nd) last season.", "tags": ["confirm"], "confirmNote": "Confirm first year as head coach; Wikipedia lists Glenn Detulleo as head coach through 2022-23."},
        {"number": null, "name": "Tyler Piacentini", "role": "Assistant coach", "notes": "No. 14 retired. Played for the Havoc 2017-23 and wore the C. Won Cups in 2018 and 2019 as a player. 61 points (22-39) in 2022-23, his final season. Assistant coach since 2023.", "tags": []}
      ],
      "forwards": [
        {"number": "18", "name": "Austin Alger", "pos": "RW", "age": null, "hometown": "Livonia, MI", "stats": "HSV: 54 GP, 30-23-53, 7 PPG, 5 GWG", "plusMinus": 13, "pmGP": 54, "plusMinusPerGP": 0.24, "plusMinusScope": null, "echlLastSeason": null, "notes": "Led Havoc in goals. All-SPHL Second Team, 2 hat tricks, 2x SPHL Player of the Week. NCAA D-I at Miami (Ohio) and Canisius. Third season in Huntsville. Scored both goals in the 2-1 win at Pensacola on Dec. 27.", "tags": []},
        {"number": "12", "name": "Gio Procopio", "pos": "LW", "age": 27, "hometown": "Grosse Pointe, MI", "stats": "HSV: 58 GP, 12-22-34, 112 PIM", "plusMinus": 19, "pmGP": 58, "plusMinusPerGP": 0.33, "plusMinusScope": null, "echlLastSeason": null, "notes": "Third Havoc season. Alternate captain last year. Brother Dom, the former Havoc captain, has retired. 179 PIM over two seasons. Aurora University teammate of Jaunich.", "tags": []},
        {"number": "15", "name": "Dawson Sciarrino", "pos": "F", "age": 26, "hometown": "Greensburg, PA", "stats": "HSV: 14 GP, 4-9-13. PEN: 34 GP, 6-11-17", "plusMinus": 0, "pmGP": 14, "plusMinusPerGP": 0.00, "plusMinusScope": "HSV only", "echlLastSeason": null, "notes": "Former Ice Flyer. Pensacola traded him to Huntsville in February for Matt Allen. 0.93 points per game as a Havoc. UW-Stevens Point teammate of Pensacola's Tyler German and Andrew Poulias.", "tags": ["ex-PEN"]},
        {"number": "91", "name": "Connor Fries", "pos": "C", "age": 30, "hometown": "Centerville, MA", "stats": "HSV: 54 GP, 12-16-28, 117 PIM", "plusMinus": 4, "pmGP": 54, "plusMinusPerGP": 0.07, "plusMinusScope": null, "echlLastSeason": null, "notes": "Scored twice vs. Pensacola last year, including the only Havoc goal in the 8-1 loss.", "tags": []},
        {"number": "28", "name": "Ethan Lindsay", "pos": "LW", "age": 23, "hometown": "Barrie, ON", "stats": "HSV: 53 GP, 8-9-17, 3 GWG", "plusMinus": 7, "pmGP": 53, "plusMinusPerGP": 0.13, "plusMinusScope": null, "echlLastSeason": null, "notes": "Second pro season. Scored the tying goal in the Dec. 11 OT game and the catfish-night goal on Dec. 26.", "tags": []},
        {"number": "25", "name": "Jack Jaunich", "pos": "F", "age": null, "hometown": "White Bear Lake, MN", "stats": "HSV: 19 GP, 3-10-13", "plusMinus": 2, "pmGP": 19, "plusMinusPerGP": 0.11, "plusMinusScope": "HSV only", "echlLastSeason": "Kalamazoo: 12 GP, 2-1-3. Norfolk: 17 GP, 3-1-4", "notes": "Aurora University. 80 points in his first 105 Havoc games. Back-to-back SPHL Player of the Week in Dec. 2024. Re-signed Feb. 12, 2026 after his ECHL run.", "tags": []},
        {"number": "16", "name": "Dallas Comeau", "pos": "F", "age": 28, "hometown": "Calgary, AB", "stats": "ECHL career: 35 GP, 10-15-25 (Savannah, Tulsa)", "plusMinus": null, "pmGP": null, "plusMinusPerGP": null, "plusMinusScope": null, "echlLastSeason": "Tulsa: 5 GP", "notes": "Former Ice Flyer: 38 games in 2022-23 and 22 in 2023-24.", "tags": ["new", "ex-PEN"]},
        {"number": "11", "name": "Michael Hodge", "pos": "F", "age": 26, "hometown": "Calgary, AB", "stats": "New. Solway Sharks (UK): 23 pts. NCAA D-I at Union and Holy Cross (58 GP)", "plusMinus": null, "pmGP": null, "plusMinusPerGP": null, "plusMinusScope": null, "echlLastSeason": null, "notes": "Played in the UK last season after college.", "tags": ["new"]},
        {"number": "23", "name": "Keighan Gerrie", "pos": "F", "age": null, "hometown": "Thunder Bay, ON", "stats": "New. Lakehead (U Sports): 34 GP, 12-8-20", "plusMinus": null, "pmGP": null, "plusMinusPerGP": null, "plusMinusScope": null, "echlLastSeason": null, "notes": "47 goals in 134 career Lakehead games: a shooter.", "tags": ["new"]},
        {"number": "13", "name": "James Eng", "pos": "F", "age": 25, "hometown": "Mississauga, ON", "stats": "New. 85 career NCAA D-III games (Finlandia, Dubuque, Misericordia)", "plusMinus": null, "pmGP": null, "plusMinusPerGP": null, "plusMinusScope": null, "echlLastSeason": null, "notes": "Pro rookie.", "tags": ["new"]}
      ],
      "defense": [
        {"number": "63", "name": "Craig McCabe", "pos": "D", "age": 28, "hometown": "Webster, NY", "stats": "HSV: 48 GP, 5-11-16, 3 PPG", "plusMinus": 14, "pmGP": 48, "plusMinusPerGP": 0.29, "plusMinusScope": "HSV only", "echlLastSeason": "Tahoe: 6 GP, 0-2-2", "notes": "5-foot-10. Nickname 'Caber.' Assisted in 3 of the 8 Pensacola games last year. Coach Stefan calls him a physical presence.", "tags": []},
        {"number": "43", "name": "Terry Ryder", "pos": "D", "age": null, "hometown": null, "stats": "HSV: 11 GP, 0-4-4. Peoria: 41 GP, 1-5-6", "plusMinus": 4, "pmGP": 11, "plusMinusPerGP": 0.36, "plusMinusScope": "HSV only", "echlLastSeason": null, "notes": "6-foot-1. Fan favorite. Traded to Peoria last season, now back. 14 assists as a Havoc rookie in 2024-25.", "tags": []},
        {"number": "22", "name": "Brody Tallman", "pos": "D", "age": 23, "hometown": "Lethbridge, AB", "stats": "PEN: 7 GP, 0-1-1. Grant MacEwan: 19 GP, 3-10-13", "plusMinus": -1, "pmGP": 7, "plusMinusPerGP": -0.14, "plusMinusScope": "PEN only", "echlLastSeason": null, "notes": "Former Ice Flyer. College teammate of Havoc goalie Eric Ward at MacEwan.", "tags": ["new", "ex-PEN"]},
        {"number": "4", "name": "Davis Goukler", "pos": "D", "age": 25, "hometown": "Cumming, GA", "stats": "New. 63 GP at Alaska-Anchorage (D-I). 3 GP with Macon", "plusMinus": null, "pmGP": null, "plusMinusPerGP": null, "plusMinusScope": null, "echlLastSeason": null, "notes": "A Georgia-raised player in a Southern league.", "tags": ["new"]},
        {"number": "5", "name": "Sam Frederick", "pos": "D", "age": null, "hometown": "North Vancouver, BC", "stats": "New. Missouri State (ACHA): 24 GP, 4-10-14", "plusMinus": null, "pmGP": null, "plusMinusPerGP": null, "plusMinusScope": null, "echlLastSeason": null, "notes": "192 career games at Missouri State.", "tags": ["new"]},
        {"number": "44", "name": "Kadin Ilott", "pos": "D", "age": 25, "hometown": "Kenora, ON", "stats": "New. Southern Maine (D-III): 25 GP, 3-7-10. Monroe (FPHL): 11 GP, 0-2-2", "plusMinus": null, "pmGP": null, "plusMinusPerGP": null, "plusMinusScope": null, "echlLastSeason": null, "notes": "6-foot, shoots left. Led his college team in blocked shots (37). Computer science major, Academic All-District.", "tags": ["new", "confirm"], "confirmNote": "No Havoc signing announcement found; likely a camp invite."}
      ],
      "goalies": [
        {"number": "72", "name": "Alex Proctor", "pos": "G", "age": 24, "hometown": "Dallas, TX", "stats": "HSV: 2 GP, 2-0, 1.00 GAA, .967 SV%, 1 SO", "echlLastSeason": "Short April loan to Bloomington (per Elite Prospects)", "notes": "Won both pro starts, one a shutout (his first as a pro).", "tags": []},
        {"number": "1", "name": "Eric Ward", "pos": "G", "age": 25, "hometown": "Edmonton, AB", "stats": "Grant MacEwan: 4-3-4, 3.69 GAA, .882 SV%", "echlLastSeason": null, "notes": "Pro rookie.", "tags": ["new"]}
      ]
    },
    "pensacola": {
      "name": "Pensacola Ice Flyers",
      "coaches": [
        {"number": null, "name": "Jeremy Gates", "role": "Head coach", "notes": "Year two. Took a 43-point team to 65 points in his first season. Previously an assistant under Rod Aldoff.", "tags": []},
        {"number": null, "name": "Chris Ferazzoli", "role": "Assistant coach", "notes": "New hire. Replaces Justin Stevens, who left for the ECHL's Reading Royals.", "tags": ["new"]}
      ],
      "forwards": [
        {"number": null, "name": "Tyler German", "pos": "RW", "age": 26, "hometown": "Canton, MI", "stats": "PEN: 58 GP, 16-12-28, 2 SHG", "plusMinus": -1, "pmGP": 58, "plusMinusPerGP": -0.02, "plusMinusScope": null, "echlLastSeason": null, "notes": "6-foot-2, right shot. Second on the team in goals; played all 58 games. Third season in Pensacola. UW-Stevens Point teammate of Poulias and Havoc's Sciarrino.", "tags": []},
        {"number": null, "name": "Andrew Poulias", "pos": "C", "age": 27, "hometown": "Whitby, ON", "stats": "PEN: 57 GP, 10-17-27", "plusMinus": -9, "pmGP": 57, "plusMinusPerGP": -0.16, "plusMinusScope": null, "echlLastSeason": null, "notes": "5-foot-8 right-shot center. Played 11 games for Peoria before Pensacola. Coach Gates praises his hockey IQ.", "tags": []},
        {"number": null, "name": "Tyler Burnie", "pos": "RW", "age": null, "hometown": "Washago, ON", "stats": "PEN: 54 GP, 5-22-27. Playoffs: 3 GP, 2-1-3", "plusMinus": -2, "pmGP": 54, "plusMinusPerGP": -0.04, "plusMinusScope": null, "echlLastSeason": "South Carolina: 3 GP", "notes": "6-foot-5. Led Pensacola in assists. Opened the scoring in the Game 2 playoff win. OHL Kingston, then ECHL Allen, Rapid City and South Carolina.", "tags": []},
        {"number": null, "name": "Andrew Kurapov", "pos": "F", "age": 27, "hometown": "Corvallis, OR", "stats": "PEN: 6 GP, 3-1-4. Knoxville: 27 GP, 7-7-14", "plusMinus": -2, "pmGP": 6, "plusMinusPerGP": -0.33, "plusMinusScope": "PEN only", "echlLastSeason": "Reading (games not listed)", "notes": "Acquired from Knoxville at the trade deadline. 118 points (51 G) in 113 games at Endicott College.", "tags": []},
        {"number": null, "name": "Jack Suchy", "pos": "LW", "age": null, "hometown": "Medina, MN", "stats": "PEN: 11 GP, 4-3-7. Playoffs: 2 GP, 1-1-2", "plusMinus": -7, "pmGP": 11, "plusMinusPerGP": -0.64, "plusMinusScope": null, "echlLastSeason": null, "notes": "6-foot-3 winger. Came from Peoria in March and scored right away.", "tags": []},
        {"number": null, "name": "Porter Schachle", "pos": "F", "age": 25, "hometown": "Wasilla, AK", "stats": "PEN: 9 GP, 1-4-5", "plusMinus": -2, "pmGP": 9, "plusMinusPerGP": -0.22, "plusMinusScope": "PEN only", "echlLastSeason": "Worcester, then South Carolina", "notes": "6-foot-4 (team listing). NCAA D-I at Vermont and Alaska-Anchorage. Brother Tanner is also at camp.", "tags": []},
        {"number": null, "name": "Tanner Schachle", "pos": "LW", "age": null, "hometown": "Wasilla, AK", "stats": "New. ECHL Worcester and Bloomington: 17 GP, 0-2-2", "plusMinus": null, "pmGP": null, "plusMinusPerGP": null, "plusMinusScope": null, "echlLastSeason": "Worcester and Bloomington: 17 GP, 0-2-2. 2023 ECHL All-Star; 163 career ECHL games", "notes": "Older brother of Porter. Alaska-Anchorage and LIU; 153 PIM in 74 college games.", "tags": ["new"]},
        {"number": null, "name": "Tyler Carpenter", "pos": "C", "age": 26, "hometown": "Palatine, IL", "stats": "New. France D1 (Mont-Blanc): 10 GP, 1-4-5", "plusMinus": null, "pmGP": null, "plusMinusPerGP": null, "plusMinusScope": null, "echlLastSeason": null, "notes": "Notre Dame: regular center and alternate captain as a senior, zero penalties in 38 games. USHL Omaha and Chicago Steel. Notre Dame teammate of Ryan Helliwell.", "tags": ["new"]},
        {"number": null, "name": "Sean Ross", "pos": "C", "age": 28, "hometown": "Bracebridge, ON", "stats": "New. France D1 (Nantes): 27 GP, 9-11-20", "plusMinus": null, "pmGP": null, "plusMinusPerGP": null, "plusMinusScope": null, "echlLastSeason": null, "notes": "Short earlier stint in Pensacola; also played for South Carolina (ECHL). Alternate captain in Nantes; playoff hat trick including the OT winner to keep Nantes in Division 1.", "tags": ["new"]},
        {"number": null, "name": "Braiden Koran", "pos": "F", "age": 25, "hometown": "Kimberley, BC", "stats": "New. Ontario Tech (U Sports): 99 career GP, 14-19-33", "plusMinus": null, "pmGP": null, "plusMinusPerGP": null, "plusMinusScope": null, "echlLastSeason": null, "notes": "6-foot, 201 lbs, left shot. 23 points in 44 college playoff games. Junior with the Humboldt Broncos.", "tags": ["new"]},
        {"number": null, "name": "Colin Roe", "pos": "RW", "age": 25, "hometown": "Hyde Park, MA", "stats": "New. Westfield State (D-III): 27 GP, 2-4-6", "plusMinus": null, "pmGP": null, "plusMinusPerGP": null, "plusMinusScope": null, "echlLastSeason": null, "notes": "Signed with Blue Ridge (FPHL) Sept. 9; no Ice Flyers signing release, so likely a camp tryout.", "tags": ["new", "confirm"], "confirmNote": "Ask Pensacola PR: signed or tryout? Pronunciation?"}
      ],
      "defense": [
        {"number": null, "name": "Nicholas Aromatario", "pos": "D", "age": null, "hometown": "Woodbridge, ON", "stats": "PEN: 58 GP, 6-12-18", "plusMinus": 4, "pmGP": 58, "plusMinusPerGP": 0.07, "plusMinusScope": null, "echlLastSeason": null, "notes": "Played every game. One of the few Pensacola regulars with a plus rating.", "tags": []},
        {"number": null, "name": "Samson Mouland", "pos": "D", "age": null, "hometown": "Hay River, NWT", "stats": "PEN: 35 GP, 0-1-1, 44 PIM", "plusMinus": -5, "pmGP": 35, "plusMinusPerGP": -0.14, "plusMinusScope": null, "echlLastSeason": null, "notes": "Right shot. Stay-at-home, physical role.", "tags": []},
        {"number": null, "name": "Ryan Helliwell", "pos": "D", "age": 24, "hometown": "Burnaby, BC", "stats": "New. ECHL: Kalamazoo 5 GP, 0-2-2; Adirondack 20 GP, 1-2-3", "plusMinus": null, "pmGP": null, "plusMinusPerGP": null, "plusMinusScope": null, "echlLastSeason": "Kalamazoo: 5 GP, 0-2-2. Adirondack: 20 GP, 1-2-3", "notes": "6-foot, 192 lbs, left shot. Notre Dame (113 GP), teammate of Tyler Carpenter. No Ice Flyers signing release.", "tags": ["new", "confirm"], "confirmNote": "Signed or tryout?"},
        {"number": null, "name": "Yahor Ramanau", "pos": "D", "age": null, "hometown": "Minsk, Belarus", "stats": "New. Twin City (FPHL): 13 GP, 0-2-2. Also Biloxi", "plusMinus": null, "pmGP": null, "plusMinusPerGP": null, "plusMinusScope": null, "echlLastSeason": null, "notes": "6-foot-1, left shot. Father Oleg played for the Belarus national team. Came to North America as a teen with Pennsylvania's Esmark Stars.", "tags": ["new"]},
        {"number": null, "name": "Dakota Zarudny", "pos": "D", "age": null, "hometown": "Orangeville, ON", "stats": "New. SUNY Geneseo (D-III): 27 GP, 5-15-20", "plusMinus": null, "pmGP": null, "plusMinusPerGP": null, "plusMinusScope": null, "echlLastSeason": null, "notes": "5-foot-11, left shot. Two-way defenseman. Pro rookie. College teammate of Alex Dameski, who signed but isn't at camp.", "tags": ["new"]}
      ],
      "goalies": [
        {"number": null, "name": "Rico DiMatteo", "pos": "G", "age": null, "hometown": "Brasher Falls, NY", "stats": "PEN: 16 GP, 10-4-2, 2.84 GAA, .915 SV%, 1 SO", "echlLastSeason": "Rapid City: 12 GP, 3.96 GAA, .907", "notes": "Led Pensacola in wins as a pro rookie. SPHL Player of the Week after opening weekend. Calls himself calm, patient and athletic.", "tags": []},
        {"number": null, "name": "Kilian Bernasconi", "pos": "G", "age": 23, "hometown": "Lugano, Switzerland", "stats": "New. Swiss system (HC Ajoie org; 2 GP in MyHL, 2.02 GAA)", "echlLastSeason": null, "notes": "6-foot-2, catches left. First season in North America.", "tags": ["new"]},
        {"number": null, "name": "Keenan Rancier", "pos": "G", "age": 26, "hometown": "Victoria, BC", "stats": "New. Clarkson grad year: 7 GP, 4.07 GAA, .841", "echlLastSeason": null, "notes": "6-foot-2. At Minnesota State went 19-10-1, 1.86 GAA, .914 as a sophomore. Also played at Vermont. No Ice Flyers signing release.", "tags": ["new", "confirm"], "confirmNote": "Signed or tryout?"}
      ]
    }
  },
  "signings2026": {
    "havoc": {
      "summary": "24 signings July 20 to Sept. 21: 16 at camp, 4 at ECHL camps, 4 unsure. No ECHL or AHL contracts.",
      "rows": [
        {"date": "2026-09-21", "name": "Ethan Lindsay", "pos": "F", "newOrBack": "Back", "status": "back", "statusText": "Havoc camp"},
        {"date": "2026-09-18", "name": "Dallas Comeau", "pos": "F", "newOrBack": "New (ex-Ice Flyer)", "status": "back", "statusText": "Havoc camp"},
        {"date": "2026-09-18", "name": "Taeo Artichuk", "pos": "F", "newOrBack": "New", "status": "unsure", "statusText": "Unsure. OJHL MVP (108 pts). Committed to the University of New Brunswick in June, before signing here; not on any ECHL camp list found"},
        {"date": "2026-09-17", "name": "Keighan Gerrie", "pos": "F", "newOrBack": "New", "status": "back", "statusText": "Havoc camp"},
        {"date": "2026-09-17", "name": "Sam Frederick", "pos": "D", "newOrBack": "New", "status": "back", "statusText": "Havoc camp"},
        {"date": "2026-09-16", "name": "Ben Schultheis", "pos": "D", "newOrBack": "Back", "status": "echl-camp", "statusText": "Greensboro (ECHL) camp, tryout"},
        {"date": "2026-09-15", "name": "Brody Tallman", "pos": "D", "newOrBack": "New (ex-Ice Flyer)", "status": "back", "statusText": "Havoc camp"},
        {"date": "2026-09-15", "name": "Lucas Piekarczyk", "pos": "F", "newOrBack": "New", "status": "unsure", "statusText": "Unsure. No ECHL camp found. Calgary; Biloxi (FPHL): 48 GP, 14-23-37"},
        {"date": "2026-09-11", "name": "Eric Ward", "pos": "G", "newOrBack": "New", "status": "back", "statusText": "Havoc camp"},
        {"date": "2026-09-10", "name": "Terry Ryder", "pos": "D", "newOrBack": "Back", "status": "back", "statusText": "Havoc camp"},
        {"date": "2026-09-08", "name": "Brayden Stannard", "pos": "F", "newOrBack": "New", "status": "echl-camp", "statusText": "Greensboro (ECHL) camp, tryout"},
        {"date": "2026-09-03", "name": "Dawson Sciarrino", "pos": "F", "newOrBack": "Back", "status": "back", "statusText": "Havoc camp"},
        {"date": "2026-09-02", "name": "James Eng", "pos": "F", "newOrBack": "New", "status": "back", "statusText": "Havoc camp"},
        {"date": "2026-08-24", "name": "Landry Schmuck", "pos": "F", "newOrBack": "New", "status": "echl-camp", "statusText": "Orlando (ECHL) camp, amateur tryout"},
        {"date": "2026-08-20", "name": "Brian Wilson", "pos": "G", "newOrBack": "Back", "status": "echl-camp", "statusText": "New Mexico (ECHL) camp, pro tryout"},
        {"date": "2026-08-18", "name": "Michael Hodge", "pos": "F", "newOrBack": "New", "status": "back", "statusText": "Havoc camp"},
        {"date": "2026-08-13", "name": "Alex Proctor", "pos": "G", "newOrBack": "Back", "status": "back", "statusText": "Havoc camp"},
        {"date": "2026-08-11", "name": "Cade Helmer", "pos": "LW", "newOrBack": "New", "status": "unsure", "statusText": "Unsure. Had a spring tryout with South Carolina (ECHL); their 2026 camp roster isn't out yet"},
        {"date": "2026-08-06", "name": "Troy Williams", "pos": "D", "newOrBack": "New", "status": "unsure", "statusText": "Unsure. Not on Wheeling's camp roster (his old ECHL team). Netherlands last year: 32 GP, 7-26-33"},
        {"date": "2026-08-04", "name": "Craig McCabe", "pos": "D", "newOrBack": "Back", "status": "back", "statusText": "Havoc camp"},
        {"date": "2026-07-27", "name": "Davis Goukler", "pos": "D", "newOrBack": "New", "status": "back", "statusText": "Havoc camp"},
        {"date": "2026-07-25", "name": "Gio Procopio", "pos": "F", "newOrBack": "Back", "status": "back", "statusText": "Havoc camp"},
        {"date": "2026-07-23", "name": "Connor Fries", "pos": "F", "newOrBack": "Back", "status": "back", "statusText": "Havoc camp"},
        {"date": "2026-07-20", "name": "Austin Alger", "pos": "F", "newOrBack": "Back", "status": "back", "statusText": "Havoc camp"}
      ],
      "notAtCampNotes": [
        "At camp without a summer signing release: Jack Jaunich (re-signed Feb. 12, 2026; on the May protected list) and Kadin Ilott (no announcement found).",
        "Other departures: Dom Procopio retired; Charlie Risk to Basingstoke (UK); Frankie Trazzera to the Mid-South Monarchs (FPHL)."
      ]
    },
    "pensacola": {
      "summary": "17 signings July 22 to Oct. 2: 16 at camp, 1 unsure. No signee is at an ECHL camp.",
      "rows": [
        {"date": "2026-10-02", "name": "Kilian Bernasconi", "pos": "G", "newOrBack": "New", "status": "back", "statusText": "Ice Flyers camp"},
        {"date": "2026-10-02", "name": "Tanner Schachle", "pos": "F", "newOrBack": "New", "status": "back", "statusText": "Ice Flyers camp"},
        {"date": "2026-10-01", "name": "Porter Schachle", "pos": "F", "newOrBack": "Back", "status": "back", "statusText": "Ice Flyers camp"},
        {"date": "2026-09-30", "name": "Yahor Ramanau", "pos": "D", "newOrBack": "New", "status": "back", "statusText": "Ice Flyers camp"},
        {"date": "2026-09-28", "name": "Rico DiMatteo", "pos": "G", "newOrBack": "Back", "status": "back", "statusText": "Ice Flyers camp"},
        {"date": "2026-09-24", "name": "Braiden Koran", "pos": "F", "newOrBack": "New", "status": "back", "statusText": "Ice Flyers camp"},
        {"date": "2026-09-17", "name": "Tyler Carpenter", "pos": "F", "newOrBack": "New", "status": "back", "statusText": "Ice Flyers camp"},
        {"date": "2026-09-15", "name": "Sean Ross", "pos": "C", "newOrBack": "New (former Ice Flyer)", "status": "back", "statusText": "Ice Flyers camp"},
        {"date": "2026-09-08", "name": "Andrew Kurapov", "pos": "F", "newOrBack": "Back", "status": "back", "statusText": "Ice Flyers camp"},
        {"date": "2026-08-21", "name": "Dakota Zarudny", "pos": "D", "newOrBack": "New", "status": "back", "statusText": "Ice Flyers camp"},
        {"date": "2026-08-18", "name": "Tyler Burnie", "pos": "F", "newOrBack": "Back", "status": "back", "statusText": "Ice Flyers camp"},
        {"date": "2026-08-14", "name": "Alex Dameski", "pos": "RW", "newOrBack": "New", "status": "unsure", "statusText": "Unsure, not at camp. Oakville, Ont. Geneseo: 21-16-37, D-III first-team All-American, Zarudny's college teammate. Not on any ECHL camp list checked"},
        {"date": "2026-08-11", "name": "Nicholas Aromatario", "pos": "D", "newOrBack": "Back", "status": "back", "statusText": "Ice Flyers camp"},
        {"date": "2026-08-03", "name": "Jack Suchy", "pos": "LW", "newOrBack": "Back", "status": "back", "statusText": "Ice Flyers camp"},
        {"date": "2026-07-28", "name": "Samson Mouland", "pos": "D", "newOrBack": "Back", "status": "back", "statusText": "Ice Flyers camp"},
        {"date": "2026-07-24", "name": "Tyler German", "pos": "F", "newOrBack": "Back", "status": "back", "statusText": "Ice Flyers camp"},
        {"date": "2026-07-22", "name": "Andrew Poulias", "pos": "C", "newOrBack": "Back", "status": "back", "statusText": "Ice Flyers camp"}
      ],
      "notAtCampNotes": [
        "At camp without a signing release (likely tryouts): Ryan Helliwell, Colin Roe (signed with Blue Ridge, FPHL, Sept. 9), Keenan Rancier.",
        "Protected list (May 22) players who are elsewhere: Sam Rhodes and Matt Allen (unsure), Cooper Jones (Tahoe ECHL camp), Jonathan Ziskie (signed with Tahoe). Unsure: Laudon Poellinger, Amedeo Mastrangeli, Max Ruoho."
      ]
    }
  },
  "pronunciations": [
    {"team": "HSV", "name": "Sciarrino", "guess": "shuh-REE-no", "confidence": "medium"},
    {"team": "HSV", "name": "Procopio", "guess": "pro-KOH-pee-oh", "confidence": "medium"},
    {"team": "HSV", "name": "Jaunich", "guess": null, "confidence": "ask"},
    {"team": "HSV", "name": "Goukler", "guess": null, "confidence": "ask"},
    {"team": "HSV", "name": "Ilott", "guess": null, "confidence": "ask"},
    {"team": "HSV", "name": "Comeau", "guess": "KOH-moh", "confidence": "medium"},
    {"team": "HSV", "name": "Gerrie", "guess": null, "confidence": "ask"},
    {"team": "PEN", "name": "Aromatario", "guess": "ah-roh-mah-TAR-ee-oh", "confidence": "medium"},
    {"team": "PEN", "name": "Poulias", "guess": null, "confidence": "ask"},
    {"team": "PEN", "name": "Kurapov", "guess": "koo-RAH-pov", "confidence": "medium"},
    {"team": "PEN", "name": "Schachle", "guess": null, "confidence": "ask"},
    {"team": "PEN", "name": "Suchy", "guess": null, "confidence": "ask"},
    {"team": "PEN", "name": "Ramanau", "guess": "rah-MAH-now", "confidence": "medium"},
    {"team": "PEN", "name": "Zarudny", "guess": "zah-ROOD-nee", "confidence": "medium"},
    {"team": "PEN", "name": "Bernasconi", "guess": "ber-nah-SKOH-nee", "confidence": "medium"},
    {"team": "PEN", "name": "DiMatteo", "guess": "dee-mah-TAY-oh", "confidence": "medium"},
    {"team": "PEN", "name": "Rancier", "guess": null, "confidence": "ask"},
    {"team": "PEN", "name": "Mouland", "guess": null, "confidence": "ask"}
  ],
  "prQuestions": {
    "havoc": [
      "Taeo Artichuk: with the Havoc, or at the University of New Brunswick?",
      "Cade Helmer, Troy Williams, Lucas Piekarczyk: ECHL camps, or joining the Havoc later?",
      "Josh Kestner, Cole Reginato, Kevin Weaver-Vitale: still playing? Rights still held?",
      "Kadin Ilott: signed or camp invite?"
    ],
    "pensacola": [
      "Alex Dameski: why isn't he at camp?",
      "Helliwell, Roe, Rancier: signed or on tryouts?",
      "Sam Rhodes and Matt Allen: protected but not at camp. Where are they?",
      "Cooper Jones at Tahoe: contract or tryout?"
    ]
  },
  "checklist": [
    "Venue: confirm VBC Propst Arena vs. a practice rink",
    "Jersey numbers for both teams and coaches",
    "Starting goalies (HSV: Proctor or Ward; PEN: DiMatteo, Bernasconi or Rancier)",
    "Re-check ECHL camp cuts on game day (Wilson, Schultheis, Stannard, Schmuck)",
    "2026-27 captains on both sides (Dom Procopio retired)",
    "Stuart Stefan: first year as head coach",
    "Oct. 30 resolved: the final 2026-27 schedule has the Havoc at Evansville that night, not Pensacola (hub schedule updated Oct. 6)"
  ],
  "sources": [
    {"label": "Havoc 2025-26 stats (StatsCrew)", "url": "https://www.statscrew.com/minorhockey/stats/t-11290/y-2025"},
    {"label": "Ice Flyers 2025-26 stats (StatsCrew)", "url": "https://www.statscrew.com/minorhockey/stats/t-11539/y-2025"},
    {"label": "Ice Flyers 2026 camp roster", "url": "https://www.oursportscentral.com/services/releases/ice-flyers-announce-official-2026-training-camp-roster/n-6419095"},
    {"label": "Havoc player news", "url": "https://www.huntsvillehavoc.com/category/player-news"},
    {"label": "Havoc 2026 protected list", "url": "https://www.huntsvillehavoc.com/havoc-announce-2026-protected-list"},
    {"label": "Ice Flyers transactions", "url": "https://iceflyers.com/category/transactions/"},
    {"label": "Ice Flyers 2026-27 protected list", "url": "https://iceflyers.com/ice-flyers-announce-protected-list-for-2026-27-season/"},
    {"label": "Brian Wilson to New Mexico (Inside The Rink)", "url": "https://insidetherink.com/echl-new-mexico-signs-brian-wilson-to-a-professional-tryout/"},
    {"label": "Greensboro camp roster (Schultheis, Stannard)", "url": "https://gargoyleshockey.com/news/2026/10/greensboro-gargoyles-release-2026-training-camp-roster"},
    {"label": "Orlando camp roster (Schmuck)", "url": "https://www.oursportscentral.com/services/releases/solar-bears-announce-roster-and-practice-schedule-for-opening-of-2026-training-camp/n-6418366"},
    {"label": "Tahoe preseason roster (Cooper Jones, Ziskie)", "url": "https://www.oursportscentral.com/services/releases/knight-monsters-announce-preseason-roster/n-6419184"},
    {"label": "Tyrone Bronte to Pee Dee", "url": "https://icehockeynewsaustralia.com/2026/08/26/tyrone-bronte-signs-with-the-pee-dee-icecats/"},
    {"label": "Dom Procopio retires (WAFF)", "url": "https://www.waff.com/2026/06/15/huntsville-havoc-captain-dom-procopio-announces-retirement/"},
    {"label": "Colin Roe signs with Blue Ridge", "url": "https://www.oursportscentral.com/services/releases/blue-ridge-signs-power-rookie-winger-colin-roe/n-6411949"},
    {"label": "DiMatteo re-signs (Rapid City stats)", "url": "https://iceflyers.com/ice-flyers-welcome-back-goaltender-rico-dimatteo-for-2026-27-season/"},
    {"label": "Havoc 2025-26 results (hockeydb)", "url": "https://www.hockeydb.com/ihdb/stats/team_results.php?tid=9375&sid=2026"},
    {"label": "Exhibition date (WKRG via Yahoo)", "url": "https://sports.yahoo.com/articles/ice-flyers-announce-first-exhibition-033728433.html"},
    {"label": "Havoc exhibition ticket page", "url": "https://www.gofevo.com/event/26Havoc1009"}
  ]
};
