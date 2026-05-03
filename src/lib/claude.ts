import { GoogleGenerativeAI } from '@google/generative-ai'
import type { VendorSignals } from '@/types/vendor'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

const EXTRACTION_PROMPT = (domain: string, content: string) => `
You are a vendor due-diligence analyst. Extract structured intelligence from the website content below for the SaaS vendor: ${domain}

Return ONLY a valid JSON object matching the exact schema below. Do not include markdown, explanation, or code blocks — raw JSON only.

SCHEMA:
{
  "security": {
    "certifications": [],
    "sourceUrl": null,
    "status": "found",
    "notes": null
  },
  "subProcessors": {
    "processors": [],
    "sourceUrl": null,
    "status": "found",
    "count": 0
  },
  "privacy": {
    "lastUpdated": null,
    "gdprMechanism": null,
    "dataResidency": "Unknown",
    "sourceUrl": null,
    "status": "found"
  },
  "pricing": {
    "model": "unknown",
    "tiers": [],
    "hasFreeOption": false,
    "sourceUrl": null,
    "status": "found"
  },
  "ownership": {
    "type": "unknown",
    "latestRound": null,
    "foundingYear": null,
    "investors": [],
    "acquiredBy": null,
    "status": "found"
  },
  "health": {
    "incidents": [],
    "flags": [],
    "statusPageUrl": null,
    "statusPageUp": null,
    "status": "found"
  }
}

FIELD NOTES:
- security.certifications: array of strings like "SOC 2 Type II", "ISO 27001", "HIPAA", "FedRAMP", "PCI DSS"
- security.status / subProcessors.status / privacy.status / pricing.status / health.status: "found" | "not_found" | "blocked" | "error"
- ownership.status: "found" | "not_found" | "error"
- ownership.type: "public" | "vc_backed" | "pe_owned" | "bootstrap" | "unknown"
- pricing.model: "public_tiers" | "contact_sales" | "freemium" | "mixed" | "unknown"
- privacy.dataResidency: "US" | "EU" | "Both" | "Unknown"
- health.flags: array of { "type": string, "description": string, "date": string|null, "severity": string }
- health.flags[].type: "layoff" | "breach" | "leadership_change" | "acquisition" | "downtime" | "legal" | "other"
- health.flags[].severity: "low" | "medium" | "high"

RULES:
- Use your training knowledge to fill gaps when the scraped content is insufficient (especially for well-known SaaS companies like Notion, Linear, Retool, etc.)
- If a page was blocked (403) or not found, set status to "blocked" or "not_found" accordingly
- Be conservative: only list certifications you are confident about
- For pricing, look for dollar amounts, tier names, "contact sales" CTAs
- For ownership, note if VC-backed, PE-backed, or public (NYSE/NASDAQ)
- For health flags, include recent layoffs, data breaches, major leadership changes, or known incidents
- If you cannot determine something at all, use null or empty array — never guess

SCRAPED CONTENT:
${content.slice(0, 28000)}
`

export async function extractVendorSignals(domain: string, content: string): Promise<VendorSignals> {
  const result = await model.generateContent(EXTRACTION_PROMPT(domain, content))
  const raw = result.response.text()

  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  return JSON.parse(cleaned) as VendorSignals
}

const SUMMARY_PROMPT = (domain: string, signals: VendorSignals, riskScore: number, riskLevel: string) => `
You are a CFO briefing assistant. Write a 2-3 sentence renewal risk summary for ${domain} based on this vendor intelligence data.

Risk Score: ${riskScore}/100 (${riskLevel} risk)
Security: ${signals.security.certifications.join(', ') || 'No certifications found'}
Pricing: ${signals.pricing.model}
Ownership: ${signals.ownership.type}${signals.ownership.latestRound ? ` — ${signals.ownership.latestRound}` : ''}
Health Flags: ${signals.health.flags.map((f) => f.description).join('; ') || 'None'}
Privacy: GDPR mechanism: ${signals.privacy.gdprMechanism || 'Unknown'}, Data residency: ${signals.privacy.dataResidency}

Write for a busy finance or legal reviewer. Be direct and factual. Start with the most important signal. Do not use bullet points. Max 60 words.
`

export async function generateSummary(
  domain: string,
  signals: VendorSignals,
  riskScore: number,
  riskLevel: string
): Promise<string> {
  const result = await model.generateContent(SUMMARY_PROMPT(domain, signals, riskScore, riskLevel))
  return result.response.text().trim()
}
