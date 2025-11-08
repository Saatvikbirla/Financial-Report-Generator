"use client";

import React, { useEffect, useMemo, useState } from "react";

// Minimal, single-file React component for a Next.js App Router page (app/page.tsx)
// Assumes a FastAPI backend running at http://localhost:8000 with these endpoints:
// POST /web/compute  { tickers: string[], start: string, end: string, interval: "1d"|"1wk"|"1mo", rf?: number }
//    -> returns { prices: Record<ticker, Array<{date:string, price:number}>>, cum: Record<ticker, Array<{date:string, value:number}>>, drawdown: Record<ticker, Array<{date:string, dd:number}>>, roll:{ vol: Record<ticker,Array<{date:string, value:number}>>, sharpe: Record<ticker,Array<{date:string, value:number}>> }, summary: Record<ticker, {...metrics}} }
// GET  /web/pdf?tickers=AAPL,MSFT&start=2020-01-01&end=2025-11-07&interval=1d&rf=0.02 -> application/pdf
// You can wire these in the backend by wrapping your existing metrics & report functions.

// Lightweight ticker list (expand to your full universe or fetch from your own endpoint)
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
  { symbol: "BRK.B", name: "Berkshire Hathaway Inc. Class B" },
  { symbol: "SHOP", name: "Shopify Inc." },
  { symbol: "RY.TO", name: "Royal Bank of Canada (TSX)" },
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
  const [data, setData] = useState<any | null>(null);
  const [showSticky, setShowSticky] = useState(false);

  // Autocomplete filter (starts-with on symbol or name)
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMON_TICKERS.slice(0, 6);
    return COMMON_TICKERS.filter(
      (t) => t.symbol.toLowerCase().startsWith(q) || t.name.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query]);

  function addTicker(sym: string) {
    setQuery("");
    setSelected((prev) => {
      if (prev.includes(sym)) return prev;
      if (prev.length >= 5) return prev; // limit 5
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
        body: JSON.stringify({ tickers: selected, start, end, interval, rf: Number(rf) || 0 }),
      });
      if (!res.ok) throw new Error(`Compute error ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      alert("Failed to compute report. Check backend.");
    } finally {
      setLoading(false);
    }
  }

  function downloadPDF() {
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
      {/* Sticky top bar once results are shown */}
      <div className={classNames("sticky top-0 z-40 border-b border-white/10 bg-[#0b0f1acc] backdrop-blur", !showSticky && "hidden")}> 
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          {/* Chips */}
          <div className="flex flex-wrap gap-2">
            {selected.map((s) => (
              <span key={s} className="rounded-full bg-white/10 px-3 py-1 text-sm">
                {s}
                <button className="ml-2 text-white/70 hover:text-white" onClick={() => removeTicker(s)}>×</button>
              </span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded bg-white/10 px-2 py-1"/>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded bg-white/10 px-2 py-1"/>
            <select value={interval} onChange={(e) => setInterval(e.target.value as any)} className="rounded bg-white/10 px-2 py-1">
              <option value="1d">1d</option>
              <option value="1wk">1wk</option>
              <option value="1mo">1mo</option>
            </select>
            <button onClick={runReport} className="rounded bg-emerald-500 px-3 py-1 font-medium hover:bg-emerald-400 disabled:opacity-50" disabled={loading}>Run</button>
            <button onClick={downloadPDF} className="rounded bg-indigo-500 px-3 py-1 font-medium hover:bg-indigo-400 disabled:opacity-50" disabled={!data}>Download PDF</button>
          </div>
        </div>
      </div>

      {/* Hero / Landing */}
      <header className="mx-auto max-w-6xl px-4 pt-16 pb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">What do you want to know?</h1>
        <p className="mt-3 text-white/80 max-w-2xl">Crypto, stocks, investments — pick up to 5 tickers, a date range, and get an instant performance report with charts and downloadable PDF.</p>
      </header>

      {/* Input Card */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-3">
              <label className="mb-1 block text-sm text-white/70">Company stocks (max 5)</label>
              <div className="rounded-xl border border-white/10 bg-[#0f1526] p-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {selected.map((s) => (
                    <span key={s} className="rounded-full bg-white/10 px-3 py-1 text-sm">
                      {s}
                      <button className="ml-2 text-white/70 hover:text-white" onClick={() => removeTicker(s)}>×</button>
                    </span>
                  ))}
                </div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value.toUpperCase())}
                  placeholder="Search tickers (e.g., AAPL, MSFT)"
                  className="w-full rounded-lg bg-transparent px-3 py-2 outline-none placeholder:text-white/40"
                />
                {/* Suggestions */}
                {query && (
                  <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-white/10 bg-[#0b0f1a]">
                    {suggestions.length === 0 && (
                      <div className="p-2 text-white/60">No matches</div>
                    )}
                    {suggestions.map((t) => (
                      <button
                        key={t.symbol}
                        onClick={() => addTicker(t.symbol)}
                        className="block w-full text-left px-3 py-2 hover:bg-white/10"
                      >
                        <div className="font-mono">{t.symbol}</div>
                        <div className="text-xs text-white/70">{t.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-white/50">Tip: start typing a symbol or company name. Example: NVDA, AAPL, TSLA.</p>
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-white/70">Start date</label>
                <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full rounded-lg bg-white/10 px-3 py-2"/>
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/70">End date</label>
                <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full rounded-lg bg-white/10 px-3 py-2"/>
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/70">Interval</label>
                <select value={interval} onChange={(e) => setInterval(e.target.value as any)} className="w-full rounded-lg bg-white/10 px-3 py-2">
                  <option value="1d">1 day</option>
                  <option value="1wk">1 week</option>
                  <option value="1mo">1 month</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/70">Risk‑free (annual)</label>
                <input type="number" step="0.001" value={rf} onChange={(e) => setRf(e.target.value)} className="w-full rounded-lg bg-white/10 px-3 py-2"/>
                <p className="mt-1 text-xs text-white/50">e.g., 0.02 = 2%</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={runReport} disabled={loading || selected.length === 0} className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold hover:bg-emerald-400 disabled:opacity-50">{loading ? "Running..." : "Generate report"}</button>
            <button onClick={downloadPDF} disabled={!data} className="rounded-xl bg-indigo-500 px-4 py-2 font-semibold hover:bg-indigo-400 disabled:opacity-50">Download PDF</button>
          </div>
        </div>
      </section>

      {/* Results */}
      {data && (
        <section className="mx-auto max-w-6xl px-4 mt-10 mb-20">
          <h2 className="text-2xl font-bold mb-4">Report</h2>
          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries<any>(data.summary).map(([ticker, s]) => (
              <div key={ticker} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">{ticker}</div>
                  <div className="text-xs text-white/60">{s.start} → {s.end}</div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>CAGR</div><div className="text-right">{(s.cagr*100).toFixed(2)}%</div>
                  <div>Volatility</div><div className="text-right">{(s.ann_vol*100).toFixed(2)}%</div>
                  <div>Sharpe</div><div className="text-right">{(s.sharpe).toFixed(2)}</div>
                  <div>Max DD</div><div className="text-right">{(s.max_drawdown*100).toFixed(2)}%</div>
                  <div>Best day</div><div className="text-right">{(s.best_day*100).toFixed(2)}%</div>
                  <div>Worst day</div><div className="text-right">{(s.worst_day*100).toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>

          {/* Lightweight SVG charts using HTML5 (to avoid extra deps). For production, swap to Recharts/Chart.js. */}
          <div className="mt-10 grid gap-8">
            <TimeseriesPanel title="Adjusted Close Price" series={data.prices} />
            <TimeseriesPanel title="Cumulative Return (1=Start)" series={data.cum} />
            <TimeseriesPanel title="Drawdowns" series={data.drawdown} />
            <TimeseriesPanel title="Rolling Volatility" series={data.roll?.vol || {}} />
            <TimeseriesPanel title="Rolling Sharpe" series={data.roll?.sharpe || {}} />
          </div>
        </section>
      )}

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-white/50 text-sm">© {new Date().getFullYear()} FinReport MVP</footer>
    </div>
  );
}

// Very small inline chart renderer without external libraries
function TimeseriesPanel({
  title,
  series,
}: {
  title: string;
  series: Record<string, Array<{ date: string; price?: number; value?: number; dd?: number }>>;
}) {
  const colors = ["#a5b4fc", "#34d399", "#f472b6", "#60a5fa", "#fbbf24"]; // just a few soft hues
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 font-semibold">{title}</div>
      <div className="overflow-x-auto">
        <MiniLines series={series} colors={colors} />
      </div>
    </div>
  );
}

function MiniLines({ series, colors }: { series: Record<string, Array<{date: string; price?: number; value?: number; dd?: number}>>; colors: string[] }) {
  const keys = Object.keys(series);
  const width = 900; const height = 220; const pad = 36;

  // Flatten and scale
  const lines = keys.map((k) => ({ key: k, pts: series[k].map((d) => ({ x: new Date(d.date).getTime(), y: (d.price ?? d.value ?? d.dd ?? 0) })) }));
  const allX = lines.flatMap(l => l.pts.map(p => p.x));
  const allY = lines.flatMap(l => l.pts.map(p => p.y)).filter(v => Number.isFinite(v));
  if (allX.length === 0 || allY.length === 0) return <div className="text-white/60">No data</div>;
  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const minY = Math.min(...allY), maxY = Math.max(...allY);

  function sx(x:number){ return pad + ( (x - minX) / (maxX - minX || 1) ) * (width - 2*pad); }
  function sy(y:number){ return height - pad - ( (y - minY) / (maxY - minY || 1) ) * (height - 2*pad); }

  // Axis ticks (dates)
  const ticks = 5;
  const tickXs = new Array(ticks).fill(0).map((_,i)=> minX + (i*(maxX-minX))/(ticks-1));

  return (
    <svg width={width} height={height} className="min-w-[900px]">
      {/* grid */}
      <g>
        {new Array(4).fill(0).map((_,i)=>{
          const y = pad + i*((height-2*pad)/4);
          return <line key={i} x1={pad} x2={width-pad} y1={y} y2={y} stroke="rgba(255,255,255,0.08)"/>;
        })}
      </g>

      {/* lines */}
      {lines.map((l, idx) => {
        const d = l.pts.map((p, i) => `${i===0 ? 'M' : 'L'} ${sx(p.x)} ${sy(p.y)}`).join(" ");
        return <path key={l.key} d={d} fill="none" stroke={colors[idx % colors.length]} strokeWidth={2}/>;
      })}

      {/* axes */}
      <line x1={pad} x2={pad} y1={pad} y2={height-pad} stroke="rgba(255,255,255,0.3)"/>
      <line x1={pad} x2={width-pad} y1={height-pad} y2={height-pad} stroke="rgba(255,255,255,0.3)"/>

      {/* labels */}
      {tickXs.map((tx, i) => (
        <g key={i}>
          <line x1={sx(tx)} x2={sx(tx)} y1={height-pad} y2={height-pad+6} stroke="rgba(255,255,255,0.3)"/>
          <text x={sx(tx)} y={height-pad+18} textAnchor="middle" fontSize={10} fill="#cbd5e1">{new Date(tx).toISOString().slice(0,10)}</text>
        </g>
      ))}

      {/* legend */}
      <g>
        {Object.keys(series).map((k, i) => (
          <g key={k} transform={`translate(${pad + i*140}, ${pad-16})`}>
            <rect width="10" height="10" fill={colors[i % colors.length]} />
            <text x={14} y={10} fontSize={12} fill="#e2e8f0">{k}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}
