import yfinance as yf
import pandas as pd


def fetch_prices(tickers, start, end, interval="1d") -> pd.DataFrame:
    data = yf.download(tickers, start=start, end=end, interval=interval, auto_adjust=True, progress=False)
    if isinstance(data.columns, pd.MultiIndex):
        close = data["Close"].copy()
    else:
        close = data.rename(columns={"Close": tickers[0]})[[tickers[0]]]
    close = close.dropna(how="all")
    close.index = pd.to_datetime(close.index)
    return close