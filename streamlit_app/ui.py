"""Reusable Streamlit presentation helpers."""

from __future__ import annotations

import html
from datetime import date, datetime

import streamlit as st

from streamlit_app import api


def _indian_group(value: int) -> str:
    raw = str(value)
    if len(raw) <= 3:
        return raw
    head, tail = raw[:-3], raw[-3:]
    groups: list[str] = []
    while len(head) > 2:
        groups.insert(0, head[-2:])
        head = head[:-2]
    if head:
        groups.insert(0, head)
    return ",".join([*groups, tail])


def inr(value: float | int | None, *, decimals: int = 0, compact: bool = False) -> str:
    """Format a number using Indian digit grouping."""
    amount = float(value or 0)
    sign = "-" if amount < 0 else ""
    amount = abs(amount)

    if compact:
        if amount >= 1_00_00_000:
            return f"{sign}₹{amount / 1_00_00_000:.1f} Cr"
        if amount >= 1_00_000:
            return f"{sign}₹{amount / 1_00_000:.1f} L"
        if amount >= 1_000:
            return f"{sign}₹{amount / 1_000:.1f} K"
        return f"{sign}₹{amount:.0f}"

    rendered = f"{amount:,.{decimals}f}".replace(",", "")
    whole, _, fraction = rendered.partition(".")
    grouped = _indian_group(int(whole))
    suffix = f".{fraction}" if decimals else ""
    return f"{sign}₹{grouped}{suffix}"


def signed_inr(value: float | None, *, decimals: int = 0) -> str:
    amount = float(value or 0)
    prefix = "+" if amount > 0 else ""
    return f"{prefix}{inr(amount, decimals=decimals)}"


def pct(value: float | int | None, *, decimals: int = 1) -> str:
    return f"{float(value or 0):.{decimals}f}%"


def _as_date(value: date | str | None) -> date | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def format_date(value: date | str | None, style: str = "medium") -> str:
    parsed = _as_date(value)
    if parsed is None:
        return "—"
    pattern = {
        "short": "%d %b",
        "medium": "%d %b %Y",
        "long": "%d %B %Y",
        "month": "%b %Y",
    }.get(style, "%d %b %Y")
    return parsed.strftime(pattern)


def days_label(days: int | None) -> str:
    if days is None:
        return "No date"
    if days < 0:
        return f"{abs(days)} days overdue"
    if days == 0:
        return "Due today"
    if days == 1:
        return "Due tomorrow"
    return f"Due in {days} days"


def initials(name: str | None) -> str:
    words = [part for part in str(name or "").split() if part]
    if not words:
        return "?"
    return "".join(word[0] for word in words[:2]).upper()


def page_header(eyebrow: str, title: str, description: str) -> None:
    st.markdown(f'<div class="fpv-eyebrow">{html.escape(eyebrow)}</div>', unsafe_allow_html=True)
    st.markdown(f'<h1 class="fpv-title">{html.escape(title)}</h1>', unsafe_allow_html=True)
    st.markdown(f'<p class="fpv-subtitle">{html.escape(description)}</p>', unsafe_allow_html=True)
    st.write("")


def section(title: str, caption: str | None = None) -> None:
    st.markdown(f'<div class="fpv-section">{html.escape(title)}</div>', unsafe_allow_html=True)
    if caption:
        st.caption(caption)


def badge(label: str, tone: str = "neutral") -> None:
    safe_tone = tone if tone in {"positive", "warning", "danger", "neutral", "blue"} else "neutral"
    st.markdown(
        f'<span class="fpv-badge fpv-badge-{safe_tone}">{html.escape(str(label))}</span>',
        unsafe_allow_html=True,
    )


def risk_tone(risk: str | None) -> str:
    return {
        "resilient": "positive",
        "stable": "blue",
        "steady": "blue",
        "caution": "warning",
        "watch": "warning",
        "watchful": "warning",
        "risk": "danger",
        "critical": "danger",
        "fragile": "danger",
        "stretched": "warning",
        "unaffordable": "danger",
        "comfortable": "positive",
        "cautious": "warning",
        "ready": "positive",
        "on_track": "positive",
        "needs_adjustment": "warning",
        "blocked": "danger",
        "good": "positive",
    }.get(str(risk or "").lower(), "neutral")


def risk_badge(label: str, risk: str | None = None) -> None:
    badge(label, risk_tone(risk if risk is not None else label))


def due_tone(status: str | None) -> str:
    return {"overdue": "danger", "due_soon": "warning", "upcoming": "blue", "completed": "positive"}.get(
        str(status or ""), "neutral"
    )


def set_flash(tone: str, message: str) -> None:
    st.session_state["_fpv_flash"] = (tone, message)


def clear_derived_state(*, reset_planner_form: bool = False) -> None:
    """Drop cached calculations after a change that invalidates their inputs."""
    for key in (
        "assessment",
        "planner_loaded",
        "simulation",
        "simulation_error",
        "emi_result",
        "emi_quote",
    ):
        st.session_state.pop(key, None)
    if reset_planner_form:
        for key in ("planner_amount", "planner_date", "planner_title", "planner_alt_pending"):
            st.session_state.pop(key, None)


def flush_flash() -> None:
    flash = st.session_state.pop("_fpv_flash", None)
    if not flash:
        return
    tone, message = flash
    renderer = {
        "success": st.success,
        "error": st.error,
        "warning": st.warning,
        "info": st.info,
    }.get(tone, st.info)
    renderer(message)


def empty_state(icon: str, title: str, body: str) -> None:
    st.markdown(
        f"""
        <div class="fpv-empty">
          <div class="fpv-empty-icon">{html.escape(icon)}</div>
          <div class="fpv-empty-title">{html.escape(title)}</div>
          <div class="fpv-empty-body">{html.escape(body)}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def kv_row(label: str, value: str) -> None:
    st.markdown(
        f'<div class="fpv-kv"><span>{html.escape(label)}</span><b>{html.escape(value)}</b></div>',
        unsafe_allow_html=True,
    )


def callout(message: str, tone: str = "positive") -> None:
    css = "fpv-callout fpv-callout-warn" if tone == "warning" else "fpv-callout"
    st.markdown(f'<div class="{css}">{html.escape(message)}</div>', unsafe_allow_html=True)


def error_callout(exc: Exception, *, retry_label: str = "Try again", key: str = "retry") -> None:
    st.error(str(exc))
    if st.button(retry_label, key=key, type="secondary"):
        st.rerun()


def require_profile() -> dict:
    try:
        return api.get_profile()
    except api.ApiError as exc:
        st.error("Your financial profile could not be loaded. Check that the FastAPI server is running.")
        st.caption(str(exc))
        if st.button("Retry connection", type="primary", key="retry-profile-load"):
            st.rerun()
        st.stop()
        raise  # pragma: no cover - st.stop ends the run


def sidebar_status() -> None:
    try:
        health = api.health()
        database = health.get("database", "unknown")
        st.sidebar.markdown(
            f"""
            <div class="fpv-kv"><span>API</span><b style="color:#7ff0bb">Connected</b></div>
            <div class="fpv-kv"><span>Database</span><b>{html.escape(str(database).title())}</b></div>
            """,
            unsafe_allow_html=True,
        )
    except api.ApiError:
        st.sidebar.markdown(
            '<div class="fpv-kv"><span>API</span><b style="color:#ff9daa">Offline</b></div>',
            unsafe_allow_html=True,
        )
        st.sidebar.caption("Start FastAPI on port 8000.")
    st.sidebar.caption("Demo data · Local workspace · Not financial advice")
