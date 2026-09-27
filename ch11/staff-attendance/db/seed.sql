-- DB-06: 로컬 개발/QA용 시드 데이터 (반복 실행 가능, idempotent)

INSERT INTO users (email, password_hash, name, employee_no, hire_date, role)
VALUES
  ('seed.manager1@example.com', 'seed-hash', '박팀장', 'SEED-EMP-001', '2020-03-02', 'manager'),
  ('seed.manager2@example.com', 'seed-hash', '이팀장', 'SEED-EMP-002', '2021-05-10', 'manager'),
  ('seed.employee1@example.com', 'seed-hash', '김사원', 'SEED-EMP-003', '2025-01-06', 'employee'),
  ('seed.employee2@example.com', 'seed-hash', '이사원', 'SEED-EMP-004', '2026-03-02', 'employee')
ON CONFLICT (employee_no) DO NOTHING;

INSERT INTO leave_balances (user_id, total_days, used_days)
SELECT u.id, 15, 0 FROM users u WHERE u.employee_no = 'SEED-EMP-001'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO leave_balances (user_id, total_days, used_days)
SELECT u.id, 15, 1 FROM users u WHERE u.employee_no = 'SEED-EMP-002'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO leave_balances (user_id, total_days, used_days)
SELECT u.id, 3, 1 FROM users u WHERE u.employee_no = 'SEED-EMP-003'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO leave_balances (user_id, total_days, used_days)
SELECT u.id, 0, 0 FROM users u WHERE u.employee_no = 'SEED-EMP-004'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO attendances (user_id, work_date, check_in_at, check_out_at)
SELECT u.id, '2026-09-01', '2026-09-01 09:00:00+09', '2026-09-01 18:00:00+09'
FROM users u WHERE u.employee_no = 'SEED-EMP-003'
ON CONFLICT (user_id, work_date) DO NOTHING;

INSERT INTO attendances (user_id, work_date, check_in_at)
SELECT u.id, '2026-09-02', '2026-09-02 09:10:00+09'
FROM users u WHERE u.employee_no = 'SEED-EMP-003'
ON CONFLICT (user_id, work_date) DO NOTHING;

INSERT INTO leave_requests (requester_id, start_date, end_date, days, reason, status)
SELECT u.id, '2026-09-08', '2026-09-08', 1, '시드 데이터 샘플 연차', 'pending'
FROM users u
WHERE u.employee_no = 'SEED-EMP-003'
  AND NOT EXISTS (
    SELECT 1 FROM leave_requests lr WHERE lr.requester_id = u.id AND lr.reason = '시드 데이터 샘플 연차'
  );
