# 📊 Financial Report Generator

![Status](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)
![Stars](https://img.shields.io/github/stars/yourusername/Financial-Report-Generator?style=social)
![Forks](https://img.shields.io/github/forks/yourusername/Financial-Report-Generator?style=social)
![Issues](https://img.shields.io/github/issues/yourusername/Financial-Report-Generator)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen)

## 🔧 Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-0EA5E9?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-FF6384?style=for-the-badge&logo=recharts&logoColor=white)

![FastAPI](https://img.shields.io/badge/FastAPI-05998B?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-013243?style=for-the-badge&logo=numpy&logoColor=white)

---

# 📘 Overview

The **Financial Report Generator** is a full‑stack application that produces stock analysis reports, interactive charts, and downloadable PDFs for up to **five US‑listed companies** at once.

It is built using:

- **FastAPI** for backend financial computations  
- **Next.js + React** for the frontend  
- **TailwindCSS** for the styling  
- **Recharts** for interactive visualizations  
- **Python (Pandas, NumPy, ReportLab)** for analytics and PDF rendering  
- **yfinance** for real‑time stock market data  
- **Local CSV Ticker Search** for fast and reliable autocomplete  

This project showcases combined skills in **frontend development**, **data analysis**, **API design**, **backend engineering**, and **UX/UI design**.

---

# 🚀 Features

### 🔍 Intelligent Stock Search
- Search any US‑listed stock  
- Suggestive autocomplete  
- Powered by local CSV for speed + reliability  

### 📈 Data Visualizations
- Interactive price charts  
- Cumulative returns  
- Drawdowns  
- Rolling volatility  
- Rolling Sharpe ratio  

### 📝 Financial Metrics
For each stock:
- Total return  
- CAGR  
- Max drawdown  
- Annualized volatility  
- Sharpe ratio  
- Best/worst return days  

### 📄 Exportable PDF Report
Includes:
- Summary statistics  
- Clean charts  
- Analysis breakdown  
- Time range & tickers selected  

---

# 📁 Project Structure

```
Financial-Report-Generator/
│
├── backend/
│   ├── app.py
│   ├── finance/
│   │   ├── fetch.py
│   │   ├── metrics.py
│   │   ├── charts.py
│   │   └── pdf.py
│   └── data/
│       └── us_symbols.csv
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── next.config.mjs
│
└── README.md
```

---

# 🧑‍💻 Installation

## Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Backend runs at **http://localhost:8000**  
Frontend runs at **http://localhost:3000**

---

# ⭐ Author

**Saatvik Birla**  
_Data Analyst_
