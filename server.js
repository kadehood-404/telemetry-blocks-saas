const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
let latestMetric = 0; // Stores the latest client telemetry data point

const server = http.createServer((req, res) => {
  // Allow any external client to send telemetry data to us (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

    // Endpoint 1: Real SDK clients POST their structured telemetry data here
  if (req.url === '/v1/telemetry' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const packet = JSON.parse(body);
        const ts = packet.timestamp || Date.now();
        
        // SECURITY CHECK: Intercept packet and query SQLite accounts table
        dbEngine.verifyApiKey(packet.apiKey, (auth) => {
          if (!auth.valid) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Invalid or missing API key.' }));
            console.log(`🚫 [BLOCKED] Dropped unauthenticated payload trying to use key: ${packet.apiKey}`);
            return;
          }
          
          if (auth.status === 'suspended') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Forbidden: This account has been suspended for unpaid billing.' }));
            return;
          }

          // If authorized, parse and save the telemetry data
          if (packet.type === 'metric') {
            dbEngine.insertMetric(packet.appId, packet.name, packet.value, ts);
            console.log(`💾 [DB SAVED] Metric: ${packet.name} -> ${packet.value}`);
          } else if (packet.type === 'log') {
            dbEngine.insertLog(packet.appId, packet.level, packet.message, ts);
            console.log(`💾 [DB SAVED] Log: [${packet.level.toUpperCase()}] ${packet.message}`);
          } else if (packet.type === 'trace') {
            dbEngine.insertTrace(packet.appId, packet.operationName, packet.durationMs, ts);
            dbEngine.insertMetric(packet.appId, packet.operationName, packet.durationMs, ts);
            console.log(`💾 [DB SAVED] Trace: ${packet.operationName} -> ${packet.durationMs}ms`);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'saved_to_disk' }));
        });

      } catch (e) {
        res.writeHead(400);
        res.end('Invalid Payload');
      }
    });
    return;
  }

  // Endpoint 2: The frontend UI polls this to get the latest metric
  if (req.url === '/api/live' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ value: latestMetric }));
    return;
  }

  // Serve static UI files (index.html, telemetry-card.js, etc.)
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
  console.log(`🛰️  Real Telemetry System Active at http://localhost:${PORT}`);
  console.log(`👉 Open http://localhost:${PORT} in your browser to view your live dashboard!`);
});
