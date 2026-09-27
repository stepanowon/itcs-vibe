-- 업무일지 앱 DDL
-- docs/2-erd.md 기준. 대상: Supabase PostgreSQL

create extension if not exists pgcrypto;

create table users (
    id uuid primary key default gen_random_uuid(),
    user_code varchar not null unique,
    email varchar not null unique,
    password_hash varchar not null,
    name varchar not null,
    department varchar not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table work_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id),
    log_date date not null,
    title varchar not null,
    content text not null,
    issue_solution text,
    is_completed boolean not null default false,
    tomorrow_plan text,
    is_deleted boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 삭제되지 않은 업무일지 기준으로 사용자당 하루 1건만 작성 가능
create unique index work_logs_user_id_log_date_key
    on work_logs (user_id, log_date)
    where is_deleted = false;

create table refresh_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id),
    token_hash varchar not null unique,
    expires_at timestamptz not null,
    revoked_at timestamptz,
    created_at timestamptz not null default now()
);

create index refresh_tokens_user_id_idx on refresh_tokens (user_id);
