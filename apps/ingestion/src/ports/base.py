"""
Ports — Abstract base classes (interfaces) for the ingestion pipeline.

Following the Dependency Inversion Principle:
  - Concrete extractors, transformers, loaders implement these ABCs.
  - Tests mock these ABCs without touching real I/O.
"""
from abc import ABC, abstractmethod
import polars as pl


class BaseExtractor(ABC):
    """Defines the contract for pulling raw data from an external EU data source."""

    @abstractmethod
    async def fetch(self, endpoint: str) -> pl.DataFrame:
        """
        Fetch raw data from the given endpoint.
        Returns a raw (un-normalised) Polars DataFrame.
        """
        ...


class BaseTransformer(ABC):
    """Defines the contract for normalising a raw DataFrame."""

    @abstractmethod
    def transform(self, raw: pl.DataFrame) -> pl.DataFrame:
        """
        Accept a raw DataFrame, return a clean, typed, normalised DataFrame.
        Must raise ValueError if required columns are missing.
        """
        ...


class BaseLoader(ABC):
    """Defines the contract for persisting a clean DataFrame to the database."""

    @abstractmethod
    async def load(self, data: pl.DataFrame, dataset_slug: str) -> int:
        """
        Persist rows to PostgreSQL.
        Returns the number of rows written.
        """
        ...
