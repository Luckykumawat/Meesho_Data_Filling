/**
 * ============================================================
 * CONTENT.JS - Stable Meesho Auto Fill Version
 * ============================================================
 */

const CONTENT_CONFIG = {
  DEBUG_MODE: true,
  FIELD_DELAY: 600,

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

  DROPDOWN_FIELDS: [
  'supplier_gst_percent',
  'hsn_code',
  'size',
  'compatible_models',
  'generic_name',
  'multipack',
  'theme',
  'type',
  'country_of_origin',
  'color',
  'material'
]
};

// ============================================================
// LOGGER
// ============================================================

function log(message, type = 'info') {
  if (!CONTENT_CONFIG.DEBUG_MODE) return;

  const time = new Date().toLocaleTimeString();
  const msg = `[${time}] [CONTENT] ${message}`;

  if (type === 'error') console.error(msg);
  else if (type === 'warn') console.warn(msg);
  else if (type === 'success') console.log('%c' + msg, 'color:green;font-weight:bold;');
  else console.log(msg);
}

// ============================================================
// UTILS
// ============================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function dispatchReactInput(element, value) {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  ).set;

  nativeSetter.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

// ============================================================
// FIELD FINDER
// ============================================================

function findFieldByName(fieldName) {
  let field = document.querySelector(`input[name="${fieldName}"]`);
  if (field) return field;

  field = document.querySelector(`textarea[name="${fieldName}"]`);
  if (field) return field;

  field = document.querySelector(`select[name="${fieldName}"]`);
  if (field) return field;

  // partial match
  const allInputs = document.querySelectorAll('input');
  for (const input of allInputs) {
    if (input.name && input.name.includes(fieldName)) {
      return input;
    }
  }

  return null;
}

// ============================================================
// NORMAL INPUT HANDLER
// ============================================================

function fillNormalInput(fieldName, value) {
  const field = findFieldByName(fieldName);
  if (!field) {
    log(`Field not found: ${fieldName}`, 'warn');
    return { success: false, skipped: true };
  }

  try {
    dispatchReactInput(field, value);
    log(`Filled input: ${fieldName}`, 'success');
    return { success: true };
  } catch (err) {
    log(`Input error: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

// ============================================================
// MUI DROPDOWN HANDLER (STABLE)
// ============================================================

async function fillDropdown(fieldName, value) {
  const field = findFieldByName(fieldName);

  if (!field) {
    log(`Dropdown not found: ${fieldName}`, 'warn');
    return { success: false, skipped: true };
  }

  try {
    document.body.click();
    await sleep(300);

    // Focus field
    field.click();
    field.focus();
    await sleep(300);

    // Clear old value
    field.value = '';
    field.dispatchEvent(new Event('input', { bubbles: true }));

    await sleep(200);

    // Type value
    for (let char of String(value)) {
      field.value += char;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(50);
    }

    await sleep(800); // wait for dropdown filter

    // Press ArrowDown
    field.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      code: 'ArrowDown',
      bubbles: true
    }));

    await sleep(200);

    // Press Enter
    field.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      bubbles: true
    }));

    await sleep(500);

    log(`Dropdown selected via keyboard: ${value}`, 'success');
    return { success: true };

  } catch (err) {
    log(`Dropdown error: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

// ============================================================
// MAIN FORM FILL
// ============================================================

async function fillForm(data) {
  log("=================================");
  log("FORM FILL STARTED");
  log("=================================");

  const results = {
    success: true,
    errors: []
  };

  for (const [sheetField, formField] of Object.entries(CONTENT_CONFIG.FIELD_MAPPING)) {
    const value = data[sheetField];

    if (!value) continue;

    let result;

    if (CONTENT_CONFIG.DROPDOWN_FIELDS.includes(formField)) {
      result = await fillDropdown(formField, value);
    } else {
      result = fillNormalInput(formField, value);
    }

    if (!result.success && !result.skipped) {
      results.errors.push({ field: formField });
    }

    await sleep(CONTENT_CONFIG.FIELD_DELAY);
  }

  results.success = results.errors.length === 0;

  log("=================================");
  log("FORM FILL COMPLETED");
  log("=================================");

  return results;
}

// ============================================================
// MESSAGE LISTENER
// ============================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === 'FILL_FORM') {

    fillForm(request.data)
      .then(results => {
        sendResponse({
          success: results.success,
          data: results
        });
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message
        });
      });

    return true;
  }

  if (request.action === 'PING') {
    sendResponse({ success: true });
    return false;
  }
});

// ============================================================
// INIT
// ============================================================

log("CONTENT SCRIPT LOADED");
