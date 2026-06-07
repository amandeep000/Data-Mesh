"""
Data-Mesh Ingestion Service
===========================
Entry point for the Python ETL pipeline.

Architecture (mirrors Hexagonal):
  src/
  ├── extractors/     — Pull raw data from EU APIs (HTTPX)
  ├── transformers/   — Normalize & clean with Polars
  ├── loaders/        — Write clean data to PostgreSQL
  ├── models/         — Pydantic domain models (typed, no `Any`)
  ├── ports/          — Abstract base classes (interfaces) for each layer
  └── config/         — Settings via pydantic-settings

TDD Protocol:
  1. Write pytest test first (tests/unit/<layer>/test_*.py)
  2. Run: pytest tests/unit/<layer>/test_*.py  → must FAIL
  3. Implement minimum code
  4. Run: pytest tests/unit/<layer>/test_*.py  → must PASS
  5. Refactor
"""
