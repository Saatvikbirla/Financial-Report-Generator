import matplotlib.pyplot as plt
import pandas as pd

# NOTE: Do not set styles or colors (kept neutral for portability)


def fig_price(prices: pd.DataFrame):
    fig, ax = plt.subplots(figsize=(10, 4))
    prices.plot(ax=ax)
    ax.set_title("Adjusted Close Price")
    ax.set_xlabel("Date")
    ax.set_ylabel("Price")
    ax.grid(True, alpha=0.3)
    return fig


def fig_cumulative(cum: pd.DataFrame):
    fig, ax = plt.subplots(figsize=(10, 4))
    cum.plot(ax=ax)
    ax.set_title("Cumulative Return (1=Start)")
    ax.set_xlabel("Date")
    ax.set_ylabel("Multiple of Initial")
    ax.grid(True, alpha=0.3)
    return fig


def fig_drawdown(cum: pd.DataFrame):
    dd = cum / cum.cummax() - 1
    fig, ax = plt.subplots(figsize=(10, 2.8))
    dd.plot(ax=ax)
    ax.set_title("Drawdowns")
    ax.set_xlabel("Date")
    ax.set_ylabel("Drawdown")
    ax.grid(True, alpha=0.3)
    return fig


def fig_rolling_vol(roll: dict):
    fig, ax = plt.subplots(figsize=(10, 3.5))
    for col, d in roll.items():
        d["vol"].plot(ax=ax, label=f"{col}")
    ax.set_title("Rolling Annualized Volatility")
    ax.set_xlabel("Date")
    ax.set_ylabel("Volatility")
    ax.legend()
    ax.grid(True, alpha=0.3)
    return fig


def fig_rolling_sharpe(roll: dict):
    fig, ax = plt.subplots(figsize=(10, 3.5))
    for col, d in roll.items():
        d["sharpe"].plot(ax=ax, label=f"{col}")
    ax.set_title("Rolling Sharpe Ratio")
    ax.set_xlabel("Date")
    ax.set_ylabel("Sharpe")
    ax.legend()
    ax.grid(True, alpha=0.3)
    return fig


def fig_monthly_heatmap(monthly: pd.DataFrame):
    # Convert to matrix with years as rows, months as columns
    m = monthly.copy()
    m["Year"] = m.index.year
    m["Month"] = m.index.month
    # For multiple tickers, show first ticker's heatmap; extend later if desired
    first = m.columns[0]
    if first in ("Year", "Month") and len(m.columns) > 2:
        first = m.columns[2]
    pivot = m.pivot_table(index="Year", columns="Month", values=first, aggfunc="first")

    fig, ax = plt.subplots(figsize=(9, 3.5))
    im = ax.imshow(pivot.values, aspect="auto")
    ax.set_title(f"Monthly Returns Heatmap ({first})")
    ax.set_yticks(range(len(pivot.index)))
    ax.set_yticklabels(pivot.index)
    ax.set_xticks(range(len(pivot.columns)))
    ax.set_xticklabels(pivot.columns)
    for (i, j), val in np.ndenumerate(pivot.values):
        if pd.notna(val):
            ax.text(j, i, f"{val*100:.1f}%", ha="center", va="center", fontsize=7, color="white")
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    return fig