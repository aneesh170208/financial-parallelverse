"""EMI Calculator: total cost, affordability and tracker hand-off."""

from __future__ import annotations

from datetime import date

import pandas as pd
import streamlit as st

from streamlit_app import api, charts, ui
from streamlit_app.finance import add_months


def _defaults(profile: dict) -> dict:
    quote = st.session_state.get("emi_quote") or {}
    price = max(float(quote.get("purchase_price") or profile.get("planned_purchase_amount") or 70000), 1000)
    return {
        "purchase_price": price,
        "down_payment": float(quote.get("down_payment", round(price * 0.2))),
        "annual_rate": float(quote.get("annual_rate", 13.5)),
        "tenure": int(quote.get("tenure", 12)),
        "fee_pct": float(quote.get("fee_pct", 0.0)),
        "fee_fixed": float(quote.get("fee_fixed", 0.0)),
    }


def _close_track_dialog() -> None:
    st.session_state["emi_show_track"] = False


@st.dialog("Track this EMI", on_dismiss=_close_track_dialog)
def _track_dialog(result: dict, quote: dict) -> None:
    st.caption(
        f"{ui.inr(quote['purchase_price'])} purchase · {ui.inr(quote['down_payment'])} down · "
        f"{ui.inr(result['monthly_emi'], decimals=2)} per month."
    )
    name = st.text_input("Plan name", placeholder="e.g. Laptop for work", max_chars=100)
    merchant = st.text_input("Merchant or lender", placeholder="Optional", max_chars=100)
    due = st.date_input(
        "First installment due",
        value=add_months(date.today(), 1),
        help="The tracker uses this date for reminders.",
    )
    notes = st.text_area(
        "Notes",
        value="Created from the EMI calculator.",
        max_chars=1000,
    )
    if st.button("Add to installment tracker", type="primary", width="stretch"):
        if not name.strip():
            st.error("Give this plan a name.")
            return
        try:
            api.create_installment(
                {
                    "name": name.strip(),
                    "merchant": merchant.strip(),
                    "total_amount": float(quote["purchase_price"]),
                    "upfront_payment": float(quote["down_payment"]),
                    "monthly_installment": float(result["monthly_emi"]),
                    "tenure_months": int(result["tenure_months"]),
                    "paid_installments": 0,
                    "next_due_date": due,
                    "annual_rate_pct": float(result["annual_rate_pct"]),
                    "notes": notes.strip(),
                }
            )
        except api.ApiError as exc:
            st.error(str(exc))
            return
        st.session_state["emi_show_track"] = False
        ui.set_flash("success", "EMI plan added to your installment tracker.")
        st.rerun()


def _calculate(payload: dict, quote: dict, *, notify: bool = False) -> None:
    try:
        with st.spinner("Calculating the real cost of this EMI…"):
            result = api.calculate_emi(payload)
        st.session_state["emi_result"] = result
        st.session_state["emi_quote"] = {
            "purchase_price": float(quote["purchase_price"]),
            "down_payment": float(quote["down_payment"]),
            "annual_rate": float(payload["annual_rate_pct"]),
            "tenure": int(payload["tenure_months"]),
            "fee_pct": float(payload["processing_fee_pct"]),
            "fee_fixed": float(payload["processing_fee_fixed"]),
        }
        if notify:
            ui.set_flash("success", "EMI calculated. The schedule and affordability are up to date.")
            st.rerun()
    except api.ApiError as exc:
        st.error(str(exc))


def render() -> None:
    profile = ui.require_profile()
    defaults = _defaults(profile)

    if "emi_result" not in st.session_state:
        price = defaults["purchase_price"]
        down = defaults["down_payment"]
        _calculate(
            {
                "principal": max(price - down, 1),
                "annual_rate_pct": defaults["annual_rate"],
                "tenure_months": defaults["tenure"],
                "processing_fee_pct": defaults["fee_pct"],
                "processing_fee_fixed": defaults["fee_fixed"],
            },
            {"purchase_price": price, "down_payment": down},
        )

    ui.page_header(
        "EMI calculator",
        "Know the real cost of monthly.",
        "See the interest, fees and cash-flow impact before an EMI becomes a monthly habit. "
        "The emergency reserve is never counted as available cash.",
    )

    form_col, summary_col = st.columns([0.86, 1.14], gap="large")
    with form_col:
        with st.form("emi-form", border=True):
            st.markdown("#### Loan details")
            price = st.number_input(
                "Purchase price (₹)",
                min_value=1.0,
                max_value=1_000_000_000.0,
                value=float(defaults["purchase_price"]),
                step=1000.0,
                format="%.0f",
            )
            down = st.number_input(
                "Down payment (₹)",
                min_value=0.0,
                max_value=1_000_000_000.0,
                value=float(defaults["down_payment"]),
                step=1000.0,
                format="%.0f",
                help="Paid upfront from safe-to-spend savings.",
            )
            rate = st.number_input(
                "Annual interest rate (%)",
                min_value=0.0,
                max_value=60.0,
                value=float(defaults["annual_rate"]),
                step=0.1,
                format="%.1f",
            )
            tenure = st.slider("Tenure (months)", 1, 60, int(defaults["tenure"]))
            with st.expander("Processing fee", expanded=False):
                fee_pct = st.number_input(
                    "Fee (% of principal)",
                    min_value=0.0,
                    max_value=10.0,
                    value=float(defaults["fee_pct"]),
                    step=0.1,
                    format="%.1f",
                )
                fee_fixed = st.number_input(
                    "Fixed fee (₹)",
                    min_value=0.0,
                    max_value=100_000_000.0,
                    value=float(defaults["fee_fixed"]),
                    step=100.0,
                    format="%.0f",
                )
            submitted = st.form_submit_button("Calculate EMI", type="primary", width="stretch")

        if submitted:
            if down >= price:
                st.error("The down payment must be less than the purchase price.")
            elif price - down < 1:
                st.error("The financed amount must be at least ₹1.")
            else:
                _calculate(
                    {
                        "principal": float(price - down),
                        "annual_rate_pct": float(rate),
                        "tenure_months": int(tenure),
                        "processing_fee_pct": float(fee_pct),
                        "processing_fee_fixed": float(fee_fixed),
                    },
                    {"purchase_price": float(price), "down_payment": float(down)},
                    notify=True,
                )

        st.caption(
            f"Safe to spend today {ui.inr(profile['safe_to_spend'])}. "
            "A down payment should come from this amount, not the emergency reserve."
        )

        if st.session_state.get("emi_result"):
            with st.container(border=True):
                st.markdown("#### Before you commit")
                st.caption(
                    "An EMI is a fixed monthly claim on future cash flow. Keep at least six months of essentials "
                    "ring-fenced before adding a new one."
                )
                if profile["emergency_gap"] > 0:
                    st.warning(
                        f"Your emergency fund is {ui.inr(profile['emergency_gap'])} short of target. "
                        "Fund that gap before starting a new EMI."
                    )
                else:
                    st.success("Your emergency reserve is fully funded. This EMI will not touch it.")

    with summary_col:
        result = st.session_state.get("emi_result")
        quote = st.session_state.get("emi_quote", {})
        if not result:
            ui.empty_state(
                "▤",
                "No EMI calculated",
                "Enter the purchase price, down payment, rate and tenure, then calculate to see the full cost.",
            )
        else:
            affordability = result.get("affordability") or {}
            with st.container(border=True):
                ui.badge(
                    affordability.get("label", "Calculated"),
                    ui.risk_tone(affordability.get("status", "comfortable")),
                )
                st.markdown("## Your monthly number")
                st.markdown(
                    f'<div style="font-size:2.3rem;font-weight:800;letter-spacing:-0.055em;line-height:1;color:#EEF5F1">'
                    f'{ui.inr(result["monthly_emi"], decimals=2)}'
                    f'<span style="font-size:0.78rem;font-weight:600;color:#6F8297"> / month</span></div>',
                    unsafe_allow_html=True,
                )
                st.caption(f"for {result['tenure_months']} months at {result['annual_rate_pct']:.1f}% annual interest")
                if affordability.get("message"):
                    st.caption(affordability["message"])
                st.progress(
                    min(max(affordability.get("emi_to_income_pct", 0) / 30, 0.0), 1.0)
                )
                st.caption(
                    f"EMI is {affordability.get('emi_to_income_pct', 0):.1f}% of monthly income · "
                    f"{ui.inr(affordability.get('free_cash_flow_after_emi', 0))} left each month."
                )
                metrics = st.columns(3)
                metrics[0].metric("Total interest", ui.inr(result["total_interest"]), border=True)
                metrics[1].metric("Processing fee", ui.inr(result["processing_fee"]), border=True)
                metrics[2].metric("Total cost", ui.inr(result["total_cost"]), border=True)
                st.caption(
                    f"Effective cost {result['effective_cost_pct']:.2f}% · "
                    f"principal financed {ui.inr(result['principal'])}."
                )
                actions = st.columns(2)
                with actions[0]:
                    if st.button("Track this EMI", type="primary", width="stretch"):
                        st.session_state["emi_show_track"] = True
                        st.rerun()
                with actions[1]:
                    schedule_csv = pd.DataFrame(result["schedule"]).to_csv(index=False).encode("utf-8")
                    st.download_button(
                        "Download schedule",
                        data=schedule_csv,
                        file_name="emi-schedule.csv",
                        mime="text/csv",
                        width="stretch",
                    )

    result = st.session_state.get("emi_result")
    if result:
        st.write("")
        chart_col, table_col = st.columns([1, 1.15], gap="large")
        with chart_col:
            with st.container(border=True):
                st.markdown("#### Principal vs interest")
                st.caption("Each monthly payment is split between the amount borrowed and the cost of borrowing.")
                charts.render(charts.emi_split_chart(result["schedule"]))
        with table_col:
            with st.container(border=True):
                st.markdown("#### Balance over time")
                st.caption("The financed balance falls as principal is repaid. Interest does not reduce the balance.")
                charts.render(charts.balance_chart(result["schedule"]))

        with st.container(border=True):
            st.markdown("#### Full repayment schedule")
            rows = [
                {
                    "Month": item["month"],
                    "EMI": ui.inr(item["emi"], decimals=2),
                    "Principal": ui.inr(item["principal"], decimals=2),
                    "Interest": ui.inr(item["interest"], decimals=2),
                    "Balance": ui.inr(item["balance"], decimals=2),
                }
                for item in result["schedule"]
            ]
            st.dataframe(pd.DataFrame(rows), hide_index=True, width="stretch")
            st.caption(
                "Figures are illustrative and rounded at the API boundary. Fees are included in total cost, "
                "not in the monthly EMI."
            )

    if result and quote and st.session_state.get("emi_show_track"):
        _track_dialog(result, quote)

    st.markdown(
        '<div class="fpv-footer-note">This calculator does not recommend borrowing. '
        "Compare the total cost with waiting and saving before committing.</div>",
        unsafe_allow_html=True,
    )
