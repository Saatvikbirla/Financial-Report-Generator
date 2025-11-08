from matplotlib.backends.backend_pdf import PdfPages
import matplotlib.pyplot as plt
from pathlib import Path
from datetime import datetime

from .charts import fig_price, fig_cumulative, fig_drawdown, fig_rolling_vol, fig_rolling_sharpe


def _summary_page(pdf: PdfPages, metrics: dict, rf: float, interval: str):
    fig = plt.figure(figsize=(8.5, 11))
    fig.clf()
    t = fig.text
    y = 0.95
    t(0.1, y, "Automated Financial Report", fontsize=16, weight="bold")
    y -= 0.03
    t(0.1, y, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    y -= 0.05
    t(0.1, y, f"Risk-free (annual): {rf:.2%} Interval: {interval}")
    y -= 0.05

    for name, s in metrics["summary"].items():
        y -= 0.04
        t(0.1, y, f"Ticker: {name}", fontsize=12, weight="bold")
        y -= 0.035
        t(0.1, y, f"Period: {s['start']} → {s['end']}")
        y -= 0.03
        t(0.1, y, f"CAGR: {s['cagr']:.2%} Vol: {s['ann_vol']:.2%} Sharpe: {s['sharpe']:.2f} Max DD: {s['max_drawdown']:.2%}")
        y -= 0.03
        t(0.1, y, f"Best day: {s['best_day']:.2%} Worst day: {s['worst_day']:.2%}")
        y -= 0.02
        if y < 0.1:
            pdf.savefig(fig, bbox_inches="tight")
        fig = plt.figure(figsize=(8.5, 11)); fig.clf(); t = fig.text; y = 0.95

    pdf.savefig(fig, bbox_inches="tight")
    plt.close(fig)


def build_pdf_report(prices, metrics, out_path: Path, rf: float, interval: str):
    out_path = Path(out_path)
    with PdfPages(out_path) as pdf:
        _summary_page(pdf, metrics, rf, interval)
        pdf.savefig(fig_price(prices), bbox_inches="tight"); plt.close()
        pdf.savefig(fig_cumulative(metrics["cum"]), bbox_inches="tight"); plt.close()
        pdf.savefig(fig_drawdown(metrics["cum"]), bbox_inches="tight"); plt.close()
        pdf.savefig(fig_rolling_vol(metrics["rolling"]), bbox_inches="tight"); plt.close()
        pdf.savefig(fig_rolling_sharpe(metrics["rolling"]), bbox_inches="tight"); plt.close()