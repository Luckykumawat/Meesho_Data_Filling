/*
 * ============================================================
 * GOOGLE APPS SCRIPT - MEESHO DATA FETCHER
 * ============================================================
 * Deploy this code as a Web App to serve data from Google Sheets
 * 
 * Sheet Structure Expected:
 * Column A: Marke No (unique numeric ID)
 * Column B: Product Name
 * Column C: Variation/Size
 * Column D: Meesho Price
 * Column E: GST %
 * Column F: HSN ID
 * Column G: Net Weight
 * Column H: SKU ID
 * Column I: Brand Name
 * Column J: Color
 * Column K: Material
 * ============================================================
 */

// ============================================================================
// CONFIG SECTION
// ============================================================================

const CONFIG = {
  SHEET_NAME: 'Sheet1',           // Change if your sheet has a different name
  HEADER_ROW: 1,                  // Row containing column headers
  DATA_START_ROW: 2,              // Row where data starts
  MARKE_COLUMN: 1,                // Column A (Marke No)
  
  // Column mapping (Column Index -> Field Name)
  COLUMN_MAPPING: {
    1: 'marke_no',
    2: 'product_name',
    3: 'variation_size',
    4: 'meesho_price',
    5: 'gst_percent',
    6: 'hsn_id',
    7: 'net_weight',
    8: 'sku_id',
    9: 'brand_name',
    10: 'color',
    11: 'material'
  }
};

// ============================================================================
// MAIN ENTRY POINT - WEB APP DOGET
// ============================================================================

/**
 * Main entry point for Web App GET requests
 * Expected URL parameter: ?marke=NUMBER
 * 
 * @param {Object} e - Event object containing URL parameters
 * @returns {TextOutput} JSON response
 */
function doGet(e) {
  Logger.log('========================================');
  Logger.log('REQUEST RECEIVED AT: ' + new Date().toISOString());
  Logger.log('========================================');
  Logger.log('Raw parameters: ' + JSON.stringify(e.parameter));
  
  try {
    // Step 1: Validate input parameters
    Logger.log('STEP 1: Validating input parameters...');
    const markeNumber = validateAndExtractMarkeNumber(e);
    Logger.log('Marke number validated: ' + markeNumber);
    
    // Step 2: Get active spreadsheet
    Logger.log('STEP 2: Accessing Google Sheet...');
    const sheet = getActiveSheet();
    Logger.log('Sheet accessed successfully: ' + sheet.getName());
    
    // Step 3: Find row by Marke number
    Logger.log('STEP 3: Searching for Marke number in sheet...');
    const rowData = findRowByMarkeNumber(sheet, markeNumber);
    
    if (!rowData) {
      Logger.log('ERROR: Marke number not found in sheet');
      return createErrorResponse('NOT_FOUND', 'Marke number ' + markeNumber + ' not found in sheet');
    }
    
    Logger.log('Row found at index: ' + rowData.rowIndex);
    
    // Step 4: Format data as structured object
    Logger.log('STEP 4: Formatting data...');
    const formattedData = formatRowData(rowData.values);
    Logger.log('Data formatted: ' + JSON.stringify(formattedData));
    
    // Step 5: Return success response
    Logger.log('STEP 5: Returning success response');
    Logger.log('========================================');
    
    return createSuccessResponse(formattedData);
    
  } catch (error) {
    Logger.log('CRITICAL ERROR: ' + error.message);
    Logger.log('Stack trace: ' + error.stack);
    Logger.log('========================================');
    
    return createErrorResponse('INTERNAL_ERROR', error.message);
  }
}

// ============================================================================
// VALIDATION MODULE
// ============================================================================

/**
 * Validates and extracts the Marke number from request parameters
 * @param {Object} e - Event object
 * @returns {number} Validated Marke number
 * @throws {Error} If validation fails
 */
function validateAndExtractMarkeNumber(e) {
  if (!e || !e.parameter) {
    throw new Error('No parameters provided. Expected: ?marke=NUMBER');
  }
  
  const markeParam = e.parameter.marke;
  
  if (!markeParam) {
    throw new Error('Missing "marke" parameter. Expected: ?marke=NUMBER');
  }
  
  const markeNumber = parseInt(markeParam, 10);
  
  if (isNaN(markeNumber)) {
    throw new Error('Invalid Marke number. Must be a valid integer. Received: ' + markeParam);
  }
  
  if (markeNumber <= 0) {
    throw new Error('Marke number must be positive. Received: ' + markeNumber);
  }
  
  return markeNumber;
}

// ============================================================================
// SHEET ACCESS MODULE
// ============================================================================

/**
 * Gets the active sheet from the spreadsheet
 * @returns {Sheet} Google Sheet object
 * @throws {Error} If sheet cannot be accessed
 */
function getActiveSheet() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    if (!spreadsheet) {
      throw new Error('No active spreadsheet found. Please open a Google Sheet.');
    }
    
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Sheet "' + CONFIG.SHEET_NAME + '" not found. Available sheets: ' + 
        spreadsheet.getSheets().map(s => s.getName()).join(', '));
    }
    
    return sheet;
    
  } catch (error) {
    throw new Error('Failed to access sheet: ' + error.message);
  }
}

// ============================================================================
// SEARCH MODULE
// ============================================================================

/**
 * Finds a row by Marke number in the sheet
 * @param {Sheet} sheet - Google Sheet object
 * @param {number} markeNumber - Marke number to search for
 * @returns {Object|null} Object with rowIndex and values, or null if not found
 */
function findRowByMarkeNumber(sheet, markeNumber) {
  try {
    // Get all data from the Marke column
    const lastRow = sheet.getLastRow();
    
    if (lastRow < CONFIG.DATA_START_ROW) {
      Logger.log('Sheet is empty (no data rows)');
      return null;
    }
    
    // Get all values from Marke column (A)
    const markeColumnRange = sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.MARKE_COLUMN, lastRow - CONFIG.DATA_START_ROW + 1, 1);
    const markeValues = markeColumnRange.getValues();
    
    Logger.log('Searching through ' + markeValues.length + ' rows...');
    
    // Search for matching Marke number
    for (let i = 0; i < markeValues.length; i++) {
      const cellValue = markeValues[i][0];
      
      // Handle both numeric and string comparisons
      const cellNum = parseInt(cellValue, 10);
      
      if (!isNaN(cellNum) && cellNum === markeNumber) {
        const rowIndex = CONFIG.DATA_START_ROW + i;
        Logger.log('Match found at row: ' + rowIndex);
        
        // Get all values from this row
        const rowRange = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn());
        const rowValues = rowRange.getValues()[0];
        
        return {
          rowIndex: rowIndex,
          values: rowValues
        };
      }
    }
    
    Logger.log('No match found for Marke number: ' + markeNumber);
    return null;
    
  } catch (error) {
    throw new Error('Error searching for Marke number: ' + error.message);
  }
}

// ============================================================================
// DATA FORMATTING MODULE
// ============================================================================

/**
 * Formats raw row values into structured object
 * @param {Array} rowValues - Array of cell values from the row
 * @returns {Object} Structured data object with field names
 */
function formatRowData(rowValues) {
  const formattedData = {};
  
  // Map each column to its field name
  for (let colIndex in CONFIG.COLUMN_MAPPING) {
    const fieldName = CONFIG.COLUMN_MAPPING[colIndex];
    const value = rowValues[colIndex - 1]; // Array is 0-indexed, columns are 1-indexed
    
    // Handle empty values
    if (value === '' || value === null || value === undefined) {
      formattedData[fieldName] = null;
    } else {
      formattedData[fieldName] = value;
    }
  }
  
  return formattedData;
}

// ============================================================================
// RESPONSE BUILDER MODULE
// ============================================================================

/**
 * Creates a successful JSON response
 * @param {Object} data - Data to include in response
 * @returns {TextOutput} JSON response
 */
function createSuccessResponse(data) {
  const response = {
    success: true,
    timestamp: new Date().toISOString(),
    data: data
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

/**
 * Creates an error JSON response
 * @param {string} errorCode - Error code for client handling
 * @param {string} message - Human-readable error message
 * @returns {TextOutput} JSON response
 */
function createErrorResponse(errorCode, message) {
  const response = {
    success: false,
    timestamp: new Date().toISOString(),
    error: {
      code: errorCode,
      message: message
    }
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

// ============================================================================
// TEST FUNCTIONS (for debugging in Apps Script editor)
// ============================================================================

/**
 * Test function - Run this to verify the script works
 * Simulates a request with marke=1
 */
function testDoGet() {
  const mockEvent = {
    parameter: {
      marke: '1'
    }
  };
  
  Logger.log('Running test with marke=1...');
  const result = doGet(mockEvent);
  Logger.log('Test result: ' + result.getContent());
}

/**
 * Test function - Tests error handling for missing parameter
 */
function testMissingParameter() {
  const mockEvent = {
    parameter: {}
  };
  
  Logger.log('Running test with missing parameter...');
  const result = doGet(mockEvent);
  Logger.log('Test result: ' + result.getContent());
}

/**
 * Test function - Tests error handling for invalid Marke number
 */
function testInvalidMarke() {
  const mockEvent = {
    parameter: {
      marke: 'abc'
    }
  };
  
  Logger.log('Running test with invalid marke...');
  const result = doGet(mockEvent);
  Logger.log('Test result: ' + result.getContent());
}

/**
 * Test function - Lists all sheets in the active spreadsheet
 */
function listAllSheets() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = spreadsheet.getSheets();
  
  Logger.log('Available sheets:');
  sheets.forEach(sheet => {
    Logger.log('- ' + sheet.getName() + ' (Rows: ' + sheet.getLastRow() + ')');
  });
}
