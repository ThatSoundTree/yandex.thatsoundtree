require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL;
const OAUTH_URL = process.env.OAUTH_URL;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml',
};

const serveStaticFile = (filePath, res) => {
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (pathname === '/api/config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ backendUrl: BACKEND_URL, oauthUrl: OAUTH_URL }));
    return;
  }

  if (pathname === '/api/backend' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const backendPath = data.path || '/';
        const backendUrlParsed = url.parse(BACKEND_URL);
        
        const fullPath = backendPath.startsWith('/') 
          ? backendPath 
          : (backendUrlParsed.pathname || '/') + backendPath;
        
        const backendReq = http.request({
          hostname: backendUrlParsed.hostname,
          port: backendUrlParsed.port || 80,
          path: fullPath,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...data.headers
          }
        }, (backendRes) => {
          let backendBody = '';
          backendRes.on('data', chunk => {
            backendBody += chunk.toString();
          });
          backendRes.on('end', () => {
            res.writeHead(backendRes.statusCode, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(backendBody);
          });
        });
        
        backendReq.on('error', (error) => {
          res.writeHead(500, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ 
            error: 'Backend request failed', 
            message: error.message 
          }));
        });
        
        backendReq.write(JSON.stringify(data.body || {}));
        backendReq.end();
      } catch (error) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: 'Invalid request body' }));
      }
    });
    return;
  }

  let filePath = pathname;
  
  const distPath = path.join(__dirname, 'dist', filePath);
  const srcPath = path.join(__dirname, 'src', filePath);
  
  if (fs.existsSync(distPath) && fs.statSync(distPath).isFile()) {
    serveStaticFile(distPath, res);
  } else if (fs.existsSync(srcPath) && fs.statSync(srcPath).isFile()) {
    serveStaticFile(srcPath, res);
  } else {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      serveStaticFile(indexPath, res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }
});

server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log(`Backend URL: ${BACKEND_URL || 'not set'}`);
  console.log(`OAuth URL: ${OAUTH_URL || 'not set'}`);
});
