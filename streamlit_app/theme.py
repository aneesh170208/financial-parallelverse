"""Visual theme for the Streamlit app.

All styling lives in this Python module so the product keeps a single-language
codebase: no separate CSS, HTML or JavaScript files.
"""

from __future__ import annotations

import streamlit as st

_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --fpv-bg: #07111d;
  --fpv-panel: #0b1726;
  --fpv-panel-2: #0e1d2f;
  --fpv-line: rgba(148, 163, 184, 0.15);
  --fpv-line-strong: rgba(148, 163, 184, 0.24);
  --fpv-ink: #eef5f1;
  --fpv-muted: #9fb0c2;
  --fpv-faint: #6f8297;
  --fpv-emerald: #3ddc97;
  --fpv-emerald-soft: rgba(61, 220, 151, 0.12);
  --fpv-amber: #f6c56b;
  --fpv-rose: #fb7185;
  --fpv-blue: #7db7ff;
  --fpv-radius: 18px;
}

html, body, [class*="css"] {
  font-family: "Manrope", "Segoe UI", system-ui, -apple-system, sans-serif;
}

.stApp {
  background:
    radial-gradient(900px 520px at 12% -8%, rgba(61, 220, 151, 0.09), transparent 60%),
    radial-gradient(720px 420px at 96% 2%, rgba(125, 183, 255, 0.07), transparent 60%),
    var(--fpv-bg);
  color: var(--fpv-ink);
}

[data-testid="stHeader"] {
  background: rgba(7, 17, 29, 0.72);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.10);
}

#MainMenu, footer, [data-testid="stToolbar"], [data-testid="stDecoration"] {
  visibility: hidden;
}

.block-container {
  max-width: 1320px;
  padding-top: 2.4rem;
  padding-bottom: 4rem;
}

/* ------------------------------------------------------------------ sidebar */
[data-testid="stSidebar"] {
  background:
    linear-gradient(180deg, rgba(13, 26, 42, 0.98), rgba(7, 17, 29, 0.98)),
    var(--fpv-bg);
  border-right: 1px solid var(--fpv-line);
}

[data-testid="stSidebar"] > div:first-child {
  padding-top: 1.4rem;
}

[data-testid="stSidebarNav"] {
  padding-top: 0.35rem;
}

[data-testid="stSidebarNav"] a {
  border-radius: 11px;
  margin: 2px 0;
  color: var(--fpv-muted);
  font-size: 0.82rem;
  font-weight: 600;
  transition: background 140ms ease, color 140ms ease;
}

[data-testid="stSidebarNav"] a:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--fpv-ink);
}

[data-testid="stSidebarNav"] a[aria-current="page"] {
  background: rgba(61, 220, 151, 0.09);
  color: var(--fpv-ink);
  box-shadow: inset 2px 0 0 var(--fpv-emerald);
}

/* --------------------------------------------------------------------- type */
.fpv-brand {
  display: flex;
  align-items: center;
  gap: 0.72rem;
  padding: 0.1rem 0.25rem 0.9rem;
}

.fpv-brand-mark {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 13px;
  border: 1px solid rgba(61, 220, 151, 0.30);
  background: linear-gradient(145deg, rgba(61, 220, 151, 0.19), rgba(61, 220, 151, 0.04));
  color: var(--fpv-emerald);
  font-size: 1.05rem;
  box-shadow: 0 14px 34px -22px rgba(61, 220, 151, 0.85);
}

.fpv-brand-name {
  display: block;
  color: var(--fpv-ink);
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.fpv-brand-accent { color: var(--fpv-emerald); }

.fpv-brand-tag {
  display: block;
  margin-top: 0.15rem;
  color: var(--fpv-faint);
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fpv-eyebrow {
  margin-bottom: 0.35rem;
  color: var(--fpv-emerald);
  font-family: "JetBrains Mono", monospace;
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.fpv-title {
  margin: 0;
  color: var(--fpv-ink);
  font-size: clamp(1.65rem, 2.4vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 1.08;
}

.fpv-subtitle {
  max-width: 760px;
  margin: 0.5rem 0 0;
  color: var(--fpv-muted);
  font-size: 0.9rem;
  line-height: 1.65;
}

.fpv-section {
  margin: 0.2rem 0 0.75rem;
  color: var(--fpv-ink);
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.fpv-caption {
  color: var(--fpv-faint);
  font-size: 0.7rem;
  line-height: 1.55;
}

h1, h2, h3, h4 {
  font-family: "Manrope", system-ui, sans-serif;
  letter-spacing: -0.025em;
}

h2 { font-size: 1.28rem; font-weight: 700; }
h3 { font-size: 1rem; font-weight: 700; }

p, label, .stMarkdown p {
  color: var(--fpv-muted);
}

[data-testid="stCaptionContainer"] p {
  color: var(--fpv-faint);
  font-size: 0.72rem;
}

a { color: var(--fpv-emerald); }

/* ------------------------------------------------------------------- badges */
.fpv-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  margin: 0.1rem 0 0.55rem;
  border: 1px solid var(--fpv-line);
  border-radius: 999px;
  padding: 0.16rem 0.56rem;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.58rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fpv-badge-positive { border-color: rgba(61, 220, 151, 0.28); background: rgba(61, 220, 151, 0.09); color: #7ff0bb; }
.fpv-badge-warning { border-color: rgba(246, 197, 107, 0.28); background: rgba(246, 197, 107, 0.09); color: #ffd99a; }
.fpv-badge-danger { border-color: rgba(251, 113, 133, 0.28); background: rgba(251, 113, 133, 0.09); color: #ff9daa; }
.fpv-badge-neutral { background: rgba(148, 163, 184, 0.08); color: var(--fpv-muted); }
.fpv-badge-blue { border-color: rgba(125, 183, 255, 0.28); background: rgba(125, 183, 255, 0.09); color: #a9ceff; }

/* ------------------------------------------------------------------ metrics */
[data-testid="stMetric"] {
  border: 1px solid var(--fpv-line);
  border-radius: var(--fpv-radius);
  background: linear-gradient(180deg, rgba(20, 38, 58, 0.72), rgba(11, 23, 38, 0.86));
  padding: 0.9rem 1rem;
  box-shadow: 0 18px 50px -42px rgba(0, 0, 0, 0.95);
}

[data-testid="stMetricLabel"] {
  color: var(--fpv-faint);
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

[data-testid="stMetricValue"] {
  color: var(--fpv-ink);
  font-family: "Manrope", sans-serif;
  font-size: 1.48rem;
  font-weight: 700;
  letter-spacing: -0.035em;
}

[data-testid="stMetricDelta"] {
  font-family: "JetBrains Mono", monospace;
  font-size: 0.65rem;
}

/* --------------------------------------------------------------- containers */
[data-testid="stVerticalBlockBorderWrapper"] {
  border-radius: var(--fpv-radius);
}

[data-testid="stVerticalBlockBorderWrapper"] > div {
  border-color: var(--fpv-line) !important;
}

div[data-testid="stVerticalBlockBorderWrapper"] {
  background: linear-gradient(180deg, rgba(18, 34, 52, 0.58), rgba(9, 20, 34, 0.78));
  border: 1px solid var(--fpv-line);
  border-radius: var(--fpv-radius);
  padding: 0.15rem;
}

[data-testid="stForm"] {
  border: 1px solid var(--fpv-line);
  border-radius: var(--fpv-radius);
  background: rgba(11, 23, 38, 0.55);
  padding: 1.15rem 1.15rem 0.65rem;
}

[data-testid="stExpander"] {
  border: 1px solid var(--fpv-line);
  border-radius: 14px;
  background: rgba(11, 23, 38, 0.46);
  overflow: hidden;
}

[data-testid="stExpander"] summary {
  color: var(--fpv-muted);
  font-size: 0.8rem;
  font-weight: 600;
}

/* ------------------------------------------------------------------ widgets */
[data-baseweb="input"] > div,
[data-baseweb="select"] > div,
[data-baseweb="textarea"] > div,
[data-testid="stNumberInputContainer"] > div,
[data-testid="stDateInputContainer"] > div {
  border-color: var(--fpv-line) !important;
  border-radius: 11px !important;
  background: #091522 !important;
}

input, textarea {
  color: var(--fpv-ink) !important;
  font-family: "Manrope", sans-serif !important;
}

[data-testid="stWidgetLabel"] p {
  color: var(--fpv-muted);
  font-size: 0.73rem;
  font-weight: 600;
}

[data-testid="stSlider"] [role="slider"] {
  background: var(--fpv-emerald);
  border-color: var(--fpv-emerald);
}

[data-baseweb="slider"] div[data-testid="stSliderTickBar"] {
  color: var(--fpv-faint);
}

[data-baseweb="checkbox"] span,
[data-baseweb="radio"] span {
  color: var(--fpv-muted);
}

/* ------------------------------------------------------------------ buttons */
.stButton > button,
.stFormSubmitButton > button,
.stDownloadButton > button {
  border-radius: 11px;
  border: 1px solid var(--fpv-line-strong);
  background: rgba(255, 255, 255, 0.025);
  color: var(--fpv-ink);
  font-family: "Manrope", sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  min-height: 2.45rem;
  transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
}

.stButton > button:hover,
.stFormSubmitButton > button:hover {
  border-color: rgba(61, 220, 151, 0.45);
  background: rgba(61, 220, 151, 0.08);
  color: var(--fpv-ink);
  transform: translateY(-1px);
}

.stButton > button[kind="primary"],
.stFormSubmitButton > button[kind="primary"] {
  border: 1px solid rgba(61, 220, 151, 0.55);
  background: linear-gradient(135deg, #47e6a3, #2bbf80);
  color: #04120c;
  box-shadow: 0 12px 28px -18px rgba(61, 220, 151, 0.85);
}

.stButton > button[kind="primary"]:hover,
.stFormSubmitButton > button[kind="primary"]:hover {
  background: linear-gradient(135deg, #5aefb1, #35ce8e);
  color: #04120c;
}

/* --------------------------------------------------------------- dataframes */
[data-testid="stDataFrame"] {
  border: 1px solid var(--fpv-line);
  border-radius: 14px;
  overflow: hidden;
}

/* ------------------------------------------------------------------- alerts */
[data-testid="stAlert"] {
  border-radius: 14px;
  border: 1px solid var(--fpv-line);
  background: rgba(13, 27, 44, 0.85);
  color: var(--fpv-ink);
}

[data-testid="stAlert"] p {
  color: var(--fpv-ink);
  font-size: 0.8rem;
}

/* --------------------------------------------------------------------- tabs */
[data-baseweb="tab-list"] {
  gap: 0.35rem;
  border-bottom: 1px solid var(--fpv-line);
}

[data-baseweb="tab"] {
  color: var(--fpv-faint);
  font-size: 0.78rem;
  font-weight: 700;
  border-radius: 10px 10px 0 0;
  padding: 0.55rem 0.9rem;
}

[data-baseweb="tab"][aria-selected="true"] {
  color: var(--fpv-ink);
  background: rgba(61, 220, 151, 0.07);
}

[data-baseweb="tab-highlight"] {
  background: var(--fpv-emerald);
}

/* ----------------------------------------------------------------- progress */
[data-testid="stProgress"] > div > div > div > div {
  background: linear-gradient(90deg, #2bbf80, #5cf0b6);
}

/* ------------------------------------------------------------------ charts */
[data-testid="stVegaLiteChart"] {
  border-radius: 14px;
}

.fpv-divider {
  height: 1px;
  margin: 0.6rem 0 1rem;
  background: linear-gradient(90deg, transparent, var(--fpv-line), transparent);
}

.fpv-empty {
  border: 1px dashed var(--fpv-line-strong);
  border-radius: var(--fpv-radius);
  background: rgba(11, 23, 38, 0.35);
  padding: 2rem 1.25rem;
  text-align: center;
}

.fpv-empty-icon { font-size: 1.6rem; }
.fpv-empty-title { margin-top: 0.5rem; color: var(--fpv-ink); font-size: 0.9rem; font-weight: 700; }
.fpv-empty-body { max-width: 460px; margin: 0.4rem auto 0; color: var(--fpv-faint); font-size: 0.76rem; line-height: 1.6; }

.fpv-kv {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.36rem 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  color: var(--fpv-muted);
  font-size: 0.74rem;
}

.fpv-kv:last-child { border-bottom: none; }
.fpv-kv b { color: var(--fpv-ink); font-weight: 600; }

.fpv-callout {
  border: 1px solid rgba(61, 220, 151, 0.22);
  border-radius: 14px;
  background: rgba(61, 220, 151, 0.06);
  padding: 0.85rem 1rem;
  color: #c8f7e2;
  font-size: 0.78rem;
  line-height: 1.6;
}

.fpv-callout-warn {
  border-color: rgba(246, 197, 107, 0.24);
  background: rgba(246, 197, 107, 0.06);
  color: #ffe6b8;
}

.fpv-footer-note {
  margin-top: 1rem;
  color: var(--fpv-faint);
  font-size: 0.64rem;
  line-height: 1.6;
}

/* ------------------------------------------------------------------- mobile */
@media (max-width: 740px) {
  .block-container { padding-top: 1.4rem; padding-left: 1rem; padding-right: 1rem; }
  .fpv-title { font-size: 1.55rem; }
  [data-testid="stMetricValue"] { font-size: 1.2rem; }
  [data-testid="stSidebar"] { min-width: 260px; }
}
</style>
"""


def apply_theme() -> None:
    st.markdown(_CSS, unsafe_allow_html=True)


def sidebar_brand() -> None:
    st.sidebar.markdown(
        """
        <div class="fpv-brand">
          <div class="fpv-brand-mark">◈</div>
          <div>
            <span class="fpv-brand-name">Financial <span class="fpv-brand-accent">Parallelverse</span></span>
            <span class="fpv-brand-tag">Local-first money simulations</span>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
