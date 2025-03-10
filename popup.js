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
      chrome.tabs.update(tab.id, { active: true })
        .catch(err => console.error('Error activating tab:', err));
    } else {
      // Different window, focus it first
      chrome.windows.update(tab.windowId, { focused: true })
        .then(() => {
          // Add a small delay to ensure window is focused
          setTimeout(() => {
            chrome.tabs.update(tab.id, { active: true })
              .catch(err => console.error('Error activating tab after window focus:', err));
          }, 150); // 150ms delay
        })
        .catch(err => console.error('Error focusing window:', err));
    }
  });
}

// Store filtered tabs and selection state globally
let currentFilteredTabs = [];
let selectedTabIndex = -1;
let activeWindowId = null;

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

      // Log information about each tab
      console.log(`Tab: ${tab.title} | Window ID: ${windowId} (${typeof windowId}) | Active Window ID: ${activeWindowId} (${typeof activeWindowId}) | isActiveTab: ${tab.isActiveTab}`);
      console.log(`Comparison result: ${tab.isActiveTab && String(windowId) === String(activeWindowId)}`);
      
      // Only highlight the active tab in the active window - convert both to strings for comparison
      if (tab.isActiveTab && String(windowId) === String(activeWindowId)) {
        console.log(`Highlighting tab: ${tab.title}`);
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
  // Get the active window ID and active tab ID when popup opens
  console.log("Getting current window and active tab...");
  
  // Get the current window
  chrome.windows.getCurrent({}, (currentWindow) => {
    console.log("Current window:", currentWindow);
    activeWindowId = currentWindow.id;
    console.log("Active window ID:", activeWindowId, "Type:", typeof activeWindowId);
    
    // Get the active tab in the current window
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      console.log("Active tabs in current window:", activeTabs);
      
      let activeTabId = null;
      if (activeTabs.length > 0) {
        const activeTab = activeTabs[0];
        activeTabId = activeTab.id;
        console.log("Active tab ID:", activeTab.id, "Window ID:", activeTab.windowId);
      }
      
      // Initial render with the active window ID
      chrome.storage.local.get('tabList', function(result) {
        const tabList = result.tabList || [];
        console.log("Tab list from storage:", tabList);
        
        // Log window IDs and active tabs
        const windowIds = [...new Set(tabList.map(tab => tab.windowId))];
        console.log("Window IDs in tab list:", windowIds);
        
        const activeTabs = tabList.filter(tab => tab.isActiveTab);
        console.log("Active tabs in tab list:", activeTabs);
        
        // Mark the active tab in the tab list
        const updatedTabList = tabList.map(tab => {
          // Reset isActiveTab for all tabs
          tab.isActiveTab = false;
          
          // Set isActiveTab to true for the active tab in the current window
          if (tab.id === activeTabId && String(tab.windowId) === String(activeWindowId)) {
            console.log("Marking tab as active:", tab.title);
            tab.isActiveTab = true;
          }
          
          return tab;
        });
        
        renderTabList(updatedTabList);
        
        // Auto-select the first item if there are results
        if (currentFilteredTabs.length > 0) {
          selectedTabIndex = 0;
          updateSelection();
        }
      });
    });
  });

  // Set up search and keyboard navigation
  const searchInput = document.getElementById('searchInput');

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
      
      // Get current window to check if we're switching to a tab in a different window
      chrome.windows.getCurrent({}, (currentWindow) => {
        const isTabInDifferentWindow = currentWindow.id !== tabToActivate.windowId;
        
        // Call switchToTab
        switchToTab(tabToActivate);
        
        // Delay closing the popup, with a longer delay for tabs in different windows
        setTimeout(() => {
          window.close();
        }, isTabInDifferentWindow ? 200 : 50);
      });
    }
  });

  // Reset selection when search changes
  searchInput.addEventListener('input', function(e) {
    chrome.storage.local.get('tabList', function(result) {
      const tabList = result.tabList || [];
      const searchTerm = e.target.value.trim();
      
      // Get the active tab in the current window
      chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
        let activeTabId = null;
        if (activeTabs.length > 0) {
          const activeTab = activeTabs[0];
          activeTabId = activeTab.id;
        }
        
        // Mark the active tab in the tab list
        const updatedTabList = tabList.map(tab => {
          // Reset isActiveTab for all tabs
          tab.isActiveTab = false;
          
          // Set isActiveTab to true for the active tab in the current window
          if (tab.id === activeTabId && String(tab.windowId) === String(activeWindowId)) {
            tab.isActiveTab = true;
          }
          
          return tab;
        });
        
        // Render the filtered list
        renderTabList(updatedTabList, searchTerm);
        
        // Auto-select the first item if there are results
        if (currentFilteredTabs.length > 0) {
          selectedTabIndex = 0;
          updateSelection();
        } else {
          selectedTabIndex = -1;
        }
      });
    });
  });

  // Focus search input when popup opens
  searchInput.focus();
});
