"""
Pytest shared fixtures for the ingestion test suite.

All fixtures are strictly typed — no use of `Any`.
Mocked HTTP responses use `respx` to intercept HTTPX calls.
"""
import pytest
import polars as pl
from datetime import datetime


@pytest.fixture
def sample_raw_eea_df() -> pl.DataFrame:
    """
    A minimal raw EEA-like DataFrame to simulate what the extractor returns
    before transformation. Column names intentionally messy to reflect real data.
    """
    return pl.DataFrame(
        {
            "CountryOrTerritory": ["DE", "FR", "PL", "IT"],
            "ReportingYear":      [2022, 2022, 2022, 2022],
            "Pollutant":          ["PM2.5", "PM2.5", "PM2.5", "PM2.5"],
            "AnnualMeanValue":    [12.4, 9.1, 18.7, 14.2],
            "Unit":               ["µg/m³", "µg/m³", "µg/m³", "µg/m³"],
        }
    )


@pytest.fixture
def sample_clean_df() -> pl.DataFrame:
    """
    The expected normalised DataFrame after transformation.
    Column names match the MeasurementRecord model.
    """
    return pl.DataFrame(
        {
            "dataset_slug":  ["eea-air-quality"] * 4,
            "country":       ["DE", "FR", "PL", "IT"],
            "region":        [None, None, None, None],
            "recorded_at":   [
                datetime(2022, 12, 31),
                datetime(2022, 12, 31),
                datetime(2022, 12, 31),
                datetime(2022, 12, 31),
            ],
            "value":         [12.4, 9.1, 18.7, 14.2],
        }
    )
