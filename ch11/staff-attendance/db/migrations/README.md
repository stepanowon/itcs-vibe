# DB 마이그레이션

SQL 마이그레이션 파일은 `NNNN_설명.sql` 형식의 4자리 순번 파일명으로 관리하며, 파일명 순서대로 순차 적용한다(재실행 가능하도록 `IF NOT EXISTS`/`CREATE OR REPLACE` 사용).

DB 접속 정보(`DATABASE_URL`)는 로컬/개발/운영 환경별로 `backend/.env`에서 환경변수로 분리해 참조한다(저장소에는 `.env.example`만 커밋).
