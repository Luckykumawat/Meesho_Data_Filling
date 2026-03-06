/**
 * ============================================================
 * OPTIONS.JS - Extension Settings Page
 * ============================================================
 */

let elements = {};

// ============================================================================
// DEBUGGING MODULE
// ============================================================================

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const fullMessage = `[${timestamp}] [OPTIONS] ${message}`;

  switch (type) {
    case 'error':
      console.error(fullMessage);
      break;
    case 'success':
      console.log('%c' + fullMessage, 'color: green; font-weight: bold;');
      break;
    default:
      console.log(fullMessage);
  }
}

// ============================================================================
// STORAGE MODULE
// ============================================================================

async function loadSettings() {
  log('Loading settings...');

  try {
    const result = await chrome.storage.sync.get(['apiUrl']);

    if (result.apiUrl) {
      elements.apiUrlInput.value = result.apiUrl;
      log('Settings loaded successfully');
    } else {
      log('No saved settings found');
    }
  } catch (error) {
    log('Error loading settings: ' + error.message, 'error');
  }
}

async function saveSettings() {
  log('Saving settings...');

  const apiUrl = elements.apiUrlInput.value.trim();

  if (!apiUrl) {
    showStatus('Please enter a valid URL', 'error');
    return;
  }

  if (!apiUrl.startsWith('https://script.google.com/')) {
    showStatus('URL must be a valid Google Apps Script Web App URL', 'error');
    return;
  }

  try {
    await chrome.storage.sync.set({ apiUrl: apiUrl });
    log('Settings saved successfully', 'success');
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    log('Error saving settings: ' + error.message, 'error');
    showStatus('Error saving settings: ' + error.message, 'error');
  }
}

// ============================================================================
// UI MODULE
// ============================================================================

function showStatus(message, type) {
  elements.statusDiv.textContent = message;
  elements.statusDiv.className = 'status ' + type;

  setTimeout(() => {
    elements.statusDiv.className = 'status';
  }, 3000);
}

// ============================================================================
// INITIALIZE AFTER DOM LOAD
// ============================================================================

document.addEventListener('DOMContentLoaded', function () {

  // ✅ DOM elements yaha initialize kar rahe hain
  elements = {
    apiUrlInput: document.getElementById('apiUrl'),
    saveButton: document.getElementById('btnSave'),
    statusDiv: document.getElementById('status')
  };

  log('Options page loaded');

  loadSettings();

  elements.saveButton.addEventListener('click', saveSettings);
});
