-- DB-01: 모든 테이블 공통으로 사용할 updated_at 자동 갱신 트리거 함수
-- 사용법: 각 테이블 마이그레이션에서 아래와 같이 부착
--   CREATE TRIGGER set_updated_at BEFORE UPDATE ON <table>
--     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
