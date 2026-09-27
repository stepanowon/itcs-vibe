import os
import re
import sys
from dotenv import load_dotenv

load_dotenv()

# ── 1. 환경 변수 읽기 ──────────────────────────────────────────
db_connection_url = os.environ.get("DB_CONNECTION_URL")
test_api_key      = os.environ.get("TEST_API_KEY")

# ── 2. 필수 환경 변수 검증 ────────────────────────────────────
required = ["DB_CONNECTION_URL", "TEST_API_KEY"]
missing  = [key for key in required if not os.environ.get(key)]

if missing:
    print(f"오류: 다음 환경 변수가 설정되지 않았습니다 → {', '.join(missing)}")
    sys.exit(1)

# ── 3. 환경 변수 출력 ──────────────────────────────────────────
print("=" * 50)

print("[데이터베이스]")
masked_url = re.sub(r"//([^:]+):([^@]+)@", r"//\1:****@", db_connection_url)
print(f"  DB_CONNECTION_URL : {masked_url}")

print("\n[API]")
print(f"  TEST_API_KEY : {test_api_key[:4]}****")

print("=" * 50)
