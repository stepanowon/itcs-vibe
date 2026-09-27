-- DB-02: users 테이블
-- 최초 가입자만 role='manager'가 되는 규칙은 DB 제약으로 강제하지 않고
-- 애플리케이션 트랜잭션 로직(백엔드 BE-06)에 위임한다.
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  name varchar(100) NOT NULL,
  employee_no varchar(50) NOT NULL UNIQUE,
  hire_date date NOT NULL,
  role varchar(20) NOT NULL CHECK (role IN ('manager', 'employee')),
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
