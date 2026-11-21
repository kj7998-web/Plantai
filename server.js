const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

let folders = [{ id: '1', name: 'Existing Plants' }];

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*'
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost:' + PORT);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  if (url.pathname === '/api/folders' && req.method === 'GET') {
    return sendJson(res, 200, { folders });
  }

  if (url.pathname === '/api/folders' && req.method === 'POST') {
    let raw = '';
    req.on('data', c => raw += c);
    req.on('end', () => {
      const { name } = JSON.parse(raw || '{}');
      const folder = { id: String(Date.now()), name: name || 'Untitled' };
      folders.push(folder);
      sendJson(res, 201, { folder });
    });
    return;
  }

  const match = url.pathname.match(/^\/api\/folders\/([^/]+)$/);
  if (match && req.method === 'PATCH') {
    let raw = '';
    req.on('data', c => raw += c);
    req.on('end', () => {
      const { name } = JSON.parse(raw || '{}');
      const folder = folders.find(f => f.id === match[1]);
      if (!folder) return sendJson(res, 404, { error: 'Not found' });
      folder.name = name;
      sendJson(res, 200, { folder });
    });
    return;
  }

  if (match && req.method === 'DELETE') {
    folders = folders.filter(f => f.id !== match[1]);
    return sendJson(res, 200, { deleted: true, id: match[1] });
  }

  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Length': Buffer.byteLength(html)
  });
  res.end(html);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Folder Manager API running at http://localhost:' + PORT + '/');
});
