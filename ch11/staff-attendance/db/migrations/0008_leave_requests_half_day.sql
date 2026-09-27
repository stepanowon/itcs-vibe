-- 연차 반차(오전/오후) 지원: 0.5일 단위 신청
ALTER TABLE leave_requests
  ADD COLUMN half_day varchar(2) CHECK (half_day IN ('am', 'pm'));

ALTER TABLE leave_requests
  ADD CONSTRAINT leave_requests_half_day_single_day CHECK (half_day IS NULL OR start_date = end_date);

ALTER TABLE leave_requests
  ADD CONSTRAINT leave_requests_half_day_days CHECK (half_day IS NULL OR days = 0.5);
