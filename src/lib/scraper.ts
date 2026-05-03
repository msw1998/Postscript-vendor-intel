import axios from 'axios'
import * as cheerio from 'cheerio'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const TIMEOUT = 12000

export interface FetchResult {
  url: string
  text: string
  html: string
  status: 'ok' | 'blocked' | 'not_found' | 'error' | 'empty'
  statusCode: number | null
  error: string | null
}

export async function fetchPage(url: string): Promise<FetchResult> {
  try {
    const resp = await axios.get(url, {
      timeout: TIMEOUT,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      maxRedirects: 5,
      validateStatus: (s) => s < 500,
    })

    if (resp.status === 404) {
      return { url, text: '', html: '', status: 'not_found', statusCode: 404, error: null }
    }
    if (resp.status === 403 || resp.status === 401 || resp.status === 429) {
      return { url, text: '', html: '', status: 'blocked', statusCode: resp.status, error: `HTTP ${resp.status}` }
    }

    const html = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data)
    const $ = cheerio.load(html)

    // Remove noise
    $('script, style, nav, footer, header, [aria-hidden="true"], .cookie-banner, #cookie-banner').remove()

    const text = $('body').text().replace(/\s+/g, ' ').trim()

    if (text.length < 100) {
      return { url, text, html, status: 'empty', statusCode: resp.status, error: 'Very little text content — may be JS-rendered' }
    }

    return { url, text, html, status: 'ok', statusCode: resp.status, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    const isTimeout = msg.includes('timeout') || msg.includes('ETIMEDOUT')
    return {
      url,
      text: '',
      html: '',
      status: 'error',
      statusCode: null,
      error: isTimeout ? 'Request timed out' : msg.slice(0, 120),
    }
  }
}

export async function fetchMultiplePages(urls: string[]): Promise<FetchResult[]> {
  return Promise.all(urls.map(fetchPage))
}

export function buildVendorUrls(domain: string): string[] {
  const base = `https://${domain}`
  const trustSubdomain = `https://trust.${domain}`
  const statusSubdomain = `https://status.${domain}`

  return [
    base,
    `${base}/security`,
    `${base}/trust`,
    `${base}/privacy`,
    `${base}/privacy-policy`,
    `${base}/pricing`,
    `${base}/about`,
    `${base}/legal/dpa`,
    `${base}/legal/sub-processors`,
    `${base}/sub-processors`,
    trustSubdomain,
    statusSubdomain,
    `${statusSubdomain}/history`,
  ]
}

export function combinePageTexts(results: FetchResult[]): string {
  return results
    .filter((r) => r.status === 'ok' || r.status === 'empty')
    .map((r) => `--- PAGE: ${r.url} ---\n${r.text}`)
    .join('\n\n')
}

export function getPageMap(results: FetchResult[]): Record<string, FetchResult> {
  const map: Record<string, FetchResult> = {}
  for (const r of results) {
    map[r.url] = r
  }
  return map
}
