/**
 * Gemini Service - AI-powered responses with debugging
 */

// ==================== GEMINI API ====================

function callGemini(prompt, model, userEmail) {
  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    
    if (!apiKey) {
      logInfo('callGemini', 'No API key configured');
      logGeminiEvent(userEmail || 'unknown', prompt, null, false, 'No API key configured');
      return null;
    }
    
    const modelName = model || GEMINI_MODEL_FLASH;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 512
      }
    };
    
    logInfo('callGemini', 'Calling Gemini API', { model: modelName, promptLength: prompt.length });
    
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode !== 200) {
      logError('callGemini', new Error(`API returned ${responseCode}`), { response: responseText.substring(0, 500) });
      logGeminiEvent(userEmail || 'unknown', prompt, responseText, false, `HTTP ${responseCode}`);
      return null;
    }
    
    const result = JSON.parse(responseText);
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      logError('callGemini', new Error('No text in response'), { result: JSON.stringify(result).substring(0, 500) });
      logGeminiEvent(userEmail || 'unknown', prompt, null, false, 'No text in response');
      return null;
    }
    
    logInfo('callGemini', 'Gemini response received', { responseLength: generatedText.length });
    logGeminiEvent(userEmail || 'unknown', prompt, generatedText, true, null);
    
    return generatedText;
    
  } catch (e) {
    logError('callGemini', e);
    logGeminiEvent(userEmail || 'unknown', prompt, null, false, e.toString());
    return null;
  }
}

// ==================== KNOWLEDGE BASE ====================

function getKBContext(query) {
  if (!KB_SHEET_ID) return '';
  
  try {
    const kb = SpreadsheetApp.openById(KB_SHEET_ID);
    const faqSheet = kb.getSheetByName('FAQs');
    if (!faqSheet) return '';
    
    const data = faqSheet.getDataRange().getValues();
    const queryLower = query.toLowerCase();
    const matches = [];
    
    for (let i = 1; i < data.length; i++) {
      const question = (data[i][0] || '').toLowerCase();
      const keywords = (data[i][3] || '').toLowerCase();
      
      if (queryLower.split(' ').some(w => question.includes(w) || keywords.includes(w))) {
        matches.push({ q: data[i][0], a: data[i][1] });
      }
    }
    
    if (matches.length === 0) return '';
    
    return '\n\nRelevant FAQs:\n' + matches.slice(0, 2).map(m => `Q: ${m.q}\nA: ${m.a}`).join('\n\n');
    
  } catch (e) {
    logError('getKBContext', e);
    return '';
  }
}

// ==================== MESSAGE HANDLING ====================

function handleWithGemini(event, messageText, userEmail) {
  logInfo('handleWithGemini', 'Processing message', { userEmail, messageLength: messageText.length });
  
  // Get KB context
  const kbContext = getKBContext(messageText);
  
  // Build prompt
  const prompt = `You are a helpful IT support assistant for Anita Methodist School (K-12) in Madras, India.

User message: "${messageText}"
${kbContext}

Instructions:
1. If this is a simple IT issue (password reset, WiFi reconnection, basic troubleshooting), provide a clear solution in 2-3 steps.
2. If the issue needs hands-on support, say: "This needs our support team. Type /ticket to create a request."
3. Keep response under 100 words, friendly and professional.
4. If greeting (hi, hello), respond briefly and ask how you can help.

Respond:`;

  const aiResponse = callGemini(prompt, GEMINI_MODEL_FLASH, userEmail);
  
  if (aiResponse) {
    logInfo('handleWithGemini', 'AI response generated', { responseLength: aiResponse.length });
    logMessageEvent(userEmail, messageText, 'GEMINI', aiResponse, true);
    return createTextResponse(aiResponse);
  }
  
  // Fallback if Gemini fails
  logInfo('handleWithGemini', 'Using fallback response (Gemini failed)', { userEmail });
  const fallback = '👋 Hi! I\'m the Tech Support Bot.\n\n' +
    'How can I help you today?\n\n' +
    '• Type /ticket to create a support request\n' +
    '• Or describe your issue and I\'ll try to help!';
  
  logMessageEvent(userEmail, messageText, 'FALLBACK', fallback, false);
  return createTextResponse(fallback);
}

// ==================== CATEGORIZATION ====================

function categorizeIssue(description) {
  const desc = description.toLowerCase();
  
  const keywords = {
    'wifi': ['wifi', 'internet', 'network', 'connect'],
    'account': ['password', 'login', 'email', 'google account'],
    'printer': ['printer', 'print', 'paper'],
    'projector': ['projector', 'display', 'screen', 'hdmi'],
    'computer': ['computer', 'laptop', 'slow', 'crash'],
    'speaker': ['speaker', 'audio', 'sound', 'mic'],
    'cctv': ['cctv', 'camera', 'security'],
    'student_ipad': ['ipad', 'tablet', 'student device']
  };
  
  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(w => desc.includes(w))) return category;
  }
  
  return null;
}

// ==================== GEMINI VISION (IMAGE ANALYSIS) ====================

/**
 * Analyzes an image using Gemini Vision
 * Note: This requires the image to be accessible via URL
 * For Chat attachments, we describe what we can see from metadata
 */
function analyzeImageWithGemini(attachment, userMessage, userEmail) {
  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!apiKey) {
      logInfo('analyzeImageWithGemini', 'No API key');
      return null;
    }
    
    // For Google Chat attachments, we may not have direct image access
    // But we can use the message context and attachment metadata
    
    const prompt = `You are an IT support assistant analyzing a user's issue.

The user sent a photo with their message.
User's message: "${userMessage || '(no text, just a photo)'}"
Image type: ${attachment.contentType || 'image'}

Based on the context, provide a brief (2-3 sentences) response that:
1. Acknowledges you received their photo
2. Makes a reasonable guess about what IT issue they might be showing (e.g., error message, broken equipment, display problem)
3. Asks a clarifying question OR suggests they type /ticket to create a support request

Be helpful and concise.`;

    const response = callGemini(prompt, GEMINI_MODEL_FLASH, userEmail);
    
    if (response) {
      logInfo('analyzeImageWithGemini', 'Analysis complete', { userEmail });
      return response;
    }
    
    return null;
    
  } catch (e) {
    logError('analyzeImageWithGemini', e);
    return null;
  }
}

// ==================== TEST FUNCTION ====================

function testGeminiDirectly() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  Logger.log('API Key exists: ' + (apiKey ? 'YES' : 'NO'));
  Logger.log('API Key length: ' + (apiKey?.length || 0));
  
  if (!apiKey) {
    Logger.log('FAILED: No API key');
    return 'No API key configured';
  }
  
  const testPrompt = 'Say "Hello, the Gemini API is working!" in exactly those words.';
  const response = callGemini(testPrompt, GEMINI_MODEL_FLASH, 'test@test.com');
  
  Logger.log('Response: ' + response);
  return response || 'Failed to get response';
}
