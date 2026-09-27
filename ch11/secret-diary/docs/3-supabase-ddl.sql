-- =============================================================================
-- 나만의 비밀일기 앱 - Supabase PostgreSQL DDL
-- =============================================================================
-- 문서 버전 : v1.0
-- 작성일    : 2026-07-05
-- 대상      : Supabase PostgreSQL (PostgreSQL 기능만 사용, Auth/RLS 미사용)
-- 관련 문서 : docs/1-prd.md, docs/2-erd.md
--
-- 실행 순서 : ENUM -> TABLE -> INDEX -> TRIGGER
-- 재실행 안전성 : DROP ... IF EXISTS 로 idempotent 하게 구성
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. 확장 기능 (UUID 생성)
-- -----------------------------------------------------------------------------
-- Supabase는 pgcrypto가 기본 활성화되어 gen_random_uuid() 사용 가능.
-- 안전하게 명시적으로 확장을 보장한다.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. 정리(재실행 대비) : 자식 -> 부모 순으로 DROP
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS diary_tags     CASCADE;
DROP TABLE IF EXISTS tags           CASCADE;
DROP TABLE IF EXISTS diaries        CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users          CASCADE;

DROP TYPE IF EXISTS weather_enum CASCADE;
DROP TYPE IF EXISTS mood_enum    CASCADE;

-- -----------------------------------------------------------------------------
-- 2. ENUM 타입 (PRD 5.1 기반)
-- -----------------------------------------------------------------------------
-- 날씨: 맑음/흐림/비/눈/바람
CREATE TYPE weather_enum AS ENUM ('sunny', 'cloudy', 'rainy', 'snowy', 'windy');

-- 기분: 행복/보통/슬픔/화남/설렘/피곤
CREATE TYPE mood_enum AS ENUM ('happy', 'neutral', 'sad', 'angry', 'excited', 'tired');

-- -----------------------------------------------------------------------------
-- 3. 공통 트리거 함수 : updated_at 자동 갱신
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 4. users : 회원 계정 (FR-1)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),  -- 전용 고유 식별자 (FR-1.2)
    email         varchar(255) NOT NULL,
    username      varchar(50)  NOT NULL,
    password_hash varchar(255) NOT NULL,                              -- bcrypt 해시 (FR-1.7)
    created_at    timestamptz  NOT NULL DEFAULT now(),
    updated_at    timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT uq_users_email    UNIQUE (email),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT chk_users_email   CHECK (email = lower(email)),        -- 이메일 소문자 정규화 강제
    CONSTRAINT chk_users_username_len CHECK (char_length(username) >= 2)
);

COMMENT ON TABLE  users              IS '회원 계정';
COMMENT ON COLUMN users.id           IS 'email/username과 별개의 전용 고유 식별자 (FR-1.2)';
COMMENT ON COLUMN users.password_hash IS 'bcrypt 등 해시 저장, 평문 금지 (FR-1.7)';

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. refresh_tokens : Refresh Token 관리 (FR-1.4 ~ FR-1.6)
-- -----------------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash varchar(255) NOT NULL,                                 -- 원문 대신 해시 저장
    expires_at timestamptz  NOT NULL,                                 -- 발급 + 7일
    revoked    boolean      NOT NULL DEFAULT false,                   -- 로그아웃/폐기 (FR-1.6)
    created_at timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT uq_refresh_token_hash UNIQUE (token_hash)
);

COMMENT ON TABLE refresh_tokens IS 'Refresh Token 저장 및 무효화 관리';

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
-- 만료 토큰 정리 배치를 위한 보조 인덱스
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);

-- -----------------------------------------------------------------------------
-- 6. diaries : 일기 (FR-2)
-- -----------------------------------------------------------------------------
CREATE TABLE diaries (
    id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid         NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 소유자 (FR-2.2)
    title      varchar(200) NOT NULL,
    content    text         NOT NULL,
    weather    weather_enum,                                          -- 선택 입력
    mood       mood_enum,                                             -- 선택 입력
    diary_date date         NOT NULL DEFAULT CURRENT_DATE,            -- 일기가 다루는 날짜(작성 날짜 직접 지정, 지난 날짜 허용)
    created_at timestamptz  NOT NULL DEFAULT now(),                   -- 실제 작성 시각(감사 로그)
    updated_at timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT chk_diaries_title_len CHECK (char_length(title) BETWEEN 1 AND 200)
);

COMMENT ON TABLE  diaries            IS '일기 본문';
COMMENT ON COLUMN diaries.user_id    IS '작성자(소유자). 조회/수정/삭제 시 소유권 검증 필수 (NFR-3)';
COMMENT ON COLUMN diaries.diary_date IS '일기가 다루는 날짜. 미입력 시 작성 당일로 기본 설정, 목록 정렬 기준 (FR-2.3)';

CREATE TRIGGER trg_diaries_updated_at
    BEFORE UPDATE ON diaries
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 내 일기 최신순 목록 (FR-2.3, diary_date 기준), 작성 일기 수 count (FR-3.2)
CREATE INDEX idx_diaries_user_created ON diaries (user_id, diary_date DESC, created_at DESC);
-- 날씨 필터 (FR-2.7). weather IS NOT NULL 부분 인덱스로 크기 최적화
CREATE INDEX idx_diaries_user_weather ON diaries (user_id, weather) WHERE weather IS NOT NULL;
-- 기분 필터 (FR-2.7)
CREATE INDEX idx_diaries_user_mood    ON diaries (user_id, mood)    WHERE mood IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 7. tags : 사용자별 태그 (FR-2.1, FR-2.7)
-- -----------------------------------------------------------------------------
CREATE TABLE tags (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       varchar(20) NOT NULL,                                  -- 태그 각 20자 제한 (PRD 8)
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_tags_user_name  UNIQUE (user_id, name),             -- 사용자 내 태그명 중복 방지
    CONSTRAINT chk_tags_name_len  CHECK (char_length(name) BETWEEN 1 AND 20)
);

COMMENT ON TABLE tags IS '사용자별 태그 사전 (프라이빗)';

-- -----------------------------------------------------------------------------
-- 8. diary_tags : 일기 <-> 태그 N:M 연결
-- -----------------------------------------------------------------------------
CREATE TABLE diary_tags (
    diary_id uuid NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
    tag_id   uuid NOT NULL REFERENCES tags(id)    ON DELETE CASCADE,

    CONSTRAINT pk_diary_tags PRIMARY KEY (diary_id, tag_id)           -- 복합 PK, 중복 연결 방지
);

COMMENT ON TABLE diary_tags IS '일기-태그 다대다 연결';

-- 태그 기준 일기 역조회 (FR-2.7 태그 필터)
CREATE INDEX idx_diary_tags_tag ON diary_tags (tag_id);

-- =============================================================================
-- 참고: 소유권 검증(NFR-3)은 백엔드 애플리케이션 계층에서 수행한다.
--       (Supabase Auth/RLS 미사용 - PRD 비목표)
--       모든 diaries/tags 접근 쿼리는 반드시 user_id = 요청자 조건을 포함할 것.
-- =============================================================================
