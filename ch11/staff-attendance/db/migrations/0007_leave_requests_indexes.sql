-- DB-06: leave_requests 조회 성능 인덱스
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests (status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_requester_id ON leave_requests (requester_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_processor_id ON leave_requests (processor_id);
