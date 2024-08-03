// server.js

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

// Simulated aircraft systems
const systems = [
  'FMS', 'EFIS', 'EICAS', 'TCAS', 'Weather Radar', 'ILS', 'VHF Comms',
  'HF Comms', 'SATCOM', 'ACARS', 'ADS-B', 'Transponder', 'EGPWS'
];

// Simulated data types
const dataTypes = [
  'position', 'altitude', 'speed', 'heading', 'fuel', 'temperature',
  'pressure', 'wind', 'system_status', 'warning', 'alert'
];

// Simulated actions
const actions = [
  'update', 'request', 'response', 'broadcast', 'acknowledge'
];

function generateRandomIP() {
  return `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

function generateRandomMAC() {
  return 'XX:XX:XX:XX:XX:XX'.replace(/X/g, () => {
    return '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16));
  });
}

function generateTrafficData() {
  const sourceSystem = systems[Math.floor(Math.random() * systems.length)];
  const destinationSystem = systems[Math.floor(Math.random() * systems.length)];
  const dataType = dataTypes[Math.floor(Math.random() * dataTypes.length)];
  const action = actions[Math.floor(Math.random() * actions.length)];

  const data = {
    timestamp: new Date().toISOString(),
    sourceIP: generateRandomIP(),
    sourceMAC: generateRandomMAC(),
    destinationIP: generateRandomIP(),
    destinationMAC: generateRandomMAC(),
    sourceSystem,
    destinationSystem,
    dataType,
    action,
    payload: generatePayload(dataType, action)
  };

  return data;
}

function generatePayload(dataType, action) {
  switch (dataType) {
    case 'position':
      return {
        latitude: (Math.random() * 180 - 90).toFixed(6),
        longitude: (Math.random() * 360 - 180).toFixed(6)
      };
    case 'altitude':
      return { value: Math.floor(Math.random() * 40000 + 1000), unit: 'ft' };
    case 'speed':
      return { value: Math.floor(Math.random() * 500 + 100), unit: 'knots' };
    case 'heading':
      return { value: Math.floor(Math.random() * 360), unit: 'degrees' };
    case 'fuel':
      return { value: Math.floor(Math.random() * 20000 + 5000), unit: 'kg' };
    case 'temperature':
      return { value: (Math.random() * 100 - 50).toFixed(1), unit: 'C' };
    case 'pressure':
      return { value: (Math.random() * 10 + 1000).toFixed(2), unit: 'hPa' };
    case 'wind':
      return {
        direction: Math.floor(Math.random() * 360),
        speed: Math.floor(Math.random() * 100)
      };
    case 'system_status':
      return { status: ['OK', 'WARNING', 'ERROR'][Math.floor(Math.random() * 3)] };
    case 'warning':
    case 'alert':
      return { message: `Simulated ${dataType} for ${action}` };
    default:
      return { value: 'Simulated data' };
  }
}

function startFlightdeckNetworkSimulation() {
  setInterval(() => {
    const trafficData = generateTrafficData();
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(trafficData));
      }
    });
    console.log('Sent:', trafficData);
  }, 1000); // Generate traffic every second
}

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

console.log('WebSocket server started on ws://localhost:8080');
startFlightdeckNetworkSimulation();
