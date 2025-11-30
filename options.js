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

const getCategoriesContainer = () => document.getElementById('categories');

const getStorage = (keys) => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve(result);
    });
  });
};

const setStorage = (data) => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(data, () => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve();
    });
  });
};

const normalizeForDisplay = (url = '') => (url || '').replaceAll(STORAGE_PLACEHOLDER, DISPLAY_PLACEHOLDER);
const normalizeForStorage = (url = '') => (url || '').replaceAll(DISPLAY_PLACEHOLDER, STORAGE_PLACEHOLDER);

const updateCategoryRemovalState = () => {
  const cards = document.querySelectorAll('.category-card');
  const disableRemove = cards.length === 1;
  cards.forEach(card => {
    const button = card.querySelector('.remove-category');
    if (button) {
      button.disabled = disableRemove;
    }
  });
};

const createSiteRow = (site = {}, list) => {
  const row = document.createElement('div');
  row.className = 'site-row';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'site-name';
  nameInput.placeholder = 'Name (z.B. Google)';
  nameInput.value = site.name || '';

  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.className = 'site-url';
  urlInput.placeholder = 'URL (mit %s als Platzhalter)';
  urlInput.value = normalizeForDisplay(site.url || '');

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'remove-site';
  removeButton.textContent = 'Entfernen';
  removeButton.addEventListener('click', () => row.remove());

  row.append(nameInput, urlInput, removeButton);
  list.appendChild(row);
  return row;
};

const createCategoryCard = (category = { name: '', sites: [] }) => {
  const container = getCategoriesContainer();
  const card = document.createElement('section');
  card.className = 'category-card';

  const header = document.createElement('div');
  header.className = 'category-header';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'category-name';
  nameInput.placeholder = 'Kategoriename';
  nameInput.value = category.name || '';

  const removeCategory = document.createElement('button');
  removeCategory.type = 'button';
  removeCategory.className = 'remove-category';
  removeCategory.textContent = 'Kategorie entfernen';
  removeCategory.addEventListener('click', () => {
    card.remove();
    updateCategoryRemovalState();
  });

  header.append(nameInput, removeCategory);
  card.append(header);

  const siteList = document.createElement('div');
  siteList.className = 'site-list';
  const sites = Array.isArray(category.sites) && category.sites.length > 0 ? category.sites : [{ name: '', url: '' }];
  sites.forEach(site => createSiteRow(site, siteList));
  card.append(siteList);

  const footer = document.createElement('div');
  footer.className = 'category-controls';
  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.textContent = 'Neue Seite hinzufügen';
  addButton.addEventListener('click', () => createSiteRow({}, siteList));
  footer.append(addButton);
  card.append(footer);

  container.appendChild(card);
  updateCategoryRemovalState();
  return card;
};

const renderCategories = (categories) => {
  const container = getCategoriesContainer();
  container.innerHTML = '';
  if (!Array.isArray(categories) || categories.length === 0) {
    createCategoryCard(DEFAULT_CATEGORIES[0]);
    return;
  }
  categories.forEach(category => createCategoryCard(category));
};

const collectCategories = () => {
  const cards = document.querySelectorAll('.category-card');
  const categories = [];
  cards.forEach(card => {
    const name = card.querySelector('.category-name')?.value.trim();
    if (!name) return;

    const sites = [];
    card.querySelectorAll('.site-row').forEach(row => {
      const siteName = row.querySelector('.site-name')?.value.trim();
      const siteUrl = normalizeForStorage(row.querySelector('.site-url')?.value.trim() || '');
      if (siteName && siteUrl && siteUrl.includes(STORAGE_PLACEHOLDER)) {
        sites.push({ name: siteName, url: siteUrl });
      }
    });

    if (sites.length > 0) {
      categories.push({ name, sites });
    }
  });
  console.log('[Collect] Gesammelte Kategorien von der UI:', JSON.parse(JSON.stringify(categories)));
  return categories;
};

const restoreOptions = async () => {
  console.log('[Restore] Lese Daten aus dem Speicher...');
  const data = await getStorage({ [STORAGE_KEY]: [], sites: [] });
  let categories = data[STORAGE_KEY];

  // Fall 1: Keine Kategorien gefunden, aber möglicherweise alte "sites"-Struktur vorhanden.
  if (!Array.isArray(categories) || categories.length === 0) {
    console.log('[Restore] Keine Kategorien gefunden, prüfe auf veraltete "sites"-Struktur.');
    const legacySites = Array.isArray(data.sites) ? data.sites : [];
    const normalizedSites = legacySites
      .map(site => ({ name: (site.name || ''), url: normalizeForStorage(site.url || '') }))
      .filter(site => site.name && site.url.includes(STORAGE_PLACEHOLDER));

    if (normalizedSites.length > 0) {
      console.log('[Restore] Veraltete "sites" gefunden und zu einer Kategorie migriert.');
      categories = [{ name: 'Standard', sites: normalizedSites }];
      await setStorage({ [STORAGE_KEY]: categories });
      console.log('[Restore] Migrierte Kategorie gespeichert.');
    }
  }

  // Fall 2: Immer noch keine Kategorien, also Standard verwenden.
  if (!Array.isArray(categories) || categories.length === 0) {
    console.log('[Restore] Keine gespeicherten Daten gefunden, verwende Standardkategorien.');
    categories = DEFAULT_CATEGORIES;
  }

  console.log('[Restore] Rendere Kategorien:', JSON.parse(JSON.stringify(categories)));
  renderCategories(categories);
};

const saveOptions = async () => {
  const categories = collectCategories();
  if (categories.length === 0) {
    console.warn('[Save] Keine gültigen Kategorien zum Speichern gefunden. Es wird nichts gespeichert.');
    return;
  }
  console.log('[Save] Speichere Kategorien:', JSON.parse(JSON.stringify(categories)));
  try {
    await setStorage({ [STORAGE_KEY]: categories });
    const status = document.getElementById('status');
    status.textContent = 'Gespeichert!';
    setTimeout(() => { status.textContent = ''; }, 1500);
  } catch (error) {
    console.error('[Save] Fehler beim Speichern:', error);
    document.getElementById('status').textContent = `Fehler: ${error.message}`;
  }
};

const exportCategories = async () => {
  // Sammelt die aktuell auf der Seite konfigurierten Kategorien.
  let categories = collectCategories();
  // Wenn keine Kategorien auf der Seite sind (z.B. vor dem Speichern),
  // werden die zuletzt gespeicherten Kategorien als Fallback verwendet.
  if (categories.length === 0) {
    const data = await getStorage({ [STORAGE_KEY]: [] });
    categories = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  }
  if (categories.length === 0) {
    alert('Keine Kategorien zum Exportieren vorhanden.');
    return;
  }
  console.log('[Export] Exportiere Kategorien:', JSON.parse(JSON.stringify(categories)));

  const manifest = chrome.runtime.getManifest();
  const extensionName = manifest.name.replace(/[^a-z0-9]/gi, '_');
  const date = new Date().toISOString().slice(0, 10);
  const filename = `${extensionName}_backup_${date}.json`;
  const content = JSON.stringify(categories, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Erstellt einen temporären Download-Link und klickt ihn an.
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const triggerImport = () => {
  // Löst den Klick auf das versteckte Datei-Eingabefeld aus.
  document.getElementById('import-file').click();
};

const importCategories = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const status = document.getElementById('status');
  status.textContent = '';

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      console.log(`[Import] Rohdaten aus Datei:`, imported);

      if (!Array.isArray(imported)) {
        throw new Error('Die importierte Datei hat ein ungültiges Format (es ist kein Array).');
      }

      const totalFromFile = imported.length;
      console.log(`[Import] ${totalFromFile} Kategorien in der Datei gefunden.`);

      // Validierung und Bereinigung der importierten Daten.
      const sanitized = imported
        .map(cat => ({
          name: (cat.name || '').trim(),
          sites: Array.isArray(cat.sites) ? cat.sites.map(site => ({
            name: (site.name || '').trim(),
            url: normalizeForStorage((site.url || ''))
          })).filter(s => s.name && s.url.includes(STORAGE_PLACEHOLDER)) : []
        }))
        .filter(c => c.name && c.sites.length > 0);

      console.log(`[Import] ${sanitized.length} gültige Kategorien nach der Bereinigung:`, JSON.parse(JSON.stringify(sanitized)));

      if (sanitized.length === 0) {
        throw new Error(`Import fehlgeschlagen. ${totalFromFile} Kategorien gefunden, aber keine davon war gültig.`);
      }

      // Speichert die bereinigten Kategorien und lädt die Seite neu.
      await setStorage({ [STORAGE_KEY]: sanitized });

      status.textContent = `${sanitized.length} Kategorien erfolgreich importiert. Seite wird neu geladen...`;
      setTimeout(() => location.reload(), 1000);
    } catch (error) {
      console.error('[Import] Fehler:', error.message);
      status.textContent = `Fehler: ${error.message}`;
    }
  };
  reader.readAsText(file);
};

const setupTabs = () => {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanels.forEach(panel => panel.classList.remove('active'));

      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
};

const ensureCategorySetup = () => {
  const container = getCategoriesContainer();
  if (container.children.length === 0) {
    renderCategories(DEFAULT_CATEGORIES);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  restoreOptions();
  setupTabs();
  document.getElementById('add-category').addEventListener('click', () => createCategoryCard());
  document.getElementById('save').addEventListener('click', saveOptions);
  document.getElementById('export').addEventListener('click', exportCategories);
  document.getElementById('import').addEventListener('click', triggerImport);
  document.getElementById('import-file').addEventListener('change', importCategories);
  ensureCategorySetup();
});