// popup.js

function faviconURL(u) {
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', u);
  url.searchParams.set('size', '16');
  return url.toString();
}

function highlightText(text, searchTerm) {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<span class="highlight">$1</span>');
}

function filterTabs(tabs, searchTerm) {
  if (!searchTerm) return tabs;
  searchTerm = searchTerm.toLowerCase();
  return tabs.filter(tab => 
    tab.title.toLowerCase().includes(searchTerm) ||
    tab.url.toLowerCase().includes(searchTerm)
  );
}

function switchToTab(tab) {
  // Get current window
  chrome.windows.getCurrent({}, (currentWindow) => {
    if (currentWindow.id === tab.windowId) {
      // Same window, just activate the tab
      chrome.tabs.update(tab.id, { active: true });
    } else {
      // Different window, focus it first
      chrome.windows.update(tab.windowId, { focused: true }, () => {
        chrome.tabs.update(tab.id, { active: true });
      });
    }
  });
}

// Store filtered tabs and selection state globally
let currentFilteredTabs = [];
let selectedTabIndex = -1;

function updateSelection() {
  // Remove selection from all tabs
  document.querySelectorAll('li').forEach(li => li.classList.remove('selected-tab'));
  
  // Add selection to current tab if valid
  if (selectedTabIndex >= 0 && selectedTabIndex < currentFilteredTabs.length) {
    const allTabs = document.querySelectorAll('li');
    allTabs[selectedTabIndex].classList.add('selected-tab');
    
    // Ensure selected tab is visible
    allTabs[selectedTabIndex].scrollIntoView({ block: 'nearest' });
  }
}

function navigateList(direction) {
  if (currentFilteredTabs.length === 0) return;

  if (selectedTabIndex === -1) {
    // If nothing is selected, start at beginning or end based on direction
    selectedTabIndex = direction > 0 ? 0 : currentFilteredTabs.length - 1;
  } else {
    // Update index with wrapping
    selectedTabIndex = (selectedTabIndex + direction + currentFilteredTabs.length) % currentFilteredTabs.length;
  }

  updateSelection();
}

function renderTabList(tabList, searchTerm = '') {
  const tabListElement = document.getElementById('tabList');
  tabListElement.innerHTML = ''; // Clear current list
  const tabsByWindow = {};
  currentFilteredTabs = []; // Reset filtered tabs

  // Group tabs by window
  tabList.forEach(tab => {
    if (!tabsByWindow[tab.windowId]) {
      tabsByWindow[tab.windowId] = [];
    }
    tabsByWindow[tab.windowId].push(tab);
  });

  // Filter and render tabs
  for (const windowId in tabsByWindow) {
    const windowTabs = filterTabs(tabsByWindow[windowId], searchTerm);
    
    // Skip empty windows after filtering
    if (windowTabs.length === 0) continue;

    // Add filtered tabs to our global array
    currentFilteredTabs.push(...windowTabs);

    const windowElement = document.createElement('div');
    const windowHeader = document.createElement('h3');
    windowHeader.textContent = `Window ${windowId}`;
    windowElement.appendChild(windowHeader);

    windowTabs.forEach(tab => {
      const li = document.createElement('li');
      
      // Add favicon
      const img = document.createElement('img');
      img.src = faviconURL(tab.url);
      li.appendChild(img);

      // Add title and URL with highlighting
      const titleSpan = document.createElement('span');
      titleSpan.innerHTML = highlightText(tab.title, searchTerm);
      li.appendChild(titleSpan);

      const urlSpan = document.createElement('span');
      urlSpan.innerHTML = ` (${highlightText(tab.url, searchTerm)})`;
      urlSpan.style.color = '#666';
      li.appendChild(urlSpan);

      // Highlight active tab
      if (tab.isActiveTab) {
        li.classList.add('active-tab');
      }

      // Add click handler
      li.addEventListener('click', () => switchToTab(tab));

      windowElement.appendChild(li);
    });

    tabListElement.appendChild(windowElement);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Initial render
  chrome.storage.local.get('tabList', function(result) {
    const tabList = result.tabList || [];
    renderTabList(tabList);
  });

  // Set up search and keyboard navigation
  const searchInput = document.getElementById('searchInput');
  
  searchInput.addEventListener('input', function(e) {
    chrome.storage.local.get('tabList', function(result) {
      const tabList = result.tabList || [];
      renderTabList(tabList, e.target.value.trim());
    });
  });

  // Set up keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      navigateList(e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === 'Enter' && currentFilteredTabs.length > 0) {
      e.preventDefault();
      // Switch to selected tab or first tab if nothing selected
      const tabToActivate = selectedTabIndex >= 0 ? 
        currentFilteredTabs[selectedTabIndex] : 
        currentFilteredTabs[0];
      switchToTab(tabToActivate);
      window.close();
    }
  });

  // Reset selection when search changes
  searchInput.addEventListener('input', function(e) {
    selectedTabIndex = -1;
    chrome.storage.local.get('tabList', function(result) {
      const tabList = result.tabList || [];
      renderTabList(tabList, e.target.value.trim());
    });
  });

  // Focus search input when popup opens
  searchInput.focus();
});
