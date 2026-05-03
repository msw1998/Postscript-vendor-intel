export interface SecuritySignal {
  certifications: string[]       // ["SOC 2 Type II", "ISO 27001", ...]
  sourceUrl: string | null
  status: 'found' | 'not_found' | 'blocked' | 'error'
  notes: string | null
}

export interface SubProcessorSignal {
  processors: string[]
  sourceUrl: string | null
  status: 'found' | 'not_found' | 'blocked' | 'error'
  count: number
}

export interface PrivacySignal {
  lastUpdated: string | null      // ISO date string
  gdprMechanism: string | null   // "Standard Contractual Clauses", "Privacy Shield", etc.
  dataResidency: 'US' | 'EU' | 'Both' | 'Unknown'
  sourceUrl: string | null
  status: 'found' | 'not_found' | 'blocked' | 'error'
}

export interface PricingSignal {
  model: 'public_tiers' | 'contact_sales' | 'freemium' | 'mixed' | 'unknown'
  tiers: string[]                // ["Free", "Pro $29/mo", "Enterprise"]
  hasFreeOption: boolean
  sourceUrl: string | null
  status: 'found' | 'not_found' | 'blocked' | 'error'
}

export interface OwnershipSignal {
  type: 'public' | 'vc_backed' | 'pe_owned' | 'bootstrap' | 'unknown'
  latestRound: string | null     // "Series D - $200M (2023)"
  foundingYear: number | null
  investors: string[]
  acquiredBy: string | null
  status: 'found' | 'not_found' | 'error'
}

export interface HealthSignal {
  incidents: string[]            // recent status page incidents
  flags: HealthFlag[]
  statusPageUrl: string | null
  statusPageUp: boolean | null
  status: 'found' | 'not_found' | 'error'
}

export interface HealthFlag {
  type: 'layoff' | 'breach' | 'leadership_change' | 'acquisition' | 'downtime' | 'legal' | 'other'
  description: string
  date: string | null
  severity: 'low' | 'medium' | 'high'
}

export interface VendorSignals {
  security: SecuritySignal
  subProcessors: SubProcessorSignal
  privacy: PrivacySignal
  pricing: PricingSignal
  ownership: OwnershipSignal
  health: HealthSignal
}

export interface ScanResult {
  id: string
  vendorId: string
  domain: string
  name: string | null
  scannedAt: string
  status: 'pending' | 'scanning' | 'done' | 'failed'
  riskScore: number | null
  riskLevel: 'low' | 'medium' | 'high' | null
  signals: VendorSignals | null
  summary: string | null
  error: string | null
}

export interface VendorWithLatestScan {
  id: string
  domain: string
  name: string | null
  addedAt: string
  latestScan: ScanResult | null
}

export interface RiskFactor {
  label: string
  points: number
  triggered: boolean
}
