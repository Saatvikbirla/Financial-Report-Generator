import yfinance as yf
import pandas as pd
from typing import List, Tuple, Dict


def fetch_prices(
    tickers: List[str],
    start: str,
    end: str,
    interval: str = "1d",
) -> Tuple[pd.DataFrame, Dict[str, str]]:
    """
    Download adjusted close prices for each ticker individually.

    - If a ticker fails (no data or exception), it is skipped.
    - Returns:
        prices: DataFrame with one column per successful ticker
        errors: dict[ticker] = error_message
    """
    tickers = [t.strip().upper() for t in tickers if t.strip()]
    frames = []
    errors: Dict[str, str] = {}

    for t in tickers:
        try:
            data = yf.download(
                t,
                start=start,
                end=end,
                interval=interval,
                auto_adjust=True,
                progress=False,
            )

            # If nothing comes back or no Close column → treat as failure
            if data.empty or "Close" not in data.columns:
                errors[t] = "No price data returned (possibly delisted or invalid ticker)."
                continue

            close = data["Close"].copy()
            close.name = t
            frames.append(close)

        except Exception as e:
            errors[t] = f"{type(e).__name__}: {e}"

    if frames:
        prices = pd.concat(frames, axis=1)
        prices.index = pd.to_datetime(prices.index)
    else:
        prices = pd.DataFrame()

    return prices, errors
