/**
 * Sheet Service - Uses Service Account for authenticated Sheet access
 * 
 * This allows the bot to access the Sheet without users needing direct access.
 * 
 * SETUP REQUIRED:
 * 1. Create a service account in GCP
 * 2. Generate a JSON key for the service account
 * 3. Share the Sheet with the service account email
 * 4. Add the JSON key content to Script Properties as 'SERVICE_ACCOUNT_KEY'
 * 5. Add the OAuth2 library (see below)
 * 
 * TO ADD OAUTH2 LIBRARY:
 * 1. In Apps Script, click + next to Libraries
 * 2. Enter Script ID: 1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF
 * 3. Select latest version
 * 4. Click Add
 */

// ==================== SERVICE ACCOUNT AUTHENTICATION ====================

/**
 * Gets an authenticated Sheets service using service account credentials
 */
function getAuthenticatedSheetsService() {
  const keyJson = PropertiesService.getScriptProperties().getProperty('SERVICE_ACCOUNT_KEY');
  
  if (!keyJson) {
    throw new Error('SERVICE_ACCOUNT_KEY not found in Script Properties. See SheetService.gs for setup instructions.');
  }
  
  const key = JSON.parse(keyJson);
  
  const service = OAuth2.createService('sheets')
    .setTokenUrl('https://oauth2.googleapis.com/token')
    .setPrivateKey(key.private_key)
    .setIssuer(key.client_email)
    .setPropertyStore(PropertiesService.getScriptProperties())
    .setScope('https://www.googleapis.com/auth/spreadsheets');
  
  if (!service.hasAccess()) {
    throw new Error('Service account authentication failed: ' + service.getLastError());
  }
  
  return service;
}

/**
 * Opens a spreadsheet using service account credentials
 * Use this instead of SpreadsheetApp.openById() for authenticated access
 */
function openSheetWithServiceAccount(spreadsheetId) {
  const service = getAuthenticatedSheetsService();
  const accessToken = service.getAccessToken();
  
  // Use the Sheets API with the service account token
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  
  const response = UrlFetchApp.fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    },
    muteHttpExceptions: true
  });
  
  if (response.getResponseCode() !== 200) {
    throw new Error('Failed to open spreadsheet: ' + response.getContentText());
  }
  
  return JSON.parse(response.getContentText());
}

/**
 * Appends a row to a sheet using service account credentials
 */
function appendRowWithServiceAccount(spreadsheetId, sheetName, rowData) {
  const service = getAuthenticatedSheetsService();
  const accessToken = service.getAccessToken();
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      values: [rowData]
    }),
    muteHttpExceptions: true
  });
  
  if (response.getResponseCode() !== 200) {
    throw new Error('Failed to append row: ' + response.getContentText());
  }
  
  return JSON.parse(response.getContentText());
}

/**
 * Gets all values from a sheet using service account credentials
 */
function getSheetDataWithServiceAccount(spreadsheetId, sheetName) {
  const service = getAuthenticatedSheetsService();
  const accessToken = service.getAccessToken();
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}`;
  
  const response = UrlFetchApp.fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    },
    muteHttpExceptions: true
  });
  
  if (response.getResponseCode() !== 200) {
    throw new Error('Failed to get sheet data: ' + response.getContentText());
  }
  
  const result = JSON.parse(response.getContentText());
  return result.values || [];
}

/**
 * Updates a specific cell using service account credentials
 */
function updateCellWithServiceAccount(spreadsheetId, sheetName, row, column, value) {
  const service = getAuthenticatedSheetsService();
  const accessToken = service.getAccessToken();
  
  // Convert column number to letter (1=A, 2=B, etc.)
  const columnLetter = String.fromCharCode(64 + column);
  const range = `${sheetName}!${columnLetter}${row}`;
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
  
  const response = UrlFetchApp.fetch(url, {
    method: 'put',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      values: [[value]]
    }),
    muteHttpExceptions: true
  });
  
  if (response.getResponseCode() !== 200) {
    throw new Error('Failed to update cell: ' + response.getContentText());
  }
  
  return JSON.parse(response.getContentText());
}

/**
 * Updates a range of cells using service account credentials
 */
function updateRangeWithServiceAccount(spreadsheetId, range, values) {
  const service = getAuthenticatedSheetsService();
  const accessToken = service.getAccessToken();
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
  
  const response = UrlFetchApp.fetch(url, {
    method: 'put',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      values: values
    }),
    muteHttpExceptions: true
  });
  
  if (response.getResponseCode() !== 200) {
    throw new Error('Failed to update range: ' + response.getContentText());
  }
  
  return JSON.parse(response.getContentText());
}

// ==================== TEST FUNCTION ====================

/**
 * Run this to test service account connection
 */
function testServiceAccountAccess() {
  try {
    const data = getSheetDataWithServiceAccount(SHEET_ID, 'Requests');
    Logger.log('✅ Service account access working!');
    Logger.log('Found ' + data.length + ' rows in Requests sheet');
    Logger.log('First row headers: ' + JSON.stringify(data[0]));
    return 'Success! Found ' + data.length + ' rows.';
  } catch (e) {
    Logger.log('❌ Service account access failed: ' + e.toString());
    return 'Failed: ' + e.toString();
  }
}
