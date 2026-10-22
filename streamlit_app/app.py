"""Financial Parallelverse — Streamlit entrypoint.

The Streamlit app is a thin client for the FastAPI service. All financial
calculations and persistence live behind the API; the UI only formats responses,
collects input and renders deterministic charts.
"""

from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st

# When Streamlit launches this file directly, make the repository importable.
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

st.set_page_config(
    page_title="Financial Parallelverse",
    page_icon="🌌",
    layout="wide",
    initial_sidebar_state="expanded",
    menu_items={
        "About": (
            "Financial Parallelverse is a local-first demonstration of deterministic "
            "purchase simulations. It is not financial advice."
        )
    },
)

from streamlit_app import theme, ui  # noqa: E402
from streamlit_app.views import emi, futures, installments, overview, planner, profile  # noqa: E402


def main() -> None:
    theme.apply_theme()

    with st.sidebar:
        theme.sidebar_brand()
        st.markdown('<div class="fpv-divider"></div>', unsafe_allow_html=True)

    pages = [
        st.Page(
            overview.render,
            title="Overview",
            icon="🏠",
            url_path="overview",
            default=True,
        ),
        st.Page(
            futures.render,
            title="Parallel Futures",
            icon="🧭",
            url_path="futures",
        ),
        st.Page(
            planner.render,
            title="Purchase Planner",
            icon="🎯",
            url_path="planner",
        ),
        st.Page(
            emi.render,
            title="EMI Calculator",
            icon="🧮",
            url_path="emi",
        ),
        st.Page(
            installments.render,
            title="Installment Tracker",
            icon="🗓️",
            url_path="installments",
        ),
        st.Page(
            profile.render,
            title="Financial Profile",
            icon="👤",
            url_path="profile",
        ),
    ]

    navigation = st.navigation(pages, position="sidebar")

    with st.sidebar:
        st.markdown('<div class="fpv-divider"></div>', unsafe_allow_html=True)
        ui.sidebar_status()

    ui.flush_flash()
    navigation.run()


if __name__ == "__main__":
    main()
