import { mkdir, writeFile } from 'node:fs/promises';

const SOURCE_URL = 'https://www.foxnews.com/outkick';
const OUTPUT_PATH = 'docs/rss.xml';
const MAX_ITEMS = 40;

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const normalizeUrl = (href) => {
  try {
    const url = new URL(href, SOURCE_URL);
    if (url.hostname !== 'www.foxnews.com' || !url.pathname.startsWith('/outkick-')) return null;
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
};

function findArticles(html) {
  const seen = new Set();
  const items = [];
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorPattern.exec(html)) && items.length < MAX_ITEMS) {
    const link = normalizeUrl(match[1]);
    const title = match[2]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!link || !title || title.length < 12 || seen.has(link)) continue;
    seen.add(link);
    items.push({ title, link });
  }
  return items;
}

async function main() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PersonalOutKickRSS/1.0; +https://github.com/)',
      'Accept': 'text/html,application/xhtml+xml'
    }
  });
  if (!response.ok) throw new Error(`OutKick returned HTTP ${response.status}`);

  const articles = findArticles(await response.text());
  if (articles.length === 0) throw new Error('No OutKick article links found; the page markup may have changed.');

  const now = new Date().toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>OutKick | Personal RSS</title>\n    <link>${SOURCE_URL}</link>\n    <description>Latest articles from Fox News OutKick, generated for personal use.</description>\n    <language>en-us</language>\n    <lastBuildDate>${now}</lastBuildDate>\n${articles.map(({ title, link }) => `    <item>\n      <title>${escapeXml(title)}</title>\n      <link>${escapeXml(link)}</link>\n      <guid isPermaLink="true">${escapeXml(link)}</guid>\n      <pubDate>${now}</pubDate>\n    </item>`).join('\n')}\n  </channel>\n</rss>\n`;

  await mkdir('docs', { recursive: true });
  await writeFile(OUTPUT_PATH, xml);
  console.log(`Wrote ${articles.length} items to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
