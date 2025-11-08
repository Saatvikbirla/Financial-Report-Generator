import argparse
from pathlib import Path
from finance.data import fetch_prices
from finance.metrics import compute_all_metrics
from finance.report import build_pdf_report


def parse_args():
    p = argparse.ArgumentParser(description="Automated Financial Report Generator")
    p.add_argument("--tickers", required=True, help="Comma-separated tickers, e.g., AAPL,MSFT")
    p.add_argument("--start", required=True, help="Start date YYYY-MM-DD")
    p.add_argument("--end", required=True, help="End date YYYY-MM-DD")
    p.add_argument("--interval", default="1d", help="yfinance interval (1d,1wk,1mo)")
    p.add_argument("--rf", type=float, default=0.0, help="Annual risk-free rate (e.g., 0.02)")
    p.add_argument("--out", default="outputs/report.pdf", help="Output PDF path")
    return p.parse_args()


def main():
    args = parse_args()
    tickers = [t.strip().upper() for t in args.tickers.split(",") if t.strip()]
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)

    prices = fetch_prices(tickers, args.start, args.end, args.interval)
    metrics = compute_all_metrics(prices, rf=args.rf, interval=args.interval)
    build_pdf_report(prices, metrics, out, rf=args.rf, interval=args.interval)
    print(f"Report saved to {out}")


if __name__ == "__main__":
    main()