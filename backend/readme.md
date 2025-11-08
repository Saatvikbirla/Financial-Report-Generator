python -m venv .venv
source .venv/bin/activate # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python cli.py --tickers AAPL,MSFT --start 2020-01-01 --end 2025-11-07 --interval 1d --rf 0.02 --out outputs/report.pdf