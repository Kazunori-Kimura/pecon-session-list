const express = require('express');
const excel = require("exceljs");
const path = require("path");

const router = express.Router();

// 現在のセッション
var currentId = -1;
// sessionファイル
const file = path.resolve(__dirname, "../session.xlsx");

/**
 * 認証
 */
router.post('/auth', function(req, res, next) {
  if (req.body.username !== "admin" || req.body.password !== "password") {
    const err = new Error("Unauthorized");
    err.status = 401;
    return next(err);
  }
  res.status(200).send('OK');
});

/**
 * データ全件返す
 */
router.get('/sessions', function(req, res, next) {
  const promise = readXlsx(file);
  promise.then((data) => {
    res.send(data);
  });
});

/**
 * 現在のセッションを返す
 */
router.get('/session/current', function(req, res, next) {
  res.send({ currentId });
});

/**
 * 現在のセッションのIDを更新
 */
router.put('/session/current', function(req, res, next) {
  console.log(`current-id=${req.body.currentId}`);
  if (req.body.currentId > 0) {
    currentId = req.body.currentId;
    res.status(200).send('OK');
  } else {
    // currentId が 0未満
    const err = new Error("Unprocessable Entity");
    err.status = 422;
    return next(err);
  }
});

/**
 * excelファイルを読み込む
 */
function readXlsx(file) {
  const MAX_ROW = 4;
  const MAX_COL = 4;
  
  return new Promise((resolve, reject) => {
    // データ
    const data = [];
    // xlsx読み込み
    const workbook = new excel.Workbook();
    workbook.xlsx.readFile(file).then(() => {
      const sheet = workbook.getWorksheet(1);
      
      for (let i=1; i<=MAX_ROW; i++) {
        const row = [];
        for (let j=1; j<=MAX_COL; j++) {
          row.push(sheet.getCell(i, j).value);
        }
        data.push(row);
      }

      resolve(data);
    });
  });
}

module.exports = router;
