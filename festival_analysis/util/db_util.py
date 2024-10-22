import os
import toml
import libsql_experimental as libsql
from dotenv import load_dotenv


def load_environment():
    # Check if .env file exists
    if os.path.exists('.env'):
        load_dotenv()
    else:
        # Load from config.toml
        config = toml.load('config.toml')
        for key, value in config.items():
            os.environ[key] = value

def connect_turso_db():
    load_environment()

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