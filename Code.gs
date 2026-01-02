/**
 * Tech Support Bot - Main Entry Point
 * 
 * A Google Chat bot for IT helpdesk ticketing with Gemini AI integration.
 * 
 * GitHub: https://github.com/YOUR_USERNAME/tech-support-bot
 * License: MIT
 * 
 * ============================================================================
 * CONFIGURATION - UPDATE THESE VALUES FOR YOUR ORGANIZATION
 * ============================================================================
 */

// Your Google Sheet ID (the long string in the spreadsheet URL)
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';

// Optional: Knowledge Base Sheet ID (leave empty if not using)
const KB_SHEET_ID = '';

// Your Google Chat Space ID for team notifications (e.g., 'spaces/XXXXXXXXX')
const TECH_SUPPORT_SPACE = 'spaces/YOUR_SPACE_ID_HERE';

// Gemini AI Models (update if models change)
const GEMINI_MODEL_FLASH = 'gemini-2.0-flash';
const GEMINI_MODEL_PRO = 'gemini-1.5-pro-latest';

// ============================================================================
// SUPPORT STAFF - ADD YOUR TEAM MEMBERS HERE
// ============================================================================
// Note: Do NOT use Mr/Mrs/Ms prefixes - use plain names for better matching

const SUPPORT_STAFF = [
  { name: 'IT Admin', email: 'itadmin@yourschool.edu', role: 'ICT Head' },
  { name: 'Support Staff 1', email: 'support1@yourschool.edu', role: 'Support' },
  { name: 'Support Staff 2', email: 'support2@yourschool.edu', role: 'Support' }
  // Add more staff as needed
];

// Staff who can be assigned tickets (excludes ICT Head by default)
const ASSIGNABLE_STAFF = SUPPORT_STAFF.filter(s => s.role !== 'ICT Head');

// ============================================================================
// WEEKLY SCHEDULE - CUSTOMIZE FOR YOUR ORGANIZATION
// ============================================================================
// List staff emails for each day (they'll rotate for ticket assignments)

const DEFAULT_WEEKLY_SCHEDULE = {
  'Monday': ['support1@yourschool.edu', 'support2@yourschool.edu'],
  'Tuesday': ['support1@yourschool.edu', 'support2@yourschool.edu'],
  'Wednesday': ['support1@yourschool.edu', 'support2@yourschool.edu'],
  'Thursday': ['support1@yourschool.edu', 'support2@yourschool.edu'],
  'Friday': ['support1@yourschool.edu', 'support2@yourschool.edu'],
  'Saturday': [],  // Empty = no assignments
  'Sunday': []
};

// ============================================================================
// TICKET TYPES - CUSTOMIZE FOR YOUR NEEDS
// ============================================================================

const TICKET_TYPES = {
  '1': { key: 'printer', name: 'Printer / Printing', icon: '🖨️' },
  '2': { key: 'account', name: 'Account / Password', icon: '🔑' },
  '3': { key: 'equipment', name: 'Equipment Request', icon: '📋' },
  '4': { key: 'projector', name: 'Projector / Display', icon: '📽️' },
  '5': { key: 'computer', name: 'Computer Problem', icon: '💻' },
  '6': { key: 'speaker', name: 'Speaker / Audio', icon: '🔊' },
  '7': { key: 'wifi', name: 'WiFi / Network', icon: '📶' },
  '8': { key: 'software', name: 'Software Issue', icon: '💾' },
  '9': { key: 'other', name: 'Other Issue', icon: '❓' }
};

// ============================================================================
// DO NOT MODIFY BELOW THIS LINE (unless you know what you're doing!)
// ============================================================================

// ==================== RESPONSE HELPERS ====================

function createTextResponse(text) {
  return {
    hostAppDataAction: {
      chatDataAction: {
        createMessageAction: {
          message: { text: text }
        }
      }
    }
  };
}

function createCardResponse(cards) {
  return {
    hostAppDataAction: {
      chatDataAction: {
        createMessageAction: {
          message: {
            cardsV2: Array.isArray(cards) ? cards : [cards]
          }
        }
      }
    }
  };
}

// ==================== EVENT HANDLERS ====================

function onMessage(event) {
  try {
    const userEmail = getUserEmail(event);
    const messageText = getMessageText(event);
    const spaceId = getSpaceId(event);
    const attachments = getAttachments(event);
    
    logInfo('onMessage', 'Received', { userEmail, text: messageText, hasAttachment: attachments.length > 0 });
    
    if (isUserStaff(userEmail) && spaceId) {
      cacheStaffDMSpace(userEmail, spaceId);
    }
    
    const userState = getUserState(userEmail);
    
    if (attachments.length > 0) {
      return handlePhotoMessage(event, userEmail, messageText, attachments, userState);
    }
    
    if (userState && userState.flow === 'ticket') {
      return handleTicketFlow(event, userState, messageText);
    }
    
    return handleWithGemini(event, messageText, userEmail);
    
  } catch (error) {
    logError('onMessage', error);
    return createTextResponse('❌ Sorry, something went wrong. Please try /ticket to start over.');
  }
}

function onAddedToSpace(event) {
  try {
    const spaceType = getSpaceType(event);
    logInfo('onAddedToSpace', 'Bot added', { spaceType });
    
    if (spaceType === 'DM' || spaceType === 'DIRECT_MESSAGE') {
      return createTextResponse(
        '👋 Hi! I\'m the Tech Support Bot.\n\n' +
        'I can help you with IT issues. Here\'s what I can do:\n\n' +
        '• Type /ticket to create a support request\n' +
        '• Type /status to check your tickets\n' +
        '• Or just describe your problem and I\'ll try to help!\n\n' +
        '📷 You can also send me a photo of any error messages.'
      );
    }
    
    return createTextResponse('👋 Tech Support Bot is ready! Type /help for commands.');
    
  } catch (error) {
    logError('onAddedToSpace', error);
    return createTextResponse('👋 Hello! Type /help for commands.');
  }
}

function onAppCommand(event) {
  try {
    const commandId = getCommandId(event);
    const userEmail = getUserEmail(event);
    
    logInfo('onAppCommand', 'Command received', { commandId, userEmail });
    
    switch (commandId) {
      case 1:
        return startTicketFlow(event, userEmail);
      case 2:
        return handleStatusCommand(event, userEmail);
      case 3:
        return handleLeaveCommand(event, userEmail);
      case 4:
        return handleScheduleCommand(event, userEmail);
      case 5:
        return showHelpMessage(userEmail);
      default:
        return createTextResponse('Unknown command. Type /help for options.');
    }
  } catch (error) {
    logError('onAppCommand', error);
    return createTextResponse('❌ Error processing command.');
  }
}

function onCardClick(event) {
  try {
    const action = event.commonEventObject?.invokedFunction || 
                   getCardAction(event);
    
    const params = getCardParams(event);
    const userEmail = getUserEmail(event);
    const userName = getUserName(event);
    
    logInfo('onCardClick', 'Button clicked', { action, userEmail });
    
    switch (action) {
      case 'selectTicketType':
        return handleTypeSelection(userEmail, params);
      
      case 'selectLocation':
        params.formInputs = event.commonEventObject?.formInputs || {};
        return handleLocationSelection(userEmail, params);
      
      case 'submitDescription':
        return handleDescriptionSubmit(event, userEmail, userName, params);
      
      case 'cancelTicket':
        clearUserState(userEmail);
        return createTextResponse('❌ Ticket creation cancelled.');
      
      default:
        logInfo('onCardClick', 'Unknown action', { action });
        return createTextResponse('Unknown action: ' + action);
    }
  } catch (error) {
    logError('onCardClick', error);
    return createTextResponse('❌ Error processing action. Try /ticket again.');
  }
}

function getCardAction(event) {
  if (event.chat?.buttonClickedPayload?.action?.actionMethodName) {
    return event.chat.buttonClickedPayload.action.actionMethodName;
  }
  if (event.action?.actionMethodName) {
    return event.action.actionMethodName;
  }
  if (event.commonEventObject?.invokedFunction) {
    return event.commonEventObject.invokedFunction;
  }
  return 'unknown';
}

function getCardParams(event) {
  const params = {};
  
  if (event.commonEventObject?.parameters) {
    Object.assign(params, event.commonEventObject.parameters);
    return params;
  }
  
  let paramArray = event.action?.parameters ||
                   event.chat?.buttonClickedPayload?.action?.parameters ||
                   [];
  
  if (Array.isArray(paramArray)) {
    paramArray.forEach(p => {
      params[p.key] = p.value;
    });
  }
  
  return params;
}

function onRemovedFromSpace(event) {
  logInfo('onRemovedFromSpace', 'Bot removed', {});
}

// ==================== HELPER FUNCTIONS ====================

function getUserEmail(event) {
  if (event.chat?.user?.email) return event.chat.user.email;
  if (event.chat?.messagePayload?.message?.sender?.email) return event.chat.messagePayload.message.sender.email;
  if (event.chat?.appCommandPayload?.message?.sender?.email) return event.chat.appCommandPayload.message.sender.email;
  return 'unknown@email.com';
}

function getUserName(event) {
  if (event.chat?.user?.displayName) return event.chat.user.displayName;
  if (event.chat?.messagePayload?.message?.sender?.displayName) return event.chat.messagePayload.message.sender.displayName;
  return 'Unknown User';
}

function getMessageText(event) {
  if (event.chat?.messagePayload?.message?.text) return event.chat.messagePayload.message.text;
  if (event.message?.text) return event.message.text;
  return '';
}

function getSpaceType(event) {
  if (event.chat?.messagePayload?.space?.spaceType) return event.chat.messagePayload.space.spaceType;
  if (event.space?.type) return event.space.type;
  return 'UNKNOWN';
}

function getSpaceId(event) {
  if (event.chat?.messagePayload?.space?.name) return event.chat.messagePayload.space.name;
  if (event.chat?.appCommandPayload?.space?.name) return event.chat.appCommandPayload.space.name;
  if (event.space?.name) return event.space.name;
  return null;
}

function getCommandId(event) {
  if (event.chat?.appCommandPayload?.appCommandMetadata?.appCommandId) {
    return event.chat.appCommandPayload.appCommandMetadata.appCommandId;
  }
  if (event.message?.slashCommand?.commandId) return event.message.slashCommand.commandId;
  return 0;
}

function getAttachments(event) {
  const attachments = event.chat?.messagePayload?.message?.attachment ||
                      event.chat?.messagePayload?.message?.attachments ||
                      event.message?.attachment ||
                      [];
  return Array.isArray(attachments) ? attachments : [attachments].filter(Boolean);
}

// ==================== PHOTO HANDLING ====================

function handlePhotoMessage(event, userEmail, messageText, attachments, userState) {
  try {
    logInfo('handlePhotoMessage', 'Processing photo', { userEmail, attachmentCount: attachments.length });
    
    const imageAttachment = attachments.find(a => a.contentType?.startsWith('image/'));
    if (!imageAttachment) {
      return createTextResponse('📎 I received your attachment, but I can only analyze images. Please send a photo or describe your issue.');
    }
    
    const attachmentInfo = {
      name: imageAttachment.name,
      contentType: imageAttachment.contentType,
      source: imageAttachment.source,
      downloadUri: imageAttachment.downloadUri || null,
      thumbnailUri: imageAttachment.thumbnailUri || null
    };
    
    if (userState && userState.flow === 'ticket') {
      userState.attachments = userState.attachments || [];
      userState.attachments.push(attachmentInfo);
      setUserState(userEmail, userState);
      
      if (userState.step === 'get_description' && messageText) {
        userState.description = messageText;
        const result = createTicketWithPhoto(event, userEmail, getUserName(event), userState);
        clearUserState(userEmail);
        return result;
      }
      
      return createTextResponse('📷 Photo added to your ticket! Please continue with your description.');
    }
    
    const analysis = analyzeImageWithGemini(imageAttachment, messageText, userEmail);
    
    if (analysis) {
      setUserState(userEmail, {
        pendingPhoto: attachmentInfo,
        photoAnalysis: analysis
      });
      
      return createTextResponse(
        '📷 *Photo received and analyzed!*\n\n' +
        `${analysis}\n\n` +
        '*What would you like to do?*\n' +
        '• Type /ticket to create a support request with this photo\n' +
        '• Or describe your issue and I\'ll help further'
      );
    }
    
    setUserState(userEmail, { pendingPhoto: attachmentInfo });
    
    return createTextResponse(
      '📷 *Photo received!*\n\n' +
      'I can see you sent an image. Would you like to:\n' +
      '• Type /ticket to create a support request with this photo\n' +
      '• Or describe what\'s happening and I\'ll help'
    );
    
  } catch (error) {
    logError('handlePhotoMessage', error);
    return createTextResponse('📷 Photo received! Type /ticket to create a support request with it.');
  }
}

function isUserStaff(email) {
  return SUPPORT_STAFF.some(s => s.email.toLowerCase() === email.toLowerCase());
}

function showHelpMessage(userEmail) {
  const isStaff = isUserStaff(userEmail);
  
  if (isStaff) {
    return createTextResponse(
      '📚 *Tech Support Bot - Staff Commands*\n\n' +
      '*Ticket Management:*\n' +
      '• /ticket - Create a ticket (for testing)\n' +
      '• /status mine - View tickets assigned to you\n' +
      '• /status [ID] [status] - Update ticket status\n' +
      '• /status [ID] note [text] - Add note to ticket\n\n' +
      '*Schedule:*\n' +
      '• /schedule - View weekly duty roster\n' +
      '• /leave - Request time off\n\n' +
      '*Other:*\n' +
      '• /help - Show this message\n' +
      '• Or type any question for AI assistance'
    );
  }
  
  return createTextResponse(
    '📚 *Tech Support Bot*\n\n' +
    '*Need IT help?*\n' +
    '• /ticket - Create a support ticket\n' +
    '• /status - View your open tickets\n' +
    '• /help - Show this message\n\n' +
    '💡 You can also describe your issue and I\'ll try to help!'
  );
}

// ==================== LOGGING ====================

function logInfo(functionName, message, data) {
  console.log(`[INFO] ${functionName}: ${message}`, JSON.stringify(data || {}));
}

function logError(functionName, error, additionalData) {
  console.error(`[ERROR] ${functionName}: ${error.toString()}`, JSON.stringify(additionalData || {}));
  try {
    logInteraction('ERROR', 'system', functionName, error.toString(), false, JSON.stringify(additionalData || {}));
  } catch (e) { /* ignore logging errors */ }
}
