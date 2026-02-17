/**
 * ============================================================
 * BACKGROUND.JS - Service Worker for API Calls
 * ============================================================
 * Handles fetching data from Google Apps Script Web App.
 * Runs as a service worker in Manifest V3.
 * ============================================================
 */

// ============================================================================
// CONFIG SECTION
// ============================================================================

console.log("Chrome object:", chrome);
console.log("Chrome storage:", chrome?.storage);


const BACKGROUND_CONFIG = {
  // REPLACE THIS WITH YOUR ACTUAL GOOGLE APPS SCRIPT WEB APP URL
  // Format: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby-If6ufUb0vqoJS6q4_pRqlv60FbpGwWT4Ftb6AJHC47Dp9sGEah5wuiPv2tJatHgb/exec',
  
  REQUEST_TIMEOUT: 30000,  // 30 seconds timeout
  DEBUG_MODE: true
};

// ============================================================================
// DEBUGGING MODULE
// ============================================================================

/**
 * Logs messages with timestamp and prefix
 * @param {string} message - Message to log
 * @param {string} type - Log type: 'info', 'success', 'error', 'warn'
 */
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const fullMessage = `[${timestamp}] [BACKGROUND] ${message}`;
  
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
}

// ============================================================================
// STORAGE MODULE
// ============================================================================

/**
 * Gets the stored API URL or returns default
 * @returns {Promise<string>} API URL
 */
async function getApiUrl() {
  try {
    const result = await chrome.storage.sync.get(['apiUrl']);
    return result.apiUrl || BACKGROUND_CONFIG.APPS_SCRIPT_URL;
  } catch (error) {
    log('Error reading API URL from storage: ' + error.message, 'warn');
    return BACKGROUND_CONFIG.APPS_SCRIPT_URL;
  }
}

// ============================================================================
// FETCH MODULE
// ============================================================================

/**
 * Fetches data from Google Apps Script Web App
 * @param {number} markeNumber - Marke number to search for
 * @returns {Promise<Object>} Response data
 */
async function fetchFromGoogleSheets(markeNumber) {
  log('========================================');
  log('FETCH MODULE: Starting data fetch');
  log('========================================');
  
  // Step 1: Get API URL
  log('Step 1: Getting API URL from storage...');
  const apiUrl = await getApiUrl();
  
  if (!apiUrl || apiUrl.includes('YOUR_SCRIPT_ID')) {
  throw new Error('API URL not configured. Please set your Google Apps Script Web App URL in extension options.');
}

  
  log('API URL configured: ' + apiUrl);
  
  // Step 2: Build request URL
  log('Step 2: Building request URL...');
  const requestUrl = `${apiUrl}?marke=${encodeURIComponent(markeNumber)}`;
  log('Request URL: ' + requestUrl);
  
  // Step 3: Make the fetch request with timeout
  log('Step 3: Sending HTTP GET request...');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      log('Request timeout reached (' + BACKGROUND_CONFIG.REQUEST_TIMEOUT + 'ms)', 'warn');
      controller.abort();
    }, BACKGROUND_CONFIG.REQUEST_TIMEOUT);
    
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    log('HTTP Response received');
    log('Status: ' + response.status + ' ' + response.statusText);
    
    // Step 4: Check response status
    log('Step 4: Checking response status...');
    
    if (!response.ok) {
      throw new Error('HTTP Error: ' + response.status + ' ' + response.statusText);
    }
    
    // Step 5: Parse JSON response
    log('Step 5: Parsing JSON response...');
    const responseData = await response.json();
    log('Response parsed successfully');
    log('Raw response: ' + JSON.stringify(responseData));
    
    // Step 6: Validate response structure
    log('Step 6: Validating response structure...');
    
    if (!responseData || typeof responseData !== 'object') {
      throw new Error('Invalid response format: Expected JSON object');
    }
    
    // Check for API-level errors
    if (responseData.success === false) {
      const errorCode = responseData.error?.code || 'UNKNOWN_ERROR';
      const errorMessage = responseData.error?.message || 'Unknown error from API';
      throw new Error(`[${errorCode}] ${errorMessage}`);
    }
    
    if (!responseData.success || !responseData.data) {
      throw new Error('Invalid response structure: Missing success or data field');
    }
    
    log('Response validation passed', 'success');
    
    // Step 7: Return formatted data
    log('Step 7: Returning formatted data');
    log('========================================');
    
    return {
      success: true,
      data: responseData.data,
      timestamp: responseData.timestamp
    };
    
  } catch (error) {
    log('Fetch failed: ' + error.message, 'error');
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    
    throw error;
  }
}

// ============================================================================
// MESSAGE HANDLER MODULE
// ============================================================================

/**
 * Handles incoming messages from popup or content scripts
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log('========================================');
  log('MESSAGE RECEIVED');
  log('Action: ' + request.action);
  log('From: ' + (sender.tab ? 'Content Script' : 'Popup'));
  log('========================================');
  
  // Handle FETCH_DATA action
  if (request.action === 'FETCH_DATA') {
    log('Processing FETCH_DATA request');
    log('Marke Number: ' + request.markeNumber);
    
    // Validate marke number
    if (!request.markeNumber || typeof request.markeNumber !== 'number') {
      log('Invalid Marke number received', 'error');
      sendResponse({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid Marke number provided'
        }
      });
      return true;
    }
    
    // Fetch data asynchronously
    fetchFromGoogleSheets(request.markeNumber)
      .then(result => {
        log('FETCH_DATA completed successfully', 'success');
        sendResponse(result);
      })
      .catch(error => {
        log('FETCH_DATA failed: ' + error.message, 'error');
        sendResponse({
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: error.message
          }
        });
      });
    
    // Return true to indicate async response
    return true;
  }
  
  // Handle PING action (for testing)
  if (request.action === 'PING') {
    log('PING received - responding with PONG');
    sendResponse({ success: true, message: 'PONG' });
    return false;
  }
  
  // Unknown action
  log('Unknown action received: ' + request.action, 'warn');
  sendResponse({
    success: false,
    error: {
      code: 'UNKNOWN_ACTION',
      message: 'Unknown action: ' + request.action
    }
  });
  
  return false;
});

// ============================================================================
// SERVICE WORKER LIFECYCLE
// ============================================================================

/**
 * Initialize service worker
 */
self.addEventListener('install', (event) => {
  log('========================================');
  log('SERVICE WORKER INSTALLED');
  log('========================================');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  log('========================================');
  log('SERVICE WORKER ACTIVATED');
  log('========================================');
  event.waitUntil(clients.claim());
});

/**
 * Handle startup
 */
chrome.runtime.onStartup.addListener(() => {
  log('========================================');
  log('EXTENSION STARTUP');
  log('========================================');
});

/**
 * Handle install/update
 */
chrome.runtime.onInstalled.addListener((details) => {
  log('========================================');
  log('EXTENSION INSTALLED/UPDATED');
  log('Reason: ' + details.reason);
  log('Previous version: ' + (details.previousVersion || 'N/A'));
  log('========================================');
  
  // Show notification on install
  if (details.reason === 'install') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Meesho Auto-Fill Installed',
      message: 'Please configure your Google Apps Script URL in extension options.'
    });
  }
});

// ============================================================================
// ERROR HANDLER MODULE
// ============================================================================

/**
 * Global error handler
 */
self.onerror = function(message, source, lineno, colno, error) {
  log('UNCAUGHT ERROR: ' + message + ' at line ' + lineno, 'error');
  return false;
};

/**
 * Handle unhandled promise rejections
 */
self.addEventListener('unhandledrejection', (event) => {
  log('UNHANDLED PROMISE REJECTION: ' + event.reason, 'error');
});

log('========================================');
log('BACKGROUND SCRIPT LOADED');
log('========================================');
