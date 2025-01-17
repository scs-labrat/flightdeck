// Advanced Flightdeck Network Simulation

const WebSocket = require('ws');
const { EventEmitter } = require('events');

// Enum for Aircraft Systems
const AircraftSystem = Object.freeze({
  FMS: 'FMS',
  EFIS: 'EFIS',
  EICAS: 'EICAS',
  TCAS: 'TCAS',
  WEATHER_RADAR: 'Weather Radar',
  ILS: 'ILS',
  VHF_COMMS: 'VHF Comms',
  HF_COMMS: 'HF Comms',
  SATCOM: 'SATCOM',
  ACARS: 'ACARS',
  ADS_B: 'ADS-B',
  TRANSPONDER: 'Transponder',
  EGPWS: 'EGPWS'
});

// Define ports for each system
const systems = {
  [AircraftSystem.FMS]: 10000,
  [AircraftSystem.EFIS]: 10001,
  [AircraftSystem.EICAS]: 10002,
  [AircraftSystem.TCAS]: 10003,
  [AircraftSystem.WEATHER_RADAR]: 10004,
  [AircraftSystem.ILS]: 10005,
  [AircraftSystem.VHF_COMMS]: 10006,
  [AircraftSystem.HF_COMMS]: 10007,
  [AircraftSystem.SATCOM]: 10008,
  [AircraftSystem.ACARS]: 10009,
  [AircraftSystem.ADS_B]: 10010,
  [AircraftSystem.TRANSPONDER]: 10011,
  [AircraftSystem.EGPWS]: 10012
};

// Create WebSocket servers for each system
const systemServers = {};
Object.entries(systems).forEach(([system, port]) => {
  systemServers[system] = new WebSocket.Server({ port });
  console.log(`${system} WebSocket server started on ws://localhost:${port}`);
});

// Simulated nearby aircraft
const nearbyAircraft = [];

// Event emitter for inter-system communication
const systemBus = new EventEmitter();

// Utility function to generate a random number within a range
function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

// Generate realistic flight data for nearby aircraft
function initializeNearbyAircraft() {
  const airlines = ['DAL', 'UAL', 'AAL', 'SWA', 'JBU', 'FDX', 'UPS'];
  for (let i = 0; i < 10; i++) {
    nearbyAircraft.push({
      callsign: `${airlines[Math.floor(Math.random() * airlines.length)]}${1000 + Math.floor(Math.random() * 9000)}`,
      type: ['B737', 'A320', 'E175', 'CRJ9', 'B787', 'A350'][Math.floor(Math.random() * 6)],
      position: {
        latitude: getRandomNumber(39, 41),
        longitude: getRandomNumber(-75, -73)
      },
      altitude: Math.floor(getRandomNumber(20000, 40000)),
      speed: Math.floor(getRandomNumber(400, 500)),
      heading: Math.floor(getRandomNumber(0, 360)),
      verticalSpeed: Math.floor(getRandomNumber(-1000, 1000))
    });
  }
}

function updateNearbyAircraft() {
  nearbyAircraft.forEach(aircraft => {
    // Update position based on speed and heading
    const distance = aircraft.speed * 0.000277778; // Convert knots to degrees per second
    aircraft.position.latitude += distance * Math.cos(aircraft.heading * Math.PI / 180);
    aircraft.position.longitude += distance * Math.sin(aircraft.heading * Math.PI / 180);
    
    // Update altitude
    aircraft.altitude += aircraft.verticalSpeed / 60;
    
    // Randomly change heading and vertical speed occasionally
    if (Math.random() < 0.05) {
      aircraft.heading = (aircraft.heading + Math.floor(getRandomNumber(-10, 10)) + 360) % 360;
    }
    if (Math.random() < 0.05) {
      aircraft.verticalSpeed = Math.floor(getRandomNumber(-2000, 2000));
    }
  });
}

// Generate system-specific data
function generateSystemData(system) {
  switch (system) {
    case AircraftSystem.FMS:
      return {
        flightPlan: {
          origin: 'KJFK',
          destination: 'KLAX',
          waypoints: ['GREKI', 'ALCOV', 'MAJIC', 'KARRS']
        },
        estimatedFuelRemaining: Math.floor(getRandomNumber(15000, 25000))
      };
    case AircraftSystem.EFIS:
      return {
        attitudeIndicator: {
          pitch: getRandomNumber(-5, 5),
          roll: getRandomNumber(-10, 10)
        },
        altimeter: Math.floor(getRandomNumber(30000, 35000)),
        airspeed: Math.floor(getRandomNumber(450, 500))
      };
    case AircraftSystem.EICAS:
      return {
        engineParameters: {
          n1: Math.floor(getRandomNumber(90, 100)),
          egt: Math.floor(getRandomNumber(700, 800)),
          fuelFlow: Math.floor(getRandomNumber(3000, 4000))
        },
        hydraulicPressure: Math.floor(getRandomNumber(2500, 3000))
      };
    case AircraftSystem.TCAS:
      return {
        nearbyAircraft: nearbyAircraft.map(aircraft => ({
          callsign: aircraft.callsign,
          relativeAltitude: aircraft.altitude - 35000,
          range: Math.floor(getRandomNumber(5, 15))
        }))
      };
    case AircraftSystem.WEATHER_RADAR:
      return {
        weatherCells: Array(3).fill().map(() => ({
          intensity: ['Light', 'Moderate', 'Severe'][Math.floor(Math.random() * 3)],
          bearing: Math.floor(getRandomNumber(0, 360)),
          distance: Math.floor(getRandomNumber(10, 60))
        }))
      };
    case AircraftSystem.ILS:
      return {
        localizer: getRandomNumber(-1, 1),
        glideslope: getRandomNumber(-1, 1),
        outerMarker: Math.random() < 0.1
      };
    case AircraftSystem.VHF_COMMS:
      return {
        activeFrequency: getRandomNumber(118, 136).toFixed(3),
        signalStrength: Math.floor(getRandomNumber(1, 6))
      };
    case AircraftSystem.HF_COMMS:
      return {
        activeFrequency: getRandomNumber(2, 30).toFixed(3),
        signalQuality: ['Poor', 'Fair', 'Good', 'Excellent'][Math.floor(Math.random() * 4)]
      };
    case AircraftSystem.SATCOM:
      return {
        connectionStatus: Math.random() < 0.9 ? 'Connected' : 'Searching',
        signalStrength: Math.floor(getRandomNumber(0, 100))
      };
    case AircraftSystem.ACARS:
      return {
        messages: [
          { type: 'OOOI', event: 'Out', time: new Date().toISOString() },
          { type: 'Weather', request: 'METAR KLAX' }
        ]
      };
    case AircraftSystem.ADS_B:
      return {
        ownship: {
          position: {
            latitude: getRandomNumber(40.5913111, 40.6913111),
            longitude: getRandomNumber(-73.8281391, -73.7281391)
          },
          altitude: Math.floor(getRandomNumber(30000, 35000)),
          speed: Math.floor(getRandomNumber(450, 500))
        },
        traffic: nearbyAircraft.slice(0, 5).map(aircraft => ({
          icao: 'A' + Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0'),
          position: aircraft.position,
          altitude: aircraft.altitude,
          speed: aircraft.speed
        }))
      };
    case AircraftSystem.TRANSPONDER:
      return {
        mode: 'Mode S',
        code: Math.floor(Math.random() * 7777).toString().padStart(4, '0'),
        ident: Math.random() < 0.05
      };
    case AircraftSystem.EGPWS:
      return {
        terrainAhead: Math.random() < 0.05,
        minimumTerrainClearance: Math.floor(getRandomNumber(500, 1500)),
        warnings: Math.random() < 0.02 ? ['TERRAIN AHEAD, PULL UP'] : []
      };
    default:
      return { status: 'Normal operation' };
  }
}

// Broadcast data for a specific system
function broadcastSystemData(system) {
  const data = {
    timestamp: new Date().toISOString(),
    system,
    data: generateSystemData(system)
  };
  
  systemServers[system].clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
  
  // Emit event for inter-system communication
  systemBus.emit('data', data);
  
  console.log(`${system} data sent:`, JSON.stringify(data));
}

// Start the flight deck network simulation
function startFlightdeckNetworkSimulation() {
  initializeNearbyAircraft();
  
  Object.keys(systems).forEach(system => {
    setInterval(() => broadcastSystemData(system), 1000);
  });
  
  setInterval(updateNearbyAircraft, 1000);
}

// Inter-system communication examples
systemBus.on('data', (data) => {
  if (data.system === AircraftSystem.TCAS && data.data.nearbyAircraft.some(ac => ac.relativeAltitude < 1000 && ac.range < 5)) {
    console.log('TCAS RA event triggered');
    broadcastSystemData(AircraftSystem.EFIS); // Trigger EFIS update for TCAS display
  }
  
  if (data.system === AircraftSystem.EGPWS && data.data.warnings.length > 0) {
    console.log('EGPWS Warning event triggered');
    broadcastSystemData(AircraftSystem.EICAS); // Trigger EICAS update for warning display
  }
});

// Start the simulation
console.log('Starting Advanced Flightdeck Network Simulation');
startFlightdeckNetworkSimulation();

