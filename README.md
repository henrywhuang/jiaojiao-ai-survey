# 叫叫儿童AI课 · 用户意向调研

一个移动端调研页面：内联配图、Q6 双方案对比图卡、预售订阅提醒、10 题 + 开放题，提交后以**表格**形式查看结果。

## 在线访问（GitHub Pages）

- 问卷页：`https://<用户名>.github.io/<仓库名>/`
- 结果表格页：`https://<用户名>.github.io/<仓库名>/results.html`

## 文件说明

| 文件 | 作用 |
|---|---|
| `index.html` | 调研问卷页（移动端，自带配图与预售订阅） |
| `results.html` | 结果表格页：表格汇总 + 一键导出 CSV |
| `apps-script.gs` | 可选：Google 表格收集端，用于多设备真实收集 |
| `server.js` | 可选：本地 Node 后端（非 Pages 用，本地预览/自建服务器时用） |

## 数据怎么收集？两种模式

GitHub Pages 是纯静态托管，没有自带后端。提交逻辑在 `index.html` 顶部 `CONFIG` 控制：

### 模式一（默认，零配置）：本浏览器收集
`CONFIG.ENDPOINT` 留空时，提交暂存到浏览器 `localStorage`，在 `results.html` 查看表格、导出 CSV。
适合本地预览、单机/单设备收集。换设备或清缓存数据不互通。

### 模式二（推荐，跨设备真实收集）：写入 Google 表格
1. 新建一个 Google 表格 → 菜单「扩展程序 → Apps Script」。
2. 把 `apps-script.gs` 整段粘贴进去保存。
3. 「部署 → 新建部署」→ 类型「Web 应用」→ 执行身份「我」、访问权限「任何人」→ 复制 Web 应用 URL。
4. 把该 URL 填到 `index.html` 的 `CONFIG.ENDPOINT`，重新提交即逐行写入表格。
   结果就是一张可随时查看/筛选/导出的 Google 表格。

## 本地预览（可选）

```bash
node server.js   # 访问 http://localhost:3000/ ，后台 /admin ，导出 /api/export.csv
```
