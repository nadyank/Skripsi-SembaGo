from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
import joblib
import os

from . import models, schemas
from .database import get_db, engine

# =========================
# LOAD MODEL (GLOBAL)
# =========================
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

model = joblib.load(os.path.join(BASE_DIR, "model.pkl"))
features = joblib.load(os.path.join(BASE_DIR, "features.pkl"))

# =========================
# INIT APP
# =========================
app = FastAPI(title="SembaGo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)

# =========================
# ROOT
# =========================
@app.get("/")
def read_root():
    return {"message": "SembaGo API running"}

# =========================
# PRODUCTS
# =========================
@app.get("/products")
def get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

# =========================
# SEARCH PRODUCT MANUAL
# =========================
@app.get("/products/search/{keyword}")
def search_product(
    keyword: str,
    db: Session = Depends(get_db)
):

    product = (
        db.query(models.Product)
        .filter(
            (models.Product.id_barang.ilike(keyword))
            |
            (models.Product.name.ilike(f"%{keyword}%"))
        )
        .first()
    )

    return product

# =========================
# UPDATE PRODUCT
# =========================
@app.put("/products/{id}")
def update_product(
    id: int,
    product: dict,
    db: Session = Depends(get_db)
):

    db_product = db.query(models.Product).filter(
        models.Product.id == id
    ).first()

    if not db_product:
        return {"status": "error"}

    db_product.id_barang = product.get("id_barang")
    db_product.barcode = product.get("barcode")
    db_product.name = product.get("name")
    db_product.unit = product.get("unit")
    db_product.stock = product.get("stock")
    db_product.qty_per_renceng = product.get("qty_per_renceng")
    db_product.qty_per_dus = product.get("qty_per_dus")
    db_product.qty_per_pack = product.get("qty_per_pack")
    db_product.price_pcs = product.get("price_pcs")
    db_product.price_renceng = product.get("price_renceng")
    db_product.price_dus = product.get("price_dus")
    db_product.price_pack = product.get("price_pack")
    db_product.description = product.get("description")

    db.commit()
    db.refresh(db_product)

    return {
        "status": "success",
        "data": db_product
    }
# =========================
# DELETE PRODUCT
# =========================
@app.delete("/products/{id}")
def delete_product(
    id: int,
    db: Session = Depends(get_db)
):

    db_product = db.query(models.Product).filter(
        models.Product.id == id
    ).first()

    if not db_product:
        return {
            "status": "error",
            "message": "Produk tidak ditemukan"
        }

    db.delete(db_product)
    db.commit()

    return {
        "status": "success",
        "message": "Produk berhasil dihapus"
    }
    
@app.post("/products")
def create_product(product: dict, db: Session = Depends(get_db)):

    db_product = models.Product(
        id_barang=product.get("id_barang"),
        barcode=product.get("barcode"),
        name=product.get("name"),
        unit=product.get("unit"),
        stock=product.get("stock"),
        qty_per_renceng=product.get("qty_per_renceng"),
        qty_per_dus=product.get("qty_per_dus"),
        qty_per_pack=product.get("qty_per_pack"),
        price_pcs=product.get("price_pcs"),
        price_renceng=product.get("price_renceng"),
        price_dus=product.get("price_dus"),
        price_pack=product.get("price_pack"),
        description=product.get("description"),
    )

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return db_product
# =========================
# SALES
# =========================
@app.post("/sales")
def create_sale(
    sale: schemas.SaleCreate,
    db: Session = Depends(get_db)
):
    try:

        # SALE # 
        db_sale = models.Sale(
            total_amount=sale.total_amount
        )

        db.add(db_sale)
        db.commit()
        db.refresh(db_sale)

        # LOOP ITEM # 
        for item in sale.items:

            # CARI PRODUK
            product = db.query(models.Product).filter(
                models.Product.id == item.product_id
            ).first()

            if not product:
                return {
                    "status": "error",
                    "message": "Produk tidak ditemukan"
                }

            # VALIDASI STOK
            if product.stock < item.quantity:
                return {
                    "status": "error",
                    "message": f"Stok {product.name} tidak cukup"
                }

            # KURANGI STOK
            product.stock -= item.quantity

            # SIMPAN HISTORY
            db_item = models.SaleItem(
                sale_id=db_sale.id,

                product_id=item.product_id,

                tanggal=db_sale.timestamp,

                id_barang=item.id_barang,

                kode_barcode=item.barcode,

                nama_barang=item.name,

                qty_terjual=item.quantity,

                harga_pcs=item.price,

                total_harga=item.price * item.quantity
            )

            db.add(db_item)

        # =========================
        # SAVE SEMUA
        # =========================
        db.commit()

        return {
            "status": "success",
            "sale_id": db_sale.id
        }

    except Exception as e:

        print("ERROR CREATE SALE:", e)

        return {
            "status": "error",
            "message": str(e)
        }

# =========================
# HISTORY
# =========================
@app.get("/history")
def get_history(db: Session = Depends(get_db)):
    try:

        rows = (
            db.query(models.SaleItem)
            .order_by(models.SaleItem.id.desc())
            .all()
        )

        result = []

        for r in rows:

            result.append({
                "id": r.id,
                "timestamp": r.tanggal,
                "id_barang": r.id_barang,
                "barcode": r.kode_barcode,
                "name": r.nama_barang,
                "price": float(r.harga_pcs or 0),
                "quantity": int(r.qty_terjual or 0),
                "total_harga": float(r.total_harga or 0),
            })
        return result

    except Exception as e:

        print("ERROR HISTORY:", e)

        return []
# =========================
# 🔥 GLOBAL CACHE
# =========================
last_result = None
last_time = 0

@app.get("/predict-final")
def predict_final(db: Session = Depends(get_db), refresh: bool = False):
    global last_result, last_time

    import time
    start = time.time()

    try:
        # CACHE 5 menit
        if not refresh and last_result and (time.time() - last_time < 300):
            return last_result

        # LOAD HISTORY
        from datetime import datetime, timedelta

        three_months = datetime.now() - timedelta(days=90)

        rows = db.query(models.SaleItem)\
            .filter(models.SaleItem.tanggal >= three_months)\
            .order_by(models.SaleItem.tanggal.asc())\
            .all()

        if not rows:
            return {
                "data": [],
                "chart": [],
                "feature_importance": []
            }

        # DATAFRAME
        df = pd.DataFrame([{
            "id_barang": r.id_barang,
            "nama_barang": r.nama_barang,
            "tanggal": r.tanggal,
            "qty": r.qty_terjual
        } for r in rows])

        df = df.dropna(subset=["tanggal"])
        df["tanggal"] = pd.to_datetime(df["tanggal"])

        # WEEKLY
        iso = df["tanggal"].dt.isocalendar()
        df["tahun"] = iso.year.astype(int)
        df["minggu"] = iso.week.astype(int)

        df = df.groupby(
            ["id_barang", "nama_barang", "tahun", "minggu"],
            as_index=False
        )["qty"].sum()

        df = df.sort_values(["id_barang", "tahun", "minggu"])

        # LAG
        for lag in [1,2,3,4,6,8,12]:
            df[f"lag{lag}"] = (
                df.groupby("id_barang")["qty"].shift(lag)
            )

        # ROLLING
        for w in [2,4,8]:
            df[f"roll{w}"] = (
                df.groupby("id_barang")["qty"]
                .shift(1)
                .rolling(w)
                .mean()
            )

        # EWM
        df["ewm_3"] = (
            df.groupby("id_barang")["qty"]
            .transform(lambda x: x.ewm(span=3).mean())
        )

        df["ewm_6"] = (
            df.groupby("id_barang")["qty"]
            .transform(lambda x: x.ewm(span=6).mean())
        )

        # TIME FEATURE
        df["trend"] = (
            df.groupby("id_barang").cumcount()
        )

        df["momentum"] = (
            df["lag1"] - df["lag4"]
        )

        df["week_sin"] = np.sin(
            2 * np.pi * df["minggu"] / 52
        )

        df["week_cos"] = np.cos(
            2 * np.pi * df["minggu"] / 52
        )

        df["volatility"] = (
            df.groupby("id_barang")["qty"]
            .transform(
                lambda x: x.rolling(4).std()
            )
        )

        # STOCK
        stok_map = {
            p.id_barang: p.stock
            for p in db.query(models.Product).all()
        }

        df["stok_awal"] = (
            df["id_barang"]
            .map(stok_map)
            .fillna(0)
        )

        # QUARTER
        df["quarter"] = (
            ((df["minggu"] - 1) // 13) + 1
        )

        q = pd.get_dummies(
            df["quarter"],
            prefix="Q"
        )

        df = pd.concat([df, q], axis=1)

        # FILL
        df = df.bfill().ffill().fillna(0)

        # LAST ROW SKU
        last_df = (
            df.groupby("id_barang")
            .tail(1)
            .copy()
        )

        # MATCH FEATURE MODEL
        for col in features:
            if col not in last_df.columns:
                last_df[col] = 0

        X = last_df[features]

        # PREDICT
        preds = model.predict(X)
        preds = np.maximum(preds, 0).round().astype(int)

        last_df["stok"] = (
            last_df["id_barang"]
            .map(stok_map)
            .fillna(0)
            .astype(int)
        )

        last_df["prediksi_mingguan"] = preds

        last_df["restock"] = (
            last_df["prediksi_mingguan"]
            - last_df["stok"]
        ).clip(lower=0)

        results = last_df[
            [
                "id_barang",
                "nama_barang",
                "stok",
                "prediksi_mingguan",
                "restock"
            ]
        ].to_dict("records")

        chart = [
    {
        "index": i + 1,
        "actual": int(r.qty),
        "predicted": int(r.prediksi_mingguan)
    }
    for i, r in enumerate(last_df.itertuples())
]

        feature_importance = []

        if hasattr(model, "feature_importances_"):
            feature_importance = [
                {
                    "feature": f,
                    "importance": float(i)
                }
                for f, i in zip(
                    features,
                    model.feature_importances_
                )
            ]

        last_result = {
            "data": results,
            "chart": chart,
            "feature_importance": feature_importance
        }

        last_time = time.time()

        print(
            "Predict speed:",
            round(time.time() - start, 2),
            "detik"
        )

        return last_result

    except Exception as e:
        print("ERROR:", e)
        return {
            "data": [],
            "chart": [],
            "feature_importance": []
        }
