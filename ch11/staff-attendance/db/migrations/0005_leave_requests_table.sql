-- DB-04: leave_requests 테이블
-- 동일 기간 중복 연차 신청 방지(EXCLUDE 제약)는 1차 버전 범위 밖이므로 추가하지 않는다(4-erd.md 비고).
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES users(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  days numeric(4,1) NOT NULL CHECK (days > 0),
  reason text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  processor_id uuid REFERENCES users(id),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date),
  CHECK (requester_id <> processor_id),
  CHECK (
    (status = 'pending' AND processor_id IS NULL AND processed_at IS NULL)
    OR (status IN ('approved', 'rejected') AND processor_id IS NOT NULL AND processed_at IS NOT NULL)
  )
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
