const MODES = {
    ftc: {
        name: 'FTC',
        apiBase: 'https://api.ftcscout.org/rest/v1',
        title: 'MechaSearch (21781)',
        subtitle: 'Explore team statistics, match history, and performance analytics for FIRST Tech Challenge teams.',
        defaultTeam: '21781',
        seasons: {
            current: 2024,
            start: 2015
        }
    },
    frc: {
        name: 'FRC',
        apiBase: 'https://www.thebluealliance.com/api/v3',
        title: 'MechaSearch (FRC)',
        subtitle: 'Explore team statistics, match history, and performance analytics for FIRST Robotics Competition teams.',
        defaultTeam: '21781',
        seasons: {
            current: 2024,
            start: 1992
        }
    }
};

let currentMode = 'ftc';
let API_BASE_URL = MODES[currentMode].apiBase;

const FRC_API_KEY = 'pUm7ONNd4VrNmelSO4ZX8Muf24gGn7xMI1VE8jeohY8ODZfEDZOlPuoahrHr9m57';

const DOM = {
    mainContent: document.querySelector('.main-content'),
    landingHeader: document.querySelector('.landing-header'),
    teamNumberInput: document.getElementById('teamNumber'),
    seasonSelector: document.getElementById('seasonSelector'),
    statsContainer: document.getElementById('stats-container'),
    analyticsContainer: document.getElementById('analytics-container'),
    teamBasicInfo: document.getElementById('teamBasicInfo'),
    teamStats: document.getElementById('teamStats'),
    landingTitle: document.getElementById('landingTitle'),
    landingSubtitle: document.getElementById('landingSubtitle'),
    charts: {
        scoreProgression: document.getElementById('scoreProgressionChart'),
        phaseBreakdown: document.getElementById('phaseBreakdownChart'),
        performanceRadar: document.getElementById('performanceRadarChart'),
        consistency: document.getElementById('consistencyChart')
    }
};

const chartInstances = {
    matchHistory: null,
    phaseBreakdown: null,
    winLoss: null,
    performanceTrends: null
};

const apiCache = new Map();
const getCachedData = async (url, ttl = 300000) => {
    const cached = apiCache.get(url);
    if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    apiCache.set(url, { data, timestamp: Date.now() });
    return data;
};

const chartConfig = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 750,
        easing: 'easeInOutQuart'
    },
    plugins: {
        legend: {
            labels: { color: '#ffffff' }
        }
    },
    scales: {
        y: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#ffffff' }
        },
        x: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#ffffff' }
        }
    }
};

const smoothUpdate = (callback) => {
    requestAnimationFrame(() => {
        requestAnimationFrame(callback);
    });
};

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function destroyCharts() {
    [chartInstances.matchHistory, chartInstances.phaseBreakdown, chartInstances.winLoss, chartInstances.performanceTrends].forEach(chart => {
        if (chart) {
            chart.destroy();
            chart = null;
        }
    });
}

function displayFRCFallback(teamNumber, year) {
    const basicInfoDiv = document.getElementById('teamBasicInfo');
    basicInfoDiv.innerHTML = `
        <div class="team-header">
            <div class="team-basic-info">
                <h3>FRC Team ${teamNumber}</h3>
                <p><strong>API Access Limited</strong></p>
                <p>Due to browser security restrictions, FRC data requires server-side implementation.</p>
            </div>
            <div class="team-record">
                <span class="record-label">Status</span>
                <span class="record-numbers">Limited</span>
            </div>
        </div>
    `;

    const statsDiv = document.getElementById('teamStats');
    statsDiv.innerHTML = `
        <h3>FRC Team Information</h3>
        <div class="stats-grid">
            <div class="stats-section">
                <h4>About FRC Data Access</h4>
                <p>The Blue Alliance API requires server-side implementation to avoid CORS restrictions in web browsers.</p>
                <p><strong>Current Limitations:</strong></p>
                <ul>
                    <li>Browser CORS policy blocks direct API access</li>
                    <li>Public CORS proxies have rate limits</li>
                    <li>Server-side proxy required for full access</li>
                </ul>
            </div>
            <div class="stats-section">
                <h4>Team Resources</h4>
                <p>Visit these official resources for FRC Team ${teamNumber}:</p>
                <ul>
                    <li><a href="https://www.thebluealliance.com/team/${teamNumber}" target="_blank" class="resource-link">The Blue Alliance</a> - Official team page</li>
                    <li><a href="https://frc-events.firstinspires.org/team/${teamNumber}" target="_blank" class="resource-link">FIRST Events</a> - Official event data</li>
                    <li><a href="https://www.thebluealliance.com/apidocs" target="_blank" class="resource-link">TBA API Docs</a> - Developer documentation</li>
                </ul>
            </div>
        </div>
    `;

    const statsContainer = document.getElementById('stats-container');
    statsContainer.classList.remove('hidden');
    statsContainer.innerHTML = `
        <h2>FRC Event Information</h2>
        <div class="info-box">
            <p><strong>Event data requires server-side API access.</strong></p>
            <p>For complete FRC team data, please visit:</p>
            <ul>
                <li><a href="https://www.thebluealliance.com/team/${teamNumber}" target="_blank">The Blue Alliance Team Page</a></li>
                <li><a href="https://frc-events.firstinspires.org/team/${teamNumber}" target="_blank">FIRST Events Team Page</a></li>
            </ul>
        </div>
    `;

    const analyticsContainer = document.getElementById('analytics-container');
    analyticsContainer.classList.add('hidden');
}

async function searchTeam() {
    const teamNumber = document.getElementById('teamNumber').value;
    if (!teamNumber) return;

    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.classList.add('visible');

    const landingHeader = document.querySelector('.landing-header');
    if (landingHeader) landingHeader.classList.add('searched');

    try {
        if (currentMode === 'ftc') {
            const teamResponse = await fetch(`${API_BASE_URL}/teams/${teamNumber}`);
            const basicTeamData = await teamResponse.json();
            
            createSeasonSelector(basicTeamData.rookieYear || 2024);
            
            const selectorContainer = document.getElementById('seasonSelectorContainer');
            if (selectorContainer) {
                selectorContainer.classList.remove('hidden');
                selectorContainer.classList.add('visible');
            }
            
            const selectedYear = document.getElementById('seasonSelector')?.value || 2024;
            const teamData = await fetchTeamData(teamNumber, selectedYear);
            const matchData = await fetchTeamMatches(teamNumber, selectedYear);

            displayTeamInfo(teamData, matchData);
            displayMatchData(matchData);
        } else {
            createSeasonSelector(1992);
            
            const selectorContainer = document.getElementById('seasonSelectorContainer');
            if (selectorContainer) {
                selectorContainer.classList.remove('hidden');
                selectorContainer.classList.add('visible');
            }
            
            const selectedYear = document.getElementById('seasonSelector')?.value || 2024;
            
            try {
                const teamData = await fetchTeamData(teamNumber, selectedYear);
                const matchData = await fetchTeamMatches(teamNumber, selectedYear);

                displayTeamInfo(teamData, matchData);
                displayMatchData(matchData);
            } catch (apiError) {
                console.warn('FRC API failed, showing fallback:', apiError);
                displayFRCFallback(teamNumber, selectedYear);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        
        const errorMessage = currentMode === 'frc' && error.message.includes('CORS') 
            ? 'FRC data is temporarily unavailable due to API restrictions. Please try again later or use FTC mode.'
            : `Error loading team data: ${error.message}`;
            
        alert(errorMessage);
    }
}

function createSeasonSelector(rookieYear) {
    const seasonSelector = document.getElementById('seasonSelector');
    if (!seasonSelector) return;

    const currentYear = MODES[currentMode].seasons.current;
    const startYear = Math.max(rookieYear || MODES[currentMode].seasons.start, MODES[currentMode].seasons.start);
    seasonSelector.innerHTML = '';
    
    for (let year = currentYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        seasonSelector.appendChild(option);
    }
    
    seasonSelector.onchange = async () => {
        const teamNumber = document.getElementById('teamNumber')?.value;
        if (!teamNumber) return;
        
        const selectedYear = seasonSelector.value;
        const teamData = await fetchTeamData(teamNumber, selectedYear);
        const matchData = await fetchTeamMatches(teamNumber, selectedYear);
        
        displayTeamInfo(teamData, matchData);
        displayMatchData(matchData);
    };
}

function displayMatchData(matchData) {
    const statsContainer = document.getElementById('stats-container');
    statsContainer.classList.remove('hidden');
    statsContainer.innerHTML = '<h2>Event Statistics</h2>';

    if (!matchData || Object.keys(matchData).length === 0) {
        statsContainer.innerHTML += '<p>No match data available</p>';
        return;
    }

    Object.entries(matchData).forEach(([eventCode, eventData]) => {
        const eventSection = document.createElement('div');
        eventSection.className = 'event-section';
        
        const stats = eventData.details.stats;
        
        const header = document.createElement('div');
        header.className = 'event-header';
        header.innerHTML = `
            <div class="event-title">
                <span class="expand-icon" style="transform: rotate(180deg);">▼</span>
                <h2>${eventCode}</h2>
            </div>
            <div class="event-stats">
                <p>R${stats.rank} | ${stats.wins}-${stats.losses}-${stats.ties} | RP:${stats.rp.toFixed(2)} | TB:${stats.tb1.toFixed(1)}/${stats.tb2.toFixed(1)}</p>
            </div>
        `;
        
        const matchesContainer = document.createElement('div');
        matchesContainer.id = `matches-${eventCode}`;
        matchesContainer.className = 'matches-container';
        matchesContainer.style.display = 'block';
        
        matchesContainer.innerHTML = eventData.matches.map(match => {
            let redScore, blueScore, autoPoints, dcPoints;
            
            if (currentMode === 'ftc') {
                redScore = match.redScore?.totalPointsNp || match.redScore?.totalPoints || 0;
                blueScore = match.blueScore?.totalPointsNp || match.blueScore?.totalPoints || 0;
                autoPoints = match[`${match.alliance.toLowerCase()}Score`]?.autoPoints || 0;
                dcPoints = match[`${match.alliance.toLowerCase()}Score`]?.dcPoints || 0;
            } else {
                redScore = match.redScore || 0;
                blueScore = match.blueScore || 0;
                autoPoints = 0;
                dcPoints = 0;
            }
            
            const matchTypeDisplay = getMatchTypeDisplay(match.matchType);
            
            return `
                <div class="match-card ${match.alliance.toLowerCase()}-alliance">
                    <div class="match-info">
                        <span class="station">${match.alliance} ${match.station}</span>
                        <div class="scores">
                            <span class="red">${redScore}</span>
                            <span>-</span>
                            <span class="blue">${blueScore}</span>
                        </div>
                        <div class="points">
                            <span>${matchTypeDisplay}</span>
                            ${currentMode === 'ftc' ? `<span>A:${autoPoints}</span><span>T:${dcPoints}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        header.addEventListener('click', () => toggleEventMatches(eventCode));
        
        eventSection.appendChild(header);
        eventSection.appendChild(matchesContainer);
        statsContainer.appendChild(eventSection);
    });

    createAnalytics(matchData);
}

function getMatchTypeDisplay(matchType) {
    if (currentMode === 'ftc') {
        return matchType === 'QUALIFICATION' ? 'Q' : matchType === 'SEMIFINAL' ? 'SF' : matchType === 'FINAL' ? 'F' : matchType;
    } else {
        const frcTypes = {
            'qm': 'Q',
            'qf': 'QF',
            'sf': 'SF',
            'f': 'F'
        };
        return frcTypes[matchType] || matchType;
    }
}

async function fetchTeamData(teamNumber, year) {
    try {
        console.log(`Fetching ${currentMode.toUpperCase()} data for team:`, teamNumber);
        
        if (currentMode === 'ftc') {
            return await fetchFTCTeamData(teamNumber, year);
        } else {
            return await fetchFRCTeamData(teamNumber, year);
        }
    } catch (error) {
        console.error('Error fetching team data:', error);
        throw error;
    }
}

async function fetchFTCTeamData(teamNumber, year) {
    const teamResponse = await fetch(`${API_BASE_URL}/teams/${teamNumber}`);
    const teamData = await teamResponse.json();
    console.log('FTC Team Data:', teamData);

    const eventsResponse = await fetch(`${API_BASE_URL}/teams/${teamNumber}/events/${year}`);
    const eventsData = await eventsResponse.json();
    console.log('FTC Events Data:', eventsData);
    
    let eventStats = null;
    if (eventsData && eventsData.length > 0) {
        const sortedEvents = eventsData.sort((a, b) => 
            new Date(b.startDate) - new Date(a.startDate)
        );
        eventStats = sortedEvents[0].stats;
        console.log('FTC Event Stats:', eventStats);
    }
    
    const statsUrl = `${API_BASE_URL}/teams/${teamNumber}/quick-stats?season=${year}`;
    console.log('Fetching FTC quick stats from:', statsUrl);
    const statsResponse = await fetch(statsUrl);
    const quickStats = await statsResponse.json();
    console.log('FTC Quick Stats:', quickStats);

    const stats = {
        ...quickStats,
        ...eventStats,
        events: eventsData
    };
    console.log('FTC Combined Stats:', stats);
    
    return {
        ...teamData,
        stats: stats
    };
}

async function fetchFRCTeamData(teamNumber, year) {
    const headers = {
        'X-TBA-Auth-Key': FRC_API_KEY
    };
    
    const teamKey = `frc${teamNumber}`;
    
    try {
        const teamData = await makeFRCRequest(`${API_BASE_URL}/team/${teamKey}`, headers);
        console.log('FRC Team Data:', teamData);

        const eventsData = await makeFRCRequest(`${API_BASE_URL}/team/${teamKey}/events/${year}`, headers);
        console.log('FRC Events Data:', eventsData);
        
        let statsData = {};
        try {
            statsData = await makeFRCRequest(`${API_BASE_URL}/team/${teamKey}/stats/${year}`, headers);
            console.log('FRC Stats Data:', statsData);
        } catch (statsError) {
            console.warn('FRC Stats not available for this team/year:', statsError.message);
        }
        
        return {
            number: teamNumber,
            name: teamData.nickname || teamData.name,
            city: teamData.city,
            state: teamData.state_prov,
            country: teamData.country,
            rookieYear: teamData.rookie_year,
            stats: {
                ...statsData,
                events: eventsData
            }
        };
    } catch (error) {
        console.error('Error fetching FRC team data:', error);
        throw error;
    }
}

async function fetchTeamMatches(teamNumber, year) {
    try {
        if (currentMode === 'ftc') {
            return await fetchFTCMatches(teamNumber, year);
        } else {
            return await fetchFRCMatches(teamNumber, year);
        }
    } catch (error) {
        console.error('Error fetching match data:', error);
        return {};
    }
}

async function fetchFTCMatches(teamNumber, year) {
    const eventsUrl = `${API_BASE_URL}/teams/${teamNumber}/events/${year}`;
    console.log('Fetching FTC events from:', eventsUrl);
    const eventsResponse = await fetch(eventsUrl);
    if (!eventsResponse.ok) throw new Error('Events data not found');
    const eventsData = await eventsResponse.json();
    console.log('FTC Events data:', eventsData);

    const eventMatches = {};
    
    for (const event of eventsData) {
        try {
            const eventCode = event.eventCode;
            
            const eventMatchesUrl = `${API_BASE_URL}/events/${year}/${eventCode}/matches`;
            console.log(`Fetching all FTC matches for event ${eventCode} from:`, eventMatchesUrl);
            const eventMatchesResponse = await fetch(eventMatchesUrl);
            if (!eventMatchesResponse.ok) continue;
            const allEventMatches = await eventMatchesResponse.json();
            console.log(`All FTC matches for event ${eventCode}:`, allEventMatches);

            const teamMatches = allEventMatches.filter(match => {
                return match.teams.some(team => team.teamNumber === parseInt(teamNumber));
            });

            if (teamMatches.length > 0) {
                eventMatches[eventCode] = {
                    details: {
                        name: event.name,
                        startDate: event.startDate,
                        endDate: event.endDate,
                        location: event.location,
                        stats: event.stats || {
                            wins: 0,
                            losses: 0,
                            ties: 0,
                            rp: 0,
                            rank: 0,
                            tb1: 0,
                            tb2: 0
                        }
                    },
                    matches: teamMatches.map(match => {
                        const ourTeamInfo = match.teams.find(team => 
                            team.teamNumber === parseInt(teamNumber)
                        );
                        
                        return {
                            matchNumber: match.id,
                            matchType: match.tournamentLevel,
                            alliance: ourTeamInfo.alliance,
                            station: ourTeamInfo.station,
                            redScore: match.scores.red,
                            blueScore: match.scores.blue,
                            surrogate: ourTeamInfo.surrogate,
                            noShow: ourTeamInfo.noShow,
                            dq: ourTeamInfo.dq,
                            teams: {
                                red: match.teams.filter(t => t.alliance === 'Red'),
                                blue: match.teams.filter(t => t.alliance === 'Blue')
                            }
                        };
                    })
                };
            }
        } catch (error) {
            console.error(`Error fetching FTC matches for event ${event.eventCode}:`, error);
        }
    }

    for (const eventCode in eventMatches) {
        eventMatches[eventCode].matches.sort((a, b) => {
            const typeOrder = { 'Quals': 0, 'Semis': 1, 'Finals': 2 };
            if (a.matchType !== b.matchType) {
                return typeOrder[a.matchType] - typeOrder[b.matchType];
            }
            return a.matchNumber - b.matchNumber;
        });
    }

    console.log('Final processed FTC event matches:', eventMatches);
    return eventMatches;
}

async function fetchFRCMatches(teamNumber, year) {
    const headers = {
        'X-TBA-Auth-Key': FRC_API_KEY
    };
    
    const teamKey = `frc${teamNumber}`;
    
    try {
        const eventsData = await makeFRCRequest(`${API_BASE_URL}/team/${teamKey}/events/${year}`, headers);
        console.log('FRC Events data:', eventsData);

        const eventMatches = {};
        
        for (const event of eventsData) {
            try {
                const eventKey = event.key;
                
                const allEventMatches = await makeFRCRequest(`${API_BASE_URL}/event/${eventKey}/matches`, headers);
                console.log(`All FRC matches for event ${eventKey}:`, allEventMatches);

                const teamMatches = allEventMatches.filter(match => {
                    return match.alliances.red.team_keys.includes(teamKey) || 
                           match.alliances.blue.team_keys.includes(teamKey);
                });

                if (teamMatches.length > 0) {
                    eventMatches[eventKey] = {
                        details: {
                            name: event.name,
                            startDate: event.start_date,
                            endDate: event.end_date,
                            location: `${event.city}, ${event.state_prov}`,
                            stats: {
                                wins: 0,
                                losses: 0,
                                ties: 0,
                                rp: 0,
                                rank: 0,
                                tb1: 0,
                                tb2: 0
                            }
                        },
                        matches: teamMatches.map(match => {
                            const isRed = match.alliances.red.team_keys.includes(teamKey);
                            const alliance = isRed ? 'Red' : 'Blue';
                            
                            return {
                                matchNumber: match.match_number,
                                matchType: match.comp_level,
                                alliance: alliance,
                                station: isRed ? 
                                       match.alliances.red.team_keys.indexOf(teamKey) + 1 :
                                       match.alliances.blue.team_keys.indexOf(teamKey) + 1,
                                redScore: match.alliances.red.score,
                                blueScore: match.alliances.blue.score,
                                surrogate: false,
                                noShow: false,
                                dq: false,
                                teams: {
                                    red: match.alliances.red.team_keys.map(key => ({ teamNumber: key.replace('frc', '') })),
                                    blue: match.alliances.blue.team_keys.map(key => ({ teamNumber: key.replace('frc', '') }))
                                }
                            };
                        })
                    };
                }
            } catch (error) {
                console.error(`Error fetching FRC matches for event ${event.key}:`, error);
            }
        }

        for (const eventKey in eventMatches) {
            eventMatches[eventKey].matches.sort((a, b) => {
                const typeOrder = { 'qm': 0, 'qf': 1, 'sf': 2, 'f': 3 };
                if (a.matchType !== b.matchType) {
                    return typeOrder[a.matchType] - typeOrder[b.matchType];
                }
                return a.matchNumber - b.matchNumber;
            });
        }

        console.log('Final processed FRC event matches:', eventMatches);
        return eventMatches;
    } catch (error) {
        console.error('Error fetching FRC matches:', error);
        throw error;
    }
}

function determineResult(match) {
    const redScore = match.redScore?.totalPointsNp || match.redScore?.totalPoints || 0;
    const blueScore = match.blueScore?.totalPointsNp || match.blueScore?.totalPoints || 0;
    
    if (match.alliance === 'RED') {
        if (redScore > blueScore) return 'Won';
        if (redScore < blueScore) return 'Lost';
        return 'Tie';
    }
    if (match.alliance === 'BLUE') {
        if (blueScore > redScore) return 'Won';
        if (blueScore < redScore) return 'Lost';
        return 'Tie';
    }
    
    return 'N/A';
}

function displayTeamInfo(teamData, matchData) {
    const record = { wins: 0, losses: 0, ties: 0 };
    
    if (matchData) {
        Object.values(matchData).forEach(eventData => {
            if (eventData.matches) {
                eventData.matches.forEach(match => {
                    let redScore, blueScore;
                    
                    if (currentMode === 'ftc') {
                        redScore = match.redScore?.totalPointsNp || match.redScore?.totalPoints || 0;
                        blueScore = match.blueScore?.totalPointsNp || match.blueScore?.totalPoints || 0;
                    } else {
                        redScore = match.redScore || 0;
                        blueScore = match.blueScore || 0;
                    }
                    
                    if (match.alliance?.toLowerCase() === 'red') {
                        if (redScore > blueScore) record.wins++;
                        else if (redScore < blueScore) record.losses++;
                        else record.ties++;
                    } else if (match.alliance?.toLowerCase() === 'blue') {
                        if (blueScore > redScore) record.wins++;
                        else if (blueScore < redScore) record.losses++;
                        else record.ties++;
                    }
                });
            }
        });
    }

    const basicInfoDiv = document.getElementById('teamBasicInfo');
    basicInfoDiv.innerHTML = `
        <div class="team-header">
            <div class="team-basic-info">
                <h3>${teamData.number} - ${teamData.name || 'Unknown Team'}</h3>
                <p><strong>Location:</strong> ${[
                    teamData.city,
                    teamData.state,
                    teamData.country
                ].filter(Boolean).join(', ') || 'Location Unknown'}</p>
                <p><strong>Rookie Year:</strong> ${teamData.rookieYear || 'Unknown'}</p>
            </div>
            <div class="team-record">
                <span class="record-label">Overall Record</span>
                <span class="record-numbers">${record.wins}W - ${record.losses}L - ${record.ties}T</span>
            </div>
        </div>
    `;

    const statsDiv = document.getElementById('teamStats');
    
    if (teamData.stats) {
        const formatValue = (value) => {
            if (typeof value === 'number') return value.toFixed(2);
            return '0.00';
        };

        const stats = teamData.stats;
        
        if (currentMode === 'ftc') {
            statsDiv.innerHTML = `
                <h3>Team Statistics (${MODES[currentMode].seasons.current} Season)</h3>
                
                <div class="stats-grid">
                    <div class="stats-section">
                        <h4>Season Rankings</h4>
                        <table class="stats-table">
                            <tr>
                                <th>Category</th>
                                <th>Value</th>
                                <th>Rank</th>
                            </tr>
                            <tr>
                                <td>Auto</td>
                                <td>${formatValue(stats.auto?.value)}</td>
                                <td>${stats.auto?.rank || 'N/A'} of ${stats.count || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>Driver Control</td>
                                <td>${formatValue(stats.dc?.value)}</td>
                                <td>${stats.dc?.rank || 'N/A'} of ${stats.count || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td>Endgame</td>
                                <td>${formatValue(stats.eg?.value)}</td>
                                <td>${stats.eg?.rank || 'N/A'} of ${stats.count || 'N/A'}</td>
                            </tr>
                        </table>
                    </div>

                    <div class="stats-section">
                        <h4>Average Match Breakdown</h4>
                        <table class="stats-table">
                            <tr>
                                <th>Phase</th>
                                <th>Avg</th>
                                <th>Max</th>
                            </tr>
                            <tr>
                                <td>Auto</td>
                                <td>${formatValue(stats.avg?.autoPoints)}</td>
                                <td>${stats.max?.autoPoints || '0'}</td>
                            </tr>
                            <tr>
                                <td>Driver Control</td>
                                <td>${formatValue(stats.avg?.dcPoints)}</td>
                                <td>${stats.max?.dcPoints || '0'}</td>
                            </tr>
                            <tr>
                                <td>Total (No Penalties)</td>
                                <td>${formatValue(stats.avg?.totalPointsNp)}</td>
                                <td>${stats.max?.totalPointsNp || '0'}</td>
                            </tr>
                            <tr>
                                <td>Total (With Penalties)</td>
                                <td>${formatValue(stats.avg?.totalPoints)}</td>
                                <td>${stats.max?.totalPoints || '0'}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            `;
        } else {
            statsDiv.innerHTML = `
                <h3>Team Statistics (${MODES[currentMode].seasons.current} Season)</h3>
                
                <div class="stats-grid">
                    <div class="stats-section">
                        <h4>Season Performance</h4>
                        <table class="stats-table">
                            <tr>
                                <th>Category</th>
                                <th>Value</th>
                            </tr>
                            <tr>
                                <td>OPR (Offensive Power Rating)</td>
                                <td>${formatValue(stats.opr || 0)}</td>
                            </tr>
                            <tr>
                                <td>DPR (Defensive Power Rating)</td>
                                <td>${formatValue(stats.dpr || 0)}</td>
                            </tr>
                            <tr>
                                <td>CCWM (Calculated Contribution to Winning Margin)</td>
                                <td>${formatValue(stats.ccwm || 0)}</td>
                            </tr>
                        </table>
                    </div>

                    <div class="stats-section">
                        <h4>Match Statistics</h4>
                        <table class="stats-table">
                            <tr>
                                <th>Category</th>
                                <th>Value</th>
                            </tr>
                            <tr>
                                <td>Average Score</td>
                                <td>${formatValue(stats.avg_score || 0)}</td>
                            </tr>
                            <tr>
                                <td>Max Score</td>
                                <td>${stats.max_score || '0'}</td>
                            </tr>
                            <tr>
                                <td>Total Matches</td>
                                <td>${stats.total_matches || '0'}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            `;
        }
    } else {
        statsDiv.innerHTML = `
            <h3>Team Statistics</h3>
            <p>No statistics available for this team in the current season.</p>
        `;
    }
}

function createMatchCard(match) {
    const result = determineResult(match);
    const matchTypeDisplay = match.matchType === 'QUALIFICATION' ? 'Q' : match.matchType === 'SEMIFINAL' ? 'SF' : match.matchType === 'FINAL' ? 'F' : match.matchType;
    
    return `
        <div class="match-card ${match.alliance.toLowerCase()} animate-fade-in">
            <div class="match-header">
                <h5>${matchTypeDisplay}-${match.matchNumber}</h5>
            </div>
            <div class="match-details">
                <div class="match-info">
                    <div class="alliance-info">
                        <span class="alliance ${match.alliance.toLowerCase()}">${match.alliance}</span>
                        <span class="station">Station ${match.station}</span>
                    </div>
                    <div class="score-display">
                        <div class="red-score ${match.alliance === 'RED' ? 'highlighted' : ''}">
                            ${match.redScore !== undefined ? match.redScore : 'TBD'}
                        </div>
                        <div class="score-divider">-</div>
                        <div class="blue-score ${match.alliance === 'BLUE' ? 'highlighted' : ''}">
                            ${match.blueScore !== undefined ? match.blueScore : 'TBD'}
                        </div>
                    </div>
                    <div class="match-result ${result.toLowerCase()}">
                        ${result}
                    </div>
                </div>
                <div class="teams-display">
                    <div class="red-alliance">
                        ${match.teams.red.map(team => 
                            `<div class="team-number">${team.teamNumber}</div>`
                        ).join('')}
                    </div>
                    <div class="blue-alliance">
                        ${match.teams.blue.map(team => 
                            `<div class="team-number">${team.teamNumber}</div>`
                        ).join('')}
                    </div>
                </div>
                <div class="match-status">
                    ${match.surrogate ? '<span class="status surrogate">Surrogate</span>' : ''}
                    ${match.noShow ? '<span class="status no-show">No Show</span>' : ''}
                    ${match.dq ? '<span class="status dq">Disqualified</span>' : ''}
                </div>
            </div>
        </div>
    `;
}

function calculateEventStats(matches) {
    return matches.reduce((stats, match) => {
        const result = determineResult(match);
        if (result === 'Won') stats.wins++;
        else if (result === 'Lost') stats.losses++;
        else if (result === 'Tie') stats.ties++;
        return stats;
    }, { wins: 0, losses: 0, ties: 0 });
}

function toggleEventMatches(eventCode) {
    const matchesContainer = document.getElementById(`matches-${eventCode}`);
    const expandIcon = matchesContainer.previousElementSibling.querySelector('.expand-icon');
    
    if (matchesContainer.style.display === 'none') {
        matchesContainer.style.display = 'block';
        expandIcon.style.transform = 'rotate(180deg)';
    } else {
        matchesContainer.style.display = 'none';
        expandIcon.style.transform = 'rotate(0deg)';
    }
}

function createAnalytics(matchData) {
    document.getElementById('analytics-container').classList.remove('hidden');
    
    const allMatches = Object.values(matchData).flatMap(event => event.matches);
    
    if (chartInstances.matchHistory) chartInstances.matchHistory.destroy();
    if (chartInstances.phaseBreakdown) chartInstances.phaseBreakdown.destroy();
    if (chartInstances.winLoss) chartInstances.winLoss.destroy();
    if (chartInstances.performanceTrends) chartInstances.performanceTrends.destroy();
    
    chartInstances.matchHistory = createMatchHistoryChart(allMatches);
    chartInstances.phaseBreakdown = createScoringBreakdownChart(allMatches);
    chartInstances.winLoss = createWinLossChart(allMatches);
    chartInstances.performanceTrends = createPerformanceTrendsChart(allMatches);
}

function createMatchHistoryChart(matches) {
    const ctx = document.getElementById('scoreProgressionChart').getContext('2d');
    
    const matchData = matches.map((match, index) => {
        let auto, teleop, total;
        
        if (currentMode === 'ftc') {
            const alliance = match.alliance.toLowerCase();
            const score = match[`${alliance}Score`];
            auto = score?.autoPoints || 0;
            teleop = score?.dcPoints || 0;
            total = score?.totalPointsNp || 0;
        } else {
            const alliance = match.alliance.toLowerCase();
            total = match[`${alliance}Score`] || 0;
            auto = 0;
            teleop = total;
        }
        
        return {
            auto: auto,
            teleop: teleop,
            total: total,
            matchNumber: index + 1
        };
    });

    const datasets = [
        {
            label: currentMode === 'ftc' ? 'Auto' : 'Score',
            data: matchData.map(m => m.auto),
            backgroundColor: 'rgba(255, 206, 86, 0.8)',
            stack: 'Stack 0',
        }
    ];
    
    if (currentMode === 'ftc') {
        datasets.push({
            label: 'TeleOp',
            data: matchData.map(m => m.teleop),
            backgroundColor: 'rgba(75, 192, 192, 0.8)',
            stack: 'Stack 0',
        });
    }
    
    datasets.push({
        label: 'Match Average',
        data: matchData.map(() => {
            const avg = matchData.reduce((sum, m) => sum + m.total, 0) / matchData.length;
            return avg;
        }),
        type: 'line',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
    });

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: matchData.map(m => `Match ${m.matchNumber}`),
            datasets: datasets
        },
        options: {
            ...chartConfig,
            plugins: {
                title: {
                    display: true,
                    text: `${currentMode.toUpperCase()} Match History Breakdown`,
                    color: '#ffffff',
                    font: { size: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y || 0;
                            return `${label}: ${Math.round(value)} points`;
                        }
                    }
                }
            }
        }
    });
}

function createScoringBreakdownChart(matches) {
    const ctx = document.getElementById('phaseBreakdownChart').getContext('2d');
    
    let scoringData;
    
    if (currentMode === 'ftc') {
        scoringData = matches.reduce((acc, match) => {
            const alliance = match.alliance.toLowerCase();
            const score = match[`${alliance}Score`];
            if (score) {
                acc.auto += score.autoPoints || 0;
                acc.teleop += score.dcPoints || 0;
            }
            return acc;
        }, { auto: 0, teleop: 0 });
    } else {
        scoringData = matches.reduce((acc, match) => {
            const alliance = match.alliance.toLowerCase();
            const score = match[`${alliance}Score`] || 0;
            acc.total += score;
            return acc;
        }, { total: 0 });
    }

    if (currentMode === 'ftc') {
        const total = scoringData.auto + scoringData.teleop;
        const autoPercentage = (scoringData.auto / total * 100).toFixed(1);
        const teleopPercentage = (scoringData.teleop / total * 100).toFixed(1);

        return new Chart(ctx, {
            type: 'pie',
            data: {
                labels: [`Auto (${autoPercentage}%)`, `TeleOp (${teleopPercentage}%)`],
                datasets: [{
                    data: [scoringData.auto, scoringData.teleop],
                    backgroundColor: [
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)'
                    ],
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }]
            },
            options: {
                ...chartConfig,
                plugins: {
                    title: {
                        display: true,
                        text: 'FTC Scoring Phase Distribution',
                        color: '#ffffff',
                        font: { size: 16 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                return `${label}: ${Math.round(value)} points`;
                            }
                        }
                    }
                }
            }
        });
    } else {
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [`Total Score (${scoringData.total} pts)`],
                datasets: [{
                    data: [scoringData.total],
                    backgroundColor: ['rgba(75, 192, 192, 0.8)'],
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }]
            },
            options: {
                ...chartConfig,
                plugins: {
                    title: {
                        display: true,
                        text: 'FRC Total Score',
                        color: '#ffffff',
                        font: { size: 16 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed || 0;
                                return `Total: ${Math.round(value)} points`;
                            }
                        }
                    }
                }
            }
        });
    }
}

function createWinLossChart(matches) {
    const ctx = document.getElementById('performanceRadarChart').getContext('2d');
    
    const results = matches.reduce((acc, match) => {
        let redScore, blueScore;
        
        if (currentMode === 'ftc') {
            redScore = match.redScore?.totalPointsNp || match.redScore?.totalPoints || 0;
            blueScore = match.blueScore?.totalPointsNp || match.blueScore?.totalPoints || 0;
        } else {
            redScore = match.redScore || 0;
            blueScore = match.blueScore || 0;
        }
        
        if (match.alliance.toLowerCase() === 'red') {
            if (redScore > blueScore) acc.won++;
            else if (redScore < blueScore) acc.lost++;
            else acc.tie++;
        } else if (match.alliance.toLowerCase() === 'blue') {
            if (blueScore > redScore) acc.won++;
            else if (blueScore < redScore) acc.lost++;
            else acc.tie++;
        }
        
        return acc;
    }, { won: 0, lost: 0, tie: 0 });

    console.log('Match Results:', results);

    const total = matches.length;
    const winRate = total > 0 ? ((results.won / total) * 100).toFixed(1) : '0.0';

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [
                `Wins (${results.won})`,
                `Losses (${results.lost})`,
                `Ties (${results.tie})`
            ],
            datasets: [{
                data: [results.won, results.lost, results.tie],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(255, 206, 86, 0.8)'
                ],
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1
            }]
        },
        options: {
            ...chartConfig,
            plugins: {
                title: {
                    display: true,
                    text: `${currentMode.toUpperCase()} Win/Loss Record (${winRate}% Win Rate)`,
                    color: '#ffffff',
                    font: { size: 16 }
                }
            }
        }
    });
}

function createPerformanceTrendsChart(matches) {
    const ctx = document.getElementById('consistencyChart').getContext('2d');
    
    const movingAverage = (data, windowSize) => {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            const start = Math.max(0, i - windowSize + 1);
            const window = data.slice(start, i + 1);
            const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
            result.push(avg);
        }
        return result;
    };

    const scores = matches.map(match => {
        let score;
        if (currentMode === 'ftc') {
            const alliance = match.alliance.toLowerCase();
            score = match[`${alliance}Score`]?.totalPointsNp || 0;
        } else {
            const alliance = match.alliance.toLowerCase();
            score = match[`${alliance}Score`] || 0;
        }
        return score;
    });

    const trendLine = movingAverage(scores, 3);

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: matches.map((_, i) => `Match ${i + 1}`),
            datasets: [
                {
                    label: 'Match Score',
                    data: scores,
                    borderColor: 'rgba(75, 192, 192, 0.8)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    pointRadius: 4,
                    fill: true
                },
                {
                    label: '3-Match Average',
                    data: trendLine,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            ...chartConfig,
            plugins: {
                title: {
                    display: true,
                    text: `${currentMode.toUpperCase()} Performance Trends`,
                    color: '#ffffff',
                    font: { size: 16 }
                }
            }
        }
    });
}

const PRESENTATION = {
    isActive: false,
    interval: null,
    steps: [
        {
            action: () => {
                DOM.mainContent.classList.remove('visible');
                DOM.landingHeader.classList.remove('searched');
                DOM.teamNumberInput.value = '';
                window.scrollTo({ top: 0, behavior: 'smooth' });
                const searchArea = document.querySelector('.landing-search');
                searchArea.classList.add('presentation-zoom');
                setTimeout(() => {
                    simulateTyping(MODES[currentMode].defaultTeam, () => {
                        searchArea.classList.remove('presentation-zoom');
                        setTimeout(() => {
                            searchArea.classList.remove('presentation-zoom');
                            searchTeam();
                            setTimeout(showcaseFeatures, 2000);
                        }, 500);
                    });
                }, 1500);
            }
        }
    ],
    currentStep: 0
};

function simulateTyping(text, callback) {
    let index = 0;
    DOM.teamNumberInput.value = '';
    
    const typeChar = () => {
        if (index < text.length) {
            DOM.teamNumberInput.value += text.charAt(index);
            index++;
            setTimeout(typeChar, 200);
        } else {
            if (callback) callback();
        }
    };
    
    typeChar();
}

function showcaseFeatures() {
    if (!PRESENTATION.isActive) return;

    const features = [
        {
            element: document.querySelector('#teamInfo'),
            duration: 4000,
            highlight: true,
            description: 'Team Information & Statistics'
        },
        {
            element: document.querySelector('#stats-container'),
            duration: 5000,
            highlight: true,
            description: 'Event Performance',
            onStart: () => {
                const eventHeaders = document.querySelectorAll('.event-header');
                eventHeaders.forEach(header => {
                    const eventCode = header.closest('.event-section').querySelector('.matches-container').id.replace('matches-', '');
                    const matchesContainer = document.getElementById(`matches-${eventCode}`);
                    if (matchesContainer.style.display === 'none') {
                        toggleEventMatches(eventCode);
                    }
                });
            },
            onEnd: () => {
                const eventHeaders = document.querySelectorAll('.event-header');
                eventHeaders.forEach(header => {
                    const eventCode = header.closest('.event-section').querySelector('.matches-container').id.replace('matches-', '');
                    const matchesContainer = document.getElementById(`matches-${eventCode}`);
                    if (matchesContainer.style.display === 'block') {
                        toggleEventMatches(eventCode);
                    }
                });
            }
        },
        {
            element: document.querySelector('#analytics-container'),
            duration: 8000,
            highlight: true,
            description: 'Performance Analytics'
        }
    ];

    let currentFeatureIndex = 0;

    function showNextFeature() {
        if (!PRESENTATION.isActive) return;

        document.querySelectorAll('.feature-highlight').forEach(el => {
            el.classList.remove('feature-highlight');
        });

        const oldDesc = document.getElementById('feature-description');
        if (oldDesc) oldDesc.remove();

        if (currentFeatureIndex >= features.length) {
            currentFeatureIndex = 0;
            executeCurrentStep();
            return;
        }

        const feature = features[currentFeatureIndex];

        if (feature.onStart) {
            feature.onStart();
        }

        feature.element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });

        if (feature.highlight) {
            feature.element.classList.add('feature-highlight');
        }

        const description = document.createElement('div');
        description.id = 'feature-description';
        description.innerHTML = feature.description;
        description.className = 'feature-description';
        document.body.appendChild(description);

        setTimeout(() => {
            if (feature.onEnd) {
                feature.onEnd();
            }
            currentFeatureIndex++;
            showNextFeature();
        }, feature.duration);
    }

    showNextFeature();
}

function togglePresentationMode() {
    PRESENTATION.isActive = !PRESENTATION.isActive;
    
    if (PRESENTATION.isActive) {
        startPresentation();
        console.log('Presenting on');
        console.log('Use "togglePresentationMode()" to deactivate');
    } else {
        stopPresentation();
        console.log('Presenting off');
    }
}

function startPresentation() {
    PRESENTATION.currentStep = 0;
    executeCurrentStep();
}

function executeCurrentStep() {
    if (!PRESENTATION.isActive) return;
    
    const step = PRESENTATION.steps[PRESENTATION.currentStep];
    step.action();
}

function stopPresentation() {
    clearTimeout(PRESENTATION.interval);
    
    const description = document.getElementById('feature-description');
    if (description) description.remove();
    
    document.querySelectorAll('.feature-highlight').forEach(el => {
        el.classList.remove('feature-highlight');
    });
    
    const searchArea = document.querySelector('.landing-search');
    searchArea.classList.remove('presentation-zoom');
}

function switchMode(mode) {
    if (mode === currentMode) return;
    
    currentMode = mode;
    API_BASE_URL = MODES[currentMode].apiBase;

    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    DOM.landingTitle.textContent = MODES[mode].title;
    DOM.landingSubtitle.textContent = MODES[mode].subtitle;
    
    resetPage();
    
    clearData();
}

function resetPage() {
    DOM.mainContent.classList.remove('visible');
    DOM.landingHeader.classList.remove('searched');
    DOM.teamNumberInput.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearData() {
    DOM.teamBasicInfo.innerHTML = '';
    DOM.teamStats.innerHTML = '';
    DOM.statsContainer.innerHTML = '<h2>Event Statistics</h2>';
    DOM.analyticsContainer.innerHTML = '<h2>Performance Analytics</h2><div class="charts-grid"></div>';
    
    DOM.statsContainer.classList.add('hidden');
    DOM.analyticsContainer.classList.add('hidden');

    destroyCharts();

    apiCache.clear();
}

window.togglePresentationMode = togglePresentationMode;
window.switchMode = switchMode;

async function makeFRCRequest(url, headers = {}) {
    const tbaHeaders = {
        'X-TBA-Auth-Key': FRC_API_KEY,
        'User-Agent': 'MechaSearch/1.0 (https://github.com/ftcscout/ftcscout.github.io)',
        ...headers
    };
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: tbaHeaders,
            mode: 'cors'
        });
        
        if (response.ok) {
            return await response.json();
        }
        
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const proxyResponse = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'MechaSearch/1.0'
            }
        });
        
        if (proxyResponse.ok) {
            return await proxyResponse.json();
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
    } catch (error) {
        console.error('FRC API request failed:', error);
        throw error;
    }
}