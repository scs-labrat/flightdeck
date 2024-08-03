// Flightdeck Console Simulation with Graphical Elements and Real-Time Monitoring

const WebSocket = require('ws');
const blessed = require('blessed');
const contrib = require('blessed-contrib');

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

// Create a screen object
const screen = blessed.screen({
  smartCSR: true,
  title: 'Flightdeck Console Simulation'
});

// Create a grid layout
const grid = new contrib.grid({
  rows: 12,
  cols: 12,
  screen: screen
});

// Define tables and line charts for different systems
const fmsTable = grid.set(0, 0, 4, 4, contrib.table, {
  keys: true,
  label: 'FMS Data',
  columnWidth: [15, 40]
});

const efisTable = grid.set(0, 4, 4, 4, contrib.table, {
  keys: true,
  label: 'EFIS Data',
  columnWidth: [15, 15, 15]
});

const eicasTable = grid.set(0, 8, 4, 4, contrib.table, {
  keys: true,
  label: 'EICAS Data',
  columnWidth: [15, 15, 15]
});

const tcasTable = grid.set(4, 0, 4, 6, contrib.table, {
  keys: true,
  label: 'TCAS Data',
  columnWidth: [15, 20, 10]
});

const weatherRadarTable = grid.set(4, 6, 4, 6, contrib.table, {
  keys: true,
  label: 'Weather Radar Data',
  columnWidth: [15, 15, 15]
});

const adsbTable = grid.set(8, 0, 4, 8, contrib.table, {
  keys: true,
  label: 'ADS-B Data',
  columnWidth: [20, 20, 20]
});

const egpwsTable = grid.set(8, 8, 4, 4, contrib.table, {
  keys: true,
  label: 'EGPWS Data',
  columnWidth: [20, 20]
});

const altitudeChart = grid.set(8, 8, 4, 4, contrib.line, {
  style: { line: 'yellow', text: 'green', baseline: 'black' },
  label: 'Altitude (ft)',
  showLegend: true
});

const speedChart = grid.set(4, 0, 4, 6, contrib.line, {
  style: { line: 'red', text: 'green', baseline: 'black' },
  label: 'Speed (knots)',
  showLegend: true
});

const fuelChart = grid.set(4, 6, 4, 6, contrib.line, {
  style: { line: 'blue', text: 'green', baseline: 'black' },
  label: 'Fuel (kg)',
  showLegend: true
});

// Data arrays for charts
let altitudeData = Array(30).fill(0);
let speedData = Array(30).fill(0);
let fuelData = Array(30).fill(0);

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
      updateFMSTable(data.data);
      updateFuelChart(data.data.estimatedFuelRemaining);
      break;
    case 'EFIS':
      updateEFISTable(data.data);
      updateAltitudeChart(data.data.altimeter);
      updateSpeedChart(data.data.airspeed);
      break;
    case 'EICAS':
      updateEICASTable(data.data);
      break;
    case 'TCAS':
      updateTCASTable(data.data);
      break;
    case 'Weather Radar':
      updateWeatherRadarTable(data.data);
      break;
    case 'ADS-B':
      updateADS-BTable(data.data);
      break;
    case 'EGPWS':
      updateEGPWSTable(data.data);
      break;
    default:
      console.log(`${colors.fg.yellow}${system} data:${colors.reset}`, data);
  }
}

function updateFMSTable(data) {
  fmsTable.setData({
    headers: ['Key', 'Value'],
    data: [
      ['Flight Plan', `${data.flightPlan.origin} → ${data.flightPlan.destination}`],
      ['Waypoints', data.flightPlan.waypoints.join(' → ')],
      ['Fuel Remaining', `${data.estimatedFuelRemaining} kg`]
    ]
  });
  screen.render();
}

function updateEFISTable(data) {
  efisTable.setData({
    headers: ['Key', 'Pitch', 'Roll'],
    data: [
      ['Attitude', `${data.attitudeIndicator.pitch.toFixed(1)}°`, `${data.attitudeIndicator.roll.toFixed(1)}°`],
      ['Altitude', `${data.altimeter} ft`, ''],
      ['Airspeed', `${data.airspeed} knots`, '']
    ]
  });
  screen.render();
}

function updateEICASTable(data) {
  eicasTable.setData({
    headers: ['Key', 'Value', 'Unit'],
    data: [
      ['N1', `${data.engineParameters.n1}%`, ''],
      ['EGT', `${data.engineParameters.egt}°C`, ''],
      ['Fuel Flow', `${data.engineParameters.fuelFlow} kg/h`, ''],
      ['Hydraulic Pressure', `${data.hydraulicPressure} psi`, '']
    ]
  });
  screen.render();
}

function updateTCASTable(data) {
  tcasTable.setData({
    headers: ['Callsign', 'Relative Altitude', 'Range (nm)'],
    data: data.nearbyAircraft.map(ac => [
      ac.callsign,
      `${ac.relativeAltitude > 0 ? '+' : ''}${ac.relativeAltitude} ft`,
      ac.range
    ])
  });
  screen.render();
}

function updateWeatherRadarTable(data) {
  weatherRadarTable.setData({
    headers: ['Intensity', 'Bearing', 'Distance (nm)'],
    data: data.weatherCells.map(cell => [
      cell.intensity,
      `${cell.bearing}°`,
      cell.distance
    ])
  });
  screen.render();
}

function updateADSBTable(data) {
  adsbTable.setData({
    headers: ['ICAO', 'Position', 'Altitude', 'Speed'],
    data: data.traffic.map(ac => [
      ac.icao,
      `${ac.position.latitude.toFixed(4)}°, ${ac.position.longitude.toFixed(4)}°`,
      `${ac.altitude} ft`,
      `${ac.speed} knots`
    ])
  });
  screen.render();
}

function updateEGPWSTable(data) {
  egpwsTable.setData({
    headers: ['Key', 'Value'],
    data: [
      ['Terrain Ahead', data.terrainAhead ? 'WARNING' : 'Clear'],
      ['Min Terrain Clearance', `${data.minimumTerrainClearance} ft`],
      ['Warnings', data.warnings.join(', ')]
    ]
  });
  screen.render();
}

function updateAltitudeChart(altitude) {
  altitudeData.shift();
  altitudeData.push(altitude);
  altitudeChart.setData([{ title: 'Altitude', x: Array(30).fill('').map((_, i) => i.toString()), y: altitudeData }]);
  screen.render();
}

function updateSpeedChart(speed) {
  speedData.shift();
  speedData.push(speed);
  speedChart.setData([{ title: 'Speed', x: Array(30).fill('').map((_, i) => i.toString()), y: speedData }]);
  screen.render();
}

function updateFuelChart(fuel) {
  fuelData.shift();
  fuelData.push(fuel);
  fuelChart.setData([{ title: 'Fuel', x: Array(30).fill('').map((_, i) => i.toString()), y: fuelData }]);
  screen.render();
}

// Quit on 'q' or Ctrl+C
screen.key(['q', 'C-c'], function() {
  return process.exit(0);
});

console.log(`${colors.fg.green}${colors.bright}Starting Flightdeck Console Simulation...${colors.reset}`);
screen.render();
