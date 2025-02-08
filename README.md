# MechaSearch - FTC Team Statistics Explorer

MechaSearch is a modern, responsive web application designed to explore FIRST Tech Challenge (FTC) team statistics, match history, and performance analytics. Built with vanilla JavaScript and Chart.js, it provides an intuitive interface for accessing and visualizing FTC team data.

![MechaSearch Screenshot](path/to/screenshot.png) <!-- You should add a screenshot of your app -->

## Features

- **Real-time Team Search**: Instantly search for any FTC team by number
- **Comprehensive Team Statistics**: View detailed team information including:
  - Basic team details (name, location, rookie year)
  - Season rankings and performance metrics
  - Win/Loss records
  - Match history
- **Interactive Data Visualization**: Multiple chart types showing:
  - Score progression over matches
  - Auto/TeleOp scoring distribution
  - Win/Loss ratio
  - Performance trends
- **Season Selection**: Browse team statistics across different seasons
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Performance Optimized**: Implements caching and efficient data loading

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- [Chart.js](https://www.chartjs.org/) - For data visualization
- [FTC API](https://api.ftcscout.org/) - For team and match data

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mechasearch.git
```

2. Open `index.html` in your web browser or set up a local server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server
```

3. Visit `http://localhost:8000` in your web browser

## Usage

1. Enter a team number in the search box (e.g., "21781")
2. Click "Search Team"
3. Browse through team statistics, match history, and performance analytics
4. Use the season selector to view data from different years

## Performance Features

- Data caching for faster repeat queries
- Lazy loading of match data
- Optimized animations and transitions
- Efficient DOM updates using requestAnimationFrame
- Content visibility optimization

## Browser Support

MechaSearch is optimized for modern browsers including:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
