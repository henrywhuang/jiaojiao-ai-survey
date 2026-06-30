/**
 * 叫叫儿童AI课调研 · 轻量后端服务（纯 Node，零依赖）
 * 功能：
 *   GET  /                 → 调研页面 index.html
 *   POST /api/submit       → 接收问卷提交，落盘到 data/submissions.json
 *   GET  /admin            → 结果管理页（表格形式查看所有提交）
 *   GET  /api/data         → 返回全部提交（JSON）
 *   GET  /api/export.csv   → 导出 CSV（Excel 可直接打开）
 *
 * 启动： node server.js   然后访问 http://localhost:3000
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');

/* ===== 题目字段定义（与前端一致，用于表格表头 / CSV 列） ===== */
const FIELDS = [
  ['q1',  '1.孩子年龄段'],
  ['q2',  '2.是否用过AI工具'],
  ['q3',  '3.用AI做过的事'],
  ['q4',  '4.最希望获得'],
  ['q5',  '5.偏好课程形式'],
  ['q6',  '6.产品方案偏好'],
  ['q6b', '6-1.7天营·最想做的项目'],
  ['q7',  '7.选择该形式的原因'],
  ['q8',  '8.7天课可接受价格'],
  ['q9',  '9.21天课可接受价格'],
  ['q10', '10.购买意向'],
  ['q11', '附加.期待或担心'],
  ['_subscribePhone', '订阅手机号'],
];

/* ===== 工具 ===== */
function readAll() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}
function writeAll(arr) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2));
}
function fmtVal(v) {
  if (v == null) return '';
  if (Array.isArray(v)) return v.join('；');
  return String(v);
}
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function send(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*' });
  res.end(body);
}

/* ===== CSV 导出 ===== */
function toCSV(rows) {
  const header = ['提交时间', ...FIELDS.map(f => f[1])];
  const cell = (s) => {
    s = fmtVal(s).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [header.map(cell).join(',')];
  rows.forEach(r => {
    const line = [r._time || '', ...FIELDS.map(f => fmtVal(r[f[0]]))];
    lines.push(line.map(cell).join(','));
  });
  return '﻿' + lines.join('\r\n'); // BOM 保证 Excel 中文不乱码
}

/* ===== 管理后台表格页 ===== */
function adminPage() {
  const rows = readAll().slice().reverse(); // 最新在上
  const total = rows.length;
  const subCount = rows.filter(r => r._subscribePhone).length;

  const ths = ['#', '提交时间', ...FIELDS.map(f => f[1])]
    .map(h => `<th>${esc(h)}</th>`).join('');

  const trs = rows.map((r, i) => {
    const tds = FIELDS.map(f => {
      const v = fmtVal(r[f[0]]);
      const cls = f[0] === '_subscribePhone' && v ? ' class="hl"' : '';
      return `<td${cls}>${esc(v) || '<span class="empty">—</span>'}</td>`;
    }).join('');
    return `<tr><td class="idx">${total - i}</td><td class="time">${esc(r._time||'')}</td>${tds}</tr>`;
  }).join('');

  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>调研结果 · 数据后台</title>
<style>
  :root{--ai:#6C5CE7;--brand:#FF7A33;--ink:#2B2B3A;--soft:#6A6A7C;--line:#ECEAF3;--bg:#F6F5FB}
  *{box-sizing:border-box}
  body{margin:0;font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--ink)}
  header{background:linear-gradient(120deg,#6C5CE7,#8E7BF0 60%,#FF9A5A 150%);color:#fff;padding:22px 26px}
  header h1{margin:0;font-size:20px}
  header .sub{opacity:.9;font-size:13px;margin-top:4px}
  .bar{display:flex;gap:14px;flex-wrap:wrap;align-items:center;padding:16px 26px;background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:5}
  .stat{background:var(--bg);border-radius:12px;padding:8px 16px}
  .stat b{font-size:20px;color:var(--ai)}
  .stat span{font-size:12px;color:var(--soft);margin-left:6px}
  .actions{margin-left:auto;display:flex;gap:10px}
  .btn{border:none;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px}
  .btn.csv{background:var(--brand);color:#fff}
  .btn.refresh{background:#EEEAFB;color:var(--ai)}
  .wrap{padding:18px 26px 60px;overflow-x:auto}
  table{border-collapse:collapse;font-size:12.5px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 6px 20px rgba(46,38,90,.06);min-width:100%}
  th,td{padding:10px 12px;text-align:left;border-bottom:1px solid var(--line);white-space:nowrap;vertical-align:top}
  th{background:#F4F1FF;color:var(--ai);font-weight:700;position:sticky;top:0}
  td{max-width:240px;white-space:normal}
  tr:hover td{background:#FAF9FE}
  td.idx{font-weight:700;color:var(--soft)}
  td.time{color:var(--soft);font-size:11.5px;white-space:nowrap}
  td.hl{color:var(--brand);font-weight:700}
  .empty{color:#CBC9D8}
  .none{padding:60px;text-align:center;color:var(--soft)}
</style></head><body>
<header>
  <h1>叫叫儿童AI课调研 · 数据后台</h1>
  <div class="sub">所有问卷提交以表格形式实时汇总，可一键导出 Excel/CSV</div>
</header>
<div class="bar">
  <div class="stat"><b>${total}</b><span>份有效问卷</span></div>
  <div class="stat"><b>${subCount}</b><span>个早鸟订阅手机号</span></div>
  <div class="actions">
    <a class="btn refresh" href="/admin">↻ 刷新</a>
    <a class="btn csv" href="/api/export.csv">⬇ 导出 CSV</a>
  </div>
</div>
<div class="wrap">
  ${total ? `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`
          : `<div class="none">暂无提交数据，去 <a href="/">填写问卷</a> 试试～</div>`}
</div>
</body></html>`;
}

/* ===== 请求处理 ===== */
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;

  // 提交问卷
  if (p === '/api/submit' && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        data._time = new Date().toLocaleString('zh-CN', { hour12: false });
        data._ua = (req.headers['user-agent'] || '').slice(0, 120);
        const all = readAll();
        all.push(data);
        writeAll(all);
        send(res, 200, 'application/json; charset=utf-8',
          JSON.stringify({ ok: true, total: all.length }));
      } catch (e) {
        send(res, 400, 'application/json; charset=utf-8',
          JSON.stringify({ ok: false, error: 'invalid json' }));
      }
    });
    return;
  }

  // 全量 JSON
  if (p === '/api/data') {
    return send(res, 200, 'application/json; charset=utf-8', JSON.stringify(readAll()));
  }

  // CSV 导出
  if (p === '/api/export.csv') {
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ai_survey_results.csv"',
    });
    return res.end(toCSV(readAll()));
  }

  // 管理后台
  if (p === '/admin') {
    return send(res, 200, 'text/html; charset=utf-8', adminPage());
  }

  // 静态文件（index.html 等）
  let file = p === '/' ? '/index.html' : p;
  const fp = path.join(ROOT, path.normalize(file).replace(/^(\.\.[/\\])+/, ''));
  if (fp.startsWith(ROOT) && fs.existsSync(fp) && fs.statSync(fp).isFile()) {
    const ext = path.extname(fp).toLowerCase();
    const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.json':'application/json' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    return res.end(fs.readFileSync(fp));
  }

  send(res, 404, 'text/plain; charset=utf-8', '404 Not Found');
});

server.listen(PORT, () => {
  console.log(`\n  叫叫AI课调研服务已启动`);
  console.log(`  ▸ 问卷页面：  http://localhost:${PORT}/`);
  console.log(`  ▸ 数据后台：  http://localhost:${PORT}/admin`);
  console.log(`  ▸ CSV 导出：  http://localhost:${PORT}/api/export.csv\n`);
});
