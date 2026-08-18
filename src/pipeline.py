from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

import pandas as pd

from .config import APPLICATION_PATH, MODEL_PATH, PORTFOLIO_DATA_PATH, PREVIOUS_PATH, PROCESSED_DIR, QUALITY_PATH, SUMMARY_PATH
from .metrics import portfolio_summary
from .transform import CURRENT_COLUMNS, PREVIOUS_COLUMNS, aggregate_previous, clean_current, finalize_previous


def _require_inputs() -> None:
    missing = [str(path) for path in (APPLICATION_PATH, PREVIOUS_PATH) if not path.exists()]
    if missing:
        raise FileNotFoundError("Missing raw input(s): " + ", ".join(missing))


def _aggregate_previous_chunks(applicant_ids: set[int], chunksize: int = 200_000) -> pd.DataFrame:
    partials: list[pd.DataFrame] = []
    for chunk in pd.read_csv(PREVIOUS_PATH, usecols=PREVIOUS_COLUMNS, chunksize=chunksize):
        relevant = chunk[chunk["SK_ID_CURR"].isin(applicant_ids)]
        if not relevant.empty:
            partials.append(aggregate_previous(relevant))
    if not partials:
        return pd.DataFrame(columns=[
            "SK_ID_CURR", "PREV_APPLICATION_COUNT", "PREV_APPROVED_COUNT",
            "PREV_REFUSED_COUNT", "PREV_CREDIT_TOTAL",
            "PREV_CREDIT_DIFF_TOTAL", "PREV_APPROVAL_RATE",
        ])
    combined = pd.concat(partials, ignore_index=True)
    totals = combined.groupby("SK_ID_CURR", as_index=False).sum(numeric_only=True)
    return finalize_previous(totals)


def _quality_report(frame: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for column in frame.columns:
        rows.append({
            "column": column,
            "dtype": str(frame[column].dtype),
            "missing_count": int(frame[column].isna().sum()),
            "missing_rate": float(frame[column].isna().mean()),
            "distinct_count": int(frame[column].nunique(dropna=True)),
        })
    return pd.DataFrame(rows)


def _atomic_write_csv(frame: pd.DataFrame, destination: Path) -> None:
    temporary = destination.with_suffix(destination.suffix + ".tmp")
    frame.to_csv(temporary, index=False)
    os.replace(temporary, destination)


def build(sample_rows: int | None = None) -> dict[str, int | float]:
    _require_inputs()
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    current = pd.read_csv(APPLICATION_PATH, usecols=CURRENT_COLUMNS, nrows=sample_rows)
    current = clean_current(current)
    previous = _aggregate_previous_chunks(set(current["SK_ID_CURR"]))
    model = current.merge(previous, on="SK_ID_CURR", how="left", validate="one_to_one")
    count_columns = ["PREV_APPLICATION_COUNT", "PREV_APPROVED_COUNT", "PREV_REFUSED_COUNT", "PREV_CREDIT_TOTAL", "PREV_CREDIT_DIFF_TOTAL", "PREV_APPROVAL_RATE"]
    model[count_columns] = model[count_columns].fillna(0)

    if model["SK_ID_CURR"].duplicated().any():
        raise ValueError("Applicant key is not unique after model build")
    if not model["TARGET"].dropna().isin([0, 1]).all():
        raise ValueError("TARGET must contain only 0 or 1")

    summary = portfolio_summary(model)
    _atomic_write_csv(model, MODEL_PATH)
    _atomic_write_csv(_quality_report(model), QUALITY_PATH)
    temporary = SUMMARY_PATH.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    os.replace(temporary, SUMMARY_PATH)
    from .portfolio_export import export_portfolio_data
    export_portfolio_data(MODEL_PATH, PORTFOLIO_DATA_PATH)
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the applicant-level risk analytical model.")
    parser.add_argument("--sample-rows", type=int, default=None)
    args = parser.parse_args()
    print(json.dumps(build(args.sample_rows), indent=2))


if __name__ == "__main__":
    main()
