import numpy as np
import pandas as pd

ANNUALIZATION = {
    "1d": 252,
    "1wk": 52,
    "1mo": 12,
}

def annualize_factor(interval: str) -> int:
    return ANNUALIZATION.get(interval, 252)


def pct_change(df: pd.DataFrame) -> pd.DataFrame:
    return df.pct_change().dropna(how="all")


def to_cumulative(returns: pd.DataFrame) -> pd.DataFrame:
    return (1 + returns).cumprod()


def compute_drawdown(cum: pd.Series) -> pd.DataFrame:
    peak = cum.cummax()
    dd = (cum / peak) - 1.0
    depth = dd.min()
    end = dd.idxmin()
    start = cum.loc[:end].idxmax()
# recovery: first time cum exceeds prior peak after end
    post = cum.loc[end:]
    rec = post[post >= peak.loc[start]].first_valid_index()
    return pd.DataFrame({
        "value": dd,
        "peak": peak,
        "peak_start": start,
        "trough": end,
        "recovery": rec,
        "max_dd": depth,
    })