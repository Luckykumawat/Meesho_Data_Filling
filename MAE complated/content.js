// /**
//  * ============================================================
//  * CONTENT.JS - Stable Meesho Auto Fill Version
//  * ============================================================
//  */

// const CONTENT_CONFIG = {
//   DEBUG_MODE: true,
//   FIELD_DELAY: 600,

//  FIELD_MAPPING: {
//   'Product Name': 'product_name',

//   'GST %': 'supplier_gst_percent',
//   'HSN ID': 'hsn_code',

//   'Variation': 'size',

//   'Compatible Models': 'compatible_models',
//   'Generic Name': 'generic_name',
//   'Net Quantity (N)': 'multipack',
//   'Theme': 'theme',
//   'Type': 'type',
//   'Country of Origin': 'country_of_origin',

//   'Manufacturer Name': 'manufacturer_name',
//   'Manufacturer Address': 'manufacturer_address',
//   'Manufacturer Pincode': 'manufacturer_pincode',

//   'Packer Name': 'packer_name',
//   'Packer Address': 'packer_address',
//   'Packer Pincode': 'packer_pincode',

//   'Importer Name': 'importer_name',   // ⚠️ read note below
//   'Importer Address': 'importer_address',
//   'Importer Pincode': 'importer_pincode',

//   'Net Weight (gms)': 'weight',

//   'Product Length (cm)': 'product_length_(cm)',
//   'Product Width(cm)': 'product_width_(cm)',

//   'Color': 'color',
//   'Material': 'material'
// }
// ,

//   DROPDOWN_FIELDS: [
//   'supplier_gst_percent',
//   'hsn_code',
//   'color'
// ]
// };

// // ============================================================
// // LOGGER
// // ============================================================

// function log(message, type = 'info') {
//   if (!CONTENT_CONFIG.DEBUG_MODE) return;

//   const time = new Date().toLocaleTimeString();
//   const msg = `[${time}] [CONTENT] ${message}`;

//   if (type === 'error') console.error(msg);
//   else if (type === 'warn') console.warn(msg);
//   else if (type === 'success') console.log('%c' + msg, 'color:green;font-weight:bold;');
//   else console.log(msg);
// }

// // ============================================================
// // UTILS
// // ============================================================

// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

// function dispatchReactInput(element, value) {
//   const nativeSetter = Object.getOwnPropertyDescriptor(
//     window.HTMLInputElement.prototype,
//     "value"
//   ).set;

//   nativeSetter.call(element, value);
//   element.dispatchEvent(new Event("input", { bubbles: true }));
//   element.dispatchEvent(new Event("change", { bubbles: true }));
// }

// // ============================================================
// // FIELD FINDER
// // ============================================================

// function findFieldByName(fieldName) {
//   let field = document.querySelector(`input[name="${fieldName}"]`);
//   if (field) return field;

//   field = document.querySelector(`textarea[name="${fieldName}"]`);
//   if (field) return field;

//   field = document.querySelector(`select[name="${fieldName}"]`);
//   if (field) return field;

//   // partial match
//   const allInputs = document.querySelectorAll('input');
//   for (const input of allInputs) {
//     if (input.name && input.name.includes(fieldName)) {
//       return input;
//     }
//   }

//   return null;
// }

// // ============================================================
// // NORMAL INPUT HANDLER
// // ============================================================

// function fillNormalInput(fieldName, value) {
//   const field = findFieldByName(fieldName);
//   if (!field) {
//     log(`Field not found: ${fieldName}`, 'warn');
//     return { success: false, skipped: true };
//   }

//   try {
//     dispatchReactInput(field, value);
//     log(`Filled input: ${fieldName}`, 'success');
//     return { success: true };
//   } catch (err) {
//     log(`Input error: ${err.message}`, 'error');
//     return { success: false, error: err.message };
//   }
// }

// // ============================================================
// // MUI DROPDOWN HANDLER (STABLE)
// // ============================================================

// // ============================================================
// // MUI DROPDOWN HANDLER (CLICK BASED - STABLE)
// // ============================================================

// async function fillDropdown(fieldName, value) {
//   const field = findFieldByName(fieldName);

//   if (!field) {
//     log(`Dropdown not found: ${fieldName}`, 'warn');
//     return { success: false, skipped: true };
//   }

//   try {
//     document.body.click();
//     await sleep(300);

//     // 1️⃣ Open dropdown
//     field.click();
//     field.focus();
//     await sleep(800); // wait for MUI menu to render

//     // 2️⃣ Find listbox
//     const listbox = document.querySelector('ul[role="listbox"]');

//     if (!listbox) {
//       log(`Listbox not found for ${fieldName}`, 'warn');
//       return { success: false };
//     }

//     const options = Array.from(listbox.querySelectorAll("li"));

//     // 3️⃣ Match option text
//     const match = options.find(option =>
//       option.innerText.trim().toLowerCase() === String(value).trim().toLowerCase()
//     );

//     if (!match) {
//       log(`Option not found: ${value}`, 'warn');
//       return { success: false };
//     }

//     // 4️⃣ Click option
//     match.click();
//     await sleep(500);

//     log(`Dropdown selected: ${value}`, 'success');
//     return { success: true };

//   } catch (err) {
//     log(`Dropdown error: ${err.message}`, 'error');
//     return { success: false, error: err.message };
//   }
// }

// // ============================================================
// // MAIN FORM FILL
// // ============================================================

// async function fillForm(data) {
//   log("=================================");
//   log("FORM FILL STARTED");
//   log("=================================");

//   const results = {
//     success: true,
//     errors: []
//   };

//   for (const [sheetField, formField] of Object.entries(CONTENT_CONFIG.FIELD_MAPPING)) {
//     const value = data[sheetField];

//     if (!value) continue;

//     let result;

//     if (CONTENT_CONFIG.DROPDOWN_FIELDS.includes(formField)) {
//       result = await fillDropdown(formField, value);
//     } else {
//       result = fillNormalInput(formField, value);
//     }

//     if (!result.success && !result.skipped) {
//       results.errors.push({ field: formField });
//     }

//     await sleep(CONTENT_CONFIG.FIELD_DELAY);
//   }

//   results.success = results.errors.length === 0;

//   log("=================================");
//   log("FORM FILL COMPLETED");
//   log("=================================");

//   return results;
// }

// // ============================================================
// // MESSAGE LISTENER
// // ============================================================

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

//   if (request.action === 'FILL_FORM') {

//     fillForm(request.data)
//       .then(results => {
//         sendResponse({
//           success: results.success,
//           data: results
//         });
//       })
//       .catch(error => {
//         sendResponse({
//           success: false,
//           error: error.message
//         });
//       });

//     return true;
//   }

//   if (request.action === 'PING') {
//     sendResponse({ success: true });
//     return false;
//   }
// });

// // ============================================================
// // INIT
// // ============================================================

// log("CONTENT SCRIPT LOADED");


/**
 * ============================================================
 * CONTENT.JS - Form Auto-Filling Script
 * ============================================================
 * Injected into Meesho supplier panel pages.
 * Handles auto-filling form fields with data from Google Sheets.
 * Supports both regular inputs and MUI dropdowns.
 * ============================================================
 */

// ============================================================================
// CONFIG SECTION
// ============================================================================

const CONTENT_CONFIG = {
  DEBUG_MODE: true,
  DROPDOWN_DELAY: 500,  // Delay before clicking dropdown options (ms)
  FIELD_DELAY: 100,     // Delay between filling fields (ms)

  // Field mapping: sheet field name -> form input name attribute
  // Modify these based on actual Meesho form field names
  FIELD_MAPPING: {
      'Product Name': 'product_name',
    
      'GST %': 'supplier_gst_percent',
      'HSN ID': 'hsn_code',
    
      'Variation': 'size',
    
      'Compatible Models': 'compatible_models',
      'Generic Name': 'generic_name',
      'Net Quantity (N)': 'multipack',
      'Theme': 'theme',
      'Type': 'type',
      'Country of Origin': 'country_of_origin',
    
      'Manufacturer Name': 'manufacturer_name',
      'Manufacturer Address': 'manufacturer_address',
      'Manufacturer Pincode': 'manufacturer_pincode',
    
      'Packer Name': 'packer_name',
      'Packer Address': 'packer_address',
      'Packer Pincode': 'packer_pincode',
    
      'Importer Name': 'importer_name',   // ⚠️ read note below
      'Importer Address': 'importer_address',
      'Importer Pincode': 'importer_pincode',
    
      'Net Weight (gms)': 'weight',
    
      'Product Length (cm)': 'product_length_(cm)',
      'Product Width(cm)': 'product_width_(cm)',
    
      'Color': 'color',
      'Material': 'material'
    }
    ,
    
     


  // Dropdown fields that need special handling
  DROPDOWN_FIELDS: [ 'color', 'material', 'supplier_gst_percent',
      'hsn_code','generic_name','multipack','theme','type','country_of_origin','size',]
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
  const fullMessage = `[${timestamp}] [CONTENT] ${message}`;

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
// ERROR HANDLER MODULE
// ============================================================================

/**
 * Creates a standardized error object
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @returns {Object} Error object
 */
function createError(code, message) {
  log(`Error created: [${code}] ${message}`, 'error');
  return {
    code: code,
    message: message
  };
}

/**
 * Validates the data object from API
 * @param {Object} data - Data to validate
 * @returns {Object} Validation result
 */
function validateData(data) {
  log('Validating received data...');

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      error: createError('INVALID_DATA', 'Data is null or not an object')
    };
  }

  // Check for marke_no (required field)
  if (!data["Marke"])
 {
    return {
      isValid: false,
      error: createError('MISSING_MARKE_NO', 'Marke number is missing from data')
    };
  }

  log('Data validation passed', 'success');
  return {
    isValid: true,
    data: data
  };
}

// ============================================================================
// UTILITY MODULE
// ============================================================================

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Dispatches input and change events on an element
 * @param {HTMLElement} element - Element to dispatch events on
 */
function dispatchInputEvents(element) {
  log('Dispatching input and change events');

  // Input event
  const inputEvent = new Event('input', {
    bubbles: true,
    cancelable: true
  });
  element.dispatchEvent(inputEvent);

  // Change event
  const changeEvent = new Event('change', {
    bubbles: true,
    cancelable: true
  });
  element.dispatchEvent(changeEvent);

  // Focus and blur to trigger any validation
  element.focus();
  element.blur();
}

// ============================================================================
// FIELD FINDER MODULE
// ============================================================================

/**
 * Finds a form field by its name attribute
 * @param {string} fieldName - Name attribute of the field
 * @returns {HTMLElement|null} The found element or null
 */
function findFieldByName(fieldName) {
  log(`Finding field with name="${fieldName}"`);

  // Try input with exact name match
  let field = document.querySelector(`input[name="${fieldName}"]`);

  if (field) {
    log(`Field found: ${field.tagName}[name="${fieldName}"]`, 'success');
    return field;
  }

  // Try textarea
  field = document.querySelector(`textarea[name="${fieldName}"]`);
  if (field) {
    log(`Field found: ${field.tagName}[name="${fieldName}"]`, 'success');
    return field;
  }

  // Try select
  field = document.querySelector(`select[name="${fieldName}"]`);
  if (field) {
    log(`Field found: ${field.tagName}[name="${fieldName}"]`, 'success');
    return field;
  }

  // Try with partial match (for MUI fields)
  const allInputs = document.querySelectorAll('input');
  for (const input of allInputs) {
    if (input.name && input.name.includes(fieldName)) {
      log(`Field found (partial match): ${input.tagName}[name="${input.name}"]`, 'success');
      return input;
    }
  }

  log(`Field not found: name="${fieldName}"`, 'warn');
  return null;
}

// ============================================================================
// NORMAL INPUT HANDLER MODULE
// ============================================================================

/**
 * Fills a normal text/number input field
 * @param {string} fieldName - Name of the field
 * @param {string|number} value - Value to set
 * @returns {Object} Result object with success status
 */
function fillNormalInput(fieldName, value) {
  log(`Filling normal input: ${fieldName} = "${value}"`);

  const field = findFieldByName(fieldName);

  if (!field) {
    log(`Skipping ${fieldName}: Field not found in form`, 'warn');
    return {
      success: false,
      skipped: true,
      reason: 'Field not found'
    };
  }

  try {
    // Set the value
    field.value = value;

    // Dispatch events to trigger any listeners
    dispatchInputEvents(field);

    log(`Successfully filled: ${fieldName}`, 'success');
    return {
      success: true,
      field: fieldName,
      value: value
    };

  } catch (error) {
    log(`Error filling ${fieldName}: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// DROPDOWN HANDLER MODULE
// ============================================================================

/**
 * Fills a MUI dropdown field
 * @param {string} fieldName - Name of the dropdown field
 * @param {string} value - Value to select
 * @returns {Promise<Object>} Result object with success status
 */
async function fillDropdown(fieldName, value) {
  log(`Filling dropdown: ${fieldName} = "${value}"`);

  const field = findFieldByName(fieldName);

  if (!field) {
    log(`Skipping ${fieldName}: Dropdown field not found`, 'warn');
    return {
      success: false,
      skipped: true,
      reason: 'Field not found'
    };
  }

  try {
    // Step 1: Click the dropdown input to open it
    log(`Step 1: Clicking dropdown input for ${fieldName}`);
    field.click();
    field.focus();

    // Wait for dropdown to open
    log(`Waiting ${CONTENT_CONFIG.DROPDOWN_DELAY}ms for dropdown to open...`);
    await sleep(CONTENT_CONFIG.DROPDOWN_DELAY);

    // Step 2: Find the dropdown list (MUI uses ul > li structure)
    log(`Step 2: Searching for dropdown options...`);

    // Try to find the dropdown list
    let dropdownList = document.querySelector('ul[role="listbox"]');

    if (!dropdownList) {
      // Try alternative selectors
      dropdownList = document.querySelector('.MuiPaper-root ul');
    }

    if (!dropdownList) {
      // Try finding any visible ul with li elements
      const allUls = document.querySelectorAll('ul');
      for (const ul of allUls) {
        if (ul.offsetParent !== null && ul.querySelectorAll('li').length > 0) {
          dropdownList = ul;
          break;
        }
      }
    }

    if (!dropdownList) {
      throw new Error('Dropdown list not found after clicking');
    }

    log('Dropdown list found');

    // Step 3: Find the matching option
    log(`Step 3: Searching for option matching "${value}"...`);

    const options = dropdownList.querySelectorAll('li');
    log(`Found ${options.length} options in dropdown`);

    let matchingOption = null;

    for (const option of options) {
      const optionText = option.textContent.trim().toLowerCase();
      const searchValue = String(value).trim().toLowerCase();

      log(`Checking option: "${optionText}"`);

      if (optionText === searchValue ||
        optionText.includes(searchValue) ||
        searchValue.includes(optionText)) {
        matchingOption = option;
        log(`Match found: "${optionText}"`, 'success');
        break;
      }
    }

    if (!matchingOption) {
      // Close dropdown by pressing Escape
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      throw new Error(`Option "${value}" not found in dropdown`);
    }

    // Step 4: Click the matching option
    log(`Step 4: Clicking matching option...`);
    matchingOption.click();

    // Wait for selection to register
    await sleep(200);

    log(`Successfully selected dropdown: ${fieldName} = "${value}"`, 'success');
    return {
      success: true,
      field: fieldName,
      value: value
    };

  } catch (error) {
    log(`Error filling dropdown ${fieldName}: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// FORM FILL MODULE
// ============================================================================

/**
 * Main function to fill the form with data
 * @param {Object} data - Data from Google Sheets
 * @returns {Promise<Object>} Result with success status and details
 */
async function fillForm(data) {
  log('========================================');
  log('FORM FILL MODULE: Starting form fill');
  log('========================================');

  const results = {
    success: true,
    filled: [],
    skipped: [],
    errors: []
  };

  // Process each field in the mapping
  for (const [sheetField, formField] of Object.entries(CONTENT_CONFIG.FIELD_MAPPING)) {
    const value = data[sheetField];

    // Skip if value is null or empty
    if (value === null || value === undefined || value === '') {
      log(`Skipping ${sheetField}: Value is empty`, 'warn');
      results.skipped.push({
        field: formField,
        reason: 'Empty value in sheet'
      });
      continue;
    }

    log(`Processing field: ${sheetField} -> ${formField}`);

    let result;

    // Check if this is a dropdown field
    if (CONTENT_CONFIG.DROPDOWN_FIELDS.includes(formField)) {
      result = await fillDropdown(formField, value);
    } else {
      result = fillNormalInput(formField, value);
    }

    // Track result
    if (result.success) {
      results.filled.push({
        field: formField,
        value: value
      });
    } else if (result.skipped) {
      results.skipped.push({
        field: formField,
        reason: result.reason || result.error
      });
    } else {
      results.errors.push({
        field: formField,
        error: result.error
      });
    }

    // Small delay between fields
    await sleep(CONTENT_CONFIG.FIELD_DELAY);
  }

  // Determine overall success
  results.success = results.errors.length === 0;

  log('========================================');
  log('FORM FILL COMPLETE');
  log(`Filled: ${results.filled.length} fields`);
  log(`Skipped: ${results.skipped.length} fields`);
  log(`Errors: ${results.errors.length} fields`);
  log('========================================');

  return results;
}

// ============================================================================
// MESSAGE HANDLER MODULE
// ============================================================================

/**
 * Handles incoming messages from background script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log('========================================');
  log('MESSAGE RECEIVED IN CONTENT SCRIPT');
  log('Action: ' + request.action);
  log('========================================');

  // Handle FILL_FORM action
  if (request.action === 'FILL_FORM') {
    log('Processing FILL_FORM request');

    // Step 1: Validate data
    log('Step 1: Validating data...');
    const validation = validateData(request.data);

    if (!validation.isValid) {
      log('Data validation failed', 'error');
      sendResponse({
        success: false,
        error: validation.error
      });
      return false;
    }

    // Step 2: Fill the form (async)
    log('Step 2: Starting form fill process...');
    fillForm(validation.data)
      .then(results => {
        log('Form fill process completed', results.success ? 'success' : 'warn');
        sendResponse({
          success: results.success,
          data: results
        });
      })
      .catch(error => {
        log('Form fill process failed: ' + error.message, 'error');
        sendResponse({
          success: false,
          error: createError('FILL_ERROR', error.message)
        });
      });

    // Return true to indicate async response
    return true;
  }

  // Handle PING action (for testing)
  if (request.action === 'PING') {
    log('PING received - responding with PONG');
    sendResponse({
      success: true,
      message: 'PONG from content script',
      url: window.location.href
    });
    return false;
  }

  // Unknown action
  log('Unknown action received: ' + request.action, 'warn');
  sendResponse({
    success: false,
    error: createError('UNKNOWN_ACTION', 'Unknown action: ' + request.action)
  });

  return false;
});

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize content script
 */
function initialize() {
  log('========================================');
  log('CONTENT SCRIPT INITIALIZED');
  log('URL: ' + window.location.href);
  log('========================================');
}

// Run initialization
initialize();

// ============================================================================
// GLOBAL ERROR HANDLERS
// ============================================================================

window.onerror = function (message, source, lineno, colno, error) {
  log('UNCAUGHT ERROR: ' + message + ' at line ' + lineno, 'error');
  return false;
};

window.addEventListener('unhandledrejection', function (event) {
  log('UNHANDLED PROMISE REJECTION: ' + event.reason, 'error');
});
