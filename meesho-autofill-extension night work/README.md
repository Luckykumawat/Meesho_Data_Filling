# Meesho Supplier Panel Auto-Fill Chrome Extension

A semi-automation Chrome Extension that auto-fills Meesho supplier panel forms by fetching data from Google Sheets using a unique "Marke Number".

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [File Structure](#file-structure)
4. [Deployment Instructions](#deployment-instructions)
5. [Configuration](#configuration)
6. [Debugging Guide](#debugging-guide)
7. [Common Errors & Solutions](#common-errors--solutions)
8. [Field Mapping Reference](#field-mapping-reference)

---

## 🎯 Project Overview

### Workflow
1. **Manual**: Upload product images in Meesho supplier panel
2. **Extension**: Enter "Marke Number" in extension popup
3. **Auto**: Extension fetches data from Google Sheets
4. **Auto**: Extension fills form fields
5. **Manual**: Review and submit the form

### Features
- ✅ Modular, debuggable code structure
- ✅ Comprehensive console logging at every step
- ✅ Error handling for all failure scenarios
- ✅ Support for MUI dropdowns
- ✅ Skip missing fields silently with warnings
- ✅ Alert for missing required data

---

## 🏗️ System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Google Sheet   │────▶│ Google Apps Script│────▶│ Chrome Extension│
│  (Data Source)  │     │   (Web App API)   │     │  (Auto-Filler)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │  Meesho Panel   │
                                                  │  (Form Fill)    │
                                                  └─────────────────┘
```

---

## 📁 File Structure

```
meesho-autofill-extension/
│
├── manifest.json          # Extension manifest (V3)
├── popup.html             # Popup UI
├── popup.js               # Popup logic
├── background.js          # Service worker for API calls
├── content.js             # Form filling logic
├── options.html           # Settings page
├── options.js             # Settings logic
├── google-apps-script.gs  # Google Apps Script code
├── README.md              # This file
│
└── icons/
    ├── icon16.png         # Extension icon (16x16)
    ├── icon48.png         # Extension icon (48x48)
    └── icon128.png        # Extension icon (128x128)
```

---

## 🚀 Deployment Instructions

### Step 1: Set Up Google Sheet

1. Create a new Google Sheet
2. Add headers in Row 1:

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| marke_no | product_name | variation_size | meesho_price | gst_percent | hsn_id | net_weight | sku_id | brand_name | color | material |

3. Add your data starting from Row 2

### Step 2: Deploy Google Apps Script

1. Open your Google Sheet
2. Click **Extensions** → **Apps Script**
3. Delete the default `myFunction()` code
4. Copy and paste the entire code from `google-apps-script.gs`
5. Click **Save** (disk icon) or press `Ctrl+S`
6. Click **Deploy** → **New deployment**
7. Click the gear icon ⚙️ and select **Web app**
8. Configure:
   - **Description**: `Meesho Data API v1`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
9. Click **Deploy**
10. Authorize the script (click through permissions)
11. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/XXXXXXXX/exec`)

### Step 3: Load Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `meesho-autofill-extension` folder
5. The extension should now appear in your extensions list

### Step 4: Configure Extension

1. Right-click the extension icon → **Options**
2. Paste your Google Apps Script Web App URL
3. Click **Save Settings**

### Step 5: Test the Setup

1. Navigate to Meesho Supplier Panel product listing page
2. Upload product images (manual step)
3. Click the extension icon
4. Enter a valid Marke Number
5. Click **Fetch & Fill Data**
6. Check console logs for debugging info

---

## ⚙️ Configuration

### Field Mapping

Edit `CONTENT_CONFIG.FIELD_MAPPING` in `content.js` to match your form:

```javascript
FIELD_MAPPING: {
  'product_name': 'productName',    // Sheet column → Form field name
  'variation_size': 'size',
  'meesho_price': 'price',
  'gst_percent': 'gstPercentage',
  'hsn_id': 'hsnCode',
  'net_weight': 'weight',
  'sku_id': 'skuId',
  'brand_name': 'brand',
  'color': 'color',
  'material': 'material'
}
```

### Finding Form Field Names

To find the correct `name` attribute for Meesho form fields:

1. Open Meesho Supplier Panel
2. Right-click on a form field → **Inspect**
3. Look for the `name` attribute in the `<input>` element
4. Update the mapping in `content.js`

### Dropdown Configuration

Add field names to `DROPDOWN_FIELDS` array if they are MUI dropdowns:

```javascript
DROPDOWN_FIELDS: ['brand', 'color', 'material', 'size', 'gstPercentage']
```

---

## 🐛 Debugging Guide

### Enable Debug Mode

All debug settings are in the `CONFIG` sections of each file:

```javascript
const CONFIG = {
  DEBUG_MODE: true  // Set to false for production
};
```

### View Console Logs

1. **Popup logs**: 
   - Right-click extension icon → **Inspect popup**
   - Check Console tab

2. **Background logs**:
   - Go to `chrome://extensions/`
   - Find your extension → Click **service worker** link
   - Check Console tab

3. **Content script logs**:
   - Navigate to Meesho panel
   - Press `F12` → Console tab
   - Look for `[CONTENT]` prefixed logs

### Log Prefix Reference

| Prefix | Source |
|--------|--------|
| `[POPUP]` | popup.js |
| `[BACKGROUND]` | background.js |
| `[CONTENT]` | content.js |
| `[OPTIONS]` | options.js |

### Debugging Checklist

#### Extension Not Loading
- [ ] Developer mode enabled in `chrome://extensions/`
- [ ] Correct folder selected when loading unpacked
- [ ] `manifest.json` is valid JSON (check for syntax errors)
- [ ] All referenced files exist

#### API Not Responding
- [ ] Web App URL is correctly copied (no extra spaces)
- [ ] Apps Script deployment is active (not archived)
- [ ] "Who has access" is set to "Anyone"
- [ ] Check Apps Script logs (View → Executions)

#### Form Not Filling
- [ ] On correct Meesho supplier panel page
- [ ] Form fields are visible (not collapsed)
- [ ] Field names in mapping match actual form
- [ ] Check content script console for errors

#### Dropdown Not Selecting
- [ ] Field is in `DROPDOWN_FIELDS` array
- [ ] Dropdown value exists in the options
- [ ] Increase `DROPDOWN_DELAY` if needed

---

## ❌ Common Errors & Solutions

### Error: "API URL not configured"
**Solution**: Go to extension options and enter your Web App URL

### Error: "Marke number not found in sheet"
**Solution**: 
- Check that the Marke number exists in Column A
- Verify data type (should be number, not text)
- Check Apps Script logs for search details

### Error: "Network error"
**Solution**:
- Check internet connection
- Verify Web App URL is correct
- Ensure Apps Script is deployed and accessible

### Error: "Field not found"
**Solution**:
- Inspect the form field to get correct `name` attribute
- Update `FIELD_MAPPING` in `content.js`
- Check if field is inside an iframe

### Error: "Option not found in dropdown"
**Solution**:
- Verify the value in Google Sheet matches dropdown options exactly
- Check for extra spaces in sheet data
- Try partial matching in `fillDropdown()` function

### Error: "Request timed out"
**Solution**:
- Check internet connection
- Increase `REQUEST_TIMEOUT` in `background.js`
- Verify Apps Script is responding

### Dropdown Opens But Doesn't Select
**Solution**:
- Increase `DROPDOWN_DELAY` to 1000ms or more
- Check if dropdown uses different HTML structure
- Modify selector in `fillDropdown()` function

---

## 📊 Field Mapping Reference

### Google Sheet Columns

| Column | Field Name | Description |
|--------|------------|-------------|
| A | marke_no | Unique identifier (1, 2, 3...) |
| B | product_name | Product name/title |
| C | variation_size | Size variant |
| D | meesho_price | Selling price |
| E | gst_percent | GST percentage |
| F | hsn_id | HSN code |
| G | net_weight | Product weight |
| H | sku_id | SKU identifier |
| I | brand_name | Brand name |
| J | color | Product color |
| K | material | Product material |

### Response JSON Format

```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "marke_no": 1,
    "product_name": "Cotton T-Shirt",
    "variation_size": "M",
    "meesho_price": 299,
    "gst_percent": 5,
    "hsn_id": "61091000",
    "net_weight": 200,
    "sku_id": "TS-M-BLU-001",
    "brand_name": "MyBrand",
    "color": "Blue",
    "material": "Cotton"
  }
}
```

---

## 🔧 Customization

### Adding New Fields

1. Add column to Google Sheet
2. Add to `COLUMN_MAPPING` in Apps Script
3. Add to `FIELD_MAPPING` in `content.js`
4. Specify if it's a dropdown in `DROPDOWN_FIELDS`

### Changing Dropdown Delay

In `content.js`:
```javascript
const CONTENT_CONFIG = {
  DROPDOWN_DELAY: 1000  // Increase if dropdown is slow
};
```

### Handling Special Input Types

For custom input types, add a handler in `content.js`:

```javascript
async function fillCustomField(fieldName, value) {
  // Your custom logic here
}
```

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-15 | Initial release |

---

## 📞 Support

For issues or questions:
1. Check the [Debugging Guide](#debugging-guide)
2. Review [Common Errors](#common-errors--solutions)
3. Check console logs for specific error messages
4. Verify all configuration steps

---

## 📄 License

This project is for personal/educational use. Modify as needed for your requirements.
