from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# =========================
# DATABASE CONFIG
# =========================
# Format:
# mysql+mysqlconnector://USER:PASSWORD@HOST/DATABASE
SQLALCHEMY_DATABASE_URL = "mysql+mysqlconnector://root:@localhost/sembago_db"

# =========================
# ENGINE
# =========================
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,   # biar koneksi gak "mati diam-diam"
    pool_recycle=3600
)

# =========================
# SESSION
# =========================
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# =========================
# BASE MODEL
# =========================
Base = declarative_base()

# =========================
# DEPENDENCY (FASTAPI)
# =========================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()