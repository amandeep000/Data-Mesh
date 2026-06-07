"""
Sample fixture data for HTTP response mocking.
Used with `respx` to mock HTTPX calls in extractor tests.
"""

EEA_AIR_QUALITY_RESPONSE = {
    "features": [
        {
            "properties": {
                "CountryOrTerritory": "DE",
                "ReportingYear": 2022,
                "Pollutant": "PM2.5",
                "AnnualMeanValue": 12.4,
                "Unit": "µg/m³",
            }
        },
        {
            "properties": {
                "CountryOrTerritory": "FR",
                "ReportingYear": 2022,
                "Pollutant": "PM2.5",
                "AnnualMeanValue": 9.1,
                "Unit": "µg/m³",
            }
        },
    ]
}

EUROSTAT_CO2_RESPONSE = {
    "value": {"0": 800.5, "1": 650.2},
    "dimension": {
        "geo": {"category": {"index": {"DE": 0, "FR": 1}}},
        "time": {"category": {"index": {"2022": 0}}},
    },
}
