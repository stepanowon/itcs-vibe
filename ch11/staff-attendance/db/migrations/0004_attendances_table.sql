-- DB-03: attendances 테이블
CREATE TABLE IF NOT EXISTS attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  work_date date NOT NULL,
  check_in_at timestamptz,
  check_out_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, work_date),
  CHECK (check_out_at IS NULL OR check_in_at IS NOT NULL),
  CHECK (check_out_at IS NULL OR check_out_at >= check_in_at)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON attendances
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
