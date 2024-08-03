// Advanced Flightdeck Network Simulation

const WebSocket = require('ws');
const { EventEmitter } = require('events');

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

// Generate realistic flight data for nearby aircraft
function initializeNearbyAircraft() {
  const airlines = ['DAL', 'UAL', 'AAL', 'SWA', 'JBU', 'FDX', 'UPS'];
  for (let i = 0; i < 10; i++) {
    nearbyAircraft.push({
      callsign: `${airlines[Math.floor(Math.random() * airlines.length)]}${1000 + Math.floor(Math.random() * 9000)}`,
      type: ['B737', 'A320', 'E175', 'CRJ9', 'B787', 'A350'][Math.floor(Math.random() * 6)],
      position: {
        latitude: 40 + (Math.random() - 0.5) * 2,
        longitude: -74 + (Math.random() - 0.5) * 2
      },
      altitude: Math.floor(Math.random() * 20000 + 20000),
      speed: Math.floor(Math.random() * 100 + 400),
      heading: Math.floor(Math.random() * 360),
      verticalSpeed: Math.floor(Math.random() * 2000 - 1000)
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
      aircraft.heading = (aircraft.heading + Math.floor(Math.random() * 20 - 10) + 360) % 360;
    }
    if (Math.random() < 0.05) {
      aircraft.verticalSpeed = Math.floor(Math.random() * 4000 - 2000);
    }
  });
}

// Generate system-specific data
function generateSystemData(system) {
  switch (system) {
    case 'FMS':
      return {
        flightPlan: {
          origin: 'KJFK',
          destination: 'KLAX',
          waypoints: ['GREKI', 'ALCOV', 'MAJIC', 'KARRS']
        },
        estimatedFuelRemaining: Math.floor(Math.random() * 10000 + 15000)
      };
    case 'EFIS':
      return {
        attitudeIndicator: {
          pitch: (Math.random() - 0.5) * 10,
          roll: (Math.random() - 0.5) * 20
        },
        altimeter: Math.floor(Math.random() * 5000 + 30000),
        airspeed: Math.floor(Math.random() * 50 + 450)
      };
    case 'EICAS':
      return {
        engineParameters: {
          n1: Math.floor(Math.random() * 10 + 90),
          egt: Math.floor(Math.random() * 100 + 700),
          fuelFlow: Math.floor(Math.random() * 1000 + 3000)
        },
        hydraulicPressure: Math.floor(Math.random() * 500 + 2500)
      };
    case 'TCAS':
      return {
        nearbyAircraft: nearbyAircraft.map(aircraft => ({
          callsign: aircraft.callsign,
          relativeAltitude: aircraft.altitude - 35000,
          range: Math.floor(Math.random() * 10 + 5)
        }))
      };
    case 'Weather Radar':
      return {
        weatherCells: Array(3).fill().map(() => ({
          intensity: ['Light', 'Moderate', 'Severe'][Math.floor(Math.random() * 3)],
          bearing: Math.floor(Math.random() * 360),
          distance: Math.floor(Math.random() * 50 + 10)
        }))
      };
    case 'ILS':
      return {
        localizer: (Math.random() - 0.5) * 2,
        glideslope: (Math.random() - 0.5) * 2,
        outerMarker: Math.random() < 0.1
      };
    case 'VHF Comms':
      return {
        activeFrequency: (118 + Math.random() * 18).toFixed(3),
        signalStrength: Math.floor(Math.random() * 5 + 1)
      };
    case 'HF Comms':
      return {
        activeFrequency: (2 + Math.random() * 28).toFixed(3),
        signalQuality: ['Poor', 'Fair', 'Good', 'Excellent'][Math.floor(Math.random() * 4)]
      };
    case 'SATCOM':
      return {
        connectionStatus: Math.random() < 0.9 ? 'Connected' : 'Searching',
        signalStrength: Math.floor(Math.random() * 100)
      };
    case 'ACARS':
      return {
        messages: [
          { type: 'OOOI', event: 'Out', time: new Date().toISOString() },
          { type: 'Weather', request: 'METAR KLAX' }
        ]
      };
    case 'ADS-B':
      return {
        ownship: {
          position: {
            latitude: 40.6413111 + (Math.random() - 0.5) * 0.1,
            longitude: -73.7781391 + (Math.random() - 0.5) * 0.1
          },
          altitude: Math.floor(Math.random() * 5000 + 30000),
          speed: Math.floor(Math.random() * 50 + 450)
        },
        traffic: nearbyAircraft.slice(0, 5).map(aircraft => ({
          icao: 'A' + Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0'),
          position: aircraft.position,
          altitude: aircraft.altitude,
          speed: aircraft.speed
        }))
      };
    case 'Transponder':
      return {
        mode: 'Mode S',
        code: Math.floor(Math.random() * 7777).toString().padStart(4, '0'),
        ident: Math.random() < 0.05
      };
    case 'EGPWS':
      return {
        terrainAhead: Math.random() < 0.05,
        minimumTerrainClearance: Math.floor(Math.random() * 1000 + 500),
        warnings: Math.random() < 0.02 ? ['TERRAIN AHEAD, PULL UP'] : []
      };
    default:
      return { status: 'Normal operation' };
  }
}

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

function startFlightdeckNetworkSimulation() {
  initializeNearbyAircraft();
  
  Object.keys(systems).forEach(system => {
    setInterval(() => broadcastSystemData(system), 1000);
  });
  
  setInterval(updateNearbyAircraft, 1000);
}

// Inter-system communication examples
systemBus.on('data', (data) => {
  if (data.system === 'TCAS' && data.data.nearbyAircraft.some(ac => ac.relativeAltitude < 1000 && ac.range < 5)) {
    console.log('TCAS RA event triggered');
    broadcastSystemData('EFIS'); // Trigger EFIS update for TCAS display
  }
  
  if (data.system === 'EGPWS' && data.data.warnings.length > 0) {
    console.log('EGPWS Warning event triggered');
    broadcastSystemData('EICAS'); // Trigger EICAS update for warning display
  }
});

// Start the simulation
console.log('Starting Advanced Flightdeck Network Simulation');
startFlightdeckNetworkSimulation();

// Example client connection (for testing purposes)
// const exampleClientConnection = new WebSocket('ws://localhost:10000');
// exampleClientConnection.on('message', (data) => {
//   console.log('Received FMS data:', JSON.parse(data));
// });