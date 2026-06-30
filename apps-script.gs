/**
 * 叫叫儿童AI课调研 —— Google 表格收集端（Apps Script）
 * 作用：接收问卷页提交，逐行写入当前 Google 表格（结果天然就是一张表）。
 *
 * 部署步骤：
 *  1. 新建一个 Google 表格（Sheet），菜单「扩展程序 → Apps Script」。
 *  2. 把本文件内容整段粘贴进去，保存。
 *  3. 点「部署 → 新建部署」，类型选「Web 应用」，
 *     执行身份=我，谁可以访问=「任何人」，部署后复制 Web 应用 URL。
 *  4. 把该 URL 填到 index.html 的 CONFIG.ENDPOINT，提交即写入表格。
 */
const HEADERS = [
  '提交时间','1.孩子年龄段','2.是否用过AI','3.用AI做过的事','4.最希望获得',
  '5.偏好课程形式','6.产品方案偏好','6-1.7天营·最想做的项目','7.选择原因','8.7天课价格','9.21天课价格',
  '10.购买意向','附加.期待或担心','订阅手机号'
];
const KEYS = ['_time','q1','q2','q3','q4','q5','q6','q6b','q7','q8','q9','q10','q11','_subscribePhone'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    const row = KEYS.map(function (k) {
      var v = data[k];
      if (k === '_time' && !v) v = new Date().toLocaleString('zh-CN');
      return Array.isArray(v) ? v.join('；') : (v == null ? '' : v);
    });
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('叫叫AI课调研收集端运行中');
}
