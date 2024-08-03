// Flightdeck Console Simulation with Optimized WebSocket Throughput

const WebSocket = require('ws');
const blessed = require('blessed');
const contrib = require('blessed-contrib');
const zlib = require('zlib');

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
  connections[system] = new WebSocket(`ws://localhost:${port}`, { perMessageDeflate: true });
  
  connections[system].on('open', () => {
    console.log(`${colors.fg.green}Connected to ${system} on port ${port}${colors.reset}`);
  });
  
  connections[system].on('message', (compressedData) => {
    zlib.inflate(compressedData, (err, rawData) => {
      if (err) {
        console.error('Failed to decompress incoming data:', err);
        return;
      }
      try {
        const data = JSON.parse(rawData.toString());
        console.log(`Received data for ${system}:`, data); // Log incoming data
        handleSystemData(system, data);
      } catch (parseError) {
        console.error('Failed to parse incoming data:', parseError);
      }
    });
  });
  
  connections[system].on('error', (error) => {
    console.error(`${colors.fg.red}Error in ${system} connection:${colors.reset}`, error);
  });

  connections[system].on('close', () => {
    console.log(`${colors.fg.yellow}Disconnected from ${system}${colors.reset}`);
  });
});

// Throttle function to limit the frequency of updates
function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function (...args) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

// Handle incoming system data
const handleSystemData = throttle((system, data) => {
  if (!data || typeof data !== 'object') {
    console.error('Received invalid data structure');
    return;
  }
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
    case 'ADS-B':  // Correct function call
      updateADSBTable(data.data); // Corrected function call
      break;
    case 'EGPWS':
      updateEGPWSTable(data.data);
      break;
    default:
      console.log(`${colors.fg.yellow}${system} data:${colors.reset}`, data);
  }
}, 500); // Throttle updates to every 500 ms

function updateFMSTable(data) {
  if (!data || !data.flightPlan) {
    console.error('Invalid FMS data');
    return;
  }

  fmsTable.setData({
    headers: ['Key', 'Value'],
    data: [
      ['Flight Plan', `${data.flightPlan.origin || 'N/A'} → ${data.flightPlan.destination || 'N/A'}`],
      ['Waypoints', Array.isArray(data.flightPlan.waypoints) ? data.flightPlan.waypoints.join(' → ') : 'N/A'],
      ['Fuel Remaining', `${data.estimatedFuelRemaining || 0} kg`]
    ]
  });
  screen.render();
}

function updateEFISTable(data) {
  if (!data || !data.attitudeIndicator || !data.altimeter || !data.airspeed) {
    console.error('Invalid EFIS data');
    return;
  }

  efisTable.setData({
    headers: ['Key', 'Pitch', 'Roll'],
    data: [
      ['Attitude', `${(data.attitudeIndicator.pitch || 0).toFixed(1)}°`, `${(data.attitudeIndicator.roll || 0).toFixed(1)}°`],
      ['Altitude', `${data.altimeter || 0} ft`, ''],
      ['Airspeed', `${data.airspeed || 0} knots`, '']
    ]
  });
  screen.render();
}

function updateEICASTable(data) {
  if (!data || !data.engineParameters || !data.hydraulicPressure) {
    console.error('Invalid EICAS data');
    return;
  }

  eicasTable.setData({
    headers: ['Key', 'Value', 'Unit'],
    data: [
      ['N1', `${data.engineParameters.n1 || 0}%`, ''],
      ['EGT', `${data.engineParameters.egt || 0}°C`, ''],
      ['Fuel Flow', `${data.engineParameters.fuelFlow || 0} kg/h`, ''],
      ['Hydraulic Pressure', `${data.hydraulicPressure || 0} psi`, '']
    ]
  });
  screen.render();
}

function updateTCASTable(data) {
  if (!data || !Array.isArray(data.nearbyAircraft)) {
    console.error('Invalid TCAS data');
    return;
  }

  tcasTable.setData({
    headers: ['Callsign', 'Relative Altitude', 'Range (nm)'],
    data: data.nearbyAircraft.map(ac => [
      ac.callsign || 'N/A',
      `${ac.relativeAltitude || 0} ft`,
      ac.range || 'N/A'
    ])
  });
  screen.render();
}

function updateWeatherRadarTable(data) {
  if (!data || !Array.isArray(data.weatherCells)) {
    console.error('Invalid Weather Radar data');
    return;
  }

  weatherRadarTable.setData({
    headers: ['Intensity', 'Bearing', 'Distance (nm)'],
    data: data.weatherCells.map(cell => [
      cell.intensity || 'N/A',
      `${cell.bearing || 0}°`,
      cell.distance || 'N/A'
    ])
  });
  screen.render();
}

function updateADSBTable(data) {  // Corrected function name
  if (!data || !Array.isArray(data.traffic)) {
    console.error('Invalid ADS-B data received');
    return;
  }

  adsbTable.setData({
    headers: ['ICAO', 'Position', 'Altitude', 'Speed'],
    data: data.traffic.map(ac => [
      ac.icao || 'N/A',
      `${(ac.position?.latitude || 0).toFixed(4)}°, ${(ac.position?.longitude || 0).toFixed(4)}°`,
      `${ac.altitude || 0} ft`,
      `${ac.speed || 0} knots`
    ])
  });
  screen.render();
}

function updateEGPWSTable(data) {
  if (!data || !('terrainAhead' in data) || !('minimumTerrainClearance' in data) || !Array.isArray(data.warnings)) {
    console.error('Invalid EGPWS data');
    return;
  }

  egpwsTable.setData({
    headers: ['Key', 'Value'],
    data: [
      ['Terrain Ahead', data.terrainAhead ? 'WARNING' : 'Clear'],
      ['Min Terrain Clearance', `${data.minimumTerrainClearance || 0} ft`],
      ['Warnings', data.warnings.length > 0 ? data.warnings.join(', ') : 'None']
    ]
  });
  screen.render();
}

function updateAltitudeChart(altitude) {
  altitudeData.shift();
  altitudeData.push(altitude || 0);
  altitudeChart.setData([{ title: 'Altitude', x: Array(30).fill('').map((_, i) => i.toString()), y: altitudeData }]);
  screen.render();
}

function updateSpeedChart(speed) {
  speedData.shift();
  speedData.push(speed || 0);
  speedChart.setData([{ title: 'Speed', x: Array(30).fill('').map((_, i) => i.toString()), y: speedData }]);
  screen.render();
}

function updateFuelChart(fuel) {
  fuelData.shift();
  fuelData.push(fuel || 0);
  fuelChart.setData([{ title: 'Fuel', x: Array(30).fill('').map((_, i) => i.toString()), y: fuelData }]);
  screen.render();
}

// Quit on 'q' or Ctrl+C
screen.key(['q', 'C-c'], function() {
  return process.exit(0);
});

console.log(`${colors.fg.green}${colors.bright}Starting Flightdeck Console Simulation...${colors.reset}`);
screen.render();
