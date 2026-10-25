const http = require('http');
const fs = require('fs');
const path = require('path');
const dbEngine = require('./database');

const PORT = 3000;

// Hard verification register for instant matching
const VALID_KEYS = {
  'ggr_live_prod_abc123': { company: 'Beta Client Inc', status: 'active' },
  'ggr_test_dev_456': { company: 'Internal Sandbox', status: 'active' }
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Endpoint 1: SDK clients POST data here. Intercepted by our security gate.
  if (req.url === '/v1/telemetry' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const packet = JSON.parse(body);
        const ts = packet.timestamp || Date.now();
        
        // 🛡️ SECURITY SHIELD: Check if the key exists in our register
        const account = VALID_KEYS[packet.apiKey];

        if (!account) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized: Invalid API key.' }));
          console.log(`🚫 [BLOCKED] Dropped unauthenticated payload using bad key: "${packet.apiKey}"`);
          return;
        }

        // Check if account has been put on hold
        if (account.status === 'suspended') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Forbidden: Account suspended.' }));
          return;
        }

        // If authorized, route data straight into SQLite tables
        if (packet.type === 'metric') {
          dbEngine.insertMetric(packet.appId, packet.name, packet.value, ts);
          console.log(`💾 [DB SAVED] Metric via ${account.company}: ${packet.name} -> ${packet.value}`);
        } else if (packet.type === 'log') {
          dbEngine.insertLog(packet.appId, packet.level, packet.message, ts);
          console.log(`💾 [DB SAVED] Log via ${account.company}: [${packet.level.toUpperCase()}] ${packet.message}`);
        } else if (packet.type === 'trace') {
          dbEngine.insertTrace(packet.appId, packet.operationName, packet.durationMs, ts);
          dbEngine.insertMetric(packet.appId, packet.operationName, packet.durationMs, ts);
          console.log(`💾 [DB SAVED] Trace via ${account.company}: ${packet.operationName} -> ${packet.durationMs}ms`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'saved_to_disk' }));

      } catch (e) {
        res.writeHead(400);
        res.end('Invalid Payload');
      }
    });
    return;
  }

  // Endpoint 2: Frontend polls this for updates
  if (req.url === '/api/live' && req.method === 'GET') {
    dbEngine.getLatestMetric((value) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ value: value }));
    });
    return;
  }

  // Serve static UI layout assets
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
    } else {
      let contentType = 'text/html';
      if (filePath.endsWith('.js')) contentType = 'text/javascript';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n⚙️  ======================================================`);
  console.log(`🛰️  GGR Security-Enhanced Ingestion Active on Port ${PORT}`);
  console.log(`🔒 Active Safe-List Keys: ggr_live_prod_abc123`);
  console.log(`⚙️  ======================================================\n`);
});
