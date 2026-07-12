/**
 * Data-Mesh Database Seed Script
 *
 * Generates realistic EU environmental data simulating EEA, Eurostat, and
 * Copernicus Climate Change Service sources — the three DataSource enum values.
 *
 * Usage:
 *   npm run db:seed:dry   — validate generated data without writing to DB
 *   npm run db:seed       — wipe & seed the database
 *
 * All data is deterministic (seeded PRNG) so every run produces identical output.
 */

import "dotenv/config";
import type { DataSource, IngestionStatus, UserRole } from "@prisma/client";
import { createHash, randomBytes, scryptSync } from "node:crypto";

// ─── Deterministic PRNG (mulberry32) ─────────────────────────
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260711);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)] as T;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function roundTo(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

// ─── Hashing ──────────────────────────────────────────────────
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

// ─── Enum value sets (mirror Prisma schema) ───────────────────
const VALID_SOURCES: readonly DataSource[] = ["EEA", "EUROSTAT", "COPERNICUS"];
const VALID_ROLES: readonly UserRole[] = ["ADMIN", "DEVELOPER"];
const VALID_STATUSES: readonly IngestionStatus[] = ["RUNNING", "SUCCESS", "FAILED"];

// ─── EU Country reference data ────────────────────────────────
const EU_COUNTRIES = [
  "DE", "FR", "ES", "IT", "NL", "PL", "SE", "NO", "FI", "DK",
  "BE", "AT", "IE", "PT", "GR", "CZ", "RO", "HU", "BG", "HR",
];

const NORDIC_COUNTRIES = ["SE", "NO", "FI", "DK"];
const MEDITERRANEAN_COUNTRIES = ["ES", "IT", "PT", "GR", "HR"];
const CENTRAL_EUROPE = ["DE", "FR", "NL", "BE", "AT", "CZ", "PL", "HU", "SK"];
const COASTAL_COUNTRIES = ["DE", "FR", "ES", "IT", "NL", "BE", "IE", "PT", "GR", "DK"];

const REGIONS: Record<string, string[]> = {
  DE: ["Bavaria", "Berlin", "Hesse", "Saxony"],
  FR: ["Île-de-France", "Occitanie", "Normandy", "Auvergne"],
  ES: ["Catalonia", "Madrid", "Andalusia", "Valencia"],
  IT: ["Lazio", "Lombardy", "Veneto", "Sicily"],
  NL: ["North Holland", "Utrecht", "South Holland"],
  PL: ["Masovia", "Lesser Poland", "Silesia"],
  SE: ["Stockholm", "Västra Götaland", "Skåne"],
  NO: ["Oslo", "Vestland", "Trøndelag"],
  FI: ["Uusimaa", "Pirkanmaa", "North Ostrobothnia"],
  DK: ["Capital Region", "Central Jutland", "South Denmark"],
  BE: ["Flanders", "Wallonia", "Brussels"],
  AT: ["Vienna", "Styria", "Tyrol"],
  IE: ["Leinster", "Munster", "Connacht"],
  PT: ["Lisbon", "Porto", "Algarve"],
  GR: ["Attica", "Central Macedonia", "Crete"],
  CZ: ["Prague", "South Moravia", "Moravia-Silesia"],
  RO: ["Bucharest", "Cluj", "Transylvania"],
  HU: ["Budapest", "Pest", "Transdanubia"],
  BG: ["Sofia", "Plovdiv", "Varna"],
  HR: ["Zagreb", "Split-Dalmatia", "Istria"],
};

const COUNTRY_NAMES: Record<string, string> = {
  DE: "Germany", FR: "France", ES: "Spain", IT: "Italy", NL: "Netherlands",
  PL: "Poland", SE: "Sweden", NO: "Norway", FI: "Finland", DK: "Denmark",
  BE: "Belgium", AT: "Austria", IE: "Ireland", PT: "Portugal", GR: "Greece",
  CZ: "Czechia", RO: "Romania", HU: "Hungary", BG: "Bulgaria", HR: "Croatia",
};

// ─── Dataset definitions ──────────────────────────────────────
interface DatasetDef {
  slug: string;
  name: string;
  source: DataSource;
  description: string;
  unit: string;
  tags: string[];
  valueMin: number;
  valueMax: number;
  countries: string[];
  timePoints: number;
  frequency: "monthly" | "annual";
  includeRegion: boolean;
  sourceMetadata: Record<string, unknown>;
}

const BASE_MONTHLY = new Date("2026-06-01T00:00:00.000Z");
const ANNUAL_YEARS = [2025, 2024, 2023];

const DATASET_DEFS: DatasetDef[] = [
  // ── EEA: Air Quality (5) ──────────────────────────────────
  {
    slug: "air-quality-pm25-eu",
    name: "PM2.5 Air Quality — Europe",
    source: "EEA",
    description:
      "Fine particulate matter (PM2.5) annual mean concentrations aggregated from the EEA air quality e-reporting network across European monitoring stations.",
    unit: "µg/m³",
    tags: ["air-quality", "pm25", "pollution"],
    valueMin: 3,
    valueMax: 35,
    countries: EU_COUNTRIES.slice(0, 15),
    timePoints: 3,
    frequency: "monthly",
    includeRegion: true,
    sourceMetadata: {
      sourceApi: "https://discomap.eea.europa.eu/map/fme/",
      pollutant: "PM2.5",
      aggregation: "monthly_mean",
      verification: "verified",
    },
  },
  {
    slug: "air-quality-no2-eu",
    name: "NO₂ Concentration — Europe",
    source: "EEA",
    description:
      "Nitrogen dioxide annual mean concentrations from urban and rural monitoring stations across the EEA network.",
    unit: "µg/m³",
    tags: ["air-quality", "no2", "pollution"],
    valueMin: 5,
    valueMax: 55,
    countries: EU_COUNTRIES.slice(0, 15),
    timePoints: 3,
    frequency: "monthly",
    includeRegion: true,
    sourceMetadata: {
      sourceApi: "https://discomap.eea.europa.eu/map/fme/",
      pollutant: "NO2",
      aggregation: "monthly_mean",
      verification: "verified",
    },
  },
  {
    slug: "air-quality-o3-eu",
    name: "Ground-level Ozone — Europe",
    source: "EEA",
    description:
      "Tropospheric ozone (O₃) daily maximum 8-hour running means from the EEA air quality reporting network.",
    unit: "µg/m³",
    tags: ["air-quality", "o3", "pollution"],
    valueMin: 35,
    valueMax: 130,
    countries: EU_COUNTRIES.slice(0, 12),
    timePoints: 3,
    frequency: "monthly",
    includeRegion: true,
    sourceMetadata: {
      sourceApi: "https://discomap.eea.europa.eu/map/fme/",
      pollutant: "O3",
      aggregation: "monthly_mean",
      verification: "verified",
    },
  },
  {
    slug: "air-quality-pm10-eu",
    name: "PM10 Air Quality — Europe",
    source: "EEA",
    description:
      "Coarse particulate matter (PM10) annual mean concentrations from the EEA air quality e-reporting network.",
    unit: "µg/m³",
    tags: ["air-quality", "pm10", "pollution"],
    valueMin: 8,
    valueMax: 65,
    countries: EU_COUNTRIES.slice(0, 15),
    timePoints: 3,
    frequency: "monthly",
    includeRegion: true,
    sourceMetadata: {
      sourceApi: "https://discomap.eea.europa.eu/map/fme/",
      pollutant: "PM10",
      aggregation: "monthly_mean",
      verification: "verified",
    },
  },
  {
    slug: "protected-areas-eu",
    name: "Protected Areas — Europe",
    source: "EEA",
    description:
      "Natura 2000 and nationally designated protected area coverage by country, including terrestrial and marine sites.",
    unit: "km²",
    tags: ["biodiversity", "protected", "natura-2000"],
    valueMin: 100,
    valueMax: 52000,
    countries: EU_COUNTRIES,
    timePoints: 3,
    frequency: "annual",
    includeRegion: false,
    sourceMetadata: {
      sourceApi: "https://sdmt.eea.europa.eu/",
      framework: "Natura 2000",
      designationType: "national_and_european",
    },
  },

  // ── EUROSTAT: Energy & Environment (5) ────────────────────
  {
    slug: "renewable-share-eu",
    name: "Renewable Energy Share — EU",
    source: "EUROSTAT",
    description:
      "Share of energy from renewable sources in gross final energy consumption by member state.",
    unit: "%",
    tags: ["energy", "renewables", "policy"],
    valueMin: 3,
    valueMax: 68,
    countries: EU_COUNTRIES,
    timePoints: 3,
    frequency: "annual",
    includeRegion: false,
    sourceMetadata: {
      sourceApi: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/",
      datasetCode: "nrg_ind_ren",
      freq: "A",
      unit: "PC",
      lastUpdated: "2026-04-15",
    },
  },
  {
    slug: "co2-emissions-eu",
    name: "CO₂ Emissions — EU",
    source: "EUROSTAT",
    description:
      "Territorial carbon dioxide emissions by sector and member state, based on the Eurostat air emissions accounts.",
    unit: "Mt CO₂",
    tags: ["emissions", "co2", "ghg", "climate"],
    valueMin: 0.5,
    valueMax: 750,
    countries: EU_COUNTRIES,
    timePoints: 3,
    frequency: "annual",
    includeRegion: false,
    sourceMetadata: {
      sourceApi: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/",
      datasetCode: "env_air_gge",
      freq: "A",
      unit: "THS_T",
      lastUpdated: "2026-03-20",
    },
  },
  {
    slug: "energy-consumption-eu",
    name: "Final Energy Consumption — EU",
    source: "EUROSTAT",
    description:
      "Final energy consumption by member state, covering all end-use sectors (industry, transport, households, services).",
    unit: "Mtoe",
    tags: ["energy", "consumption", "policy"],
    valueMin: 1,
    valueMax: 320,
    countries: EU_COUNTRIES,
    timePoints: 3,
    frequency: "annual",
    includeRegion: false,
    sourceMetadata: {
      sourceApi: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/",
      datasetCode: "nrg_bal_c",
      freq: "A",
      unit: "KTOE",
      lastUpdated: "2026-05-10",
    },
  },
  {
    slug: "waste-recycling-eu",
    name: "Municipal Waste Recycling — EU",
    source: "EUROSTAT",
    description:
      "Recycling rate of municipal waste by member state, tracking progress toward the EU circular economy targets.",
    unit: "%",
    tags: ["waste", "recycling", "circular-economy"],
    valueMin: 5,
    valueMax: 70,
    countries: EU_COUNTRIES.slice(0, 18),
    timePoints: 3,
    frequency: "annual",
    includeRegion: false,
    sourceMetadata: {
      sourceApi: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/",
      datasetCode: "env_wasmun",
      freq: "A",
      unit: "PC",
      lastUpdated: "2026-04-28",
    },
  },
  {
    slug: "water-abstraction-eu",
    name: "Freshwater Abstraction — EU",
    source: "EUROSTAT",
    description:
      "Freshwater abstraction by source and member state, reported under the Joint Questionnaire on Inland Waters.",
    unit: "million m³",
    tags: ["water", "abstraction", "resource"],
    valueMin: 200,
    valueMax: 50000,
    countries: EU_COUNTRIES.slice(0, 18),
    timePoints: 3,
    frequency: "annual",
    includeRegion: false,
    sourceMetadata: {
      sourceApi: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/",
      datasetCode: "env_wat_abs",
      freq: "A",
      unit: "MIO_M3",
      lastUpdated: "2026-02-14",
    },
  },

  // ── COPERNICUS: Climate / Satellite (4) ────────────────────
  {
    slug: "surface-temperature-eu",
    name: "Surface Air Temperature — Europe",
    source: "COPERNICUS",
    description:
      "Monthly mean near-surface (2m) air temperature from the ERA5 reanalysis across the European domain.",
    unit: "°C",
    tags: ["climate", "temperature", "era5"],
    valueMin: -8,
    valueMax: 26,
    countries: EU_COUNTRIES.slice(0, 15),
    timePoints: 4,
    frequency: "monthly",
    includeRegion: true,
    sourceMetadata: {
      sourceApi: "https://cds.climate.copernicus.eu/api/v2",
      dataset: "reanalysis-era5-single-levels-monthly-means",
      variable: "2m_temperature",
      productType: "monthly_mean",
      model: "ERA5",
      gridResolution: "0.25deg",
      spatialExtent: { latMin: 34, latMax: 72, lonMin: -25, lonMax: 45 },
    },
  },
  {
    slug: "precipitation-eu",
    name: "Precipitation — Europe",
    source: "COPERNICUS",
    description:
      "Monthly total accumulated precipitation from the ERA5 reanalysis, bias-corrected against gauge observations.",
    unit: "mm",
    tags: ["climate", "precipitation", "era5"],
    valueMin: 10,
    valueMax: 320,
    countries: EU_COUNTRIES.slice(0, 15),
    timePoints: 4,
    frequency: "monthly",
    includeRegion: true,
    sourceMetadata: {
      sourceApi: "https://cds.climate.copernicus.eu/api/v2",
      dataset: "reanalysis-era5-single-levels-monthly-means",
      variable: "total_precipitation",
      productType: "monthly_mean",
      model: "ERA5",
      gridResolution: "0.25deg",
      spatialExtent: { latMin: 34, latMax: 72, lonMin: -25, lonMax: 45 },
    },
  },
  {
    slug: "soil-moisture-eu",
    name: "Soil Moisture — Europe",
    source: "COPERNICUS",
    description:
      "Volumetric surface soil moisture from the Copernicus Climate Change Service, based on active and passive microwave satellite observations.",
    unit: "m³/m³",
    tags: ["climate", "soil-moisture", "satellite"],
    valueMin: 0.05,
    valueMax: 0.5,
    countries: EU_COUNTRIES.slice(0, 12),
    timePoints: 4,
    frequency: "monthly",
    includeRegion: false,
    sourceMetadata: {
      sourceApi: "https://cds.climate.copernicus.eu/api/v2",
      dataset: "satellite-soil-moisture",
      variable: "volumetric_surface_soil_moisture",
      productType: "monthly_mean",
      sensor: "combined_passive_active",
      gridResolution: "0.25deg",
    },
  },
  {
    slug: "sea-surface-temp-eu",
    name: "Sea Surface Temperature — European Seas",
    source: "COPERNICUS",
    description:
      "Monthly mean sea surface temperature for European regional seas from the Copernicus Marine Service reanalysis.",
    unit: "°C",
    tags: ["climate", "ocean", "temperature", "marine"],
    valueMin: 3,
    valueMax: 27,
    countries: COASTAL_COUNTRIES,
    timePoints: 4,
    frequency: "monthly",
    includeRegion: false,
    sourceMetadata: {
      sourceApi: "https://marine.copernicus.eu/",
      dataset: "GLOBAL_REANALYSIS_PHY_001_030",
      variable: "sea_surface_temperature",
      productType: "monthly_mean",
      gridResolution: "0.083deg",
    },
  },
];

// ─── Seed record types ────────────────────────────────────────
interface SeedUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
}

interface SeedApiKey {
  id: string;
  keyHash: string;
  name: string;
  userId: string;
  rateLimit: number;
  isActive: boolean;
  lastUsed: Date | null;
  expiresAt: Date | null;
}

interface SeedDataset {
  id: string;
  slug: string;
  name: string;
  source: DataSource;
  description: string;
  unit: string;
  tags: string[];
}

interface SeedMeasurement {
  datasetId: string;
  country: string;
  region: string | null;
  recordedAt: Date;
  value: number;
  rawMetadata: Record<string, unknown> | null;
}

interface SeedIngestionRun {
  datasetSlug: string;
  status: IngestionStatus;
  rowsWritten: number;
  errorMsg: string | null;
  startedAt: Date;
  finishedAt: Date | null;
}

interface SeedData {
  users: SeedUser[];
  apiKeys: SeedApiKey[];
  datasets: SeedDataset[];
  measurements: SeedMeasurement[];
  ingestionRuns: SeedIngestionRun[];
}

// ─── Date helpers ─────────────────────────────────────────────
function monthlyDates(count: number): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(BASE_MONTHLY);
    d.setUTCMonth(d.getUTCMonth() - i);
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
    dates.push(d);
  }
  return dates;
}

function annualDates(count: number): Date[] {
  return ANNUAL_YEARS.slice(0, count).map(
    (y) => new Date(Date.UTC(y, 0, 1, 0, 0, 0)),
  );
}

function datesFor(def: DatasetDef): Date[] {
  return def.frequency === "monthly"
    ? monthlyDates(def.timePoints)
    : annualDates(def.timePoints);
}

// ─── Metadata enrichment ──────────────────────────────────────
function enrichMetadata(
  def: DatasetDef,
  country: string,
): Record<string, unknown> {
  const meta: Record<string, unknown> = { ...def.sourceMetadata };

  if (def.source === "EEA") {
    meta.stationId = `STA-${country}-${String(randInt(1, 9999)).padStart(5, "0")}`;
    meta.qualityFlag = rand() > 0.93 ? "estimated" : "measured";
  } else if (def.source === "EUROSTAT") {
    meta.flags = rand() > 0.88 ? ["e"] : [];
    meta.confidentiality = "public";
  } else if (def.source === "COPERNICUS") {
    meta.processingLevel = "L4";
    meta.ensembleMember = "reanalysis";
  }

  return meta;
}

// ─── Data generation ──────────────────────────────────────────
function generateUsers(): SeedUser[] {
  return [
    {
      id: "seed-user-admin",
      email: "admin@data-mesh.eu",
      passwordHash: hashPassword("Adm1n!DataMesh2026"),
      name: "System Administrator",
      role: "ADMIN",
    },
    {
      id: "seed-user-dev-1",
      email: "developer@data-mesh.eu",
      passwordHash: hashPassword("Dev!DataMesh2026"),
      name: "Backend Developer",
      role: "DEVELOPER",
    },
    {
      id: "seed-user-dev-2",
      email: "analyst@data-mesh.eu",
      passwordHash: hashPassword("Ana!DataMesh2026"),
      name: "Data Analyst",
      role: "DEVELOPER",
    },
  ];
}

function generateApiKeys(users: SeedUser[]): SeedApiKey[] {
  const keys: SeedApiKey[] = [];
  const now = new Date("2026-07-01T12:00:00.000Z");

  const defs = [
    { name: "Production Gateway", rateLimit: 1000, active: true, expires: null as Date | null, lastUsedDays: 1 },
    { name: "Staging Environment", rateLimit: 200, active: true, expires: new Date("2026-12-31T23:59:59.000Z"), lastUsedDays: 3 },
    { name: "Local Development", rateLimit: 50, active: false, expires: new Date("2026-08-01T00:00:00.000Z"), lastUsedDays: 21 },
    { name: "ETL Ingestion Worker", rateLimit: 500, active: true, expires: null as Date | null, lastUsedDays: 0 },
    { name: "Dashboard Read-Only", rateLimit: 100, active: true, expires: new Date("2027-01-31T00:00:00.000Z"), lastUsedDays: 2 },
    { name: "Partner API Access", rateLimit: 300, active: true, expires: null as Date | null, lastUsedDays: 7 },
  ];

  defs.forEach((d, i) => {
    const user = users[i % users.length]!;
    const rawKey = `dm_${randomBytes(24).toString("hex")}`;
    const lastUsed = new Date(now);
    lastUsed.setUTCDate(lastUsed.getUTCDate() - d.lastUsedDays);

    keys.push({
      id: `seed-key-${i + 1}`,
      keyHash: hashApiKey(rawKey),
      name: d.name,
      userId: user.id,
      rateLimit: d.rateLimit,
      isActive: d.active,
      lastUsed: d.lastUsedDays >= 0 ? lastUsed : null,
      expiresAt: d.expires,
    });
  });

  return keys;
}

function generateDatasets(): SeedDataset[] {
  return DATASET_DEFS.map((d) => ({
    id: `seed-ds-${d.slug}`,
    slug: d.slug,
    name: d.name,
    source: d.source,
    description: d.description,
    unit: d.unit,
    tags: d.tags,
  }));
}

function generateMeasurements(datasets: SeedDataset[]): SeedMeasurement[] {
  const measurements: SeedMeasurement[] = [];

  for (const def of DATASET_DEFS) {
    const dataset = datasets.find((d) => d.slug === def.slug)!;
    const dates = datesFor(def);

    for (const country of def.countries) {
      for (const date of dates) {
        const value = roundTo(
          def.valueMin + rand() * (def.valueMax - def.valueMin),
          2,
        );

        let region: string | null = null;
        if (def.includeRegion) {
          const regionList = REGIONS[country];
          region = regionList ? pick(regionList) : null;
        }

        measurements.push({
          datasetId: dataset.id,
          country,
          region,
          recordedAt: date,
          value,
          rawMetadata: enrichMetadata(def, country),
        });
      }
    }
  }

  return measurements;
}

const ERROR_MESSAGES = [
  "Upstream Eurostat API returned 503 Service Unavailable after 3 retries.",
  "Timeout while fetching from CDS API: connection reset by peer after 120s.",
  'EEA Air Quality e-Reporting service returned malformed GeoJSON: missing "features" array.',
  "Copernicus CDS request queue exceeded maximum wait time of 300s.",
  'Eurostat dataset schema mismatch: expected column "geo" not found in response payload.',
  "Authentication failed: EEA API token expired — re-authentication required.",
  "Network error: ENOTFOUND while resolving eea.europa.eu — DNS lookup failed.",
  "Rate limit exceeded: Copernicus CDS returned 429 Too Many Requests.",
  "Data validation error: 14 records failed country code format check during transform.",
  "Database write failed: connection pool exhausted during bulk insert.",
  "SSL certificate verification failed for ec.europa.eu: certificate has expired.",
  "Unexpected response format: Content-Type was text/html, expected application/json.",
];

function generateIngestionRuns(
  datasets: SeedDataset[],
  measurements: SeedMeasurement[],
): SeedIngestionRun[] {
  const runs: SeedIngestionRun[] = [];
  const now = new Date("2026-07-01T00:00:00.000Z");

  datasets.forEach((ds, i) => {
    const measurementCount = measurements.filter(
      (m) => m.datasetId === ds.id,
    ).length;

    // Run 1: always SUCCESS
    {
      const started = new Date(now);
      started.setUTCHours(started.getUTCHours() - randInt(12, 72));
      const finished = new Date(started);
      finished.setUTCMinutes(finished.getUTCMinutes() + randInt(5, 35));
      runs.push({
        datasetSlug: ds.slug,
        status: "SUCCESS",
        rowsWritten: measurementCount * randInt(80, 400),
        errorMsg: null,
        startedAt: started,
        finishedAt: finished,
      });
    }

    // Run 2: SUCCESS or RUNNING (alternate)
    {
      const status = i % 2 === 0 ? "SUCCESS" : "RUNNING";
      const started = new Date(now);
      started.setUTCHours(started.getUTCHours() - randInt(2, 10));
      const finished = status === "SUCCESS" ? new Date(started) : null;
      if (finished) finished.setUTCMinutes(finished.getUTCMinutes() + randInt(3, 20));
      runs.push({
        datasetSlug: ds.slug,
        status,
        rowsWritten: status === "SUCCESS" ? measurementCount * randInt(50, 300) : Math.floor(measurementCount * randInt(10, 80)),
        errorMsg: null,
        startedAt: started,
        finishedAt: finished,
      });
    }

    // Run 3: always FAILED
    {
      const started = new Date(now);
      started.setUTCDate(started.getUTCDate() - randInt(1, 5));
      const finished = new Date(started);
      finished.setUTCMinutes(finished.getUTCMinutes() + randInt(1, 15));
      runs.push({
        datasetSlug: ds.slug,
        status: "FAILED",
        rowsWritten: randInt(0, 50),
        errorMsg: ERROR_MESSAGES[i % ERROR_MESSAGES.length]!,
        startedAt: started,
        finishedAt: finished,
      });
    }
  });

  return runs;
}

function generateSeedData(): SeedData {
  const users = generateUsers();
  const apiKeys = generateApiKeys(users);
  const datasets = generateDatasets();
  const measurements = generateMeasurements(datasets);
  const ingestionRuns = generateIngestionRuns(datasets, measurements);
  return { users, apiKeys, datasets, measurements, ingestionRuns };
}

// ─── Validation ───────────────────────────────────────────────
interface ValidationResult {
  passed: boolean;
  errors: string[];
  checks: { name: string; passed: boolean }[];
}

function validateSeedData(data: SeedData): ValidationResult {
  const errors: string[] = [];
  const checks: { name: string; passed: boolean }[] = [];

  const check = (name: string, fn: () => boolean) => {
    const passed = fn();
    checks.push({ name, passed });
    if (!passed) errors.push(`✗ ${name}`);
  };

  // 1. Enum values
  check("All DataSource enum values valid", () =>
    data.datasets.every((d) => VALID_SOURCES.includes(d.source)),
  );
  check("All UserRole enum values valid", () =>
    data.users.every((u) => VALID_ROLES.includes(u.role)),
  );
  check("All IngestionStatus enum values valid", () =>
    data.ingestionRuns.every((r) => VALID_STATUSES.includes(r.status)),
  );

  // 2. Uniqueness
  check("All dataset slugs unique", () => {
    const slugs = data.datasets.map((d) => d.slug);
    return new Set(slugs).size === slugs.length;
  });
  check("All user emails unique", () => {
    const emails = data.users.map((u) => u.email);
    return new Set(emails).size === emails.length;
  });
  check("All API key hashes unique", () => {
    const hashes = data.apiKeys.map((k) => k.keyHash);
    return new Set(hashes).size === hashes.length;
  });

  // 3. Country codes
  check("All country codes are ISO 3166-1 alpha-2", () =>
    data.measurements.every(
      (m) => /^[A-Z]{2}$/.test(m.country) && COUNTRY_NAMES[m.country] !== undefined,
    ),
  );

  // 4. Referential integrity
  check("All measurement.datasetId references valid datasets", () => {
    const ids = new Set(data.datasets.map((d) => d.id));
    return data.measurements.every((m) => ids.has(m.datasetId));
  });
  check("All apiKey.userId references valid users", () => {
    const ids = new Set(data.users.map((u) => u.id));
    return data.apiKeys.every((k) => ids.has(k.userId));
  });
  check("All ingestionRun.datasetSlug references valid datasets", () => {
    const slugs = new Set(data.datasets.map((d) => d.slug));
    return data.ingestionRuns.every((r) => slugs.has(r.datasetSlug));
  });

  // 5. Required fields present
  check("All required fields present on users", () =>
    data.users.every((u) => u.email && u.passwordHash && u.name !== undefined),
  );
  check("All required fields present on apiKeys", () =>
    data.apiKeys.every((k) => k.keyHash && k.name && k.userId),
  );
  check("All required fields present on datasets", () =>
    data.datasets.every((d) => d.slug && d.name && d.source && Array.isArray(d.tags)),
  );
  check("All required fields present on measurements", () =>
    data.measurements.every(
      (m) => m.datasetId && m.country && m.recordedAt !== undefined,
    ),
  );
  check("All required fields present on ingestionRuns", () =>
    data.ingestionRuns.every(
      (r) => r.datasetSlug && r.status && r.startedAt !== undefined,
    ),
  );

  // 6. Value types
  check("All measurement values are finite numbers", () =>
    data.measurements.every((m) => typeof m.value === "number" && Number.isFinite(m.value)),
  );
  check("All rateLimit values are positive integers", () =>
    data.apiKeys.every((k) => Number.isInteger(k.rateLimit) && k.rateLimit > 0),
  );
  check("All rowsWritten values are non-negative integers", () =>
    data.ingestionRuns.every((r) => Number.isInteger(r.rowsWritten) && r.rowsWritten >= 0),
  );

  // 7. Temporal logic for ingestion runs
  check("finishedAt null for RUNNING runs", () =>
    data.ingestionRuns.every((r) => r.status !== "RUNNING" || r.finishedAt === null),
  );
  check("finishedAt set and after startedAt for SUCCESS/FAILED runs", () =>
    data.ingestionRuns.every(
      (r) => r.status === "RUNNING" || (r.finishedAt !== null && r.finishedAt >= r.startedAt),
    ),
  );
  check("errorMsg non-null for FAILED runs", () =>
    data.ingestionRuns.every((r) => r.status !== "FAILED" || r.errorMsg !== null),
  );
  check("errorMsg null for SUCCESS/RUNNING runs", () =>
    data.ingestionRuns.every(
      (r) => r.status === "FAILED" || r.errorMsg === null,
    ),
  );

  // 8. rawMetadata is serializable
  check("All rawMetadata fields are JSON-serializable", () =>
    data.measurements.every((m) => {
      if (m.rawMetadata === null) return true;
      try {
        JSON.stringify(m.rawMetadata);
        return true;
      } catch {
        return false;
      }
    }),
  );

  // 9. Dataset tags are non-empty arrays
  check("All datasets have non-empty tags arrays", () =>
    data.datasets.every((d) => Array.isArray(d.tags) && d.tags.length > 0),
  );

  // 10. No duplicate measurement keys (datasetId + country + recordedAt)
  check("No duplicate measurements (datasetId + country + recordedAt)", () => {
    const seen = new Set<string>();
    for (const m of data.measurements) {
      const key = `${m.datasetId}|${m.country}|${m.recordedAt.toISOString()}`;
      if (seen.has(key)) return false;
      seen.add(key);
    }
    return true;
  });

  return { passed: errors.length === 0, errors, checks };
}

// ─── Summary printer ──────────────────────────────────────────
function printSummary(data: SeedData, result: ValidationResult): void {
  const line = "─".repeat(61);

  const countBy = <T,>(arr: T[], fn: (item: T) => string): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const item of arr) {
      const k = fn(item);
      out[k] = (out[k] ?? 0) + 1;
    }
    return out;
  };

  const measurementsBySource = countBy(data.measurements, (m) => {
    const ds = data.datasets.find((d) => d.id === m.datasetId);
    return ds ? ds.source : "UNKNOWN";
  });
  const runsByStatus = countBy(data.ingestionRuns, (r) => r.status);

  const total =
    data.users.length +
    data.apiKeys.length +
    data.datasets.length +
    data.measurements.length +
    data.ingestionRuns.length;

  console.log(`\n${"═".repeat(61)}`);
  console.log("  DATA-MESH SEED SCRIPT — DRY RUN VALIDATION");
  console.log(`${"═".repeat(61)}\n`);

  if (result.passed) {
    console.log(`  ✓ Validation passed — all ${total} records conform to schema\n`);
  } else {
    console.log(`  ✗ Validation FAILED — ${result.errors.length} error(s)\n`);
    for (const e of result.errors) console.log(`    ${e}`);
    console.log();
  }

  console.log(`  Record counts:`);
  console.log(`    Users           → ${String(data.users.length).padStart(5)}`);
  console.log(`    ApiKeys         → ${String(data.apiKeys.length).padStart(5)}`);
  console.log(`    Datasets        → ${String(data.datasets.length).padStart(5)}`);
  console.log(`    Measurements    → ${String(data.measurements.length).padStart(5)}`);
  console.log(`    IngestionRuns   → ${String(data.ingestionRuns.length).padStart(5)}`);
  console.log(`    ${line}`);
  console.log(`    TOTAL           → ${String(total).padStart(5)}\n`);

  console.log(`  Measurements by source:`);
  for (const src of VALID_SOURCES) {
    const cnt = measurementsBySource[src] ?? 0;
    const dsCount = data.datasets.filter((d) => d.source === src).length;
    console.log(`    ${src.padEnd(14)} → ${String(dsCount).padStart(2)} datasets, ${String(cnt).padStart(4)} measurements`);
  }
  console.log();

  console.log(`  Ingestion runs by status:`);
  for (const s of VALID_STATUSES) {
    console.log(`    ${s.padEnd(10)} → ${String(runsByStatus[s] ?? 0).padStart(3)}`);
  }
  console.log();

  console.log(`  Validation checks (${result.checks.length}):`);
  for (const c of result.checks) {
    console.log(`    ${c.passed ? "✓" : "✗"} ${c.name}`);
  }
  console.log();

  console.log(`  Sample records:`);
  const sampleDs = data.datasets[0]!;
  const sampleM = data.measurements.find((m) => m.datasetId === sampleDs.id);
  const sampleRun = data.ingestionRuns.find((r) => r.datasetSlug === sampleDs.slug);
  console.log(`    [Dataset]     ${sampleDs.slug} (${sampleDs.source}) — ${sampleDs.name}`);
  if (sampleM) {
    console.log(`    [Measurement] ${sampleM.country}/${sampleM.region ?? "—"} @ ${sampleM.recordedAt.toISOString().slice(0, 10)} → ${sampleM.value} ${sampleDs.unit}`);
  }
  if (sampleRun) {
    console.log(`    [IngestRun]   ${sampleRun.datasetSlug} → ${sampleRun.status} (${sampleRun.rowsWritten} rows)`);
  }
  console.log(`    [User]        ${data.users[0]!.email} (${data.users[0]!.role})`);
  console.log(`    [ApiKey]      ${data.apiKeys[0]!.name} — rateLimit=${data.apiKeys[0]!.rateLimit}, active=${data.apiKeys[0]!.isActive}`);

  console.log(`\n${line}`);
  console.log(`  Dry run complete — no database writes performed.`);
  console.log(`  To seed the database for real:  npm run db:seed`);
  console.log(`${"═".repeat(61)}\n`);
}

// ─── Database seeding ─────────────────────────────────────────
async function seedDatabase(data: SeedData): Promise<void> {
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { Pool } = await import("pg");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Make sure .env exists and is loaded before running the seed.",
    );
  }

  // Prisma 7 requires a driver adapter for direct DB connections.
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("\n  Connecting to database...");
    await prisma.$connect();
    console.log("  Connected. Wiping existing data...\n");

    // Delete in FK-safe order (children first)
    await prisma.measurement.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.ingestionRun.deleteMany();
    await prisma.dataset.deleteMany();
    await prisma.user.deleteMany();

    // 1. Users
    console.log(`  Creating ${data.users.length} users...`);
    const userIdMap = new Map<string, string>();
    for (const u of data.users) {
      const created = await prisma.user.create({
        data: {
          email: u.email,
          passwordHash: u.passwordHash,
          name: u.name,
          role: u.role,
        },
      });
      userIdMap.set(u.id, created.id);
    }

    // 2. API Keys
    console.log(`  Creating ${data.apiKeys.length} API keys...`);
    for (const k of data.apiKeys) {
      await prisma.apiKey.create({
        data: {
          keyHash: k.keyHash,
          name: k.name,
          userId: userIdMap.get(k.userId)!,
          rateLimit: k.rateLimit,
          isActive: k.isActive,
          lastUsed: k.lastUsed,
          expiresAt: k.expiresAt,
        },
      });
    }

    // 3. Datasets
    console.log(`  Creating ${data.datasets.length} datasets...`);
    const datasetIdMap = new Map<string, string>();
    for (const d of data.datasets) {
      const created = await prisma.dataset.create({
        data: {
          slug: d.slug,
          name: d.name,
          source: d.source,
          description: d.description,
          unit: d.unit,
          tags: d.tags,
        },
      });
      datasetIdMap.set(d.id, created.id);
    }

    // 4. Measurements (bulk insert per dataset)
    console.log(`  Creating ${data.measurements.length} measurements...`);
    let inserted = 0;
    for (const d of data.datasets) {
      const realId = datasetIdMap.get(d.id)!;
      const batch = data.measurements
        .filter((m) => m.datasetId === d.id)
        .map((m) => ({
          datasetId: realId,
          country: m.country,
          region: m.region,
          recordedAt: m.recordedAt,
          value: m.value,
          rawMetadata: m.rawMetadata,
        }));
      if (batch.length > 0) {
        const res = await prisma.measurement.createMany({ data: batch });
        inserted += res.count;
      }
    }
    console.log(`    Inserted ${inserted} measurement rows.`);

    // 5. Ingestion Runs (bulk insert)
    console.log(`  Creating ${data.ingestionRuns.length} ingestion runs...`);
    await prisma.ingestionRun.createMany({
      data: data.ingestionRuns.map((r) => ({
        datasetSlug: r.datasetSlug,
        status: r.status,
        rowsWritten: r.rowsWritten,
        errorMsg: r.errorMsg,
        startedAt: r.startedAt,
        finishedAt: r.finishedAt,
      })),
    });

    console.log("\n  ✓ Database seeded successfully!\n");

    // Verify counts
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.apiKey.count(),
      prisma.dataset.count(),
      prisma.measurement.count(),
      prisma.ingestionRun.count(),
    ]);
    console.log(`  Verification — rows in database:`);
    console.log(`    users:           ${counts[0]}`);
    console.log(`    api_keys:        ${counts[1]}`);
    console.log(`    datasets:        ${counts[2]}`);
    console.log(`    measurements:    ${counts[3]}`);
    console.log(`    ingestion_runs:  ${counts[4]}`);
    console.log(`    ${"─".repeat(40)}`);
    console.log(`    TOTAL:           ${counts.reduce((a, b) => a + b, 0)}\n`);

  } finally {
    await prisma.$disconnect();
  }
}

// ─── Main ─────────────────────────────────────────────────────
async function main(): Promise<void> {
  const isDryRun = process.argv.includes("--dry-run");

  console.log(`\n  Generating seed data (deterministic, seed=20260711)...`);
  const data = generateSeedData();

  console.log(`  Validating ${data.users.length + data.apiKeys.length + data.datasets.length + data.measurements.length + data.ingestionRuns.length} records against schema...\n`);

  const result = validateSeedData(data);

  if (isDryRun) {
    printSummary(data, result);
    if (!result.passed) {
      process.exit(1);
    }
    return;
  }

  // Real seed: validate first, then write
  if (!result.passed) {
    console.log("\n  ✗ Validation FAILED — aborting seed. Fix errors and retry.\n");
    for (const e of result.errors) console.log(`    ${e}`);
    process.exit(1);
  }

  console.log(`  ✓ Validation passed — all checks green.\n`);

  try {
    await seedDatabase(data);
  } catch (err) {
    console.error("\n  ✗ Database seed failed:\n");
    console.error(`    ${err instanceof Error ? err.message : String(err)}\n`);
    console.error("  Make sure PostgreSQL is running (npm run docker:up:infra)\n");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
