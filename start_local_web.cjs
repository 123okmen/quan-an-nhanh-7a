const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

console.log('============================================================');
console.log('🍔 FOOD STATION 7A - CƠM CHIÊN · MÌ XÀO · BÁNH BAO KẸP');
console.log('📍 Địa chỉ: Số 2, Đường 7A, KP. Phước Thiện, P. Long Bình, TP. Thủ Đức');
console.log('============================================================');

const distDir = path.join(__dirname, 'dist');

if (!fs.existsSync(distDir)) {
  console.log('Đang biên dịch mã nguồn...');
  try {
    execSync('npm.cmd run build', { cwd: __dirname, stdio: 'inherit' });
  } catch (err) {
    console.error('Build error:', err.message);
  }
}

const mimeTypes = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'bluetooth=(self), camera=(self), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin'
};

const resolvedDistDir = path.resolve(distDir);

const server = http.createServer((req, res) => {
  let reqUrl = '/';
  try {
    reqUrl = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch {
    res.writeHead(400, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=UTF-8' });
    return res.end('400 Bad Request');
  }
  if (reqUrl.includes('\0')) {
    res.writeHead(400, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=UTF-8' });
    return res.end('400 Bad Request');
  }

  let filePath = path.resolve(resolvedDistDir, '.' + (reqUrl.startsWith('/') ? reqUrl : '/' + reqUrl));

  if (filePath !== path.join(resolvedDistDir, 'index.html') && !filePath.startsWith(resolvedDistDir + path.sep)) {
    res.writeHead(403, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=UTF-8' });
    return res.end('403 Forbidden');
  }

  if (reqUrl === '/' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(resolvedDistDir, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': contentType });
      res.end(content);
    }
  });
});

function listen(port) {
  server.listen(port, () => {
    const targetUrl = `http://localhost:${port}/#/order`;
    console.log(`\n✅ WEB APP QUÁN ĂN NHANH ĐANG CHẠY TẠI: ${targetUrl}`);
    console.log(`📋 Xem Kế Hoạch Setup & Vận Hành tại: http://localhost:${port}/#/plan\n`);
    if (process.env.AUTO_OPEN !== '0') {
      const startCmd = process.platform === 'win32' ? 'start' : 'open';
      exec(`${startCmd} ${targetUrl}`);
    }
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      listen(port + 1);
    } else {
      console.error('Server error:', err.message);
    }
  });
}

listen(3080);
