from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import pandas as pd

from .config import MODEL_PATH, PORTFOLIO_DATA_PATH
from .metrics import portfolio_summary


MIN_SEGMENT_SIZE = 500


def wilson_interval(successes: int, observations: int, z: float = 1.96) -> tuple[float, float]:
    if observations == 0:
        return 0.0, 0.0
    rate = successes / observations
    denominator = 1 + (z**2 / observations)
    centre = rate + (z**2 / (2 * observations))
    margin = z * math.sqrt((rate * (1 - rate) / observations) + (z**2 / (4 * observations**2)))
    return (centre - margin) / denominator, (centre + margin) / denominator


def segment_summary(
    frame: pd.DataFrame,
    column: str,
    overall_rate: float,
    *,
    minimum_size: int = MIN_SEGMENT_SIZE,
) -> list[dict[str, int | float | str]]:
    grouped = frame.groupby(column, observed=True, dropna=False)["TARGET"].agg(["count", "sum", "mean"])
    grouped = grouped[grouped["count"] >= minimum_size].sort_values("mean", ascending=False)
    rows: list[dict[str, int | float | str]] = []
    for label, values in grouped.iterrows():
        observations = int(values["count"])
        successes = int(values["sum"])
        low, high = wilson_interval(successes, observations)
        rows.append({
            "label": "Unknown" if pd.isna(label) else str(label),
            "applications": observations,
            "difficultyCount": successes,
            "difficultyRate": float(values["mean"]),
            "ciLow": low,
            "ciHigh": high,
            "riskIndex": float(values["mean"] / overall_rate) if overall_rate else 0.0,
        })
    return rows


def build_portfolio_data(frame: pd.DataFrame) -> dict:
    summary = portfolio_summary(frame)
    overall_rate = float(summary["payment_difficulty_rate"])

    work = frame.copy()
    work["AGE_BAND"] = pd.cut(
        work["AGE_YEARS"],
        bins=[20, 30, 40, 50, 60, 70],
        labels=["20–29", "30–39", "40–49", "50–59", "60–69"],
        include_lowest=True,
        right=False,
    )
    work["AFFORDABILITY_BAND"] = pd.cut(
        work["CREDIT_TO_INCOME"],
        bins=[0, 2, 4, 6, 8, float("inf")],
        labels=["Under 2×", "2–4×", "4–6×", "6–8×", "8× and above"],
        include_lowest=True,
        right=False,
    )

    income_segments = segment_summary(work, "NAME_INCOME_TYPE", overall_rate)
    contract_segments = segment_summary(work, "NAME_CONTRACT_TYPE", overall_rate)
    age_segments = segment_summary(work, "AGE_BAND", overall_rate)
    affordability_segments = segment_summary(work, "AFFORDABILITY_BAND", overall_rate, minimum_size=1)

    prior_total = int(summary["prior_applications"])
    prior_approved = int(work["PREV_APPROVED_COUNT"].sum())
    prior_refused = int(work["PREV_REFUSED_COUNT"].sum())
    prior_other = max(prior_total - prior_approved - prior_refused, 0)
    linked_history = int((work["PREV_APPLICATION_COUNT"] > 0).sum())

    highest_income = income_segments[0]
    return {
        "meta": {
            "title": "Credit Risk & Lending Portfolio Analytics",
            "targetDefinition": "Client experienced payment difficulty under the dataset's late-payment definition.",
            "minimumSegmentSize": MIN_SEGMENT_SIZE,
            "monetaryUnit": "Source currency units (dataset does not identify a currency)",
        },
        "overview": {
            **summary,
            "linkedHistoryApplicants": linked_history,
            "linkedHistoryRate": linked_history / len(work),
            "medianAnnuityToIncome": float(work["ANNUITY_TO_INCOME"].median()),
        },
        "segments": {
            "income": income_segments,
            "contract": contract_segments,
            "age": age_segments,
            "affordability": affordability_segments,
        },
        "priorOutcomes": [
            {"label": "Approved", "count": prior_approved, "share": prior_approved / prior_total},
            {"label": "Refused", "count": prior_refused, "share": prior_refused / prior_total},
            {"label": "Cancelled / unused", "count": prior_other, "share": prior_other / prior_total},
        ],
        "quality": {
            "rawApplicationColumns": 122,
            "analyticalModelColumns": int(work.shape[1] - 2),
            "employmentSentinelCount": int(work["EMPLOYMENT_YEARS"].isna().sum()),
            "unknownGenderCount": int(work["CODE_GENDER"].eq("XNA").sum()),
            "occupationMissingRate": float(work["OCCUPATION_TYPE"].isna().mean()),
            "creditToIncomeP99": float(work["CREDIT_TO_INCOME"].quantile(0.99)),
        },
        "insights": [
            {
                "eyebrow": "Portfolio baseline",
                "title": f"{overall_rate:.1%} of current applications show payment difficulty",
                "body": "This is a descriptive outcome rate, not a probability of default or a causal estimate.",
            },
            {
                "eyebrow": "Highest stable segment",
                "title": f"{highest_income['label']} applicants index at {highest_income['riskIndex']:.2f}× the baseline",
                "body": f"The estimate is based on {highest_income['applications']:,} applications; segments below {MIN_SEGMENT_SIZE:,} are excluded.",
            },
            {
                "eyebrow": "History coverage",
                "title": f"{linked_history / len(work):.1%} of applicants have linked prior decisions",
                "body": "Prior outcomes add context, but they may also encode earlier policy choices and should not be treated as neutral ground truth.",
            },
        ],
    }


def export_portfolio_data(source: Path = MODEL_PATH, destination: Path = PORTFOLIO_DATA_PATH) -> Path:
    frame = pd.read_csv(source)
    payload = build_portfolio_data(frame)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    temporary.replace(destination)
    return destination


def main() -> None:
    parser = argparse.ArgumentParser(description="Export curated, portfolio-safe dashboard aggregates.")
    parser.add_argument("--source", type=Path, default=MODEL_PATH)
    parser.add_argument("--output", type=Path, default=PORTFOLIO_DATA_PATH)
    args = parser.parse_args()
    print(export_portfolio_data(args.source, args.output))


if __name__ == "__main__":
    main()
