import libsql_experimental as libsql
from dotenv import load_dotenv
import os

load_dotenv()

def connect_turso_db():
    url = os.getenv("TURSO_DATABASE_URL")
    auth_token = os.getenv("TURSO_AUTH_TOKEN")
    db_directory = os.getenv("TURSO_DB_DIRECTORY", "default_db_directory")

    # Ensure the directory exists
    if not os.path.exists(db_directory):
        os.makedirs(db_directory)

    db_path = os.path.join(db_directory, "festival-db.db")

    conn = libsql.connect(db_path, sync_url=url, auth_token=auth_token)
    conn.sync()
    return conn

#connect_turso_db()