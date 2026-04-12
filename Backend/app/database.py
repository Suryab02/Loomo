from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

DATABASE_URL = settings.DATABASE_URL

# Neon and most hosted Postgres URLs include ?sslmode=require in DATABASE_URL.
# If yours does not, set DATABASE_SSL=True so psycopg2 negotiates TLS.
_connect_args = {}
if settings.DATABASE_SSL:
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
