const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// db.json 파일을 데이터 저장소로 사용 (파일 기반 JSON DB)
const adapter = new FileSync(path.join(__dirname, 'db.json'));
const db = low(adapter);

// db.json이 비어있을 때만 채워질 초기 데이터
db.defaults({
  todos: [
    { id: 1, title: 'HTTP 요청/응답 구조 학습하기', done: false },
    { id: 2, title: '간단한 웹서버 만들어보기', done: true },
  ],
  nextId: 3,
}).write();

module.exports = db;
