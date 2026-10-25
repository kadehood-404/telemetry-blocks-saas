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

  // Endpoint 1: Real clients POST their telemetry data here
  if (req.url === '/v1/telemetry' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        if (parsed.value !== undefined) {
          latestMetric = Number(parsed.value);
          console.log(`📥 Received live metric from client: ${latestMetric}`);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'acknowledged' }));
      } catch (e) {
        res.writeHead(400);
        res.end('Invalid JSON payload');
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
