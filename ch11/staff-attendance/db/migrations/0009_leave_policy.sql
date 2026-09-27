-- 공통 연차일수 정책: 전사 공통 기본 연차일수(단일 행). 각 직원의 총 연차일수는
-- 입사연도 기준으로 자동 계산된다: 해당연도 입사자는 0일, 전년도 입사자는 base_days,
-- 그 이전 입사자는 base_days+(지난 햇수-1)(백엔드 leaveAccrual 유틸 참고).
CREATE TABLE IF NOT EXISTS leave_policy (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  base_days numeric(4,1) NOT NULL DEFAULT 0 CHECK (base_days >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON leave_policy
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO leave_policy (id, base_days) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;
