import pandas as pd

from src.metrics import portfolio_summary
from src.transform import aggregate_previous, clean_current, finalize_previous


def test_clean_current_handles_employment_sentinel_and_ratios():
    source = pd.DataFrame({
        "DAYS_BIRTH": [-3652.5, -7305], "DAYS_EMPLOYED": [-365.25, 365243],
        "AMT_INCOME_TOTAL": [100.0, 0.0], "AMT_CREDIT": [250.0, 100.0],
        "AMT_ANNUITY": [10.0, 5.0],
    })
    result = clean_current(source)
    assert result.AGE_YEARS.tolist() == [10.0, 20.0]
    assert result.EMPLOYMENT_YEARS.iloc[0] == 1.0
    assert pd.isna(result.EMPLOYMENT_YEARS.iloc[1])
    assert result.CREDIT_TO_INCOME.iloc[0] == 2.5
    assert pd.isna(result.CREDIT_TO_INCOME.iloc[1])


def test_previous_aggregation_counts_outcomes():
    source = pd.DataFrame({
        "SK_ID_CURR": [1, 1, 2], "SK_ID_PREV": [10, 11, 12],
        "NAME_CONTRACT_STATUS": ["Approved", "Refused", "Approved"],
        "AMT_APPLICATION": [100.0, 200.0, 50.0], "AMT_CREDIT": [90.0, 220.0, 50.0],
    })
    result = finalize_previous(aggregate_previous(source)).set_index("SK_ID_CURR")
    assert result.loc[1, "PREV_APPLICATION_COUNT"] == 2
    assert result.loc[1, "PREV_APPROVAL_RATE"] == 0.5
    assert result.loc[1, "PREV_CREDIT_DIFF_TOTAL"] == 10.0


def test_portfolio_summary_uses_weighted_prior_approval_rate():
    frame = pd.DataFrame({
        "TARGET": [0, 1], "AMT_CREDIT": [100.0, 300.0],
        "CREDIT_TO_INCOME": [1.0, 3.0], "PREV_APPLICATION_COUNT": [1, 3],
        "PREV_APPROVED_COUNT": [1, 1],
    })
    result = portfolio_summary(frame)
    assert result["applications"] == 2
    assert result["payment_difficulty_rate"] == 0.5
    assert result["prior_approval_rate"] == 0.5
