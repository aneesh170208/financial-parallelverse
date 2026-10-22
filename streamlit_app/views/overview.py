"""Overview page: financial weather, cash flow and upcoming commitments."""

from __future__ import annotations

import html
from datetime import datetime

import streamlit as st

from streamlit_app import api, charts, ui


def render() -> None:
    profile = ui.require_profile()
    try:
        dashboard = api.get_dashboard()
    except api.ApiError as exc:
        ui.page_header("Overview", "Your money, in one calm view.", "The dashboard could not be loaded right now.")
        ui.error_callout(exc, key="overview-retry")
        return

    hour = datetime.now().hour
    greeting = "Good morning" if hour < 12 else "Good afternoon" if hour < 18 else "Good evening"
    first_name = str(profile["name"]).split()[0] if profile.get("name") else "there"

    ui.page_header(
        "Overview",
        f"{greeting}, {first_name}.",
        "A calm view of your cash flow, your safety net, and the next decision in front of you.",
    )

    cashflow = dashboard["cashflow"]
    purchase = dashboard["purchase"]

    left, right = st.columns([1.35, 1], gap="large")
    with left:
        with st.container(border=True):
            ui.badge("Financial weather", ui.risk_tone(profile["health_label"]))
            score_col, label_col = st.columns([0.42, 0.58], vertical_alignment="center")
            with score_col:
                st.markdown(
                    f'<div style="font-size:3.3rem;font-weight:800;letter-spacing:-0.06em;line-height:1;color:#EEF5F1">'
                    f'{profile["health_score"]}<span style="font-size:1rem;color:#6F8297;font-weight:600"> / 100</span></div>',
                    unsafe_allow_html=True,
                )
            with label_col:
                st.markdown(f"#### {profile['health_label']}")
                st.caption(
                    f"{profile['emergency_coverage_months']:.1f} months of essentials covered · "
                    f"{profile['savings_rate_pct']:.1f}% savings rate"
                )
            st.progress(min(max(profile["health_score"] / 100, 0.0), 1.0))
            st.markdown(
                f'<div class="fpv-callout">{html.escape(str(dashboard["insight"]))}</div>',
                unsafe_allow_html=True,
            )

    with right:
        with st.container(border=True):
            purchase_tone = "positive" if purchase["gap"] <= 0 else "warning"
            ui.badge("Next decision", purchase_tone)
            st.markdown(f"#### {purchase['title']}")
            st.markdown(
                f'<div style="font-size:1.65rem;font-weight:800;letter-spacing:-0.04em;color:#EEF5F1">'
                f'{ui.inr(purchase["amount"])}</div>',
                unsafe_allow_html=True,
            )
            st.caption(f"Target {ui.format_date(purchase['target_date'])} · {purchase['days_until_target']} days away")
            st.progress(min(max(purchase["readiness_pct"] / 100, 0.0), 1.0))
            st.caption(
                f"{ui.inr(purchase['safe_to_spend'])} safely available today"
                + (f" · {ui.inr(purchase['gap'])} to close" if purchase["gap"] > 0 else " · fully covered")
            )
            if purchase["gap"] > 0:
                ui.callout(
                    f"Save about {ui.inr(purchase['monthly_saving_plan'] or purchase['gap'] / max(purchase['months_to_purchase'] or 1, 1))} "
                    "per month to stay on pace without touching the emergency reserve.",
                    tone="warning",
                )
            else:
                ui.callout("This purchase fits inside your safe-to-spend amount. Your reserve stays intact.")

    st.write("")
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Safe to spend", ui.inr(profile["safe_to_spend"]), border=True, help="Savings above your emergency-fund target.")
    c2.metric("Monthly free cash flow", ui.inr(profile["monthly_free_cash_flow"]), border=True)
    c3.metric("Emergency cover", f"{profile['emergency_coverage_months']:.1f} mo", border=True, help="Months of essential expenses covered by savings.")
    c4.metric("Monthly commitments", ui.inr(dashboard["monthly_installment_commitment"]), border=True, help="Active installment payments.")

    st.write("")
    chart_left, chart_right = st.columns([1, 1.35], gap="large")
    with chart_left:
        with st.container(border=True):
            st.markdown("#### Where the month goes")
            st.caption("Income split across essentials, discretionary spending, debt and free cash flow.")
            charts.render(charts.cashflow_chart(cashflow))
            st.caption(
                f"Income {ui.inr(cashflow['income'])} · Outgoings {ui.inr(cashflow['essential'] + cashflow['discretionary'] + cashflow['debt'])}"
            )
    with chart_right:
        with st.container(border=True):
            st.markdown("#### Twelve-month trajectory")
            st.caption("Your savings path at 0% assumed investment return, with the emergency reserve marked.")
            charts.render(charts.projection_chart(dashboard["projection"], profile["emergency_fund_target"]))
            st.caption("Illustrative projection · no investment returns, inflation or tax modelled.")

    st.write("")
    upcoming_col, activity_col = st.columns([1.25, 1], gap="large")
    with upcoming_col:
        with st.container(border=True):
            st.markdown("#### Upcoming payments")
            st.caption("The next installments that need attention.")
            upcoming = dashboard.get("upcoming_installments", [])
            if not upcoming:
                ui.empty_state("✓", "No payments due soon", "Your installment tracker is clear. New commitments will appear here.")
            else:
                for item in upcoming:
                    cols = st.columns([0.62, 0.38], vertical_alignment="center")
                    with cols[0]:
                        st.markdown(f"**{item['name']}**")
                        st.caption(f"{item['merchant'] or 'Installment'} · {ui.days_label(item['days_until_due'])}")
                    with cols[1]:
                        ui.badge(item["due_status"].replace("_", " ").title(), ui.due_tone(item["due_status"]))
                        st.markdown(
                            f'<div style="text-align:right;font-weight:700;color:#EEF5F1">{ui.inr(item["amount"], decimals=0)}</div>',
                            unsafe_allow_html=True,
                        )
                    st.markdown('<div class="fpv-divider"></div>', unsafe_allow_html=True)
                st.caption(f"{dashboard['active_installments']} active plans · {ui.inr(dashboard['monthly_installment_commitment'])} per month")

    with activity_col:
        with st.container(border=True):
            st.markdown("#### Latest analysis")
            recent = dashboard.get("recent_simulation")
            if not recent:
                ui.empty_state("◇", "No simulations yet", "Run a Parallel Futures comparison to see how timing changes your outcome.")
            else:
                ui.badge("Saved simulation", "blue")
                st.markdown(f"**{recent['title']}**")
                st.caption(f"Recommended: {recent['recommended_scenario']} · {ui.format_date(recent['created_at'])}")
                st.markdown(
                    f'<div style="font-size:1.5rem;font-weight:800;letter-spacing:-0.04em;color:#EEF5F1">'
                    f'{ui.inr(recent["purchase_amount"])}</div>',
                    unsafe_allow_html=True,
                )
                st.caption("Purchase amount under analysis")
            st.markdown('<div class="fpv-divider"></div>', unsafe_allow_html=True)
            st.markdown("#### Guardrails")
            if profile["emergency_gap"] > 0:
                st.warning(f"Emergency fund is {ui.inr(profile['emergency_gap'])} short of target.")
            else:
                st.success("Emergency reserve is fully funded and ring-fenced.")
            st.caption("Safe-to-spend never includes the emergency fund. Projections are deterministic and educational.")

    st.markdown(
        '<div class="fpv-footer-note">Financial Parallelverse is a local demonstration. All names and amounts are fictional. '
        "It is not financial advice.</div>",
        unsafe_allow_html=True,
    )
