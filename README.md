# MechaSearch - FTC & FRC Team Analytics

A comprehensive team statistics and analytics platform for both FIRST Tech Challenge (FTC) and FIRST Robotics Competition (FRC) teams.

## Features

- **Dual Mode Support**: Switch between FTC and FRC modes seamlessly
- **Team Statistics**: View detailed team information, rankings, and performance metrics
- **Match History**: Browse through all matches with detailed scoring breakdowns
- **Performance Analytics**: Interactive charts showing scoring trends, win/loss records, and performance consistency
- **Season Selection**: View data from multiple seasons
- **Real-time Data**: Live data from FTC Scout and The Blue Alliance APIs

## Setup

### FRC API Key Setup

To use FRC functionality, you need to obtain an API key from The Blue Alliance:

1. Go to [The Blue Alliance Account Dashboard](https://www.thebluealliance.com/account)
2. Sign in with your Google account
3. Navigate to the "Read API Keys" section
4. Generate a new API key
5. Replace `'your_frc_api_key_here'` in `script.js` with your actual API key

```javascript
// In script.js, line ~30
const FRC_API_KEY = 'your_actual_api_key_here';
```

### CORS Proxy Solution

Due to CORS restrictions, FRC API calls use a CORS proxy service (`cors-anywhere.herokuapp.com`). This allows the application to access The Blue Alliance API from a web browser.

**Note**: The CORS proxy service may have rate limits or temporary outages. If FRC data is not loading:
1. Try refreshing the page
2. Switch to FTC mode temporarily
3. Check the browser console for error messages

### API Documentation

- **FTC API**: [FTC Scout API](https://api.ftcscout.org/rest/v1)
- **FRC API**: [The Blue Alliance API v3](https://www.thebluealliance.com/apidocs)

## Usage

1. **Switch Modes**: Use the tabs in the top-left corner to switch between FTC and FRC modes
2. **Search Teams**: Enter a team number and click "Search Team"
3. **View Statistics**: Browse team information, match history, and performance analytics
4. **Season Selection**: Use the dropdown to view data from different seasons
5. **Interactive Charts**: Explore performance trends and scoring breakdowns

## Technical Details

### FTC Mode
- Uses FTC Scout API
- Supports seasons from 2015 to present
- Shows auto/teleop scoring breakdowns
- Displays FTC-specific statistics

### FRC Mode
- Uses The Blue Alliance API v3
- Supports seasons from 1992 to present
- Shows total scoring (auto/teleop combined)
- Displays FRC-specific statistics (OPR, DPR, CCWM)
- Uses CORS proxy for browser compatibility

### Data Sources
- **FTC**: FTC Scout API (no authentication required)
- **FRC**: The Blue Alliance API v3 (requires API key, uses CORS proxy)

## Troubleshooting

### FRC Data Not Loading
- Check that your API key is correctly set in `script.js`
- Verify the API key is valid by testing it directly with The Blue Alliance API
- Check browser console for CORS or network errors
- Try refreshing the page or switching modes

### CORS Errors
- The application uses a CORS proxy to access FRC data
- If the proxy is down, FRC mode will show an error message
- FTC mode will continue to work normally

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge
- Mobile responsive design

## Development

The application is built with vanilla JavaScript and uses:
- Chart.js for data visualization
- CSS Grid and Flexbox for layout
- Fetch API for data retrieval
- Local caching for improved performance
- CORS proxy for FRC API access

## License

This project is open source and available under the MIT License. 