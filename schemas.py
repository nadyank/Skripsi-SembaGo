from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProductBase(BaseModel):
    id_barang: Optional[str] = None
    barcode: Optional[str] = None
    name: str
    unit: str
    stock: int

    qty_per_renceng: int = 0
    qty_per_dus: int = 0
    qty_per_pack: int = 0

    price_pcs: float = 0
    price_renceng: float = 0
    price_dus: float = 0
    price_pack: float = 0

    description: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    updated_at: datetime
    class Config:
        from_attributes = True

class SaleItemCreate(BaseModel):
    product_id: int
    id_barang: str
    barcode: str
    name: str
    quantity: int
    price: float

class SaleCreate(BaseModel):
    total_amount: float
    items: List[SaleItemCreate]

class Sale(BaseModel):
    id: int
    timestamp: datetime
    total_amount: float
    items: List[SaleItemCreate] = []
    class Config:
        from_attributes = True
