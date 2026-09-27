-- DB-05: leave_balances 테이블
-- 회원가입(BE-06) 시 사용자 1건 생성과 함께 leave_balances 1건이 초기화(total_days=0)되도록 백엔드에서 처리한다.
CREATE TABLE IF NOT EXISTS leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id),
  total_days numeric(4,1) NOT NULL DEFAULT 0 CHECK (total_days >= 0),
  used_days numeric(4,1) NOT NULL DEFAULT 0 CHECK (used_days >= 0),
  remaining_days numeric(4,1) GENERATED ALWAYS AS (total_days - used_days) STORED,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (used_days <= total_days)
);
