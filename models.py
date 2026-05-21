from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
import datetime


# =========================
# USERS
# =========================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    password = Column(String(255))
    name = Column(String(100))


# =========================
# PRODUCTS
# =========================
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    id_barang = Column(String(50), unique=True, index=True)
    barcode = Column(String(50), unique=True, index=True, nullable=True)

    name = Column(String(200))
    unit = Column(String(50))
    stock = Column(Integer)

    qty_per_renceng = Column(Integer, default=0)
    qty_per_dus = Column(Integer, default=0)
    qty_per_pack = Column(Integer, default=0)

    price_pcs = Column(Float, default=0)
    price_renceng = Column(Float, default=0)
    price_dus = Column(Float, default=0)
    price_pack = Column(Float, default=0)

    description = Column(String(500))


# =========================
# SALES 
# =========================
class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)

    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    total_amount = Column(Float)


# =========================
# SALE ITEMS
# =========================
class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)

    # RELASI KE SALES
    sale_id = Column(
        Integer,
        ForeignKey("sales.id")
    )

    product_id = Column(Integer)

    tanggal = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )

    id_barang = Column(String(50), nullable=True)

    kode_barcode = Column(
        String(50),
        nullable=True
    )

    nama_barang = Column(String(200))

    harga_pcs = Column(Float)

    qty_terjual = Column(Integer)

    total_harga = Column(Float)