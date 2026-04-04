from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Neon and most hosted Postgres URLs include ?sslmode=require in DATABASE_URL.
# If yours does not, set DATABASE_SSL=require (or true) so psycopg2 negotiates TLS.
_connect_args = {}
if os.getenv("DATABASE_SSL", "").lower() in ("1", "true", "yes", "require"):
    _connect_args["sslmode"] = "require"

engine = create_engine(DATABASE_URL, connect_args=_connect_args or {})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
