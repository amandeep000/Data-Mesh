import type { DataSource, IngestionStatus } from '@data-mesh/api-contracts';

/** App route paths — single source of truth for navigation. */
export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  dashboardOverview: '/dashboard',
  datasets: '/dashboard/datasets',
  measurements: '/dashboard/measurements',
  playground: '/dashboard/playground',
  apiKeys: '/dashboard/api-keys',
  ingestion: '/dashboard/ingestion',
  settings: '/dashboard/settings',
  pricing: '/pricing',
} as const;

export const DATA_SOURCES: readonly DataSource[] = ['EEA', 'EUROSTAT', 'COPERNICUS'] as const;

export interface SourceMeta {
  readonly key: DataSource;
  readonly name: string;
  readonly fullName: string;
  readonly description: string;
  readonly url: string;
  readonly accent: string;
  /** Tailwind text/bg classes for badges. */
  readonly badge: string;
  readonly dot: string;
}

export const SOURCE_META: Record<DataSource, SourceMeta> = {
  EEA: {
    key: 'EEA',
    name: 'EEA',
    fullName: 'European Environment Agency',
    description: 'Air quality, biodiversity and land-cover observations across Europe.',
    url: 'https://www.eea.europa.eu',
    accent: 'emerald',
    badge: 'bg-primary/10 text-primary border-primary/20',
    dot: 'bg-primary',
  },
  EUROSTAT: {
    key: 'EUROSTAT',
    name: 'Eurostat',
    fullName: 'European Statistical Office',
    description: 'Emissions, energy production and consumption statistics.',
    url: 'https://ec.europa.eu/eurostat',
    accent: 'blue',
    badge: 'bg-accent/10 text-accent border-accent/20',
    dot: 'bg-accent',
  },
  COPERNICUS: {
    key: 'COPERNICUS',
    name: 'Copernicus',
    fullName: 'Copernicus Climate Service',
    description: 'Temperature, precipitation and atmospheric climate records.',
    url: 'https://climate.copernicus.eu',
    accent: 'teal',
    badge: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
    dot: 'bg-chart-3',
  },
};

export interface DatasetCategory {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly tags: readonly string[];
}

export const DATASET_CATEGORIES: readonly DatasetCategory[] = [
  {
    id: 'air-quality',
    label: 'Air Quality',
    description: 'PM2.5, PM10, NO₂, O₃ and SO₂ pollutant measurements.',
    icon: 'wind',
    tags: ['pm25', 'pm10', 'no2', 'o3', 'so2'],
  },
  {
    id: 'climate',
    label: 'Climate',
    description: 'Temperature, precipitation and atmospheric indicators.',
    icon: 'thermometer',
    tags: ['temperature', 'precipitation', 'humidity'],
  },
  {
    id: 'energy',
    label: 'Energy',
    description: 'Renewable share, consumption and production metrics.',
    icon: 'zap',
    tags: ['renewables', 'consumption', 'production'],
  },
  {
    id: 'emissions',
    label: 'Emissions',
    description: 'CO₂, methane and greenhouse-gas inventories by sector.',
    icon: 'factory',
    tags: ['co2', 'ch4', 'ghg'],
  },
  {
    id: 'biodiversity',
    label: 'Biodiversity',
    description: 'Species, habitat and protected-area indicators.',
    icon: 'leaf',
    tags: ['species', 'habitat', 'protected'],
  },
] as const;

export interface StatusMeta {
  readonly label: string;
  readonly badge: string;
  readonly dot: string;
}

export const INGESTION_STATUS_META: Record<IngestionStatus, StatusMeta> = {
  RUNNING: {
    label: 'Running',
    badge: 'bg-accent/10 text-accent border-accent/20',
    dot: 'bg-accent',
  },
  SUCCESS: {
    label: 'Success',
    badge: 'bg-success/10 text-success border-success/20',
    dot: 'bg-success',
  },
  FAILED: {
    label: 'Failed',
    badge: 'bg-destructive/10 text-destructive border-destructive/20',
    dot: 'bg-destructive',
  },
};

export const COUNTRIES: Readonly<Record<string, string>> = {
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  PL: 'Poland',
  SE: 'Sweden',
  NO: 'Norway',
  FI: 'Finland',
  DK: 'Denmark',
  AT: 'Austria',
  BE: 'Belgium',
  CZ: 'Czechia',
  GR: 'Greece',
  PT: 'Portugal',
  IE: 'Ireland',
} as const;

export const DEFAULT_PAGE_SIZE = 10;
export const API_BASE_PATH = '/api/v1';
