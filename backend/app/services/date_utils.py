import calendar
from datetime import date


def add_months(value: date, months: int) -> date:
    """Add calendar months while clamping to the last valid day of the month."""
    target_month = value.month - 1 + months
    year = value.year + target_month // 12
    month = target_month % 12 + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def month_label(value: date, include_year: bool = False) -> str:
    return value.strftime("%b %Y" if include_year else "%b")


def days_between(start: date, end: date) -> int:
    return (end - start).days
