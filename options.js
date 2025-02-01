// Default settings
const DEFAULT_SETTINGS = {
  enableJson: false,
  updateInterval: 10,
  serverUrl: 'http://localhost/save_tabs.php'
};

// Save options to storage
function saveOptions() {
  const settings = {
    enableJson: document.getElementById('enableJson').checked,
    updateInterval: parseInt(document.getElementById('updateInterval').value, 10),
    serverUrl: document.getElementById('serverUrl').value.trim()
  };

  chrome.storage.sync.set(settings, () => {
    // Update status to let user know options were saved
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    status.className = 'status success';
    status.style.display = 'block';

    // Notify background script of settings change
    chrome.runtime.sendMessage({ type: 'settingsUpdated', settings });

    setTimeout(() => {
      status.style.display = 'none';
    }, 2000);
  });
}

// Restore options from storage
function restoreOptions() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    document.getElementById('enableJson').checked = settings.enableJson;
    document.getElementById('updateInterval').value = settings.updateInterval;
    document.getElementById('serverUrl').value = settings.serverUrl;
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
