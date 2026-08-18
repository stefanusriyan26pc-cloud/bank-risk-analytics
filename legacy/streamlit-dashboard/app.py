from pathlib import Path
import sys

import pandas as pd
import plotly.express as px
import streamlit as st

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from src.config import MODEL_PATH  # noqa: E402
from src.metrics import portfolio_summary  # noqa: E402

st.set_page_config(page_title="Lending Risk Overview", page_icon="◈", layout="wide")


@st.cache_data
def load_model() -> pd.DataFrame:
    return pd.read_csv(MODEL_PATH)


st.title("Lending Risk Overview")
st.caption("Descriptive monitoring of current applications and prior lending outcomes")

if not MODEL_PATH.exists():
    st.error("Processed model not found. Run `python -m src.pipeline` first.")
    st.stop()

data = load_model()
with st.sidebar:
    st.header("Portfolio filters")
    contracts = st.multiselect("Contract type", sorted(data["NAME_CONTRACT_TYPE"].dropna().unique()))
    income_types = st.multiselect("Income type", sorted(data["NAME_INCOME_TYPE"].dropna().unique()))
    age_range = st.slider("Age", int(data.AGE_YEARS.min()), int(data.AGE_YEARS.max()), (int(data.AGE_YEARS.min()), int(data.AGE_YEARS.max())))

filtered = data[data.AGE_YEARS.between(*age_range)]
if contracts:
    filtered = filtered[filtered.NAME_CONTRACT_TYPE.isin(contracts)]
if income_types:
    filtered = filtered[filtered.NAME_INCOME_TYPE.isin(income_types)]

summary = portfolio_summary(filtered)
cols = st.columns(4)
cols[0].metric("Applications", f"{summary['applications']:,}")
cols[1].metric("Payment difficulty", f"{summary['payment_difficulty_rate']:.1%}")
cols[2].metric("Credit requested", f"{summary['total_credit']/1_000_000_000:.2f}B")
cols[3].metric("Prior approval rate", f"{summary['prior_approval_rate']:.1%}")

left, right = st.columns(2)
segment = (filtered.groupby("NAME_INCOME_TYPE", dropna=False).agg(applications=("SK_ID_CURR", "count"), difficulty_rate=("TARGET", "mean")).reset_index())
left.plotly_chart(px.bar(segment, x="NAME_INCOME_TYPE", y="difficulty_rate", hover_data=["applications"], title="Payment difficulty by income type", labels={"difficulty_rate": "Difficulty rate", "NAME_INCOME_TYPE": "Income type"}), width="stretch")
right.plotly_chart(px.histogram(filtered, x="CREDIT_TO_INCOME", color="TARGET", nbins=50, barmode="overlay", title="Credit-to-income distribution", labels={"TARGET": "Payment difficulty"}), width="stretch")

st.subheader("Highest-volume segments")
st.dataframe(segment.sort_values("applications", ascending=False), width="stretch", hide_index=True)
st.caption("For portfolio analysis only. This dashboard must not be used as an automated eligibility decision.")
