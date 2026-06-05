import { useState } from "react";
import axios from "axios";
import "./App.css";

type FraudResult = {
  prediction: string;
  risk_score: number;
  reasons: string[];
};

function App() {
  const [form, setForm] = useState({
    amount: 950,
    amount_vs_avg: 8.5,
    hour: 2,
    is_new_country: 1,
    impossible_travel: 1,
    merchant_category: "electronics",
  });

  const [result, setResult] = useState<FraudResult | null>(null);

  const analyzeTransaction = async () => {
    const response = await axios.post(
      "http://127.0.0.1:8000/transactions",
      form
    );

    setResult(response.data);
  };

  return (
  <main>
    <section className="hero">
      <div className="badge">ML Fraud Detection System</div>
      <h1>SentinelPay</h1>
      <p className="subtitle">
        A real-time credit card fraud detection dashboard using behavioral
        spending patterns, geolocation signals, and machine learning risk scoring.
      </p>
    </section>

    <section className="grid">
      <div className="panel">
        <h2>Analyze Transaction</h2>

        <div className="form-grid">
          <div className="field">
            <label>Transaction Amount</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) =>
                setForm({ ...form, amount: Math.max(0, Number(e.target.value)) })
              }
            />
          </div>

          <div className="field">
            <label>Amount vs User Average</label>
            <input
              type="number"
              value={form.amount_vs_avg}
              onChange={(e) =>
                setForm({ ...form, amount_vs_avg: Math.max(0, Number(e.target.value)) })
              }
            />
          </div>

          <div className="field">
            <label>Hour of Purchase</label>
            <input
              type="number"
              min={0}
              max={23}
              value={form.hour}
              onChange={(e) =>
                setForm({
                  ...form,
                  hour: Math.min(23, Math.max(0, Number(e.target.value))), })
              }
            />
          </div>

          <div className="field">
            <label>Merchant Category</label>
            <select
              value={form.merchant_category}
              onChange={(e) =>
                setForm({ ...form, merchant_category: e.target.value })
              }
            >
              <option value="food">Food</option>
              <option value="groceries">Groceries</option>
              <option value="gas">Gas</option>
              <option value="electronics">Electronics</option>
              <option value="travel">Travel</option>
              <option value="luxury">Luxury</option>
              <option value="entertainment">Entertainment</option>
            </select>
          </div>

          <div className="field">
            <label>New Country?</label>
            <select
              value={form.is_new_country}
              onChange={(e) =>
                setForm({ ...form, is_new_country: Number(e.target.value) })
              }
            >
              <option value={0}>No</option>
              <option value={1}>Yes</option>
            </select>
          </div>

          <div className="field">
            <label>Impossible Travel?</label>
            <select
              value={form.impossible_travel}
              onChange={(e) =>
                setForm({ ...form, impossible_travel: Number(e.target.value) })
              }
            >
              <option value={0}>No</option>
              <option value={1}>Yes</option>
            </select>
          </div>
        </div>

        <button onClick={analyzeTransaction}>Run Fraud Analysis</button>
      </div>

      <div className="panel result-card">
        <h2>Risk Assessment</h2>

        {result ? (
          <>
            <div
              className={
                result.prediction === "Fraud"
                  ? "status fraud"
                  : "status legit"
              }
            >
              {result.prediction}
            </div>

            <div className="risk-score">{result.risk_score}</div>
            <p>Risk Score / 100</p>

            <ul className="reasons">
              {result.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="empty-state">
            Submit a transaction to generate a fraud prediction, risk score,
            and explanation.
          </p>
        )}
      </div>
    </section>
  </main>
);
}

export default App;