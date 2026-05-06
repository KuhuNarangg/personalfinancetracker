import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv('DATABASE_URL')
print(f"Testing connection to: {db_url}")

try:
    conn = psycopg2.connect(db_url, connect_timeout=10)
    print("Connection successful!")
    cur = conn.cursor()
    cur.execute("SELECT current_schema();")
    print(f"Current schema: {cur.fetchone()[0]}")
    cur.execute("SELECT schema_name FROM information_schema.schemata;")
    print(f"Available schemas: {[s[0] for s in cur.fetchall()]}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
