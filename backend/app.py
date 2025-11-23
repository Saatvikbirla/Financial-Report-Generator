from pathlib import Path
import pandas as pd
import httpx
from fastapi import FastAPI, APIRouter, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
import tempfile
import pandas as pd  # for JSON shaping

# ---- your modules from the starter pack ----
from finance.data import fetch_prices
from finance.metrics import compute_all_metrics
from finance.report import build_pdf_report

app = FastAPI(title="FinReport API", version="0.2.0")

BASE_DIR = Path(__file__).resolve().parent
SYMBOLS_CSV = BASE_DIR / "data" / "us_symbols.csv"

# Load once at startup
try:
  SYMBOLS_DF = pd.read_csv(SYMBOLS_CSV)
  # Normalize columns just in case
  SYMBOLS_DF["symbol"] = SYMBOLS_DF["symbol"].astype(str)
  SYMBOLS_DF["name"] = SYMBOLS_DF["name"].astype(str)
  if "exchange" not in SYMBOLS_DF.columns:
      SYMBOLS_DF["exchange"] = ""
except FileNotFoundError:
  print(f"[WARN] Symbols CSV not found at {SYMBOLS_CSV}. /web/search will return empty results.")
  SYMBOLS_DF = pd.DataFrame(columns=["symbol", "name", "exchange"])

# Allow your Next.js dev server to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

router = APIRouter(prefix="/web", tags=["web"])

import httpx
from fastapi import HTTPException

@router.get("/search")
async def search_tickers(q: str):
    """
    Local search over us_symbols.csv.

    Returns:
      { "results": [ { "symbol": str, "name": str, "exchange": str }, ... ] }
    """
    query = (q or "").strip().lower()
    if not query or SYMBOLS_DF.empty:
        return {"results": []}

    df = SYMBOLS_DF

    # Match: symbol starts with query OR name contains query
    mask = df["symbol"].str.lower().str.startswith(query) | df["name"].str.lower().str.contains(query)
    subset = df[mask].head(10)

    results = [
        {
            "symbol": row["symbol"],
            "name": row["name"],
            "exchange": row.get("exchange", ""),
        }
        for _, row in subset.iterrows()
    ]

    return {"results": results}

@router.post("/compute")
async def compute(payload: dict = Body(...)):
    """
    Accepts: { tickers: [str], start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', interval: '1d'|'1wk'|'1mo', rf?: float }
    Returns JSON for the frontend charts + summary cards, plus any per-ticker errors.
    """
    tickers = payload.get("tickers") or []
    start = payload.get("start")
    end = payload.get("end")
    interval = payload.get("interval", "1d")
    rf = float(payload.get("rf", 0.0))

    if not tickers or not start or not end:
        raise HTTPException(400, "tickers, start, end are required")

    # 1) prices + errors
    prices, errors = fetch_prices(tickers, start, end, interval)

    # If ALL tickers failed, bail with a clear error
    if prices.empty:
        detail = "No valid price data for any ticker. "
        if errors:
            detail += "Errors: " + "; ".join(f"{k}: {v}" for k, v in errors.items())
        raise HTTPException(status_code=400, detail=detail)

    # 2) metrics bundle for successful tickers only
    metrics = compute_all_metrics(prices, rf=rf, interval=interval)

    # ---- Helpers to shape pandas → JSON expected by the frontend ----
    prices_dict = {
        col: [{"date": str(idx.date()), "price": float(val)} for idx, val in prices[col].dropna().items()]
        for col in prices.columns
    }

    def df_to_value_series(df: pd.DataFrame) -> dict:
        if df is None or df.empty:
            return {}
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = [c[-1] for c in df.columns]
        out = {}
        for col in df.columns:
            out[col] = [{"date": str(i.date()), "value": float(v)} for i, v in df[col].dropna().items()]
        return out

    cum_dict = df_to_value_series(metrics["cum"])
    drawdown_df = metrics["cum"] / metrics["cum"].cummax() - 1
    drawdown_dict = df_to_value_series(drawdown_df)

    roll_vol = {
        k: [{"date": str(i.date()), "value": float(v)} for i, v in d["vol"].dropna().items()]
        for k, d in metrics["rolling"].items()
    }
    roll_sharpe = {
        k: [{"date": str(i.date()), "value": float(v)} for i, v in d["sharpe"].dropna().items()]
        for k, d in metrics["rolling"].items()
    }

    return {
        "prices": prices_dict,
        "cum": cum_dict,
        "drawdown": drawdown_dict,
        "roll": {"vol": roll_vol, "sharpe": roll_sharpe},
        "summary": metrics["summary"],
        "errors": errors,  # 👈 per-ticker issues surfaced to frontend
    }


@router.get("/pdf")
async def download_pdf(tickers: str, start: str, end: str, interval: str = "1d", rf: float = 0.0):
    """
    Streams a freshly generated PDF to the browser.
    Example: /web/pdf?tickers=AAPL,MSFT&start=2020-01-01&end=2025-11-07&interval=1d&rf=0.02
    """
    tickers_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if not tickers_list or not start or not end:
        raise HTTPException(400, "tickers, start, end are required")

    prices, errors = fetch_prices(tickers_list, start, end, interval)

    if prices.empty:
        detail = "No valid price data for any ticker. "
        if errors:
            detail += "Errors: " + "; ".join(f"{k}: {v}" for k, v in errors.items())
        raise HTTPException(status_code=400, detail=detail)

    metrics = compute_all_metrics(prices, rf=rf, interval=interval)

    tmp_path = Path(tempfile.gettempdir()) / "financial_report.pdf"
    build_pdf_report(prices, metrics, tmp_path, rf=rf, interval=interval)
    return FileResponse(tmp_path, filename="financial_report.pdf", media_type="application/pdf")

app.include_router(router)
