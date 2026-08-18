from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = PROJECT_ROOT / "data" / "raw" / "dataset"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"

APPLICATION_PATH = RAW_DIR / "application_data.csv"
PREVIOUS_PATH = RAW_DIR / "previous_application.csv"
MODEL_PATH = PROCESSED_DIR / "applicant_risk_model.csv"
QUALITY_PATH = PROCESSED_DIR / "data_quality.csv"
SUMMARY_PATH = PROCESSED_DIR / "portfolio_summary.json"
PORTFOLIO_DATA_PATH = PROJECT_ROOT / "dashboard" / "src" / "data" / "portfolio.json"
