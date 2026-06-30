import {
  Activity,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  PlayCircle,
  Settings,
  TableProperties,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROUTES } from './constants';

export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: LucideIcon;
  readonly description: string;
}

export const DASHBOARD_NAV: readonly NavItem[] = [
  {
    label: 'Overview',
    href: ROUTES.dashboardOverview,
    icon: LayoutDashboard,
    description: 'System health and usage at a glance',
  },
  {
    label: 'Datasets',
    href: ROUTES.datasets,
    icon: TableProperties,
    description: 'Browse and explore datasets',
  },
  {
    label: 'Measurements',
    href: ROUTES.measurements,
    icon: ListChecks,
    description: 'Query raw measurement records',
  },
  {
    label: 'API Playground',
    href: ROUTES.playground,
    icon: PlayCircle,
    description: 'Build and test API requests',
  },
  {
    label: 'API Keys',
    href: ROUTES.apiKeys,
    icon: KeyRound,
    description: 'Manage keys and rate limits',
  },
  {
    label: 'Ingestion',
    href: ROUTES.ingestion,
    icon: Activity,
    description: 'ETL pipeline status and logs',
  },
  {
    label: 'Settings',
    href: ROUTES.settings,
    icon: Settings,
    description: 'Account and preferences',
  },
] as const;

export interface PricingTier {
  readonly name: string;
  readonly price: number;
  readonly period: string;
  readonly description: string;
  readonly features: readonly string[];
  readonly cta: string;
  readonly highlighted: boolean;
}

export const PRICING_TIERS: readonly PricingTier[] = [
  {
    name: 'Developer',
    price: 0,
    period: 'forever',
    description: 'For exploring the API and building prototypes.',
    features: [
      '10,000 requests / month',
      '5 datasets',
      'Community support',
      'Swagger docs',
      '1 API key',
    ],
    cta: 'Start free',
    highlighted: false,
  },
  {
    name: 'Team',
    price: 99,
    period: 'month',
    description: 'For teams building data products on EU data.',
    features: [
      '1,000,000 requests / month',
      'All datasets',
      'Historical archives',
      'Priority support',
      '10 API keys',
      '99.9% uptime SLA',
    ],
    cta: 'Start 14-day trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 0,
    period: 'custom',
    description: 'For regulated workloads and on-prem needs.',
    features: [
      'Unlimited requests',
      'Dedicated cache & rate limits',
      'Custom ETL pipelines',
      'SSO & SAML',
      'Audit logs',
      'Dedicated CSM',
    ],
    cta: 'Contact sales',
    highlighted: false,
  },
] as const;

export interface MarketingNavLink {
  readonly label: string;
  readonly href: string;
}

export const MARKETING_NAV: readonly MarketingNavLink[] = [
  { label: 'Data Sources', href: '/#sources' },
  { label: 'Categories', href: '/#categories' },
  { label: 'Architecture', href: '/#architecture' },
  { label: 'Pricing', href: '/pricing' },
] as const;

export const SITE = {
  name: 'Data-Mesh',
  tagline: 'EU Environmental Data, as an API.',
  description:
    'Aggregate, normalize and serve European environmental datasets through a clean, rate-limited REST API.',
  url: 'https://data-mesh.dev',
} as const;
