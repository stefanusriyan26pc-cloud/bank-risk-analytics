import pandas as pd

from src.portfolio_export import segment_summary, wilson_interval


def test_wilson_interval_contains_observed_rate():
    low, high = wilson_interval(81, 1000)
    assert low < 0.081 < high


def test_segment_summary_excludes_unstable_small_segments():
    frame = pd.DataFrame({
        "segment": ["stable"] * 1000 + ["tiny"] * 5,
        "TARGET": [1] * 80 + [0] * 920 + [1] * 2 + [0] * 3,
    })
    rows = segment_summary(frame, "segment", overall_rate=0.081, minimum_size=500)
    assert [row["label"] for row in rows] == ["stable"]
    assert rows[0]["applications"] == 1000


def test_segment_summary_reports_relative_risk():
    frame = pd.DataFrame({"segment": ["A"] * 1000, "TARGET": [1] * 100 + [0] * 900})
    rows = segment_summary(frame, "segment", overall_rate=0.08)
    assert rows[0]["riskIndex"] == 1.25
