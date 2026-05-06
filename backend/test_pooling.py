import sys
import psycopg2

base_url = "postgresql://{user}:foqfac-0toqzu-Kyhzov@aws-1-ap-northeast-1.pooler.supabase.com:{port}/postgres"

variants = [
    ("postgres.pdmlojojzgaauqatqvqk", 6543),
    ("postgres", 6543),
    ("postgres.pdmlojojzgaauqatqvqk", 5432),
    ("postgres", 5432),
]

for user, port in variants:
    db_url = base_url.format(user=user, port=port)
    print(f"Testing {user} on port {port}...", flush=True)
    try:
        conn = psycopg2.connect(db_url, connect_timeout=5)
        print("Success!\n", flush=True)
        conn.close()
    except Exception as e:
        print(f"Failed: {str(e).strip()}\n", flush=True)
