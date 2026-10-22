"""Purchase Planner: readiness, trajectory and saved blueprints."""

from __future__ import annotations

from datetime import date

import streamlit as st

from streamlit_app import api, charts, ui


def _as_date(value: str | date | None, fallback: date) -> date:
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value)[:10])
    except (TypeError, ValueError):
        return fallback


def _load_plans(force: bool = False) -> list[dict]:
    if force or "planner_plans" not in st.session_state:
        try:
            st.session_state["planner_plans"] = api.list_purchase_plans()
        except api.ApiError:
            st.session_state.setdefault("planner_plans", [])
    return st.session_state["planner_plans"]


def _close_save_dialog() -> None:
    st.session_state["planner_show_save"] = False


def _close_delete_dialog() -> None:
    st.session_state.pop("planner_delete_plan", None)


@st.dialog("Save purchase plan", on_dismiss=_close_save_dialog)
def _save_dialog(assessment: dict) -> None:
    st.caption("This blueprint aligns your profile with the purchase you are planning.")
    monthly = st.number_input(
        "Monthly saving plan (₹)",
        min_value=0.0,
        max_value=100_000_000.0,
        value=float(assessment.get("recommended_monthly_saving") or assessment.get("monthly_saving_needed") or 0),
        step=500.0,
        format="%.0f",
    )
    notes = st.text_area(
        "Notes",
        placeholder="What would make this plan worth prioritising?",
        max_chars=1000,
    )
    update_profile = st.checkbox("Use this purchase as my planned purchase", value=True)
    if st.button("Save plan", type="primary", width="stretch"):
        try:
            api.create_purchase_plan(
                {
                    "title": assessment["title"],
                    "amount": assessment["amount"],
                    "target_date": assessment["target_date"],
                    "monthly_saving_plan": float(monthly),
                    "notes": notes,
                    "update_profile": bool(update_profile),
                }
            )
        except api.ApiError as exc:
            st.error(str(exc))
            return
        st.session_state.pop("planner_plans", None)
        st.session_state["planner_show_save"] = False
        if update_profile:
            ui.clear_derived_state()
        ui.set_flash("success", "Purchase plan saved. Your profile is aligned with this blueprint.")
        st.rerun()


@st.dialog("Remove saved plan?", on_dismiss=_close_delete_dialog)
def _delete_dialog(plan: dict) -> None:
    st.write(f"**{plan['title']}** · {ui.inr(plan['amount'])}")
    st.caption("This removes the saved blueprint. Your financial profile values are left unchanged.")
    if st.button("Remove saved plan", type="primary", width="stretch", key="confirm-remove-plan"):
        try:
            api.delete_purchase_plan(plan["id"])
        except api.ApiError as exc:
            st.error(str(exc))
            return
        st.session_state.pop("planner_plans", None)
        st.session_state.pop("planner_delete_plan", None)
        st.session_state.pop("assessment", None)
        st.session_state.pop("planner_loaded", None)
        ui.set_flash("success", "Saved plan removed. Your profile was left unchanged.")
        st.rerun()


def _apply_alternative(amount: float, title: str) -> None:
    """Widget callback: runs before widgets so session state can be changed safely."""
    st.session_state["planner_amount"] = float(amount)
    st.session_state["planner_title"] = title
    st.session_state["planner_alt_pending"] = True


def _assess(payload: dict, *, notify: bool = False) -> dict | None:
    try:
        with st.spinner("Assessing your purchase plan…"):
            result = api.assess_purchase(payload)
        st.session_state["assessment"] = result
        if notify:
            ui.set_flash("success", "Purchase plan analysed.")
            st.rerun()
        return result
    except api.ApiError as exc:
        st.error(str(exc))
        return None


def render() -> None:
    profile = ui.require_profile()
    plans = _load_plans()
    active_plan = next((plan for plan in plans if plan["status"] == "active"), None)

    if "planner_loaded" not in st.session_state or any(
        key not in st.session_state for key in ("planner_amount", "planner_date", "planner_title")
    ):
        fallback_date = _as_date(profile.get("expected_purchase_date"), date.today())
        initial = {
            "title": active_plan["title"] if active_plan else "My next purchase",
            "amount": max(
                float(active_plan["amount"] if active_plan else profile["planned_purchase_amount"]),
                1.0,
            ),
            "target_date": _as_date(active_plan["target_date"] if active_plan else profile.get("expected_purchase_date"), fallback_date),
        }
        st.session_state["planner_amount"] = initial["amount"]
        st.session_state["planner_date"] = initial["target_date"]
        st.session_state["planner_title"] = initial["title"]
        _assess(initial)
        st.session_state["planner_loaded"] = True

    ui.page_header(
        "Purchase planner",
        "Make room for what you want.",
        "Turn a purchase target into a realistic timeline without spending your safety net. "
        "The emergency reserve stays ring-fenced.",
    )

    form_col, result_col = st.columns([0.82, 1.18], gap="large")

    with form_col:
        with st.form("purchase-plan-form", border=True):
            st.markdown("#### Plan the numbers")
            title = st.text_input("Purchase name", key="planner_title", max_chars=140)
            amount = st.number_input(
                "Purchase amount (₹)",
                min_value=1.0,
                max_value=1_000_000_000.0,
                step=1000.0,
                format="%.0f",
                key="planner_amount",
            )
            target = st.date_input("Target date", key="planner_date")
            st.caption(
                f"Safe to spend today {ui.inr(profile['safe_to_spend'])} · "
                f"free cash flow {ui.inr(profile['monthly_free_cash_flow'])} per month."
            )
            submitted = st.form_submit_button("Assess this plan", type="primary", width="stretch")

        if submitted:
            _assess(
                {
                    "title": (title or "My next purchase").strip(),
                    "amount": float(amount),
                    "target_date": target,
                },
                notify=True,
            )

        if active_plan:
            with st.container(border=True):
                ui.badge("Active blueprint", "blue")
                st.markdown(f"**{active_plan['title']}**")
                st.caption(
                    f"{ui.inr(active_plan['amount'])} · target {ui.format_date(active_plan['target_date'])}"
                )
                ui.kv_row("Monthly saving plan", ui.inr(active_plan["monthly_saving_plan"]))
                if active_plan.get("notes"):
                    st.caption(active_plan["notes"])
                if st.button("Remove active plan", key=f"remove-plan-{active_plan['id']}", width="stretch"):
                    st.session_state["planner_delete_plan"] = active_plan
                    st.rerun()

        if plans:
            with st.expander(f"Saved plans ({len(plans)})", expanded=False):
                for plan in plans:
                    cols = st.columns([0.72, 0.28], vertical_alignment="center")
                    with cols[0]:
                        st.markdown(f"**{plan['title']}**")
                        st.caption(
                            f"{ui.inr(plan['amount'])} · {ui.format_date(plan['target_date'])} · {plan['status'].title()}"
                        )
                    with cols[1]:
                        if st.button("Remove", key=f"remove-archived-{plan['id']}", width="stretch"):
                            st.session_state["planner_delete_plan"] = plan
                            st.rerun()

    if st.session_state.pop("planner_alt_pending", False):
        _assess(
            {
                "title": st.session_state.get("planner_title", "My next purchase"),
                "amount": float(st.session_state.get("planner_amount", 1)),
                "target_date": _as_date(st.session_state.get("planner_date"), date.today()),
            }
        )

    assessment = st.session_state.get("assessment")
    with result_col:
        if not assessment:
            ui.empty_state(
                "◎",
                "No assessment loaded",
                "Use the planner form to see what your current pace can support and what needs to change.",
            )
        else:
            status_tone = ui.risk_tone(assessment["status"])
            with st.container(border=True):
                ui.badge(assessment["status"].replace("_", " ").title(), status_tone)
                st.markdown(f"## {assessment['headline']}")
                st.write(assessment["summary"])
                st.progress(min(max(assessment["readiness_pct"] / 100, 0.0), 1.0))
                st.caption(
                    f"{assessment['readiness_pct']:.0f}% of the purchase is covered by safe-to-spend savings."
                )
                metrics = st.columns(3)
                metrics[0].metric("Available today", ui.inr(assessment["available_today"]), border=True)
                metrics[1].metric("Gap", ui.inr(assessment["gap"]), border=True)
                metrics[2].metric(
                    "Monthly saving",
                    ui.inr(assessment["monthly_saving_needed"]),
                    border=True,
                    help="Required each month to close the gap by the target date.",
                )
                if assessment["gap"] <= 0:
                    ui.callout("This purchase is fully covered without touching your emergency fund.")
                else:
                    ui.callout(
                        f"First step: {assessment['recommended_first_step']}",
                        tone="warning",
                    )
                actions = st.columns(2)
                with actions[0]:
                    if st.button("Save this plan", type="primary", width="stretch"):
                        st.session_state["planner_show_save"] = True
                        st.rerun()
                with actions[1]:
                    if assessment.get("suggested_alternative") and assessment["suggested_alternative"] < assessment["amount"]:
                        st.button(
                            f"Try {ui.inr(assessment['suggested_alternative'])} option",
                            width="stretch",
                            key="try-alternative",
                            on_click=_apply_alternative,
                            args=(
                                float(assessment["suggested_alternative"]),
                                f"{assessment['title']} — lighter option",
                            ),
                        )

    if assessment:
        st.write("")
        detail_left, detail_right = st.columns([1.35, 1], gap="large")
        with detail_left:
            with st.container(border=True):
                st.markdown("#### Path to the target")
                st.caption(
                    f"Available savings grow toward the {ui.inr(assessment['amount'])} goal. "
                    f"The current plan is {'on track' if assessment['on_track'] else 'behind pace'}."
                )
                charts.render(charts.trajectory_chart(assessment["trajectory"], assessment["amount"]))
                if assessment.get("estimated_affordable_date"):
                    st.caption(f"Estimated affordable date at current pace: {ui.format_date(assessment['estimated_affordable_date'])}")
        with detail_right:
            with st.container(border=True):
                st.markdown("#### Readiness checks")
                for factor in assessment["factors"]:
                    cols = st.columns([0.68, 0.32], vertical_alignment="center")
                    with cols[0]:
                        st.markdown(f"**{factor['label']}**")
                        st.caption(factor["detail"])
                    with cols[1]:
                        ui.badge(factor["value"], ui.risk_tone(factor["status"]))
                    st.markdown('<div class="fpv-divider"></div>', unsafe_allow_html=True)

        with st.container(border=True):
            st.markdown("#### What would make this plan stronger")
            for item in assessment["recommendations"]:
                st.markdown(f"- {item}")
            st.caption(
                "This planner separates the emergency reserve from spendable savings. "
                "It does not recommend borrowing against the reserve."
            )

    if assessment and st.session_state.get("planner_show_save"):
        _save_dialog(assessment)
    if st.session_state.get("planner_delete_plan"):
        _delete_dialog(st.session_state["planner_delete_plan"])

    st.markdown(
        '<div class="fpv-footer-note">Illustrative projection · not financial advice. '
        "Reassess after any change in income, expenses or debt.</div>",
        unsafe_allow_html=True,
    )
