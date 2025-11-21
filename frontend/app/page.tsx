"use client";

import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type SummaryEntry = {
  start: string;
  end: string;
  cagr: number;
  ann_vol: number;
  sharpe: number;
  max_drawdown: number;
  best_day: number;
  worst_day: number;
};

type BackendData = {
  prices: Record<string, Array<{ date: string; price: number }>>;
  cum: Record<string, Array<{ date: string; value: number }>>;
  drawdown: Record<string, Array<{ date: string; value: number }>>;
  roll: {
    vol: Record<string, Array<{ date: string; value: number }>>;
    sharpe: Record<string, Array<{ date: string; value: number }>>;
  };
  summary: Record<string, SummaryEntry>;
  errors?: Record<string, string>;
};

const COMMON_TICKERS: { symbol: string; name: string }[] = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc. (Class A)" },
  { symbol: "AMZN", name: "Amazon.com, Inc." },
  { symbol: "META", name: "Meta Platforms, Inc." },
  { symbol: "TSLA", name: "Tesla, Inc." },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "NFLX", name: "Netflix, Inc." },
  { symbol: "JPM", name: "JPMorgan Chase & Co." },
  { symbol: "V", name: "Visa Inc." },
  { symbol: "MA", name: "Mastercard Incorporated" },
  { symbol: "AMD", name: "Advanced Micro Devices, Inc." },
  { symbol: "INTC", name: "Intel Corporation" },
  // removed BRK.B because yfinance is flaky with it
  { symbol: "SHOP", name: "Shopify Inc." },
];

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function FinancialReportApp() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [start, setStart] = useState<string>("2020-01-01");
  const [end, setEnd] = useState<string>(new Date().toISOString().slice(0, 10));
  const [interval, setInterval] = useState<"1d" | "1wk" | "1mo">("1d");
  const [rf, setRf] = useState<string>("0.02");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BackendData | null>(null);
  const [backendErrors, setBackendErrors] = useState<Record<string, string>>({});
  const [showSticky, setShowSticky] = useState(false);

  // Autocomplete suggestions
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMON_TICKERS.slice(0, 6);
    return COMMON_TICKERS.filter(
      (t) => t.symbol.toLowerCase().startsWith(q) || t.name.toLowerCase().includes(q),
    ).slice(0, 10);
  }, [query]);

  function addTicker(sym: string) {
    setQuery("");
    setSelected((prev) => {
      if (prev.includes(sym)) return prev;
      if (prev.length >= 5) return prev;
      return [...prev, sym];
    });
  }

  function removeTicker(sym: string) {
    setSelected((prev) => prev.filter((s) => s !== sym));
  }

  async function runReport() {
    if (selected.length === 0) return;
    setLoading(true);
    setShowSticky(true);
    try {
      const res = await fetch("http://localhost:8000/web/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tickers: selected,
          start,
          end,
          interval,
          rf: Number(rf) || 0,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Compute error ${res.status}: ${txt}`);
      }
      const json = (await res.json()) as BackendData;
      setData(json);
      setBackendErrors(json.errors || {});
    } catch (e) {
      console.error(e);
      alert("Failed to compute report. Check backend logs for details.");
    } finally {
      setLoading(false);
    }
  }

  function downloadPDF() {
    if (selected.length === 0) return;
    const params = new URLSearchParams({
      tickers: selected.join(","),
      start,
      end,
      interval,
      rf: rf || "0",
    });
    const url = `http://localhost:8000/web/pdf?${params.toString()}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-report-${Date.now()}.pdf`;
    a.click();
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white">
      {/* Sticky bar when results are shown */}
      {/*
      <div
        className={classNames(
          "sticky top-0 z-40 border-b border-white/10 bg-[#0b0f1acc] backdrop-blur",
          !showSticky && "hidden",
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {selected.map((s) => (
              <span
                key={s}
                className="rounded-full bg-white/10 px-3 py-1 text-sm"
              >
                {s}
                <button
                  className="ml-2 text-white/70 hover:text-white"
                  onClick={() => removeTicker(s)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="rounded bg-white/10 px-2 py-1"
            />
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="rounded bg-white/10 px-2 py-1"
            />
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value as any)}
              className="rounded bg-white/10 px-2 py-1"
            >
              <option value="1d">1d</option>
              <option value="1wk">1wk</option>
              <option value="1mo">1mo</option>
            </select>
            <button
              onClick={runReport}
              className="rounded bg-emerald-500 px-3 py-1 font-medium hover:bg-emerald-400 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Running..." : "Run"}
            </button>
            <button
              onClick={downloadPDF}
              className="rounded bg-indigo-500 px-3 py-1 font-medium hover:bg-indigo-400 disabled:opacity-50"
              disabled={!data}
            >
              Download PDF
            </button>
          </div>
        </div>
      </div> */}

      {/* Hero */}
      <header className="mx-auto max-w-6xl px-4 pb-10 pt-16">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
          What do you want to know?
        </h1>
        <p className="mt-3 max-w-2xl text-white/80">
          Crypto, stocks, investments — pick up to 5 tickers, a date range, and
          get an instant performance report with charts and a downloadable PDF.
        </p>
      </header>

      {/* Input Card */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="grid gap-4 md:grid-cols-5">
            {/* Tickers */}
            <div className="md:col-span-3">
              <label className="mb-1 block text-sm text-white/70">
                Company stocks (max 5)
              </label>
              <div className="rounded-xl border border-white/10 bg-[#0f1526] p-2">
                <div className="mb-2 flex flex-wrap gap-2">
                  {selected.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-white/10 px-3 py-1 text-sm"
                    >
                      {s}
                      <button
                        className="ml-2 text-white/70 hover:text-white"
                        onClick={() => removeTicker(s)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tickers (e.g., AAPL, MSFT, TSLA)"
                  className="w-full rounded-lg bg-transparent px-3 py-2 outline-none placeholder:text-white/40"
                />
                {query && (
                  <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-white/10 bg-[#0b0f1a]">
                    {suggestions.length === 0 && (
                      <div className="p-2 text-white/60">No matches</div>
                    )}
                    {suggestions.map((t) => (
                      <button
                        key={t.symbol}
                        onClick={() => addTicker(t.symbol)}
                        className="block w-full px-3 py-2 text-left hover:bg-white/10"
                      >
                        <div className="font-mono">{t.symbol}</div>
                        <div className="text-xs text-white/70">{t.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-white/50">
                Tip: start typing a symbol or company name. Example: NVDA, AAPL,
                TSLA.
              </p>
            </div>

            {/* Dates / interval / rf */}
            <div className="grid grid-cols-2 gap-3 md:col-span-2">
              <div>
                <label className="mb-1 block text-sm text-white/70">
                  Start date
                </label>
                <input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full rounded-lg bg-white/10 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/70">
                  End date
                </label>
                <input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full rounded-lg bg-white/10 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/70">
                  Interval
                </label>
                <select
                  value={interval}
                  onChange={(e) =>
                    setInterval(e.target.value as "1d" | "1wk" | "1mo")
                  }
                  className="w-full rounded-lg bg-white/10 px-3 py-2"
                >
                  <option value="1d">1 day</option>
                  <option value="1wk">1 week</option>
                  <option value="1mo">1 month</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/70">
                  Risk-free (annual)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={rf}
                  onChange={(e) => setRf(e.target.value)}
                  className="w-full rounded-lg bg-white/10 px-3 py-2"
                />
                <p className="mt-1 text-xs text-white/50">e.g., 0.02 = 2%</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={runReport}
              disabled={loading || selected.length === 0}
              className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold hover:bg-emerald-400 disabled:opacity-50"
            >
              {loading ? "Running..." : "Generate report"}
            </button>
            <button
              onClick={downloadPDF}
              disabled={!data}
              className="rounded-xl bg-indigo-500 px-4 py-2 font-semibold hover:bg-indigo-400 disabled:opacity-50"
            >
              Download PDF
            </button>
          </div>
        </div>
      </section>

      {/* Report section */}
      {data && (
        <section className="mx-auto mt-10 mb-20 max-w-6xl px-4">
          <h2 className="mb-4 text-2xl font-bold">Report</h2>

          {backendErrors && Object.keys(backendErrors).length > 0 && (
            <div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              <div className="mb-1 font-semibold">
                Some tickers were skipped:
              </div>
              <ul className="list-disc space-y-1 pl-5">
                {Object.entries(backendErrors).map(([ticker, msg]) => (
                  <li key={ticker}>
                    <span className="font-mono">{ticker}</span>: {msg}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary table */}
          <div className="mb-8 overflow-x-auto rounded-xl border border-white/10 bg-white/5">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/70">
                    Ticker
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/70">
                    Period
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-white/70">
                    CAGR
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-white/70">
                    Volatility
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-white/70">
                    Sharpe
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-white/70">
                    Max DD
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-white/70">
                    Best day
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-white/70">
                    Worst day
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.summary).map(([ticker, s], idx) => (
                  <tr
                    key={ticker}
                    className={idx % 2 === 0 ? "bg-transparent" : "bg-white/5"}
                  >
                    <td className="px-4 py-3 font-mono text-sm">{ticker}</td>
                    <td className="px-4 py-3 text-xs text-white/70">
                      {s.start} → {s.end}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(s.cagr * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(s.ann_vol * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.sharpe.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(s.max_drawdown * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(s.best_day * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(s.worst_day * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Charts */}
          <div className="mt-6 grid gap-8">
            <TimeseriesPanel
              title="Adjusted Close Price"
              series={data.prices}
            />
            <TimeseriesPanel
              title="Cumulative Return (1 = start)"
              series={data.cum}
            />
            <TimeseriesPanel title="Drawdowns" series={data.drawdown} />
            <TimeseriesPanel
              title="Rolling Annualized Volatility"
              series={data.roll?.vol || {}}
            />
            <TimeseriesPanel
              title="Rolling Sharpe Ratio"
              series={data.roll?.sharpe || {}}
            />
          </div>
        </section>
      )}

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-sm text-white/50">
        © {new Date().getFullYear()} FinReport MVP
      </footer>
    </div>
  );
}

/* ---------- Interactive chart panel ---------- */

type SeriesRecord = Record<
  string,
  Array<{ date: string; price?: number; value?: number; dd?: number }>
>;

function TimeseriesPanel({ title, series }: { title: string; series: SeriesRecord }) {
  const colors = ["#a5b4fc", "#34d399", "#f472b6", "#60a5fa", "#fbbf24"];

  const { chartData, keys } = useMemo(() => {
    const tickers = Object.keys(series || {});
    if (tickers.length === 0) {
      return { chartData: [] as any[], keys: [] as string[] };
    }

    const dateSet = new Set<string>();
    for (const t of tickers) {
      for (const p of series[t] || []) {
        if (p.date) dateSet.add(p.date);
      }
    }
    const dates = Array.from(dateSet).sort();

    const rows = dates.map((d) => {
      const row: any = { date: d };
      for (const t of tickers) {
        const entry = (series[t] || []).find((p) => p.date === d);
        const raw = entry ? entry.price ?? entry.value ?? entry.dd ?? null : null;
        row[t] = raw;
      }
      return row;
    });

    return { chartData: rows, keys: tickers };
  }, [series]);

  if (!chartData.length || !keys.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 font-semibold">{title}</div>
        <div className="text-sm text-white/60">No data available.</div>
      </div>
    );
  }

  return (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <div className="mb-2 font-semibold">{title}</div>
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148, 163, 184, 0.3)"
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#cbd5e1" }}
            tickMargin={8}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#cbd5e1" }}
            tickMargin={8}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#020617",
              border: "1px solid #1f2937",
            }}
            labelStyle={{ color: "#e5e7eb" }}
            formatter={(value: any, name: string) => {
              if (value == null || isNaN(value)) return ["–", name];
              return [value, name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {keys.map((k, idx) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke={colors[idx % colors.length]}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
  );

}