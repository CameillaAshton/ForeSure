const http = require('http');
const fs = require('fs');
const path = require('path');

// 自动检测项目根目录（兼容开发环境和服务器部署）
const ROOT = __dirname;

const MIME = {
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  ico: 'image/x-icon',
  json: 'application/json'
};

const PORT = process.env.PORT || 7788;

http.createServer((req, res) => {
  // 安全：防止路径穿越攻击
  const safePath = req.url.split('?')[0].replace(/\.\./g, '');
  const filePath = path.join(ROOT, safePath === '/' ? 'index.html' : safePath);

  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': `${contentType};charset=utf-8`,
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(data);
  } catch (e) {
    // 404 时回退到 index.html（SPA 支持）
    if (e.code === 'ENOENT') {
      try {
        const indexData = fs.readFileSync(path.join(ROOT, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
        res.end(indexData);
      } catch (_) {
        res.writeHead(404);
        res.end('Not Found');
      }
    } else {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }
}).listen(PORT, () => {
  console.log(`雀定 已启动 → http://localhost:${PORT}`);
});
