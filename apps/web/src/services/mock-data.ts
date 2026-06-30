import type {
  ApiKey,
  Dataset,
  IngestionRun,
  Measurement,
} from '@data-mesh/api-contracts';

/** Deterministic seed data used when NEXT_PUBLIC_API_MODE=mock. */

const datasetSeed: Dataset[] = [
  {
    id: 'ck-ds-air-de',
    slug: 'air-quality-pm25-de',
    name: 'PM2.5 Air Quality — Germany',
    source: 'EEA',
    description:
      'Fine particulate matter (PM2.5) hourly observations aggregated from the EEA air quality e-reporting network across German monitoring stations.',
    unit: 'µg/m³',
    tags: ['air-quality', 'pm25', 'pollution'],
    createdAt: '2026-01-04T09:00:00.000Z',
    updatedAt: '2026-06-28T03:14:00.000Z',
  },
  {
    id: 'ck-ds-no2-fr',
    slug: 'air-quality-no2-fr',
    name: 'NO₂ Concentration — France',
    source: 'EEA',
    description: 'Nitrogen dioxide annual mean concentrations from French urban and rural stations.',
    unit: 'µg/m³',
    tags: ['air-quality', 'no2', 'pollution'],
    createdAt: '2026-01-06T08:00:00.000Z',
    updatedAt: '2026-06-27T22:40:00.000Z',
  },
  {
    id: 'ck-ds-temp-eu',
    slug: 'surface-temperature-eu',
    name: 'Surface Temperature — Europe',
    source: 'COPERNICUS',
    description: 'Monthly mean near-surface air temperature anomalies across the European domain.',
    unit: '°C',
    tags: ['climate', 'temperature'],
    createdAt: '2026-01-02T07:30:00.000Z',
    updatedAt: '2026-06-29T01:05:00.000Z',
  },
  {
    id: 'ck-ds-precip-no',
    slug: 'precipitation-nordics',
    name: 'Precipitation — Nordics',
    source: 'COPERNICUS',
    description: 'Daily accumulated precipitation for Scandinavian countries, bias-corrected.',
    unit: 'mm',
    tags: ['climate', 'precipitation'],
    createdAt: '2026-01-03T10:00:00.000Z',
    updatedAt: '2026-06-26T18:20:00.000Z',
  },
  {
    id: 'ck-ds-renew-eu',
    slug: 'renewable-share-eu',
    name: 'Renewable Energy Share — EU',
    source: 'EUROSTAT',
    description: 'Share of energy from renewable sources in gross final energy consumption.',
    unit: '%',
    tags: ['energy', 'renewables'],
    createdAt: '2026-01-05T11:00:00.000Z',
    updatedAt: '2026-06-25T14:00:00.000Z',
  },
  {
    id: 'ck-ds-co2-eu',
    slug: 'co2-emissions-eu',
    name: 'CO₂ Emissions — EU',
    source: 'EUROSTAT',
    description: 'Territorial carbon dioxide emissions by sector and member state.',
    unit: 'Mt CO₂',
    tags: ['emissions', 'co2', 'ghg'],
    createdAt: '2026-01-07T09:30:00.000Z',
    updatedAt: '2026-06-24T09:45:00.000Z',
  },
  {
    id: 'ck-ds-bio-eu',
    slug: 'protected-areas-eu',
    name: 'Protected Areas — Europe',
    source: 'EEA',
    description: 'Natura 2000 and nationally designated protected area coverage by country.',
    unit: 'km²',
    tags: ['biodiversity', 'protected'],
    createdAt: '2026-01-08T08:15:00.000Z',
    updatedAt: '2026-06-23T16:30:00.000Z',
  },
  {
    id: 'ck-ds-o3-it',
    slug: 'ozone-o3-it',
    name: 'Ground-level Ozone — Italy',
    source: 'EEA',
    description: 'Tropospheric ozone (O₃) daily maximum 8-hour running means.',
    unit: 'µg/m³',
    tags: ['air-quality', 'o3', 'pollution'],
    createdAt: '2026-01-09T07:45:00.000Z',
    updatedAt: '2026-06-22T20:10:00.000Z',
  },
];

const countries = ['DE', 'FR', 'ES', 'IT', 'NL', 'PL', 'SE', 'NO', 'FI', 'DK'];
const regions: Record<string, string[]> = {
  DE: ['Bavaria', 'Berlin', 'Hesse'],
  FR: ['Île-de-France', 'Occitanie', 'Normandy'],
  ES: ['Catalonia', 'Madrid', 'Andalusia'],
  IT: ['Lazio', 'Lombardy', 'Veneto'],
  NL: ['North Holland', 'Utrecht'],
  PL: ['Masovia', 'Lesser Poland'],
  SE: ['Stockholm', 'Västra Götaland'],
  NO: ['Oslo', 'Vestland'],
  FI: ['Uusimaa', 'Pirkanmaa'],
  DK: ['Capital Region', 'Central Jutland'],
};

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function buildMeasurements(): Measurement[] {
  const rand = seededRandom(42);
  const out: Measurement[] = [];
  const now = Date.now();
  datasetSeed.forEach((ds, dsIdx) => {
    const baseValue = [18, 24, 12, 2.4, 22, 64, 3200, 95][dsIdx] ?? 10;
    for (let i = 0; i < 24; i++) {
      const country = countries[Math.floor(rand() * countries.length)] ?? 'DE';
      const regionList = regions[country] ?? ['—'];
      out.push({
        id: `ck-msr-${ds.id}-${i}`,
        datasetId: ds.id,
        country,
        region: regionList[Math.floor(rand() * regionList.length)] ?? null,
        recordedAt: new Date(now - i * 86400000).toISOString(),
        value: Number((baseValue * (0.6 + rand() * 0.9)).toFixed(2)),
      });
    }
  });
  return out;
}

const measurementSeed = buildMeasurements();

const apiKeySeed: ApiKey[] = [
  {
    id: 'ck-key-prod',
    name: 'Production',
    rateLimit: 1000,
    isActive: true,
    lastUsed: '2026-06-29T10:22:00.000Z',
    expiresAt: null,
    createdAt: '2026-02-01T12:00:00.000Z',
  },
  {
    id: 'ck-key-staging',
    name: 'Staging',
    rateLimit: 100,
    isActive: true,
    lastUsed: '2026-06-28T16:05:00.000Z',
    expiresAt: '2026-12-31T23:59:59.000Z',
    createdAt: '2026-03-12T09:30:00.000Z',
  },
  {
    id: 'ck-key-dev',
    name: 'Local Dev',
    rateLimit: 50,
    isActive: false,
    lastUsed: '2026-06-15T08:40:00.000Z',
    expiresAt: '2026-08-01T00:00:00.000Z',
    createdAt: '2026-04-20T14:10:00.000Z',
  },
];

const ingestionSeed: IngestionRun[] = [
  {
    id: 'ck-run-1',
    datasetSlug: 'air-quality-pm25-de',
    status: 'SUCCESS',
    rowsWritten: 184320,
    errorMsg: null,
    startedAt: '2026-06-29T02:00:00.000Z',
    finishedAt: '2026-06-29T02:14:22.000Z',
    createdAt: '2026-06-29T02:00:00.000Z',
  },
  {
    id: 'ck-run-2',
    datasetSlug: 'surface-temperature-eu',
    status: 'RUNNING',
    rowsWritten: 94210,
    errorMsg: null,
    startedAt: '2026-06-30T01:05:00.000Z',
    finishedAt: null,
    createdAt: '2026-06-30T01:05:00.000Z',
  },
  {
    id: 'ck-run-3',
    datasetSlug: 'renewable-share-eu',
    status: 'FAILED',
    rowsWritten: 0,
    errorMsg: 'Upstream Eurostat API returned 503 Service Unavailable after 3 retries.',
    startedAt: '2026-06-29T18:30:00.000Z',
    finishedAt: '2026-06-29T18:31:44.000Z',
    createdAt: '2026-06-29T18:30:00.000Z',
  },
  {
    id: 'ck-run-4',
    datasetSlug: 'co2-emissions-eu',
    status: 'SUCCESS',
    rowsWritten: 52100,
    errorMsg: null,
    startedAt: '2026-06-28T22:00:00.000Z',
    finishedAt: '2026-06-28T22:08:11.000Z',
    createdAt: '2026-06-28T22:00:00.000Z',
  },
  {
    id: 'ck-run-5',
    datasetSlug: 'precipitation-nordics',
    status: 'SUCCESS',
    rowsWritten: 76440,
    errorMsg: null,
    startedAt: '2026-06-28T03:00:00.000Z',
    finishedAt: '2026-06-28T03:06:50.000Z',
    createdAt: '2026-06-28T03:00:00.000Z',
  },
];

export const mockDb = {
  datasets: datasetSeed,
  measurements: measurementSeed,
  apiKeys: apiKeySeed,
  ingestionRuns: ingestionSeed,
} as const;
