import { buildVendorUrls, fetchMultiplePages, combinePageTexts } from './scraper'
import { extractVendorSignals, generateSummary } from './claude'
import { calculateRiskScore } from './risk-score'
import type { VendorSignals } from '@/types/vendor'

export interface ScanOutput {
  signals: VendorSignals
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high'
  summary: string
}

export async function scanVendor(domain: string): Promise<ScanOutput> {
  const urls = buildVendorUrls(domain)
  const pages = await fetchMultiplePages(urls)
  const combinedText = combinePageTexts(pages)

  // Build a summary of what pages were accessible for context
  const pageStatuses = pages
    .map((p) => `${p.url}: ${p.status}${p.error ? ` (${p.error})` : ''}`)
    .join('\n')

  const fullContent = `DOMAIN: ${domain}\n\nPAGE FETCH RESULTS:\n${pageStatuses}\n\n${combinedText}`

  const signals = await extractVendorSignals(domain, fullContent)

  const { score, level } = calculateRiskScore(signals)
  const summary = await generateSummary(domain, signals, score, level)

  return {
    signals,
    riskScore: score,
    riskLevel: level,
    summary,
  }
}
