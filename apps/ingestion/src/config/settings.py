"""
Configuration — loaded from environment via pydantic-settings.
All settings are strictly typed. No `Any` used.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database
    database_url: str

    # EU Data Sources
    eea_base_url: str = "https://discomap.eea.europa.eu/map/fme/public"
    eurostat_base_url: str = "https://ec.europa.eu/eurostat/api/dissemination"

    # HTTP
    http_timeout_seconds: int = 30
    http_max_retries: int = 3

    # Logging
    log_level: str = "INFO"


# Singleton — import this everywhere instead of instantiating Settings()
settings = Settings()
