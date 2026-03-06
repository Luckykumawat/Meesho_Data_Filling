# Debugging Checklist - Quick Reference

## 🔴 Critical Checks

### Extension Won't Load
```
□ Developer mode enabled (chrome://extensions/)
□ Correct folder selected
□ manifest.json is valid (use JSON validator)
□ All files exist in folder
```

### API Not Working
```
□ Web App URL copied correctly (no spaces)
□ Apps Script deployed (not just saved)
□ "Who has access" = "Anyone"
□ Apps Script logs show execution (View → Executions)
```

### Form Not Filling
```
□ On Meesho supplier panel page
□ Form fields are visible
□ Field names match in content.js mapping
□ Content script injected (check console for [CONTENT] logs)
```

---

## 📋 Step-by-Step Debug Process

### Step 1: Test Apps Script Directly
Open browser and visit:
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?marke=1
```

**Expected**: JSON response with data or "not found" error

### Step 2: Test Extension Popup
1. Right-click extension icon → **Inspect popup**
2. Check Console for `[POPUP]` logs
3. Click **Fetch & Fill** and watch logs

### Step 3: Test Background Script
1. Go to `chrome://extensions/`
2. Click **service worker** link
3. Check Console for `[BACKGROUND]` logs

### Step 4: Test Content Script
1. Navigate to Meesho panel
2. Press `F12` → Console
3. Look for `[CONTENT]` logs
4. Run in console: 
   ```javascript
   chrome.runtime.sendMessage({action: 'PING'})
   ```

---

## 🐛 Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `NOT_FOUND` | Marke number not in sheet | Add data to sheet or check number |
| `INVALID_INPUT` | Bad input to background | Check marke number format |
| `FETCH_ERROR` | Network/API error | Check URL and connection |
| `INVALID_DATA` | Bad response from API | Check Apps Script logs |
| `MISSING_MARKE_NO` | Response missing ID | Check sheet structure |
| `FILL_ERROR` | Form fill failed | Check field names and visibility |
| `UNKNOWN_ACTION` | Wrong message action | Check action names match |

---

## 🔍 Console Log Prefixes

Look for these in respective consoles:

| Console | Prefix | How to Open |
|---------|--------|-------------|
| Popup | `[POPUP]` | Right-click icon → Inspect popup |
| Background | `[BACKGROUND]` | chrome://extensions/ → service worker |
| Content | `[CONTENT]` | F12 on Meesho page |
| Options | `[OPTIONS]` | Right-click icon → Options |

---

## 🛠️ Quick Fixes

### Dropdown Not Selecting
```javascript
// In content.js, increase delay:
DROPDOWN_DELAY: 1000  // was 500
```

### Field Not Found
```javascript
// Add partial matching in findFieldByName()
if (input.name.includes(fieldName)) {
  return input;
}
```

### API Timeout
```javascript
// In background.js, increase timeout:
REQUEST_TIMEOUT: 60000  // was 30000
```

---

## 📊 Test Data Format

### Google Sheet Row
```
A: 1
B: Test Product
C: M
D: 299
E: 5
F: 61091000
G: 200
H: SKU-001
I: MyBrand
J: Blue
K: Cotton
```

### Expected API Response
```json
{
  "success": true,
  "data": {
    "marke_no": 1,
    "product_name": "Test Product",
    "variation_size": "M",
    "meesho_price": 299,
    "gst_percent": 5,
    "hsn_id": "61091000",
    "net_weight": 200,
    "sku_id": "SKU-001",
    "brand_name": "MyBrand",
    "color": "Blue",
    "material": "Cotton"
  }
}
```

---

## ✅ Success Indicators

### Apps Script Working
- [ ] Direct URL visit returns JSON
- [ ] Apps Script logs show execution
- [ ] No authorization errors

### Extension Working
- [ ] Popup opens without errors
- [ ] Background script console shows logs
- [ ] Content script console shows `[CONTENT] INITIALIZED`

### Form Filling Working
- [ ] Clicking Fetch shows loading status
- [ ] Console shows field-by-field filling
- [ ] Form fields get populated
- [ ] Success message appears

---

## 🚨 Emergency Reset

If nothing works:
1. Remove extension from Chrome
2. Reload extension folder
3. Re-enter API URL in options
4. Refresh Meesho page
5. Try again with Marke number 1
