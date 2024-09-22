import libsql_experimental as libsql
from dotenv import load_dotenv
import os

load_dotenv()

def connect_turso_db():
    url = os.getenv("TURSO_DATABASE_URL")
    auth_token = os.getenv("TURSO_AUTH_TOKEN")

    conn = libsql.connect("festival-db.db", sync_url=url, auth_token=auth_token)
    conn.sync()
    return conn

connect_turso_db()