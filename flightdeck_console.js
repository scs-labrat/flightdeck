// Flightdeck Console Simulation

const WebSocket = require('ws');
const readline = require('readline');

// ANSI escape codes for colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  },
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m'
  }
};

// Simulated aircraft systems with assigned ports
const systems = {
  FMS: 10000,
  EFIS: 10001,
  EICAS: 10002,
  TCAS: 10003,
  'Weather Radar': 10004,
  ILS: 10005,
  'VHF Comms': 10006,
  'HF Comms': 10007,
  SATCOM: 10008,
  ACARS: 10009,
  'ADS-B': 10010,
  Transponder: 10011,
  EGPWS: 10012
};

// WebSocket connections
const connections = {};

// Connect to all system WebSockets
Object.entries(systems).forEach(([system, port]) => {
  connections[system] = new WebSocket(`ws://localhost:${port}`);
  
  connections[system].on('open', () => {
    console.log(`${colors.fg.green}Connected to ${system} on port ${port}${colors.reset}`);
  });
  
  connections[system].on('message', (data) => {
    handleSystemData(system, JSON.parse(data));
  });
  
  connections[system].on('error', (error) => {
    console.error(`${colors.fg.red}Error in ${system} connection:${colors.reset}`, error);
  });
});

// Handle incoming system data
function handleSystemData(system, data) {
  switch (system) {
    case 'FMS':
      displayFMSData(data.data);
      break;
    case 'EFIS':
      displayEFISData(data.data);
      break;
    case 'EICAS':
      displayEICASData(data.data);
      break;
    case 'TCAS':
      displayTCASData(data.data);
      break;
    case 'Weather Radar':
      displayWeatherRadarData(data.data);
      break;
    case 'ADS-B':
      displayADSBData(data.data);
      break;
    case 'EGPWS':
      displayEGPWSData(data.data);
      break;
    default:
      console.log(`${colors.fg.yellow}${system} data:${colors.reset}`, data);
  }
}

function displayFMSData(data) {
  console.log(`
${colors.fg.cyan}${colors.bright}FMS Data:${colors.reset}
  Flight Plan: ${data.flightPlan.origin} → ${data.flightPlan.destination}
  Waypoints: ${data.flightPlan.waypoints.join(' → ')}
  Est. Fuel Remaining: ${data.estimatedFuelRemaining} kg
  `);
}

function displayEFISData(data) {
  console.log(`
${colors.fg.cyan}${colors.bright}EFIS Data:${colors.reset}
  Attitude: Pitch ${data.attitudeIndicator.pitch.toFixed(1)}°, Roll ${data.attitudeIndicator.roll.toFixed(1)}°
  Altitude: ${data.altimeter} ft
  Airspeed: ${data.airspeed} knots
  `);
}

function displayEICASData(data) {
  console.log(`
${colors.fg.cyan}${colors.bright}EICAS Data:${colors.reset}
  Engine: N1 ${data.engineParameters.n1}%, EGT ${data.engineParameters.egt}°C
  Fuel Flow: ${data.engineParameters.fuelFlow} kg/h
  Hydraulic Pressure: ${data.hydraulicPressure} psi
  `);
}

function displayTCASData(data) {
  console.log(`
${colors.fg.cyan}${colors.bright}TCAS Data:${colors.reset}
  Nearby Aircraft:`);
  data.nearbyAircraft.forEach(ac => {
    console.log(`  ${ac.callsign}: ${ac.relativeAltitude > 0 ? '+' : ''}${ac.relativeAltitude} ft, ${ac.range} nm`);
  });
}

function displayWeatherRadarData(data) {
  console.log(`
${colors.fg.cyan}${colors.bright}Weather Radar:${colors.reset}
  Weather Cells:`);
  data.weatherCells.forEach(cell => {
    console.log(`  ${cell.intensity} at ${cell.bearing}°, ${cell.distance} nm`);
  });
}

function displayADSBData(data) {
  console.log(`
${colors.fg.cyan}${colors.bright}ADS-B Data:${colors.reset}
  Ownship: ${data.ownship.position.latitude.toFixed(4)}°, ${data.ownship.position.longitude.toFixed(4)}°
           Alt: ${data.ownship.altitude} ft, Speed: ${data.ownship.speed} knots
  Nearby Traffic:`);
  data.traffic.forEach(ac => {
    console.log(`  ${ac.icao}: ${ac.position.latitude.toFixed(4)}°, ${ac.position.longitude.toFixed(4)}°`);
    console.log(`           Alt: ${ac.altitude} ft, Speed: ${ac.speed} knots`);
  });
}

function displayEGPWSData(data) {
  console.log(`
${colors.fg.cyan}${colors.bright}EGPWS Data:${colors.reset}
  Terrain Ahead: ${data.terrainAhead ? colors.fg.red + 'WARNING' + colors.reset : 'Clear'}
  Minimum Terrain Clearance: ${data.minimumTerrainClearance} ft
  Warnings: ${data.warnings.length > 0 ? colors.fg.red + data.warnings.join(', ') + colors.reset : 'None'}
  `);
}

// Set up readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function displayMenu() {
  console.log(`
${colors.fg.yellow}${colors.bright}Flightdeck Console Menu:${colors.reset}
  1. Display FMS Data
  2. Display EFIS Data
  3. Display EICAS Data
  4. Display TCAS Data
  5. Display Weather Radar
  6. Display ADS-B Data
  7. Display EGPWS Data
  8. Exit
  `);
  rl.question('Enter your choice: ', handleUserInput);
}

function handleUserInput(choice) {
  switch (choice) {
    case '1':
      connections.FMS.send('request');
      break;
    case '2':
      connections.EFIS.send('request');
      break;
    case '3':
      connections.EICAS.send('request');
      break;
    case '4':
      connections.TCAS.send('request');
      break;
    case '5':
      connections['Weather Radar'].send('request');
      break;
    case '6':
      connections['ADS-B'].send('request');
      break;
    case '7':
      connections.EGPWS.send('request');
      break;
    case '8':
      console.log('Exiting Flightdeck Console Simulation.');
      rl.close();
      process.exit(0);
    default:
      console.log('Invalid choice. Please try again.');
  }
  setTimeout(displayMenu, 1000);
}

console.log(`${colors.fg.green}${colors.bright}Starting Flightdeck Console Simulation...${colors.reset}`);
setTimeout(displayMenu, 2000);  // Give time for WebSocket connections to establish