import { GoogleGenerativeAI } from '@google/generative-ai'
import type { VendorSignals } from '@/types/vendor'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

// Single prompt returns both signals + summary to halve API calls per vendor
const COMBINED_PROMPT = (domain: string, content: string) => `
You are a vendor due-diligence analyst. Analyze the website content below for the SaaS vendor: ${domain}

Return ONLY a valid JSON object with this exact shape. No markdown, no code fences, raw JSON only.

{
  "signals": {
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
  },
  "summary": "2-3 sentence CFO renewal risk summary. Lead with the most important signal. Direct and factual. Max 60 words."
}

FIELD NOTES:
- security.certifications: "SOC 2 Type II", "ISO 27001", "HIPAA", "FedRAMP", "PCI DSS"
- *.status: "found" | "not_found" | "blocked" | "error"
- ownership.type: "public" | "vc_backed" | "pe_owned" | "bootstrap" | "unknown"
- pricing.model: "public_tiers" | "contact_sales" | "freemium" | "mixed" | "unknown"
- privacy.dataResidency: "US" | "EU" | "Both" | "Unknown"
- health.flags[].type: "layoff" | "breach" | "leadership_change" | "acquisition" | "downtime" | "legal" | "other"
- health.flags[].severity: "low" | "medium" | "high"

RULES:
- Use your training knowledge for well-known SaaS companies when scraping is insufficient
- If a page was blocked (403) set status to "blocked", if not found set "not_found"
- Only list certifications you are confident about
- Never guess — use null or empty array when unknown
- The summary should be written for a busy finance or legal reviewer

SCRAPED CONTENT:
${content.slice(0, 28000)}
`

async function callWithRetry(prompt: string, retries = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (err: unknown) {
      const is429 = err instanceof Error && (err.message.includes('429') || err.message.includes('503'))
      const isLast = attempt === retries - 1
      if (!is429 || isLast) throw err
      // Exponential backoff: 10s, 20s, 40s
      const delay = 10000 * Math.pow(2, attempt)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw new Error('Max retries exceeded')
}

export async function extractVendorSignals(
  domain: string,
  content: string
): Promise<{ signals: VendorSignals; summary: string }> {
  const raw = await callWithRetry(COMBINED_PROMPT(domain, content))

  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  const parsed = JSON.parse(cleaned) as { signals: VendorSignals; summary: string }

  // Gemini sometimes returns incidents as objects instead of strings — normalize to strings
  const s = parsed.signals
  s.health.incidents = s.health.incidents.map((inc: unknown) => {
    if (typeof inc === 'string') return inc
    const o = inc as Record<string, string>
    return o.description ?? o.title ?? o.summary ?? JSON.stringify(inc)
  })
  // Normalize any string arrays that may have snuck in as objects
  s.security.certifications = s.security.certifications.map((c: unknown) =>
    typeof c === 'string' ? c : JSON.stringify(c)
  )
  s.subProcessors.processors = s.subProcessors.processors.map((p: unknown) =>
    typeof p === 'string' ? p : JSON.stringify(p)
  )
  s.pricing.tiers = s.pricing.tiers.map((t: unknown) =>
    typeof t === 'string' ? t : JSON.stringify(t)
  )
  s.subProcessors.count = s.subProcessors.processors.length

  return parsed
}
