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
    rows: list[dict] = []
    names: list[str] = []
    colors: list[str] = []
    for scenario in simulation["scenarios"]:
        names.append(scenario["name"])
        colors.append(scenario.get("color") or SLATE)
        for point in scenario["path"]:
            rows.append(
                {
                    "date": point["date"],
                    "savings": point["savings"],
                    "scenario": scenario["name"],
                    "month": point["month"],
                }
            )
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    recommended = simulation["recommendation"]["scenario_name"]

    line = (
        alt.Chart(df)
        .mark_line(interpolate="monotone")
        .encode(
            x=alt.X("date:T", title=None, axis=alt.Axis(format="%b %y", tickCount=7)),
            y=alt.Y("savings:Q", title=None, axis=alt.Axis(format="~s")),
            color=alt.Color("scenario:N", scale=alt.Scale(domain=names, range=colors), title=None),
            strokeWidth=alt.condition(
                alt.datum.scenario == recommended, alt.value(3.1), alt.value(1.5)
            ),
            tooltip=[
                alt.Tooltip("scenario:N", title="Future"),
                alt.Tooltip("date:T", format="%d %b %Y", title="Date"),
                alt.Tooltip("savings:Q", format=",.0f", title="Savings"),
            ],
        )
    )

    layers: list[alt.Chart] = [line]
    if target > 0:
        rule = (
            alt.Chart(pd.DataFrame({"target": [target]}))
            .mark_rule(color=AMBER, strokeDash=[5, 4], strokeWidth=1)
            .encode(y="target:Q")
        )
        layers.append(rule)

    return _style(alt.layer(*layers), height=350)


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
