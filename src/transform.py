from __future__ import annotations

import numpy as np
import pandas as pd

CURRENT_COLUMNS = [
    "SK_ID_CURR", "TARGET", "NAME_CONTRACT_TYPE", "CODE_GENDER",
    "CNT_CHILDREN", "AMT_INCOME_TOTAL", "AMT_CREDIT", "AMT_ANNUITY",
    "NAME_INCOME_TYPE", "NAME_EDUCATION_TYPE", "NAME_FAMILY_STATUS",
    "NAME_HOUSING_TYPE", "DAYS_BIRTH", "DAYS_EMPLOYED",
    "OCCUPATION_TYPE", "ORGANIZATION_TYPE", "REGION_RATING_CLIENT",
]

PREVIOUS_COLUMNS = ["SK_ID_CURR", "SK_ID_PREV", "NAME_CONTRACT_STATUS", "AMT_APPLICATION", "AMT_CREDIT"]


def clean_current(frame: pd.DataFrame) -> pd.DataFrame:
    """Create analysis-ready current-application fields without imputing outcomes."""
    result = frame.copy()
    result["AGE_YEARS"] = (-result["DAYS_BIRTH"] / 365.25).round(1)
    employed = result["DAYS_EMPLOYED"].where(result["DAYS_EMPLOYED"] <= 0)
    result["EMPLOYMENT_YEARS"] = (-employed / 365.25).round(1)
    result["CREDIT_TO_INCOME"] = np.where(
        result["AMT_INCOME_TOTAL"] > 0,
        result["AMT_CREDIT"] / result["AMT_INCOME_TOTAL"],
        np.nan,
    )
    result["ANNUITY_TO_INCOME"] = np.where(
        result["AMT_INCOME_TOTAL"] > 0,
        result["AMT_ANNUITY"] / result["AMT_INCOME_TOTAL"],
        np.nan,
    )
    return result.drop(columns=["DAYS_BIRTH", "DAYS_EMPLOYED"])


def aggregate_previous(frame: pd.DataFrame) -> pd.DataFrame:
    """Aggregate one or more prior applications to the current applicant grain."""
    work = frame.copy()
    work["PREV_APPROVED"] = work["NAME_CONTRACT_STATUS"].eq("Approved").astype("int64")
    work["PREV_REFUSED"] = work["NAME_CONTRACT_STATUS"].eq("Refused").astype("int64")
    work["PREV_CREDIT_DIFF"] = work["AMT_CREDIT"] - work["AMT_APPLICATION"]
    grouped = work.groupby("SK_ID_CURR", sort=False).agg(
        PREV_APPLICATION_COUNT=("SK_ID_PREV", "count"),
        PREV_APPROVED_COUNT=("PREV_APPROVED", "sum"),
        PREV_REFUSED_COUNT=("PREV_REFUSED", "sum"),
        PREV_CREDIT_TOTAL=("AMT_CREDIT", "sum"),
        PREV_CREDIT_DIFF_TOTAL=("PREV_CREDIT_DIFF", "sum"),
    )
    return grouped.reset_index()


def finalize_previous(frame: pd.DataFrame) -> pd.DataFrame:
    result = frame.copy()
    result["PREV_APPROVAL_RATE"] = (
        result["PREV_APPROVED_COUNT"] / result["PREV_APPLICATION_COUNT"]
    ).fillna(0)
    return result
