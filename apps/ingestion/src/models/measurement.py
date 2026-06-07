"""
Pydantic domain models for the ingestion layer.
All fields are explicitly typed — no use of `Any`.
"""
from datetime import datetime
from enum import StrEnum
from pydantic import BaseModel, HttpUrl, field_validator


class DataSource(StrEnum):
    EEA = "EEA"
    EUROSTAT = "EUROSTAT"
    COPERNICUS = "COPERNICUS"


class IngestionStatus(StrEnum):
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class MeasurementRecord(BaseModel):
    """A single normalised measurement row ready for DB insertion."""

    dataset_slug: str
    country: str        # ISO 3166-1 alpha-2
    region: str | None = None
    recorded_at: datetime
    value: float

    @field_validator("country")
    @classmethod
    def country_must_be_iso2(cls, v: str) -> str:
        if len(v) != 2 or not v.isalpha():
            raise ValueError(f"country must be ISO 3166-1 alpha-2, got: {v!r}")
        return v.upper()


class IngestionRunResult(BaseModel):
    """Result returned after a pipeline run completes."""

    dataset_slug: str
    status: IngestionStatus
    rows_written: int
    error_msg: str | None = None
    started_at: datetime
    finished_at: datetime
