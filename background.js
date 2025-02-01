// background.js

console.log("Background script loaded");

// Default settings
const DEFAULT_SETTINGS = {
  enableJson: false,
  updateInterval: 10,
  serverUrl: 'http://localhost/save_tabs.php'
};

let settings = DEFAULT_SETTINGS;
let updateIntervalId = null;

// Load settings and start update interval if enabled
chrome.storage.sync.get(DEFAULT_SETTINGS, (loadedSettings) => {
  settings = loadedSettings;
  if (settings.enableJson) {
    startUpdateInterval();
  }
});

// Listen for settings changes
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'settingsUpdated') {
    settings = message.settings;
    startUpdateInterval();
  }
});

function startUpdateInterval() {
  // Clear existing interval if any
  if (updateIntervalId) {
    clearInterval(updateIntervalId);
    updateIntervalId = null;
  }
  
  // Only start interval if JSON output is enabled
  if (settings.enableJson) {
    updateIntervalId = setInterval(updateTabList, settings.updateInterval * 1000);
    // Run immediately
    updateTabList();
  }
}

// Listen for keyboard command
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-tab-search") {
    chrome.action.openPopup();
  }
});


// Log when a tab is activated
chrome.tabs.onActivated.addListener(function (activeInfo) {
  console.log("Tab", activeInfo.tabId, "was activated");
})

// Update tab list when a tab is attached to a window
chrome.tabs.onAttached.addListener(function (tabId, attachInfo) {
  console.log("Tab", tabId, "was attached to window", attachInfo.newWindowId);
  updateTabList();
});

// Update tab list when the extension icon is clicked
chrome.action.onClicked.addListener(function () {
  updateTabList();
});

// Update tab list when a tab is created
chrome.tabs.onCreated.addListener(function (tab) {
  console.log("Tab", tab.id, "was created");
  updateTabList();
});

// Update tab list when a tab is detached from a window
chrome.tabs.onDetached.addListener(function (tabId, detachInfo) {
  console.log("Tab", tabId, "was detached from window", detachInfo.oldWindowId);
  updateTabList();
});

// Update tab list when a tab is removed
chrome.tabs.onRemoved.addListener(function (tabId) {
  console.log("Tab", tabId, "was removed");
  updateTabList();
});

// Update tab list when a tab is updated
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  console.log("Tab", tabId, "was updated", changeInfo);
  updateTabList();
});

// Update tab list when extenstion is installed or updated
chrome.runtime.onInstalled.addListener(function () {
  updateTabList();
});

chrome.tabs.onReplaced.addListener(function (removedTabId, newTabId) {
  console.log("Tab", removedTabId, "was replaced by tab", newTabId);
  updateTabList();
});

async function sendToServer(data) {
  if (!settings.enableJson) return;
  
  try {
    const response = await fetch(settings.serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data, null, 2)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Server response:', result);
  } catch (error) {
    console.error('Error sending data to server:', error);
  }
}

async function updateTabList() {
  chrome.tabs.query({}, async function (tabs) {
    const tabList = tabs.map(tab => {
      return {
        windowId: tab.windowId,
        id: tab.id,
        url: tab.url,
        title: tab.title,
        index: tab.index,
        isActiveTab: tab.active
      };
    });

    // Save to chrome storage for popup
    await chrome.storage.local.set({ tabList });
    console.log("Tab list updated:", tabList);

    // Only send to server if JSON output is enabled
    if (settings.enableJson) {
      // Create simplified version for JSON file
      const simplifiedTabList = tabs.map(tab => ({
        windowId: tab.windowId,
        title: tab.title,
        url: tab.url,
        index: tab.index
      }));

      // Send to PHP server
      await sendToServer(simplifiedTabList);
    }
  });
}
