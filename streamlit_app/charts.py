"""Altair charts for the Streamlit interface.

Charts are declared in Python and rendered by Streamlit. No frontend assets or
JavaScript files are involved.
"""

from __future__ import annotations

import altair as alt
import pandas as pd
import streamlit as st

from streamlit_app.ui import inr

EMERALD = "#3DDC97"
AMBER = "#F6C56B"
ROSE = "#FB7185"
BLUE = "#7DB7FF"
VIOLET = "#B49CFF"
SLATE = "#8FA3B8"

RISK_COLORS = {
    "Resilient": EMERALD,
    "Steady": BLUE,
    "Critical": ROSE,
    "Caution": AMBER,
    "Watchful": AMBER,
    "Fragile": ROSE,
    "Stretched": AMBER,
    "Unaffordable": ROSE,
    "Comfortable": EMERALD,
    "Cautious": AMBER,
}


def _style(chart: alt.Chart, *, height: int = 300, legend: bool = True) -> alt.Chart:
    chart = (
        chart.properties(height=height)
        .configure(background="transparent")
        .configure_view(strokeOpacity=0)
        .configure_axis(
            labelColor=SLATE,
            titleColor=SLATE,
            gridColor="rgba(148,163,184,0.10)",
            domain=False,
            tickColor="rgba(148,163,184,0.20)",
            labelFont="Manrope",
            titleFont="Manrope",
            labelFontSize=10,
            titleFontSize=10,
        )
    )
    if legend:
        chart = chart.configure_legend(
            labelColor="#C8D5E2",
            titleColor=SLATE,
            labelFont="Manrope",
            titleFont="Manrope",
            labelFontSize=10,
            titleFontSize=10,
            orient="bottom",
            symbolType="stroke",
        )
    return chart


def render(chart: alt.Chart) -> None:
    st.altair_chart(chart, width="stretch", theme=None)


def projection_chart(points: list[dict], target: float) -> alt.Chart:
    df = pd.DataFrame(points)
    df["date"] = pd.to_datetime(df["date"])

    base = alt.Chart(df).encode(
        x=alt.X("date:T", title=None, axis=alt.Axis(format="%b %y", tickCount=7)),
        y=alt.Y("savings:Q", title=None, axis=alt.Axis(format="~s")),
        tooltip=[
            alt.Tooltip("date:T", format="%d %b %Y", title="Date"),
            alt.Tooltip("savings:Q", format=",.0f", title="Projected savings"),
        ],
    )
    gradient = alt.Gradient(
        gradient="linear",
        stops=[
            alt.GradientStop(color="rgba(61,220,151,0.30)", offset=0),
            alt.GradientStop(color="rgba(61,220,151,0.02)", offset=1),
        ],
        x1=1,
        x2=1,
        y1=1,
        y2=0,
    )
    area = base.mark_area(color=gradient, line=False)
    line = base.mark_line(color=EMERALD, strokeWidth=2.2, interpolate="monotone")

    layers: list[alt.Chart] = [area, line]
    if target > 0:
        rule_df = pd.DataFrame({"target": [target], "label": ["Emergency reserve"]})
        rule = alt.Chart(rule_df).mark_rule(color=AMBER, strokeDash=[5, 4], strokeWidth=1).encode(y="target:Q")
        label = alt.Chart(rule_df).mark_text(
            align="left", dx=5, dy=-7, color=AMBER, fontSize=10, font="Manrope"
        ).encode(y="target:Q", text="label:N")
        layers.extend([rule, label])

    return _style(alt.layer(*layers), height=300, legend=False)


def futures_chart(simulation: dict, target: float) -> alt.Chart:
    """Compare where each future ends and how low it dips.

    A grouped bar chart keeps all six paths comparable without the crossing
    lines of a multi-series trajectory chart.
    """
    scenarios = simulation["scenarios"]
    recommended_id = simulation["recommendation"]["scenario_id"]
    ordered = sorted(
        scenarios,
        key=lambda item: (float(item["final_savings"]), int(item["score"])),
        reverse=True,
    )

    rows: list[dict] = []
    order: list[str] = []
    for scenario in ordered:
        label = str(scenario["name"])
        if scenario["id"] == recommended_id:
            label = f"{label} ★"
        order.append(label)
        for metric, amount in (
            ("Ending balance", float(scenario["final_savings"])),
            ("Lowest balance", float(scenario["minimum_savings"])),
        ):
            rows.append(
                {
                    "label": label,
                    "metric": metric,
                    "amount": amount,
                    "display": inr(amount, compact=True),
                    "risk": scenario["risk_label"],
                    "score": int(scenario["score"]),
                    "id": scenario["id"],
                }
            )

    df = pd.DataFrame(rows)
    metrics = ["Ending balance", "Lowest balance"]
    low = min(float(df["amount"].min()), 0.0)
    high = max(float(df["amount"].max()), float(target), 1.0)
    domain = [low * 1.32 if low < 0 else 0.0, high * 1.24]

    bars = (
        alt.Chart(df)
        .mark_bar(cornerRadiusEnd=4, height=12)
        .encode(
            y=alt.Y(
                "label:N",
                sort=order,
                title=None,
                axis=alt.Axis(labelPadding=8, labelLimit=220),
            ),
            yOffset=alt.YOffset("metric:N", sort=metrics),
            x=alt.X(
                "amount:Q",
                title=None,
                axis=alt.Axis(format="~s"),
                scale=alt.Scale(domain=domain),
            ),
            color=alt.Color(
                "metric:N",
                scale=alt.Scale(domain=metrics, range=[EMERALD, BLUE]),
                legend=alt.Legend(title=None, symbolType="square"),
            ),
            tooltip=[
                alt.Tooltip("label:N", title="Future"),
                alt.Tooltip("metric:N", title="Measure"),
                alt.Tooltip("amount:Q", format=",.0f", title="Amount"),
                alt.Tooltip("risk:N", title="Risk"),
                alt.Tooltip("score:Q", title="Score"),
            ],
        )
    )
    labels = (
        alt.Chart(df[df["amount"] >= 0])
        .mark_text(align="left", dx=6, color="#D7E4EF", font="Manrope", fontSize=9)
        .encode(
            y=alt.Y("label:N", sort=order),
            yOffset=alt.YOffset("metric:N", sort=metrics),
            x=alt.X("amount:Q"),
            text=alt.Text("display:N"),
        )
    )
    layers: list[alt.Chart] = [bars, labels]
    negative = df[df["amount"] < 0]
    if not negative.empty:
        negative_labels = (
            alt.Chart(negative)
            .mark_text(align="right", dx=-6, color="#D7E4EF", font="Manrope", fontSize=9)
            .encode(
                y=alt.Y("label:N", sort=order),
                yOffset=alt.YOffset("metric:N", sort=metrics),
                x=alt.X("amount:Q"),
                text=alt.Text("display:N"),
            )
        )
        layers.append(negative_labels)
    if low < 0:
        zero = (
            alt.Chart(pd.DataFrame({"zero": [0]}))
            .mark_rule(color=SLATE, strokeWidth=1, opacity=0.5)
            .encode(x="zero:Q")
        )
        layers.append(zero)
    if target > 0:
        rule = (
            alt.Chart(pd.DataFrame({"target": [target]}))
            .mark_rule(color=AMBER, strokeDash=[5, 4], strokeWidth=1.2)
            .encode(x="target:Q")
        )
        layers.append(rule)

    return _style(alt.layer(*layers), height=360)


def scenario_path_chart(scenario: dict, target: float) -> alt.Chart:
    """Monthly savings bars for a single future, with the reserve marked."""
    df = pd.DataFrame(scenario["path"])
    df["date"] = pd.to_datetime(df["date"])
    df["tick"] = df["date"].dt.strftime("%b %y")
    df.loc[df["month"] == 0, "tick"] = "Now"
    order = list(df["tick"])
    step = max(1, len(order) // 12)
    ticks = order[::step]
    if order[-1] not in ticks:
        ticks.append(order[-1])
    color = scenario.get("color") or EMERALD

    bars = (
        alt.Chart(df)
        .mark_bar(
            cornerRadiusTopLeft=4,
            cornerRadiusTopRight=4,
            color=color,
            opacity=0.92,
        )
        .encode(
            x=alt.X(
                "tick:O",
                sort=order,
                title=None,
                axis=alt.Axis(labelAngle=-40, labelFontSize=9, values=ticks),
            ),
            y=alt.Y("savings:Q", title=None, axis=alt.Axis(format="~s")),
            tooltip=[
                alt.Tooltip("tick:N", title="Month"),
                alt.Tooltip("savings:Q", format=",.0f", title="Savings"),
                alt.Tooltip("cash_flow:Q", format=",.0f", title="Monthly cash flow"),
                alt.Tooltip("event:N", title="Event"),
            ],
        )
    )
    layers: list[alt.Chart] = [bars]
    if target > 0:
        rule = (
            alt.Chart(pd.DataFrame({"target": [target]}))
            .mark_rule(color=AMBER, strokeDash=[5, 4], strokeWidth=1.2)
            .encode(y="target:Q")
        )
        layers.append(rule)
    if float(df["savings"].min()) < 0:
        zero = (
            alt.Chart(pd.DataFrame({"zero": [0]}))
            .mark_rule(color=SLATE, strokeWidth=1, opacity=0.5)
            .encode(y="zero:Q")
        )
        layers.append(zero)

    return _style(alt.layer(*layers), height=270, legend=False)


def cashflow_chart(cashflow: dict) -> alt.Chart:
    rows = [
        {"label": "Essentials", "amount": cashflow["essential"], "color": BLUE},
        {"label": "Discretionary", "amount": cashflow["discretionary"], "color": VIOLET},
        {"label": "Debt payments", "amount": cashflow["debt"], "color": AMBER},
        {"label": "Free cash flow", "amount": max(cashflow["free_cash_flow"], 0), "color": EMERALD},
    ]
    df = pd.DataFrame(rows)
    df["display"] = df["amount"].apply(lambda value: inr(value, compact=True))
    order = ["Essentials", "Discretionary", "Debt payments", "Free cash flow"]

    bars = (
        alt.Chart(df)
        .mark_bar(cornerRadiusEnd=7, height=25)
        .encode(
            y=alt.Y("label:N", sort=order, title=None),
            x=alt.X(
                "amount:Q",
                title=None,
                axis=alt.Axis(format="~s"),
                scale=alt.Scale(domain=[0, float(df["amount"].max()) * 1.24 or 1]),
            ),
            color=alt.Color("label:N", scale=alt.Scale(domain=order, range=[BLUE, VIOLET, AMBER, EMERALD]), legend=None),
            tooltip=[
                alt.Tooltip("label:N", title="Category"),
                alt.Tooltip("amount:Q", format=",.0f", title="Monthly"),
            ],
        )
    )
    labels = (
        alt.Chart(df)
        .mark_text(align="left", dx=6, color="#D7E4EF", font="Manrope", fontSize=10)
        .encode(y=alt.Y("label:N", sort=order), x="amount:Q", text="display:N")
    )
    return _style(alt.layer(bars, labels), height=205, legend=False)


def trajectory_chart(trajectory: list[dict], amount: float) -> alt.Chart:
    df = pd.DataFrame(trajectory)
    base = alt.Chart(df).encode(
        x=alt.X("month:Q", title=None, axis=alt.Axis(tickMinStep=1, format="d")),
        y=alt.Y("available_for_purchase:Q", title=None, axis=alt.Axis(format="~s")),
        tooltip=[
            alt.Tooltip("label:N", title="Month"),
            alt.Tooltip("available_for_purchase:Q", format=",.0f", title="Available"),
            alt.Tooltip("goal:Q", format=",.0f", title="Goal"),
        ],
    )
    area = base.mark_area(color="rgba(61,220,151,0.13)", line=False)
    line = base.mark_line(color=EMERALD, strokeWidth=2.2, interpolate="monotone")
    goal = (
        alt.Chart(pd.DataFrame({"goal": [amount]}))
        .mark_rule(color=AMBER, strokeDash=[5, 4], strokeWidth=1)
        .encode(y="goal:Q")
    )
    return _style(alt.layer(area, line, goal), height=270, legend=False)


def stress_chart(tests: list[dict]) -> alt.Chart:
    df = pd.DataFrame(tests)
    df["label"] = df["final_savings"].apply(lambda value: inr(value, compact=True))
    order = list(df["name"])
    baseline = float(df.loc[df["id"] == "stress_baseline", "final_savings"].iloc[0]) if "stress_baseline" in set(df["id"]) else None
    max_value = max(float(df["final_savings"].max()), baseline or 0, 1)

    bars = (
        alt.Chart(df)
        .mark_bar(cornerRadiusEnd=6, height=24)
        .encode(
            y=alt.Y("name:N", sort=order, title=None),
            x=alt.X("final_savings:Q", title=None, axis=alt.Axis(format="~s"), scale=alt.Scale(domain=[0, max_value * 1.22])),
            color=alt.Color("risk_label:N", scale=alt.Scale(domain=list(RISK_COLORS), range=list(RISK_COLORS.values())), legend=None),
            tooltip=[
                alt.Tooltip("name:N", title="Stress test"),
                alt.Tooltip("final_savings:Q", format=",.0f", title="Final savings"),
                alt.Tooltip("impact_vs_no_surprises:Q", format=",.0f", title="Impact"),
                alt.Tooltip("risk_label:N", title="Risk"),
            ],
        )
    )
    labels = (
        alt.Chart(df)
        .mark_text(align="left", dx=6, color="#D7E4EF", font="Manrope", fontSize=10)
        .encode(y=alt.Y("name:N", sort=order), x="final_savings:Q", text="label:N")
    )
    layers: list[alt.Chart] = [bars, labels]
    if baseline:
        rule = (
            alt.Chart(pd.DataFrame({"baseline": [baseline]}))
            .mark_rule(color="#E6EEF6", strokeDash=[3, 4], strokeWidth=1, opacity=0.7)
            .encode(x="baseline:Q")
        )
        layers.append(rule)
    return _style(alt.layer(*layers), height=240, legend=False)


def emi_split_chart(schedule: list[dict]) -> alt.Chart:
    df = pd.DataFrame(schedule)
    melted = df.melt(id_vars=["month"], value_vars=["principal", "interest"], var_name="component", value_name="amount")
    order = ["principal", "interest"]
    return _style(
        alt.Chart(melted)
        .mark_bar(cornerRadiusTopLeft=3, cornerRadiusTopRight=3)
        .encode(
            x=alt.X("month:O", title=None, axis=alt.Axis(labelAngle=0)),
            y=alt.Y("amount:Q", title=None, axis=alt.Axis(format="~s")),
            color=alt.Color(
                "component:N",
                scale=alt.Scale(domain=order, range=[EMERALD, AMBER]),
                legend=alt.Legend(title=None),
            ),
            tooltip=[
                alt.Tooltip("month:O", title="Month"),
                alt.Tooltip("component:N", title="Component"),
                alt.Tooltip("amount:Q", format=",.0f", title="Amount"),
            ],
        ),
        height=250,
    )


def balance_chart(schedule: list[dict]) -> alt.Chart:
    df = pd.DataFrame(schedule)
    base = alt.Chart(df).encode(
        x=alt.X("month:O", title=None, axis=alt.Axis(labelAngle=0)),
        y=alt.Y("balance:Q", title=None, axis=alt.Axis(format="~s")),
        tooltip=[
            alt.Tooltip("month:O", title="Month"),
            alt.Tooltip("balance:Q", format=",.0f", title="Balance"),
        ],
    )
    area = base.mark_area(color="rgba(125,183,255,0.16)", line=False)
    line = base.mark_line(color=BLUE, strokeWidth=2, interpolate="monotone")
    return _style(alt.layer(area, line), height=250, legend=False)
