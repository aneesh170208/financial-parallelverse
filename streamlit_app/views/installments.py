"""Installment tracker: plans, payments and reminders."""

from __future__ import annotations

from datetime import date

import streamlit as st

from streamlit_app import api, ui
from streamlit_app.finance import add_months


def _default_due() -> date:
    return add_months(date.today(), 1)


def _close_add_dialog() -> None:
    st.session_state["installments_show_add"] = False


def _close_delete_dialog() -> None:
    st.session_state.pop("installment_delete_plan", None)


@st.dialog("Add an installment plan", width="large", on_dismiss=_close_add_dialog)
def _add_dialog() -> None:
    st.caption("Track a purchase that is paid over time. Existing payments can be backfilled.")
    with st.form("add-installment", border=False):
        row1 = st.columns(2)
        name = row1[0].text_input("Plan name", placeholder="e.g. Phone for work", max_chars=100)
        merchant = row1[1].text_input("Merchant or lender", placeholder="Optional", max_chars=100)
        row2 = st.columns(3)
        total = row2[0].number_input(
            "Total purchase amount (₹)", min_value=1.0, max_value=1_000_000_000.0, value=50000.0, step=1000.0, format="%.0f"
        )
        upfront = row2[1].number_input(
            "Upfront payment (₹)", min_value=0.0, max_value=1_000_000_000.0, value=0.0, step=1000.0, format="%.0f"
        )
        monthly = row2[2].number_input(
            "Monthly installment (₹)", min_value=1.0, max_value=100_000_000.0, value=5000.0, step=100.0, format="%.0f"
        )
        row3 = st.columns(3)
        tenure = row3[0].slider("Tenure (months)", 1, 60, 10)
        paid = row3[1].slider("Already paid", 0, 60, 0)
        rate = row3[2].number_input(
            "Annual interest rate (%)", min_value=0.0, max_value=100.0, value=0.0, step=0.1, format="%.1f"
        )
        due = st.date_input("Next due date", value=_default_due())
        notes = st.text_area("Notes", max_chars=1000, placeholder="Anything worth remembering about this plan?")
        submitted = st.form_submit_button("Add plan", type="primary", width="stretch")

    if submitted:
        errors = []
        if not name.strip():
            errors.append("Give this plan a name.")
        if upfront >= total:
            errors.append("The upfront payment must be less than the total amount.")
        if paid > tenure:
            errors.append("Already-paid installments cannot exceed the tenure.")
        if errors:
            for message in errors:
                st.error(message)
            return
        try:
            api.create_installment(
                {
                    "name": name.strip(),
                    "merchant": merchant.strip(),
                    "total_amount": float(total),
                    "upfront_payment": float(upfront),
                    "monthly_installment": float(monthly),
                    "tenure_months": int(tenure),
                    "paid_installments": int(paid),
                    "next_due_date": due,
                    "annual_rate_pct": float(rate),
                    "notes": notes.strip(),
                }
            )
        except api.ApiError as exc:
            st.error(str(exc))
            return
        st.session_state["installments_show_add"] = False
        ui.set_flash("success", "Installment plan added.")
        st.rerun()


@st.dialog("Remove installment plan?", on_dismiss=_close_delete_dialog)
def _delete_dialog(plan: dict) -> None:
    st.write(f"**{plan['name']}** · {ui.inr(plan['monthly_installment'])} per month")
    st.caption("This permanently removes the plan and its payment records. The action cannot be undone.")
    if st.button("Remove installment", type="primary", width="stretch", key="confirm-remove-installment"):
        try:
            api.delete_installment(plan["id"])
        except api.ApiError as exc:
            st.error(str(exc))
            return
        st.session_state.pop("installment_delete_plan", None)
        ui.set_flash("success", "Installment plan removed.")
        st.rerun()


def _plan_card(plan: dict, *, completed: bool = False) -> None:
    with st.container(border=True):
        header = st.columns([0.68, 0.32], vertical_alignment="center")
        with header[0]:
            st.markdown(f"#### {plan['name']}")
            st.caption(f"{plan['merchant'] or 'Installment plan'} · created {ui.format_date(plan['created_at'])}")
        with header[1]:
            ui.badge(plan["due_status"].replace("_", " ").title(), ui.due_tone(plan["due_status"]))
            st.markdown(
                f'<div style="text-align:right;font-weight:700;color:#EEF5F1">{ui.inr(plan["monthly_installment"])}'
                '<span style="font-size:0.65rem;color:#6F8297;font-weight:500"> / mo</span></div>',
                unsafe_allow_html=True,
            )

        st.progress(min(max(plan["progress_pct"] / 100, 0.0), 1.0))
        st.caption(
            f"{plan['paid_installments']} of {plan['tenure_months']} paid · "
            f"{ui.inr(plan['outstanding_amount'])} outstanding"
        )

        metrics = st.columns(4)
        metrics[0].metric("Total amount", ui.inr(plan["total_amount"]), border=True)
        metrics[1].metric("Upfront", ui.inr(plan["upfront_payment"]), border=True)
        metrics[2].metric("Financed", ui.inr(plan["financed_amount"]), border=True)
        metrics[3].metric(
            "Next due",
            ui.format_date(plan["next_due_date"], "short") if plan["status"] == "active" else "Complete",
            border=True,
        )

        if plan["status"] == "active":
            st.caption(
                f"{ui.days_label(plan['days_until_due'])} · "
                f"{plan['remaining_installments']} installments remaining"
            )
        if plan.get("annual_rate_pct"):
            st.caption(f"Annual rate {plan['annual_rate_pct']:.1f}%")
        if plan.get("notes"):
            st.caption(plan["notes"])

        with st.expander("Payment activity"):
            payments = plan.get("payments") or []
            if not payments:
                st.caption("No individual payment records yet.")
            else:
                for payment in payments:
                    st.markdown(
                        f"- {ui.format_date(payment['paid_at'])} · {ui.inr(payment['amount'])} "
                        f"(due {ui.format_date(payment['due_date'])})"
                    )

        if plan["status"] == "active":
            actions = st.columns([0.5, 0.5])
            with actions[0]:
                if st.button(
                    "Mark next payment paid",
                    type="primary",
                    key=f"pay-{plan['id']}",
                    width="stretch",
                ):
                    try:
                        updated = api.pay_installment(plan["id"])
                    except api.ApiError as exc:
                        st.error(str(exc))
                    else:
                        message = (
                            "Final payment recorded. The plan moved to history."
                            if updated["status"] == "completed"
                            else "Payment recorded and the next due date advanced."
                        )
                        ui.set_flash("success", message)
                        st.rerun()
            with actions[1]:
                if st.button("Remove plan", key=f"delete-{plan['id']}", width="stretch"):
                    st.session_state["installment_delete_plan"] = plan
                    st.rerun()
        else:
            if st.button("Remove from history", key=f"delete-history-{plan['id']}", width="stretch"):
                st.session_state["installment_delete_plan"] = plan
                st.rerun()


def render() -> None:
    try:
        collection = api.list_installments()
    except api.ApiError as exc:
        ui.page_header("Installment tracker", "Keep every monthly promise visible.", "The tracker could not be loaded.")
        ui.error_callout(exc, key="installments-retry")
        return

    summary = collection["summary"]
    plans = collection["plans"]
    active = [plan for plan in plans if plan["status"] == "active"]
    completed = [plan for plan in plans if plan["status"] == "completed"]

    ui.page_header(
        "Installment tracker",
        "Keep every monthly promise visible.",
        "A single view of what is already committed, what is due next, and how much room is left in the month.",
    )

    header_actions = st.columns([0.75, 0.25], vertical_alignment="center")
    with header_actions[0]:
        if summary["overdue_count"]:
            st.error(f"{summary['overdue_count']} payment is overdue. Clear it before adding anything new.")
        elif summary["due_soon_count"]:
            st.warning(f"{summary['due_soon_count']} payment is due soon.")
        else:
            st.success("No overdue installments. Your monthly commitments are visible.")
    with header_actions[1]:
        if st.button("Add a plan", type="primary", width="stretch"):
            st.session_state["installments_show_add"] = True
            st.rerun()

    metrics = st.columns(4)
    metrics[0].metric("Active plans", int(summary["active_plans"]), border=True)
    metrics[1].metric("Monthly commitment", ui.inr(summary["monthly_commitment"]), border=True)
    metrics[2].metric("Outstanding", ui.inr(summary["outstanding_total"]), border=True)
    metrics[3].metric(
        "Next due",
        ui.format_date(summary["next_due_date"], "short") if summary["next_due_date"] else "None",
        border=True,
    )

    if collection.get("reminders"):
        with st.container(border=True):
            st.markdown("#### Reminders")
            for reminder in collection["reminders"]:
                cols = st.columns([0.68, 0.32], vertical_alignment="center")
                with cols[0]:
                    st.markdown(f"**{reminder['name']}**")
                    st.caption(
                        f"{reminder['merchant'] or 'Installment'} · {ui.days_label(reminder['days_until_due'])} · "
                        f"due {ui.format_date(reminder['due_date'])}"
                    )
                with cols[1]:
                    ui.badge(reminder["due_status"].replace("_", " ").title(), ui.due_tone(reminder["due_status"]))
                    st.markdown(
                        f'<div style="text-align:right;font-weight:700;color:#EEF5F1">{ui.inr(reminder["amount"])}</div>',
                        unsafe_allow_html=True,
                    )

    st.write("")
    active_tab, history_tab = st.tabs([f"Active plans ({len(active)})", f"History ({len(completed)})"])

    with active_tab:
        if not active:
            ui.empty_state(
                "✓",
                "No active installments",
                "You have no monthly commitments in the tracker. Add one from a purchase or from the button above.",
            )
        else:
            for plan in active:
                _plan_card(plan)

    with history_tab:
        if not completed:
            ui.empty_state(
                "▤",
                "No completed plans yet",
                "Plans move here automatically when the final installment is paid.",
            )
        else:
            for plan in completed:
                _plan_card(plan, completed=True)

    if st.session_state.get("installments_show_add"):
        _add_dialog()
    if st.session_state.get("installment_delete_plan"):
        _delete_dialog(st.session_state["installment_delete_plan"])

    st.markdown(
        '<div class="fpv-footer-note">Payments are recorded locally in the demo database. '
        "This tracker does not move money or connect to a lender.</div>",
        unsafe_allow_html=True,
    )
