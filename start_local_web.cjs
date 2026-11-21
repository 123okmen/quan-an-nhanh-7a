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

const server = http.createServer((req, res) => {
  let reqUrl = (req.url || '/').split('?')[0];
  let filePath = path.join(distDir, reqUrl);

  if (reqUrl === '/' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('Server Error: ' + err.code);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
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
