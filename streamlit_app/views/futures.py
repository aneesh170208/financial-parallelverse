"""Parallel Futures: compare six purchase paths and stress-test them."""

from __future__ import annotations

from datetime import date

import pandas as pd
import streamlit as st

from streamlit_app import api, charts, ui


def _default_payload(profile: dict) -> dict:
    amount = max(float(profile.get("planned_purchase_amount") or 70000), 1000)
    return {
        "title": "My next purchase futures",
        "horizon_months": 12,
        "purchase_amount": amount,
        "wait_months": 3,
        "cheaper_price": max(round(amount * 0.8), 0),
        "emi_down_payment_pct": 20.0,
        "emi_annual_rate_pct": 13.5,
        "emi_tenure_months": 12,
        "unexpected_expense_amount": 35000.0,
        "unexpected_expense_month": 4,
        "delayed_salary_months": 1,
        "spending_increase_pct": 12.0,
    }


def _ensure_simulation(profile: dict) -> None:
    if "simulation" in st.session_state:
        return
    payload = _default_payload(profile)
    with st.spinner("Building your six futures…"):
        try:
            st.session_state["simulation"] = api.simulate(payload)
            st.session_state.setdefault("simulation_title", payload["title"])
            st.session_state.pop("simulation_error", None)
        except api.ApiError as exc:
            st.session_state["simulation_error"] = str(exc)


@st.dialog("Future detail", width="large")
def _scenario_dialog(scenario: dict, target: float) -> None:
    ui.badge(scenario["risk_label"], ui.risk_tone(scenario["risk"]))
    st.markdown(f"## {scenario['name']}")
    st.write(scenario["description"])
    st.caption(scenario["verdict"])
    cols = st.columns(4)
    cols[0].metric("Ending savings", ui.inr(scenario["final_savings"]), border=True)
    cols[1].metric("Lowest point", ui.inr(scenario["minimum_savings"]), border=True)
    cols[2].metric("Monthly commitment", ui.inr(scenario["monthly_commitment"]), border=True)
    cols[3].metric("Interest paid", ui.inr(scenario["interest_paid"]), border=True)
    st.markdown("#### Month-by-month savings")
    st.caption(
        "Each bar is the projected balance at that point in the path. "
        "The amber line marks your emergency reserve."
    )
    charts.render(charts.scenario_path_chart(scenario, target))
    if scenario["purchase_events"]:
        st.markdown("#### Purchase events")
        for event in scenario["purchase_events"]:
            st.markdown(f"- **{event['label']}** · {event['type']} · {ui.inr(event['amount'])}")
    if scenario["extra_details"]:
        st.markdown("#### Assumptions")
        for item in scenario["extra_details"]:
            st.markdown(f"- {item}")
    if scenario["emergency_shortfall"] > 0:
        st.warning(
            f"This path dips {ui.inr(scenario['emergency_shortfall'])} below your emergency reserve target."
        )
    else:
        st.success("This path keeps your emergency reserve intact.")


def _run_simulation(payload: dict) -> None:
    try:
        with st.spinner("Recalculating all six futures…"):
            st.session_state["simulation"] = api.simulate(payload)
        st.session_state["simulation_title"] = payload["title"]
        st.session_state.pop("simulation_error", None)
        ui.set_flash("success", "Six futures recalculated and saved to your history.")
        st.rerun()
    except api.ApiError as exc:
        st.error(str(exc))


def render() -> None:
    profile = ui.require_profile()
    _ensure_simulation(profile)

    simulation = st.session_state.get("simulation")
    defaults = simulation.get("assumptions", {}) if simulation else _default_payload(profile)
    amount_default = (
        float(simulation["purchase_amount"])
        if simulation
        else float(profile.get("planned_purchase_amount") or 70000)
    )

    ui.page_header(
        "Parallel futures",
        "One purchase. Six possible versions of your next year.",
        "Compare buying now, waiting, choosing lighter, paying by EMI, or absorbing an unexpected expense. "
        "Every path protects the same emergency reserve.",
    )

    if not simulation and st.session_state.get("simulation_error"):
        st.error(st.session_state["simulation_error"])
        if st.button("Retry simulation", type="primary", key="futures-retry-load"):
            st.session_state.pop("simulation", None)
            st.rerun()

    with st.form("futures-setup", border=True):
        st.markdown("#### Scenario setup")
        row1 = st.columns([1.35, 0.65, 0.8])
        title = row1[0].text_input(
            "Analysis name",
            value=st.session_state.get("simulation_title", "My next purchase futures"),
            max_chars=140,
        )
        horizon_default = int(simulation["horizon_months"]) if simulation else int(defaults.get("horizon_months", 12))
        horizon = row1[1].slider("Horizon (months)", 6, 36, horizon_default)
        purchase_amount = row1[2].number_input(
            "Purchase amount (₹)",
            min_value=1000.0,
            max_value=1_000_000_000.0,
            value=amount_default,
            step=1000.0,
            format="%.0f",
        )
        row2 = st.columns(4)
        wait_months = row2[0].slider("Wait & save (months)", 1, 12, int(defaults.get("wait_months", 3)))
        cheaper_price = row2[1].number_input(
            "Lighter alternative (₹)",
            min_value=0.0,
            max_value=1_000_000_000.0,
            value=float(defaults.get("cheaper_price", round(amount_default * 0.8))),
            step=1000.0,
            format="%.0f",
        )
        unexpected_amount = row2[2].number_input(
            "Unexpected expense (₹)",
            min_value=0.0,
            max_value=1_000_000_000.0,
            value=float(defaults.get("unexpected_expense_amount", 35000)),
            step=1000.0,
            format="%.0f",
        )
        unexpected_month = row2[3].slider(
            "Curveball month", 1, 24, int(defaults.get("unexpected_expense_month", 4))
        )

        with st.expander("EMI assumptions", expanded=False):
            emi1, emi2, emi3 = st.columns(3)
            down_payment_pct = emi1.slider(
                "Down payment (%)", 0, 90, int(defaults.get("emi_down_payment_pct", 20))
            )
            emi_rate = emi2.number_input(
                "Annual interest rate (%)",
                min_value=0.0,
                max_value=60.0,
                value=float(defaults.get("emi_annual_rate_pct", 13.5)),
                step=0.1,
                format="%.1f",
            )
            emi_tenure = emi3.slider("EMI tenure (months)", 1, 60, int(defaults.get("emi_tenure_months", 12)))

        with st.expander("Stress lab inputs", expanded=True):
            stress1, stress2 = st.columns(2)
            delayed_salary = stress1.slider(
                "Delayed salary (months)", 1, 6, int(defaults.get("delayed_salary_months", 1))
            )
            spending_increase = stress2.slider(
                "Spending increase (%)", 0, 100, int(defaults.get("spending_increase_pct", 12))
            )

        submitted = st.form_submit_button(
            "Run six-future simulation", type="primary", width="stretch"
        )

    if submitted:
        _run_simulation(
            {
                "title": title.strip() or "My next purchase futures",
                "horizon_months": int(horizon),
                "purchase_amount": float(purchase_amount),
                "wait_months": int(wait_months),
                "cheaper_price": float(cheaper_price) if cheaper_price else None,
                "emi_down_payment_pct": float(down_payment_pct),
                "emi_annual_rate_pct": float(emi_rate),
                "emi_tenure_months": int(emi_tenure),
                "unexpected_expense_amount": float(unexpected_amount),
                "unexpected_expense_month": int(unexpected_month),
                "delayed_salary_months": int(delayed_salary),
                "spending_increase_pct": float(spending_increase),
            }
        )

    simulation = st.session_state.get("simulation")
    if not simulation:
        st.write("")
        ui.empty_state(
            "◇",
            "Your futures are waiting",
            "Adjust the scenario assumptions and run the simulation to compare six possible outcomes.",
        )
        return

    recommendation = simulation["recommendation"]
    recommended_scenario = next(
        (item for item in simulation["scenarios"] if item["id"] == recommendation["scenario_id"]),
        simulation["scenarios"][0],
    )
    baseline = next(
        (item for item in simulation["scenarios"] if item.get("is_baseline")),
        None,
    )
    target = float(profile["emergency_fund_target"])
    ending_leader = max(simulation["scenarios"], key=lambda item: item["final_savings"])
    deepest = min(simulation["scenarios"], key=lambda item: item["minimum_savings"])

    with st.container(border=True):
        ui.badge("Recommended path", "positive")
        st.markdown(f"## {recommended_scenario['name']}")
        st.write(recommendation["headline"])
        st.caption(recommendation["rationale"])
        metrics = st.columns(4)
        metrics[0].metric(
            "Ending balance",
            ui.inr(recommended_scenario["final_savings"]),
            delta=(
                ui.signed_inr(recommended_scenario["final_savings"] - baseline["final_savings"])
                if baseline
                else None
            ),
            help="Compared with the no-purchase path.",
            delta_color="off",
            border=True,
        )
        metrics[1].metric(
            "Lowest balance",
            ui.inr(recommended_scenario["minimum_savings"]),
            delta=ui.signed_inr(recommended_scenario["minimum_savings"] - target),
            help="Compared with your ring-fenced emergency reserve target.",
            border=True,
        )
        metrics[2].metric(
            "Extra to save",
            ui.inr(recommendation["extra_to_save"]),
            help="Amount beyond your safe-to-spend balance.",
            border=True,
        )
        metrics[3].metric(
            "Safe to spend now",
            ui.inr(recommendation["safe_to_spend_now"]),
            help="Savings above your emergency reserve. The reserve itself is never spendable.",
            border=True,
        )

    st.write("")
    with st.container(border=True):
        st.markdown("#### Six futures, side by side")
        st.caption(
            "Ending balance and the lowest balance along each path. The amber line marks your emergency reserve; "
            "★ marks the recommended route."
        )
        charts.render(charts.futures_chart(simulation, target))
        st.caption(
            f"Highest ending balance: {ending_leader['name']} at {ui.inr(ending_leader['final_savings'])} · "
            f"Deepest balance: {deepest['name']} at {ui.inr(deepest['minimum_savings'])} · "
            f"Recommended: {recommended_scenario['name']}."
        )
        st.caption(
            f"Horizon: {simulation['horizon_months']} months · Purchase: {ui.inr(simulation['purchase_amount'])} · "
            "0% assumed investment return."
        )

    st.markdown("#### Scenario cards")
    st.caption("Open any future to inspect the full path, events and assumptions.")
    columns = st.columns(3, gap="medium")
    for index, scenario in enumerate(simulation["scenarios"]):
        is_recommended = scenario["id"] == recommendation["scenario_id"]
        with columns[index % 3]:
            with st.container(border=True):
                ui.badge(scenario["risk_label"], ui.risk_tone(scenario["risk"]))
                st.markdown(f"##### {scenario['name']}{' ★' if is_recommended else ''}")
                st.caption(scenario["tagline"])
                st.markdown(
                    f'<div style="font-size:1.35rem;font-weight:800;letter-spacing:-0.04em;color:#EEF5F1">'
                    f'{ui.inr(scenario["final_savings"])}</div>',
                    unsafe_allow_html=True,
                )
                if baseline and scenario["id"] == baseline["id"]:
                    st.caption("Projected ending savings · reference path")
                elif baseline:
                    st.caption(
                        "Projected ending savings · "
                        f"{ui.signed_inr(scenario['final_savings'] - baseline['final_savings'])} vs no purchase"
                    )
                else:
                    st.caption("Projected ending savings")
                st.progress(min(max(scenario["score"] / 100, 0.0), 1.0))
                st.caption(
                    f"Score {scenario['score']}/100 · lowest {ui.inr(scenario['minimum_savings'])}"
                )
                if scenario["monthly_commitment"] > 0:
                    st.caption(f"Monthly commitment {ui.inr(scenario['monthly_commitment'])}")
                if scenario["interest_paid"] > 0:
                    st.caption(f"Interest cost {ui.inr(scenario['interest_paid'])}")
                if st.button(
                    "Inspect future",
                    key=f"inspect-{scenario['id']}",
                    width="stretch",
                    type="primary" if is_recommended else "secondary",
                ):
                    _scenario_dialog(scenario, target)

    st.write("")
    with st.container(border=True):
        st.markdown("#### Stress lab")
        st.caption(
            "The buy-now future is tested against an unexpected expense, a delayed salary, higher spending, "
            "and all three combined."
        )
        charts.render(charts.stress_chart(simulation["stress_tests"]))
        stress_rows = []
        for item in simulation["stress_tests"]:
            stress_rows.append(
                {
                    "Scenario": item["name"],
                    "Final savings": ui.inr(item["final_savings"]),
                    "Lowest balance": ui.inr(item["minimum_savings"]),
                    "Impact": ui.signed_inr(item["impact_vs_no_surprises"]),
                    "Cover": f"{item['months_of_cover']:.1f} mo",
                    "Risk": item["risk_label"],
                }
            )
        st.dataframe(pd.DataFrame(stress_rows), hide_index=True, width="stretch")
        st.caption(
            "A delayed salary is temporary and eventually paid in full. The stress lab shows the timing pressure, "
            "not a permanent loss."
        )

    with st.expander("Assumptions used in this analysis"):
        assumptions = simulation.get("assumptions", {})
        items = [
            ("Wait before buying", f"{assumptions.get('wait_months', 0)} months"),
            ("Lighter alternative", ui.inr(assumptions.get("cheaper_price", 0))),
            ("EMI down payment", f"{assumptions.get('emi_down_payment_pct', 0):.0f}%"),
            ("EMI annual rate", f"{assumptions.get('emi_annual_rate_pct', 0):.1f}%"),
            ("EMI tenure", f"{assumptions.get('emi_tenure_months', 0)} months"),
            ("Unexpected expense", ui.inr(assumptions.get("unexpected_expense_amount", 0))),
            ("Curveball month", f"Month {assumptions.get('unexpected_expense_month', 0)}"),
            ("Delayed salary", f"{assumptions.get('delayed_salary_months', 0)} month(s)"),
            ("Spending increase", f"{assumptions.get('spending_increase_pct', 0):.0f}%"),
            ("Assumed investment return", "0%"),
        ]
        for label, value in items:
            ui.kv_row(label, str(value))
        st.caption(f"Generated {ui.format_date(simulation['generated_at'])} · simulations are deterministic.")

    st.markdown(
        '<div class="fpv-footer-note">This is an educational comparison, not a recommendation to borrow or spend. '
        "Your emergency fund is never treated as spendable.</div>",
        unsafe_allow_html=True,
    )
