const STORAGE_KEY = 'searchCategories';
const STORAGE_PLACEHOLDER = '{q}';
const DISPLAY_PLACEHOLDER = '%s';
const DEFAULT_TEMPLATES = [
  { name: 'Google', url: 'https://www.google.com/search?q={q}' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={q}' },
  { name: 'Wikipedia (DE)', url: 'https://de.wikipedia.org/wiki/Spezial:Suche?search={q}' },
  { name: 'Bing', url: 'https://www.bing.com/search?q={q}' },
  { name: 'YouTube', url: 'https://www.youtube.com/results?search_query={q}' }
];
const DEFAULT_CATEGORIES = [
  { name: 'Standard', sites: DEFAULT_TEMPLATES }
];

const normalizeUrlPlaceholder = (url = '') =>
  (url || '').trim().replaceAll(DISPLAY_PLACEHOLDER, STORAGE_PLACEHOLDER);

const sanitizeSites = (sites = []) =>
  (Array.isArray(sites) ? sites : [])
    .map(site => ({
      ...site,
      url: normalizeUrlPlaceholder(site.url || '')
    }))
    .filter(site => site.name && site.url.includes(STORAGE_PLACEHOLDER));

const getStoredCategories = async () => {
  const { [STORAGE_KEY]: categories = [] } = await chrome.storage.sync.get({ [STORAGE_KEY]: [] });
  return Array.isArray(categories) ? categories : [];
};

const ensureDefaultCategories = async () => {
  const stored = await getStoredCategories();
  if (stored.length > 0) {
    return stored;
  }
  // Sanitize and store default categories if no categories are stored yet.
  const sanitizedDefaults = DEFAULT_CATEGORIES.filter(c => c.name && c.sites.length > 0);
  await chrome.storage.sync.set({ [STORAGE_KEY]: sanitizedDefaults });
  return DEFAULT_CATEGORIES;
};

let isRebuilding = false;
async function rebuildContextMenu() {
  if (isRebuilding) return;
  isRebuilding = true;

  try { await chrome.contextMenus.removeAll(); } catch (_) {}
  const categories = await ensureDefaultCategories();
  if (!Array.isArray(categories) || categories.length === 0) {
    chrome.contextMenus.create({
      id: 'multiSiteSearch',
      title: 'Mit Multi‑Site Suche suchen: "%s"',
      contexts: ['selection']
    });
    return;
  }
  categories.forEach((category, index) => {
    chrome.contextMenus.create({
      id: `multiSiteSearch-${index}`,
      title: category.name || `Kategorie ${index + 1}`,
      contexts: ['selection']
    });
  });

  isRebuilding = false;
}

chrome.runtime.onInstalled.addListener(async () => {
  await rebuildContextMenu();
});

chrome.runtime.onStartup.addListener(rebuildContextMenu);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync') return;
  if (!changes[STORAGE_KEY]) return;
  rebuildContextMenu();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.menuItemId?.startsWith('multiSiteSearch')) return;
  const selection = info.selectionText?.trim();
  if (!selection) return;
  const match = info.menuItemId.match(/multiSiteSearch-(\d+)/);
  const categoryIndex = match ? Number(match[1]) : 0;
  openSearchTabs(selection, { categoryIndex });
});

async function openSearchTabs(query, options = {}) {
  const categories = await ensureDefaultCategories();
  let index = Number.isFinite(options.categoryIndex) ? options.categoryIndex : 0;
  if (index < 0) index = 0;
  if (index >= categories.length) index = categories.length - 1;
  const category = categories[index] || DEFAULT_CATEGORIES[0];
  const safeQ = encodeURIComponent(query);
  const list = sanitizeSites(category?.sites || []);

  for (const t of list) {
    const targetUrl = t.url.replaceAll(STORAGE_PLACEHOLDER, safeQ);
    try {
      await chrome.tabs.create({ url: targetUrl, active: false });
    } catch (e) {
      console.warn('Failed to open', t, e);
    }
  }
}

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg?.type === 'OPEN_SEARCH_FOR_QUERY' && msg.query) {
    openSearchTabs(msg.query, { categoryIndex: msg.categoryIndex });
    sendResponse({ ok: true });
    return true;
  }
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeUrlPlaceholder,
    sanitizeSites,
    DEFAULT_CATEGORIES,
    STORAGE_PLACEHOLDER
  };
}
