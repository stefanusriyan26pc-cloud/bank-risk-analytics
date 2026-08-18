from __future__ import annotations

import math

import pandas as pd


def portfolio_summary(frame: pd.DataFrame) -> dict[str, int | float]:
    applications = int(len(frame))
    prior_count = int(frame["PREV_APPLICATION_COUNT"].sum()) if applications else 0
    approved = int(frame["PREV_APPROVED_COUNT"].sum()) if applications else 0
    difficulty_rate = float(frame["TARGET"].mean()) if applications else 0.0
    return {
        "applications": applications,
        "payment_difficulty_count": int(frame["TARGET"].sum()) if applications else 0,
        "payment_difficulty_rate": _finite(difficulty_rate),
        "total_credit": _finite(float(frame["AMT_CREDIT"].sum())) if applications else 0.0,
        "median_credit_to_income": _finite(float(frame["CREDIT_TO_INCOME"].median())) if applications else 0.0,
        "prior_applications": prior_count,
        "prior_approval_rate": _finite(approved / prior_count) if prior_count else 0.0,
    }


def _finite(value: float) -> float:
    return value if math.isfinite(value) else 0.0
