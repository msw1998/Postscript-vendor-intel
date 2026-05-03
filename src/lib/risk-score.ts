import type { VendorSignals, RiskFactor } from '@/types/vendor'

export function calculateRiskScore(signals: VendorSignals): {
  score: number
  level: 'low' | 'medium' | 'high'
  factors: RiskFactor[]
} {
  const factors: RiskFactor[] = [
    {
      label: 'No SOC 2 certification found',
      points: 25,
      triggered: !signals.security.certifications.some((c) => c.toLowerCase().includes('soc 2')),
    },
    {
      label: 'No GDPR transfer mechanism documented',
      points: 15,
      triggered: !signals.privacy.gdprMechanism,
    },
    {
      label: 'Unknown data residency',
      points: 10,
      triggered: signals.privacy.dataResidency === 'Unknown',
    },
    {
      label: 'Contact-sales only pricing (opacity risk)',
      points: 10,
      triggered: signals.pricing.model === 'contact_sales',
    },
    {
      label: 'Privacy policy outdated or not found',
      points: 10,
      triggered: isPrivacyOutdated(signals.privacy.lastUpdated),
    },
    {
      label: 'Recent data breach',
      points: 30,
      triggered: signals.health.flags.some((f) => f.type === 'breach'),
    },
    {
      label: 'Recent significant layoffs',
      points: 15,
      triggered: signals.health.flags.some((f) => f.type === 'layoff' && f.severity !== 'low'),
    },
    {
      label: 'Recent leadership change',
      points: 10,
      triggered: signals.health.flags.some((f) => f.type === 'leadership_change'),
    },
    {
      label: 'PE-owned (higher churn/changes risk)',
      points: 10,
      triggered: signals.ownership.type === 'pe_owned',
    },
    {
      label: 'No public pricing information',
      points: 5,
      triggered: signals.pricing.status === 'not_found' || signals.pricing.model === 'unknown',
    },
    {
      label: 'Status page showing active incidents',
      points: 15,
      triggered: signals.health.incidents.length > 0,
    },
    {
      label: 'Legal or regulatory issues',
      points: 20,
      triggered: signals.health.flags.some((f) => f.type === 'legal'),
    },
  ]

  const score = factors.filter((f) => f.triggered).reduce((sum, f) => sum + f.points, 0)
  const capped = Math.min(score, 100)

  const level: 'low' | 'medium' | 'high' = capped <= 25 ? 'low' : capped <= 55 ? 'medium' : 'high'

  return { score: capped, level, factors }
}

function isPrivacyOutdated(lastUpdated: string | null): boolean {
  if (!lastUpdated) return true
  try {
    const date = new Date(lastUpdated)
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
    return date < twoYearsAgo
  } catch {
    return true
  }
}
