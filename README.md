# Credit Risk & Lending Portfolio Analytics

An end-to-end portfolio case study that turns 307,511 current lending applications
and linked prior decisions into an explainable risk-monitoring experience.

## The business question

How can a consumer-finance risk team identify portfolio segments associated with
payment difficulty while preserving opportunity for applicants who are likely to
repay?

This project is descriptive decision support. It is **not** an approval model and
does not recommend automated eligibility rules.

## Data source

The analysis uses the [Risk Analytics in Banking](https://www.kaggle.com/datasets/sabarostami/risk-analytics-in-banking)
dataset published by Sabar Ostami on Kaggle. The primary files are
`application_data.csv`, containing current application information, and
`previous_application.csv`, containing linked historical lending decisions.

The source dataset is used for educational portfolio analysis. Its monetary
currency and observation date are not identified, so this project does not make
currency-conversion or time-trend claims.

## What makes the analysis trustworthy

- One-row-per-applicant analytical model with validated keys
- Chunked aggregation of the 1.67M-row prior-application source
- Employment sentinel `365243` converted to missing, not treated as tenure
- Affordability ratios computed only when annual income is positive
- Segments below 500 applications suppressed from comparative risk views
- 95% Wilson confidence intervals reported with segment rates
- Sensitive and historical-policy fields treated as monitoring context, not rules
- Monetary values described as source currency units because the dataset does not
  identify a currency

## Architecture

```text
Immutable CSV sources
        ↓
Python cleaning + feature engineering
        ↓
Applicant-level analytical model
        ↓
Portfolio-safe JSON aggregates
        ↓
Next.js analytical dashboard
```

## Repository map

```text
src/                    Python pipeline, transformations, metrics, export
tests/                  Data-contract and statistical-guardrail tests
dashboard/              Next.js 16 + React 19 analytical portfolio UI
legacy/                 Archived Streamlit prototype (not the main entrypoint)
data/raw/               Original Kaggle files (ignored by Git)
data/processed/         Generated analytical artifacts (ignored by Git)
```

## Run the data pipeline

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m src.pipeline
pytest -q
```

The pipeline atomically replaces generated artifacts and refreshes
`dashboard/src/data/portfolio.json`. For a fast development build:

```bash
python -m src.pipeline --sample-rows 50000
```

## Run the portfolio dashboard

```bash
cd dashboard
npm install
npm run dev
```

Production verification:

```bash
npm run lint
npm run build
```

## Free deployment on GitHub Pages

The dashboard is configured as a static Next.js export. Every push to `main`
runs tests, lint, and build checks before deploying `dashboard/out` through the
GitHub Pages environment.

The project site is published at `https://desta-data-analytics.github.io/credit-risk-analytics/`.
The build automatically uses a repository base path for project Pages and the
root path for account or organization Pages.

## Core definitions

- **Payment difficulty:** `TARGET = 1`, using the source dataset's late-payment
  definition. It is not relabeled as default.
- **Credit-to-income:** current requested credit divided by annual income.
- **Annuity-to-income:** current annual annuity divided by annual income.
- **Prior approval rate:** approved linked prior applications divided by all
  linked prior decisions for applicants in the current model.
- **Risk index:** segment payment-difficulty rate divided by the portfolio rate.

## Limits

The dataset has no identified currency or observation date, so the project makes
no currency conversion, time-trend, expected-loss, or causal claims. Prior lending
decisions may encode historical policy bias. Before operational use, findings
would require temporal validation, fairness review, stability monitoring, and
analysis that controls for confounding variables.
