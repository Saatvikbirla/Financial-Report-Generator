import numpy as np
import pandas as pd
from .utils import pct_change, to_cumulative, annualize_factor


def cagr(cum: pd.Series, periods_per_year: int) -> float:
    if cum.empty:
        return float("nan")
    n_periods = len(cum)
    years = n_periods / periods_per_year
    if years <= 0:
        return float("nan")
    return float(cum.iloc[-1]) ** (1 / years) - 1


def annualized_vol(returns: pd.Series, periods_per_year: int) -> float:
    return float(returns.std(ddof=0) * np.sqrt(periods_per_year))


def sharpe(returns: pd.Series, rf_annual: float, periods_per_year: int) -> float:
    rf_period = (1 + rf_annual) ** (1 / periods_per_year) - 1
    ex_ret = returns - rf_period
    vol = returns.std(ddof=0)
    if vol == 0 or np.isnan(vol):
        return float("nan")
    return float(ex_ret.mean() / vol * np.sqrt(periods_per_year))


def max_drawdown(cum: pd.Series) -> float:
    if cum.empty:
        return float("nan")
    peak = cum.cummax()
    dd = (cum / peak) - 1.0
    return float(dd.min())


def monthly_returns(returns: pd.DataFrame) -> pd.DataFrame:
    return returns.resample("M").apply(lambda x: (1 + x).prod() - 1)


def rolling_metric(returns: pd.Series, window: int, func):
    return returns.rolling(window).apply(func, raw=False)


def compute_all_metrics(prices: pd.DataFrame, rf: float = 0.0, interval: str = "1d") -> dict:
    periods_per_year = annualize_factor(interval)
    rets = prices.pct_change().dropna(how="all")
    cum = (1 + rets).cumprod()

    summary = {}
    for col in prices.columns:
        r = rets[col].dropna()
        c = cum[col].dropna()
        summary[col] = {
            "start": str(prices.index.min().date()),
            "end": str(prices.index.max().date()),
            "cagr": cagr(c, periods_per_year),
            "ann_vol": annualized_vol(r, periods_per_year),
            "sharpe": sharpe(r, rf, periods_per_year),
            "max_drawdown": max_drawdown(c),
            "best_day": float(r.max()) if not r.empty else float("nan"),
            "worst_day": float(r.min()) if not r.empty else float("nan"),
        }

# monthly heatmap data
    monthly = monthly_returns(rets)

    # rolling 63-day (quarter) volatility & sharpe for each asset
    roll = {}
    window = int(round(periods_per_year / 4))
    for col in prices.columns:
        r = rets[col].dropna()
        rv = r.rolling(window).std(ddof=0) * np.sqrt(periods_per_year)
        # rolling sharpe using same rf per period
        rf_period = (1 + rf) ** (1 / periods_per_year) - 1
        ex_ret = r - rf_period
        rs = (ex_ret.rolling(window).mean() / r.rolling(window).std(ddof=0)) * np.sqrt(periods_per_year)
        roll[col] = {"vol": rv, "sharpe": rs}

    return {
    "returns": rets,
    "cum": cum,
    "monthly": monthly,
    "rolling": roll,
    "summary": summary,
    "periods_per_year": periods_per_year,
    "rf": rf,
    }
 