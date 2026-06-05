from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import joblib
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Fraud Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("../models/fraud_model.pkl")
model_features = joblib.load("../models/model_features.pkl")

transactions = []


class Transaction(BaseModel):
    amount: float
    amount_vs_avg: float
    hour: int
    is_new_country: int
    impossible_travel: int
    merchant_category: str


def build_input(transaction: Transaction):
    data = {feature: 0 for feature in model_features}

    data["amount"] = transaction.amount
    data["amount_vs_avg"] = transaction.amount_vs_avg
    data["hour"] = transaction.hour
    data["is_new_country"] = transaction.is_new_country
    data["impossible_travel"] = transaction.impossible_travel

    merchant_col = f"merchant_category_{transaction.merchant_category}"

    if merchant_col in data:
        data[merchant_col] = 1

    return pd.DataFrame([data])


def generate_reasons(transaction: Transaction, risk_score: float):
    reasons = []

    if transaction.amount_vs_avg >= 5:
        reasons.append("Transaction amount is far above the user's normal spending.")

    if transaction.amount_vs_avg >= 3 and transaction.amount_vs_avg < 5:
        reasons.append("Transaction amount is moderately higher than usual.")

    if transaction.is_new_country == 1:
        reasons.append("Transaction occurred in a new country.")

    if transaction.impossible_travel == 1:
        reasons.append("Impossible travel detected between recent transactions.")

    if transaction.hour <= 4 or transaction.hour >= 23:
        reasons.append("Transaction occurred at an unusual hour.")

    if transaction.merchant_category in ["electronics", "travel", "luxury"]:
        reasons.append("Merchant category is commonly associated with higher-risk purchases.")

    if not reasons:
        reasons.append("No major suspicious behavior detected.")

    return reasons


@app.get("/")
def home():
    return {"message": "Fraud Detection API is running"}


@app.post("/predict")
def predict(transaction: Transaction):
    input_df = build_input(transaction)

    prediction = model.predict(input_df)[0]
    risk_score = model.predict_proba(input_df)[0][1] * 100

    result = "Fraud" if prediction == 1 else "Legit"

    reasons = generate_reasons(transaction, risk_score)

    return {
        "prediction": result,
        "risk_score": round(risk_score, 2),
        "reasons": reasons
    }

@app.post("/transactions")
def create_transaction(transaction: Transaction):
    input_df = build_input(transaction)

    prediction = model.predict(input_df)[0]
    risk_score = model.predict_proba(input_df)[0][1] * 100
    result = "Fraud" if prediction == 1 else "Legit"
    reasons = generate_reasons(transaction, risk_score)

    transaction_record = {
        "id": len(transactions) + 1,
        "amount": transaction.amount,
        "amount_vs_avg": transaction.amount_vs_avg,
        "hour": transaction.hour,
        "is_new_country": transaction.is_new_country,
        "impossible_travel": transaction.impossible_travel,
        "merchant_category": transaction.merchant_category,
        "prediction": result,
        "risk_score": round(risk_score, 2),
        "reasons": reasons
    }

    transactions.append(transaction_record)

    return transaction_record


@app.get("/transactions")
def get_transactions():
    return transactions