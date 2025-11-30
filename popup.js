const STORAGE_KEY = 'searchCategories';
const categorySelect = document.getElementById('category');

const loadCategories = async () => {
  if (!categorySelect) return;
  const { [STORAGE_KEY]: categories = [] } = await chrome.storage.sync.get({ [STORAGE_KEY]: [] });
  categorySelect.innerHTML = '';
  if (!Array.isArray(categories) || categories.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.disabled = true;
    option.selected = true;
    option.textContent = 'Keine Kategorien definiert';
    categorySelect.appendChild(option);
    return;
  }
  categories.forEach((category, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = category.name || `Kategorie ${index + 1}`;
    categorySelect.appendChild(option);
  });
};

document.getElementById('useSelection').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() || ''
    });
    document.getElementById('q').value = (result || '').trim();
  } catch (e) {
    console.warn('Selection read failed', e);
  }
});

document.getElementById('search').addEventListener('click', () => {
  const q = document.getElementById('q').value.trim();
  if (!q) return;
  const payload = { type: 'OPEN_SEARCH_FOR_QUERY', query: q };
  const selectedIndex = Number.parseInt(categorySelect?.value, 10);
  if (Number.isFinite(selectedIndex)) {
    payload.categoryIndex = selectedIndex;
  }
  chrome.runtime.sendMessage(payload);
  window.close();
});

document.addEventListener('DOMContentLoaded', loadCategories);
