"""Financial Profile: edit the source data and preview the consequences."""

from __future__ import annotations

from datetime import date

import streamlit as st

from streamlit_app import api, finance, ui


def _as_date(value: str | date | None) -> date:
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value)[:10])
    except (TypeError, ValueError):
        return date.today()


def _close_reset_dialog() -> None:
    st.session_state["profile_show_reset"] = False


@st.dialog("Restore the demo profile?", on_dismiss=_close_reset_dialog)
def _reset_dialog() -> None:
    st.write("This restores the profile fields to the original demo workspace.")
    st.caption(
        "Installments, saved purchase plans and simulation history are not deleted. "
        "Only the profile values are reset."
    )
    if st.button("Restore demo data", type="primary", width="stretch", key="confirm-reset-profile"):
        try:
            api.reset_demo_profile()
        except api.ApiError as exc:
            st.error(str(exc))
            return
        st.session_state["profile_form_version"] = st.session_state.get("profile_form_version", 0) + 1
        st.session_state["profile_show_reset"] = False
        ui.clear_derived_state(reset_planner_form=True)
        ui.set_flash("success", "Demo profile restored. Installments and saved plans were left untouched.")
        st.rerun()


def render() -> None:
    profile = ui.require_profile()
    version = st.session_state.setdefault("profile_form_version", 0)

    ui.page_header(
        "Financial profile",
        "The numbers behind every future.",
        "Keep your income, spending, savings and safety net current. The API recalculates every score and "
        "projection after you save.",
    )

    left, right = st.columns([1.14, 0.86], gap="large")

    with left:
        with st.container(border=True):
            st.markdown("#### Identity")
            name = st.text_input(
                "Name",
                value=str(profile["name"]),
                max_chars=80,
                key=f"profile-name-{version}",
            )
            purchase_date = st.date_input(
                "Expected purchase date",
                value=_as_date(profile.get("expected_purchase_date")),
                key=f"profile-date-{version}",
            )

        st.write("")
        with st.container(border=True):
            st.markdown("#### Monthly cash flow")
            row1 = st.columns(2)
            income = row1[0].number_input(
                "Monthly income (₹)",
                min_value=0.0,
                max_value=1_000_000_000.0,
                value=float(profile["monthly_income"]),
                step=1000.0,
                format="%.0f",
                key=f"profile-income-{version}",
            )
            essentials = row1[1].number_input(
                "Essential expenses (₹)",
                min_value=0.0,
                max_value=1_000_000_000.0,
                value=float(profile["essential_expenses"]),
                step=500.0,
                format="%.0f",
                help="Rent, food, utilities, transport, insurance and other non-negotiables.",
                key=f"profile-essential-{version}",
            )
            row2 = st.columns(2)
            discretionary = row2[0].number_input(
                "Discretionary expenses (₹)",
                min_value=0.0,
                max_value=1_000_000_000.0,
                value=float(profile["discretionary_expenses"]),
                step=500.0,
                format="%.0f",
                key=f"profile-discretionary-{version}",
            )
            debt = row2[1].number_input(
                "Existing debt payments (₹)",
                min_value=0.0,
                max_value=1_000_000_000.0,
                value=float(profile["existing_debt_payments"]),
                step=500.0,
                format="%.0f",
                key=f"profile-debt-{version}",
            )

        st.write("")
        with st.container(border=True):
            st.markdown("#### Savings and next purchase")
            row3 = st.columns(2)
            savings = row3[0].number_input(
                "Current savings (₹)",
                min_value=0.0,
                max_value=1_000_000_000.0,
                value=float(profile["current_savings"]),
                step=1000.0,
                format="%.0f",
                key=f"profile-savings-{version}",
            )
            target = row3[1].number_input(
                "Emergency fund target (₹)",
                min_value=0.0,
                max_value=1_000_000_000.0,
                value=float(profile["emergency_fund_target"]),
                step=1000.0,
                format="%.0f",
                help="Ring-fenced. Never included in safe-to-spend.",
                key=f"profile-target-{version}",
            )
            amount = st.number_input(
                "Planned purchase amount (₹)",
                min_value=0.0,
                max_value=1_000_000_000.0,
                value=float(profile["planned_purchase_amount"]),
                step=1000.0,
                format="%.0f",
                key=f"profile-purchase-{version}",
            )

            save_clicked = st.button("Save profile", type="primary", width="stretch")

        if save_clicked:
            if not name.strip():
                st.error("Name cannot be empty.")
            else:
                try:
                    api.update_profile(
                        {
                            "name": name.strip(),
                            "monthly_income": float(income),
                            "current_savings": float(savings),
                            "essential_expenses": float(essentials),
                            "discretionary_expenses": float(discretionary),
                            "existing_debt_payments": float(debt),
                            "emergency_fund_target": float(target),
                            "planned_purchase_amount": float(amount),
                            "expected_purchase_date": purchase_date,
                        }
                    )
                except api.ApiError as exc:
                    st.error(str(exc))
                else:
                    st.session_state["profile_form_version"] = version + 1
                    ui.clear_derived_state(reset_planner_form=True)
                    ui.set_flash("success", "Profile saved. Every score and projection was recalculated.")
                    st.rerun()

    preview = finance.derive_preview(
        monthly_income=income,
        current_savings=savings,
        essential_expenses=essentials,
        discretionary_expenses=discretionary,
        existing_debt_payments=debt,
        emergency_fund_target=target,
        planned_purchase_amount=amount,
        today=date.today(),
    )

    with right:
        with st.container(border=True):
            ui.badge("Live preview", "blue")
            st.markdown("#### Financial weather")
            score = preview["health_score"]
            health_tone = ui.risk_tone(preview["health_label"])
            ui.badge(preview["health_label"], health_tone)
            st.markdown(
                f'<div style="font-size:3rem;font-weight:800;letter-spacing:-0.06em;line-height:1;color:#EEF5F1">'
                f'{score}<span style="font-size:0.9rem;color:#6F8297;font-weight:600"> / 100</span></div>',
                unsafe_allow_html=True,
            )
            st.progress(min(max(score / 100, 0.0), 1.0))
            st.caption("Preview only. The server recalculates and stores the authoritative score on save.")

        st.write("")
        preview_metrics = st.columns(2)
        preview_metrics[0].metric("Safe to spend", ui.inr(preview["safe_to_spend"]), border=True)
        preview_metrics[1].metric("Monthly free cash flow", ui.inr(preview["monthly_free_cash_flow"]), border=True)
        preview_metrics2 = st.columns(2)
        preview_metrics2[0].metric(
            "Emergency cover",
            f"{preview['emergency_coverage_months']:.1f} mo",
            border=True,
        )
        preview_metrics2[1].metric(
            "Purchase readiness",
            f"{preview['purchase_readiness_pct']:.0f}%",
            border=True,
        )

        st.write("")
        with st.container(border=True):
            st.markdown("#### Reserve and purchase")
            if preview["emergency_gap"] > 0:
                ui.callout(
                    f"Your emergency fund is {ui.inr(preview['emergency_gap'])} short of target. "
                    "That gap stays ring-fenced and is never counted as spendable.",
                    tone="warning",
                )
            else:
                ui.callout(
                    f"Emergency fund target met. {ui.inr(preview['safe_to_spend'])} is above the reserve and "
                    "available for the purchase."
                )

            ui.kv_row("Monthly expenses", ui.inr(preview["monthly_expenses"]))
            ui.kv_row("Savings rate", ui.pct(preview["savings_rate_pct"]))
            ui.kv_row("Debt-to-income", ui.pct(preview["debt_to_income_pct"]))
            ui.kv_row("Purchase gap", ui.inr(preview["purchase_gap"]))
            if preview["projected_affordable_date"]:
                ui.kv_row(
                    "Affordable around",
                    ui.format_date(preview["projected_affordable_date"], "medium"),
                )
            else:
                ui.kv_row("Affordable around", "Not at current pace")

            if preview["monthly_free_cash_flow"] <= 0:
                st.error("Free cash flow is zero or negative. Reduce fixed outgoings or increase income before planning a purchase.")

        with st.expander("How the preview is calculated"):
            st.markdown(
                "- **Monthly expenses** = essentials + discretionary spending + existing debt payments.\n"
                "- **Free cash flow** = income − monthly expenses.\n"
                "- **Safe to spend** = current savings − emergency fund target, never below zero.\n"
                "- **Emergency cover** = current savings ÷ essential expenses.\n"
                "- **Health score** combines savings rate, emergency cover, debt-to-income, free cash flow and reserve buffer.\n"
                "- Projections assume 0% investment return and no inflation."
            )

        st.write("")
        if st.button("Restore demo profile", width="stretch"):
            st.session_state["profile_show_reset"] = True
            st.rerun()

    if st.session_state.get("profile_show_reset"):
        _reset_dialog()

    st.markdown(
        '<div class="fpv-footer-note">Your data stays in the local SQLite database. '
        "The emergency reserve is ring-fenced across every plan and projection.</div>",
        unsafe_allow_html=True,
    )
