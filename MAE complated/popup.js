/**
 * ============================================================
 * POPUP.JS - Extension Popup Interface
 * ============================================================
 * Handles user input, sends messages to background script,
 * and displays status updates with comprehensive logging.
 * ============================================================
 */

// ============================================================================
// CONFIG SECTION
// ============================================================================

const POPUP_CONFIG = {
  DEBUG_MODE: true,  // Set to false to hide debug logs in production
  // DEFAULT_API_URL: 'https://script.google.com/macros/s/AKfycby-If6ufUb0vqoJS6q4_pRqlv60FbpGwWT4Ftb6AJHC47Dp9sGEah5wuiPv2tJatHgb/exec'
  DEFAULT_API_URL: 'https://script.google.com/macros/s/AKfycbwGKfuY5Fyi-_QYO75LCxQaDtj7Hwkck5lBW3_BxAPhDVfhe_dC_W8rU40oBy4brLVm/exec'
};

// ============================================================================
// DOM ELEMENT REFERENCES
// ============================================================================

const elements = {
  markeInput: document.getElementById('markeNumber'),
  fetchButton: document.getElementById('btnFetch'),
  statusDiv: document.getElementById('status'),
  debugInfo: document.getElementById('debugInfo'),
  settingsLink: document.getElementById('settingsLink')
};

// ============================================================================
// DEBUGGING MODULE
// ============================================================================

/**
 * Logs messages to console and optionally displays in popup
 * @param {string} message - Message to log
 * @param {string} type - Log type: 'info', 'success', 'error', 'warn'
 */
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const fullMessage = `[${timestamp}] [POPUP] ${message}`;
  
  // Console logging
  switch (type) {
    case 'error':
      console.error(fullMessage);
      break;
    case 'warn':
      console.warn(fullMessage);
      break;
    case 'success':
      console.log('%c' + fullMessage, 'color: green; font-weight: bold;');
      break;
    default:
      console.log(fullMessage);
  }
  
  // Visual debug in popup (if enabled)
  if (POPUP_CONFIG.DEBUG_MODE) {
    const debugLine = document.createElement('div');
    debugLine.textContent = fullMessage;
    debugLine.style.color = type === 'error' ? '#d32f2f' : 
                           type === 'success' ? '#388e3c' : '#666';
    elements.debugInfo.appendChild(debugLine);
    elements.debugInfo.classList.add('visible');
    elements.debugInfo.scrollTop = elements.debugInfo.scrollHeight;
  }
}

/**
 * Shows status message in the popup
 * @param {string} message - Status message
 * @param {string} type - Status type: 'loading', 'success', 'error'
 */
function showStatus(message, type) {
  log(`Status update: ${message}`, type);
  elements.statusDiv.textContent = message;
  elements.statusDiv.className = 'status ' + type;
}

/**
 * Clears the status display
 */
function clearStatus() {
  elements.statusDiv.className = 'status';
  elements.statusDiv.textContent = '';
}

// ============================================================================
// INPUT VALIDATION MODULE
// ============================================================================

/**
 * Validates the Marke number input
 * @param {string} value - Input value
 * @returns {Object} Validation result with isValid and message
 */
function validateMarkeNumber(value) {
  log('Validating Marke number input: "' + value + '"');
  
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      message: 'Please enter a Marke Number'
    };
  }
  
  const numValue = parseInt(value.trim(), 10);
  
  if (isNaN(numValue)) {
    return {
      isValid: false,
      message: 'Marke Number must be a valid number'
    };
  }
  
  if (numValue <= 0) {
    return {
      isValid: false,
      message: 'Marke Number must be greater than 0'
    };
  }
  
  log('Validation passed: ' + numValue, 'success');
  return {
    isValid: true,
    value: numValue,
    message: 'Valid'
  };
}

// ============================================================================
// MESSAGE HANDLER MODULE
// ============================================================================

/**
 * Sends message to background script to fetch data
 * @param {number} markeNumber - Marke number to fetch
 */
async function sendFetchRequest(markeNumber) {
  log('Sending FETCH_DATA message to background script for Marke: ' + markeNumber);
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'FETCH_DATA',
      markeNumber: markeNumber
    });
    
    log('Received response from background script', 'success');
    log('Response data: ' + JSON.stringify(response));
    
    return response;
    
  } catch (error) {
    log('Error sending message to background: ' + error.message, 'error');
    throw error;
  }
}

/**
 * Sends message to content script to fill the form
 * @param {Object} data - Data to fill in the form
 */
async function sendFillRequest(data) {
  log('Sending FILL_FORM message to content script');

  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!activeTab) {
    throw new Error('No active tab found');
  }

  if (!activeTab.url.includes('supplier.meesho.com')) {
    throw new Error('Please navigate to the Meesho Supplier Panel first');
  }

  // 🔥 Force inject content script
  await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    files: ['content.js']
  });

  // 🔥 Then send message
  const response = await chrome.tabs.sendMessage(activeTab.id, {
    action: 'FILL_FORM',
    data: data
  });

  return response;
}

// ============================================================================
// MAIN CONTROLLER
// ============================================================================

/**
 * Main function to handle fetch and fill process
 */
async function handleFetchAndFill() {
  log('========================================');
  log('FETCH AND FILL PROCESS STARTED');
  log('========================================');
  
  // Step 1: Get and validate input
  const inputValue = elements.markeInput.value;
  log('Step 1: Input received: "' + inputValue + '"');
  
  const validation = validateMarkeNumber(inputValue);
  
  if (!validation.isValid) {
    log('Validation failed: ' + validation.message, 'error');
    showStatus(validation.message, 'error');
    return;
  }
  
  const markeNumber = validation.value;
  
  // Step 2: Update UI to loading state
  log('Step 2: Setting UI to loading state');
  elements.fetchButton.disabled = true;
  showStatus('Fetching data from Google Sheets...', 'loading');
  
  try {
    // Step 3: Fetch data from background script
    log('Step 3: Fetching data from Google Sheets...');
    const fetchResponse = await sendFetchRequest(markeNumber);
    
    if (!fetchResponse.success) {
      throw new Error(fetchResponse.error?.message || 'Failed to fetch data');
    }
    
    log('Data fetched successfully', 'success');
    
    // Step 4: Send data to content script to fill form
    log('Step 4: Sending data to content script to fill form...');
    showStatus('Filling form fields...', 'loading');
    
    const fillResponse = await sendFillRequest(fetchResponse.data);
    
    if (!fillResponse.success) {
      throw new Error(fillResponse.error?.message || 'Failed to fill form');
    }
    
    // Step 5: Success
    log('Step 5: Form filled successfully!', 'success');
    showStatus('Form filled successfully! Please review and submit.', 'success');
    
  } catch (error) {
    log('Process failed: ' + error.message, 'error');
    showStatus('Error: ' + error.message, 'error');
  } finally {
    // Reset UI
    log('Resetting UI state');
    elements.fetchButton.disabled = false;
    log('========================================');
    log('PROCESS COMPLETED');
    log('========================================');
  }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Initialize popup when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
  log('========================================');
  log('POPUP INITIALIZED');
  log('========================================');
  
  // Focus on input field
  elements.markeInput.focus();
  
  // Fetch button click handler
  elements.fetchButton.addEventListener('click', handleFetchAndFill);
  
  // Enter key handler
  elements.markeInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      handleFetchAndFill();
    }
  });
  
  // Settings link handler
  elements.settingsLink.addEventListener('click', function(event) {
    event.preventDefault();
    alert('To configure the API URL:\n\n1. Right-click the extension icon\n2. Select "Options"\n3. Enter your Google Apps Script Web App URL');
  });
  
  log('Event listeners attached');
});

// ============================================================================
// ERROR HANDLER MODULE
// ============================================================================

/**
 * Global error handler for uncaught errors
 */
window.onerror = function(message, source, lineno, colno, error) {
  log('UNCAUGHT ERROR: ' + message + ' at line ' + lineno, 'error');
  showStatus('An unexpected error occurred. Check console.', 'error');
  return false;
};

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', function(event) {
  log('UNHANDLED PROMISE REJECTION: ' + event.reason, 'error');
  showStatus('An unexpected error occurred. Check console.', 'error');
});
