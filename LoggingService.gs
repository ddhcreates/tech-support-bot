/**
 * Logging Service - Comprehensive interaction logging
 * Logs ALL bot interactions to Google Sheet for debugging
 */

// ==================== LOGGING FUNCTIONS ====================

/**
 * Logs any interaction to the ChatLogs sheet
 */
function logInteraction(type, userEmail, input, output, success, details) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let logSheet = ss.getSheetByName('ChatLogs');
    
    if (!logSheet) {
      logSheet = ss.insertSheet('ChatLogs');
      logSheet.getRange(1, 1, 1, 8).setValues([
        ['Timestamp', 'Type', 'User', 'Input', 'Output', 'Success', 'Details', 'Error']
      ]);
      logSheet.setFrozenRows(1);
    }
    
    logSheet.appendRow([
      new Date().toISOString(),
      type,
      userEmail,
      (input || '').substring(0, 500),
      (output || '').substring(0, 500),
      success ? 'SUCCESS' : 'FAILURE',
      (details || '').substring(0, 500),
      ''
    ]);
    
  } catch (e) {
    console.error('logInteraction failed:', e);
  }
}

/**
 * Logs errors with full details
 */
function logErrorWithDetails(functionName, error, userEmail, additionalInfo) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let logSheet = ss.getSheetByName('ChatLogs');
    
    if (!logSheet) {
      logSheet = ss.insertSheet('ChatLogs');
      logSheet.getRange(1, 1, 1, 8).setValues([
        ['Timestamp', 'Type', 'User', 'Input', 'Output', 'Success', 'Details', 'Error']
      ]);
    }
    
    logSheet.appendRow([
      new Date().toISOString(),
      'ERROR',
      userEmail || 'unknown',
      functionName,
      '',
      'FAILURE',
      JSON.stringify(additionalInfo || {}).substring(0, 500),
      error.toString().substring(0, 500)
    ]);
    
  } catch (e) {
    console.error('logErrorWithDetails failed:', e);
  }
}

// ==================== ENHANCED LOGGING FOR KEY FUNCTIONS ====================

/**
 * Wrapper to log message events
 */
function logMessageEvent(userEmail, messageText, responseType, response, success) {
  const output = typeof response === 'object' ? 
    (response.hostAppDataAction?.chatDataAction?.createMessageAction?.message?.text || 'Card response') :
    response;
  
  logInteraction('MESSAGE', userEmail, messageText, output, success, `ResponseType: ${responseType}`);
}

/**
 * Wrapper to log command events
 */
function logCommandEvent(userEmail, command, response, success) {
  const output = typeof response === 'object' ? 
    (response.hostAppDataAction?.chatDataAction?.createMessageAction?.message?.text || 'Card response') :
    response;
  
  logInteraction('COMMAND', userEmail, command, output, success, '');
}

/**
 * Wrapper to log card click events
 */
function logCardClickEvent(userEmail, action, response, success) {
  const output = typeof response === 'object' ? 
    (response.hostAppDataAction?.chatDataAction?.createMessageAction?.message?.text || 'Card response') :
    response;
  
  logInteraction('CARD_CLICK', userEmail, action, output, success, '');
}

/**
 * Wrapper to log email send attempts
 */
function logEmailEvent(recipientEmail, subject, success, error) {
  logInteraction('EMAIL', recipientEmail, subject, success ? 'Sent' : 'Failed', success, error || '');
}

/**
 * Wrapper to log Gemini API calls
 */
function logGeminiEvent(userEmail, prompt, response, success, error) {
  logInteraction('GEMINI', userEmail, prompt.substring(0, 200), 
    response ? response.substring(0, 300) : 'No response', 
    success, 
    error || '');
}

// ==================== TEST LOGGING ====================

function testLogging() {
  logInteraction('TEST', 'test@example.com', 'Test input', 'Test output', true, 'Manual test');
  Logger.log('Check ChatLogs sheet for test entry');
}
