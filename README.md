# Tab List Chrome Extension

The Tab List Chrome Extension is a simple utility extension that allows users to list open tabs along with their URLs, tab IDs, and window IDs. The extension provides an organized view of open tabs within your active Chrome window, making it easier to manage and keep track of your browsing sessions. The extension also logs any changes made to these tabs, such as updates, creations, removals in the DevTools console.

Helpful for developers troubleshooting Chrome Extensions that use `chrome.tabs`

![Extension Screenshot](https://i.imgur.com/Ynn1VLH.png)

## Features

### Tab Management

- List open tabs in a user-friendly format
- Display tab favicons for better visual identification
- Organize tabs by their associated window IDs
- Update the tab list in real-time when tabs are closed, opened, or updated
- The active tab in all windows is highlighted
- Dark mode interface for better visibility
- Keyboard shortcuts for quick access (Ctrl+Shift+P)

### Search and Navigation

- Quick search functionality for tabs by title or URL
- Live search results as you type
- Keyboard navigation using arrow keys
- Select tabs using Up/Down arrows
- Activate selected tab with Enter key
- Visual highlighting of search matches
- Auto-focus on search input when opened

### JSON Output (Optional)

- Optional JSON output for tab information
- Configurable update interval
- Custom server URL support
- Disabled by default for better performance
- Enable/disable through options page

### Configuration

- Dark-themed options page
- Enable/disable JSON output
- Adjust update interval (1-3600 seconds)
- Configure server URL for JSON output
- Settings persist across browser sessions
- Real-time settings application

## Installation

1. Download the extension's code from the repository or zip file
2. Open Google Chrome
3. Type chrome://extensions/ in the address bar and press Enter
4. Enable "Developer mode" in the top right corner of the Extensions page
5. Click "Load unpacked" and select the directory containing the extension's code
6. The Tab List Chrome Extension icon will appear in your browser's toolbar

## How to Use

### Basic Usage

1. Click the extension icon or press Ctrl+Shift+P to open
2. View all open tabs organized by window
3. Click any tab to switch to it
4. Use the search box to filter tabs
5. Navigate with arrow keys and Enter

### Search and Navigation

1. Start typing to search tabs
2. Use Up/Down arrows to select tabs
3. Press Enter to activate selected tab
4. Search matches are highlighted in yellow

### JSON Output Configuration

1. Right-click the extension icon
2. Select "Options"
3. Enable JSON output if needed
4. Set update interval
5. Configure server URL
6. Save changes

## Permissions

The extension requests the following permissions:

- 'activeTab': Required to interact with the currently active tab
- 'favicon': Required to fetch and display tab favicons
- 'storage': Required to store and retrieve tab information
- 'tabs': Required to query and manage open tabs

## Contributing

Contributions to the Tab List Chrome Extension are welcome! Feel free to fork this repository, make improvements, and submit pull requests.

## License

This project is licensed under the MIT License.

Extension icon by [icons8](https://icons8.com/)

## Acknowledgements

The Tab List Chrome Extension was inspired by the need for a simple way to manage and visualize open tabs within a Chrome window for troubleshooting Chrome Extension projects.
