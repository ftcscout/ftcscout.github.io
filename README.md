# MechaSearch — FTC & FRC Team Search + Analytics

MechaSearch is a single-page HTML/CSS/JS app that lets you look up FIRST Tech Challenge (FTC) and FIRST Robotics Competition (FRC) teams, view their season history, and explore match-by-match analytics. FTC works out of the box; FRC requires a The Blue Alliance (TBA) API key.

## What it does
- **Dual modes:** Toggle FTC/FRC from the top tabs; UI reuses the same flow for both.
- **Team lookup:** Enter a team number to fetch profile, events, awards, rankings, and match history.
- **Dynamic seasons:** Season list is generated from current year/rookie year or API status; switching seasons reloads data.
- **Analytics:** Bottom-of-page Chart.js visuals for score progression, phase mix, win/loss, and consistency (FRC data is adapted to the same chart shapes).
- **Resilient fetch:** Local cache, CORS-aware fallback for TBA, inline error messaging when data is missing.

## Quick start
1) Open `index.html` in a modern browser (no build tooling).  
2) Search an FTC team number — results and analytics render automatically.  
3) To use FRC mode, supply a TBA API key (see below), switch to FRC, and search a team.

### Set your FRC API key
Create a Read API key in your [TBA account](https://www.thebluealliance.com/account), then provide it to the app in **one** of these ways:
- Add a meta tag in `index.html`: `<meta name="tba-api-key" content="YOUR_KEY">`
- Set in dev tools: `localStorage.setItem('tbaApiKey','YOUR_KEY')`
- Expose globally before `script.js`: `window.FRC_API_KEY = 'YOUR_KEY'`

### Data sources
- **FTC:** `https://api.ftcscout.org/rest/v1` (no auth)
- **FRC:** `https://www.thebluealliance.com/api/v3` (requires API key; browser CORS may require the built-in proxy fallbacks)

## Using the app
- Pick FTC or FRC from the tabs.
- Enter a team number and click **Search Team**.
- Use the season dropdown to jump between seasons; charts and stats reload automatically.
- Expand events to see match breakdowns; analytics update from the same data.

## Troubleshooting (FRC)
- “Failed to fetch” / CORS: try reloading; if blocked, use a different browser or host locally with the provided proxy fallbacks.
- Empty analytics: no match data returned for that season/event — pick another season or verify the team competed.
- Bad key: regenerate in TBA, then update your meta/localStorage/global key.

## Tech notes
- Vanilla JS, Chart.js, CSS Grid/Flexbox; no build step.
- Shared adapter layer normalizes FTC/FRC responses into common render shapes without merging schemas.
- Chart instances are destroyed/recreated on each team/season/mode change to avoid stale data.

## License
MIT
