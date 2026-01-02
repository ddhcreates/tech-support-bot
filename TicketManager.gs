/**
 * Ticket Manager - With Rich Cards and Button UI
 * Uses Workspace Add-ons format (function instead of actionMethodName)
 */

// ==================== USER STATE MANAGEMENT ====================

function getUserState(userEmail) {
  try {
    const cache = CacheService.getScriptCache();
    const data = cache.get('state_' + userEmail);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

function setUserState(userEmail, state) {
  try {
    const cache = CacheService.getScriptCache();
    cache.put('state_' + userEmail, JSON.stringify(state), 1800);
  } catch (e) {
    logError('setUserState', e);
  }
}

function clearUserState(userEmail) {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove('state_' + userEmail);
  } catch (e) { /* ignore */ }
}

// ==================== CARD RESPONSE HELPERS ====================

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

// ==================== TICKET CREATION WITH CARDS ====================

function startTicketFlow(event, userEmail) {
  // Check if user has a pending photo from earlier
  const existingState = getUserState(userEmail);
  const pendingPhoto = existingState?.pendingPhoto;
  const photoAnalysis = existingState?.photoAnalysis;
  
  // Create card with ticket type buttons
  const buttons = [];
  
  Object.entries(TICKET_TYPES).forEach(([num, type]) => {
    buttons.push({
      text: `${type.icon} ${type.name}`,
      onClick: {
        action: {
          function: 'selectTicketType',
          parameters: [
            { key: 'typeKey', value: type.key },
            { key: 'typeName', value: type.name },
            { key: 'typeIcon', value: type.icon }
          ]
        }
      }
    });
  });
  
  // Split into groups of 2 for better layout
  const buttonRows = [];
  for (let i = 0; i < buttons.length; i += 2) {
    buttonRows.push({
      buttonList: {
        buttons: buttons.slice(i, i + 2)
      }
    });
  }
  
  // Build header with photo indicator if present
  const headerSubtitle = pendingPhoto 
    ? '📷 Photo attached - Select the type of issue' 
    : 'Select the type of issue';
  
  const widgets = [...buttonRows];
  
  // Add photo indicator if present
  if (pendingPhoto) {
    widgets.unshift({
      textParagraph: {
        text: '📷 <b>Your photo will be included with this ticket</b>'
      }
    });
  }
  
  const card = {
    cardId: 'ticketTypeSelection',
    card: {
      header: {
        title: '🎫 Create a Support Ticket',
        subtitle: headerSubtitle
      },
      sections: [{
        widgets: widgets
      }, {
        widgets: [{
          buttonList: {
            buttons: [{
              text: '❌ Cancel',
              onClick: {
                action: {
                  function: 'cancelTicket'
                }
              }
            }]
          }
        }]
      }]
    }
  };
  
  // Preserve photo info in state when starting ticket flow
  if (pendingPhoto) {
    setUserState(userEmail, {
      flow: 'ticket',
      step: 'select_type',
      attachments: [pendingPhoto],
      photoAnalysis: photoAnalysis
    });
  }
  
  return createCardResponse(card);
}

// Note: onCardClick and helper functions are defined in Code.gs
// This file only contains the handler functions they call

function getFormInputs(event) {
  return event.commonEventObject?.formInputs ||
         event.common?.formInputs ||
         {};
}

// ==================== TYPE SELECTION ====================

function handleTypeSelection(userEmail, params) {
  const typeKey = params.typeKey;
  const typeName = params.typeName;
  const typeIcon = params.typeIcon;
  
  // Get existing state to preserve attachments
  const existingState = getUserState(userEmail);
  const attachments = existingState?.attachments || [];
  const photoAnalysis = existingState?.photoAnalysis;
  
  // Save state (preserving attachments)
  setUserState(userEmail, {
    flow: 'ticket',
    step: 'get_location',
    ticketType: typeKey,
    ticketTypeName: typeName,
    ticketIcon: typeIcon,
    attachments: attachments,
    photoAnalysis: photoAnalysis
  });
  
  // Show location card with input field
  const card = {
    cardId: 'locationInput',
    card: {
      header: {
        title: `${typeIcon} ${typeName}`,
        subtitle: 'Step 2: Location'
      },
      sections: [{
        widgets: [
          {
            textParagraph: {
              text: '📍 <b>Where is the issue located?</b>'
            }
          },
          {
            textInput: {
              name: 'location',
              label: 'Location',
              type: 'SINGLE_LINE',
              hintText: 'e.g., Z009, M110, Library, Admin Office'
            }
          },
          {
            buttonList: {
              buttons: [
                {
                  text: '➡️ Next',
                  onClick: {
                    action: {
                      function: 'selectLocation'
                    }
                  }
                },
                {
                  text: '❌ Cancel',
                  onClick: {
                    action: {
                      function: 'cancelTicket'
                    }
                  }
                }
              ]
            }
          }
        ]
      }]
    }
  };
  
  return createCardResponse(card);
}

// ==================== LOCATION SELECTION ====================

function handleLocationSelection(userEmail, params) {
  const userState = getUserState(userEmail);
  if (!userState) {
    return createTextResponse('Session expired. Please type /ticket to start over.');
  }
  
  // Get location from form input
  const formInputs = params.formInputs || {};
  const location = formInputs.location?.stringInputs?.value?.[0] || 
                   params.location || 
                   'Not specified';
  
  userState.location = location;
  userState.step = 'get_description';
  setUserState(userEmail, userState);
  
  // Show description input card
  const card = {
    cardId: 'descriptionInput',
    card: {
      header: {
        title: `${userState.ticketIcon} ${userState.ticketTypeName}`,
        subtitle: 'Step 3: Describe the issue'
      },
      sections: [{
        widgets: [
          {
            textParagraph: {
              text: `📍 Location: <b>${location}</b>`
            }
          },
          {
            textInput: {
              name: 'description',
              label: 'Description',
              type: 'MULTIPLE_LINE',
              hintText: 'What\'s happening? Any error messages?'
            }
          },
          {
            selectionInput: {
              name: 'priority',
              label: 'Priority',
              type: 'DROPDOWN',
              items: [
                { text: '🟢 Low - Can wait', value: 'Low' },
                { text: '🟡 Medium - Affects work', value: 'Medium', selected: true },
                { text: '🟠 High - Blocking work', value: 'High' },
                { text: '🔴 Urgent - Emergency', value: 'Urgent' }
              ]
            }
          },
          {
            buttonList: {
              buttons: [
                {
                  text: '✅ Submit Ticket',
                  onClick: {
                    action: {
                      function: 'submitDescription'
                    }
                  },
                  color: {
                    red: 0.2,
                    green: 0.7,
                    blue: 0.3,
                    alpha: 1
                  }
                },
                {
                  text: '❌ Cancel',
                  onClick: {
                    action: {
                      function: 'cancelTicket'
                    }
                  }
                }
              ]
            }
          }
        ]
      }]
    }
  };
  
  return createCardResponse(card);
}

// ==================== DESCRIPTION SUBMIT ====================

function handleDescriptionSubmit(event, userEmail, userName, params) {
  const userState = getUserState(userEmail);
  if (!userState) {
    return createTextResponse('Session expired. Please type /ticket to start over.');
  }
  
  // Get form inputs
  const formInputs = getFormInputs(event);
  const description = formInputs.description?.stringInputs?.value?.[0] || 
                      params.description || 
                      'No description provided';
  const priority = formInputs.priority?.stringInputs?.value?.[0] || 'Medium';
  
  userState.description = description;
  userState.priority = priority;
  
  // Create the ticket
  try {
    const result = createTicketInSheet(userEmail, userName, userState);
    clearUserState(userEmail);
    return result;
  } catch (error) {
    logError('handleDescriptionSubmit', error);
    clearUserState(userEmail);
    return createTextResponse('❌ Error creating ticket. Please try /ticket again.');
  }
}

// ==================== TICKET FLOW (TEXT FALLBACK) ====================

function handleTicketFlow(event, userState, messageText) {
  const userEmail = getUserEmail(event);
  const userName = getUserName(event);
  const input = messageText.trim();
  
  switch (userState.step) {
    case 'select_type':
      const ticketType = TICKET_TYPES[input];
      if (ticketType) {
        return handleTypeSelection(userEmail, {
          typeKey: ticketType.key,
          typeName: ticketType.name,
          typeIcon: ticketType.icon
        });
      }
      return createTextResponse('Please click a button above or enter a number 1-11.');
    
    case 'get_location':
      userState.location = input;
      userState.step = 'get_description';
      setUserState(userEmail, userState);
      return handleLocationSelection(userEmail, { location: input });
    
    case 'get_description':
      userState.description = input;
      userState.priority = 'Medium';
      try {
        const result = createTicketInSheet(userEmail, userName, userState);
        clearUserState(userEmail);
        return result;
      } catch (e) {
        clearUserState(userEmail);
        return createTextResponse('❌ Error. Try /ticket again.');
      }
    
    default:
      clearUserState(userEmail);
      return createTextResponse('Please type /ticket to start over.');
  }
}

// ==================== CREATE TICKET ====================

function createTicketInSheet(userEmail, userName, ticketData) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Requests');
  if (!sheet) throw new Error('Requests sheet not found');
  
  const lastRow = sheet.getLastRow();
  const ticketNumber = (lastRow).toString().padStart(4, '0');
  const ticketId = '#' + ticketNumber;
  
  const assignment = getAvailableStaffForToday();
  const assignedStaff = getNextAssignment(assignment);
  
  if (!assignedStaff) {
    return createTextResponse('⚠️ No staff available. Please contact ICT directly.');
  }
  
  if (assignment.scheduleRowIndex !== -1) {
    updateLastAssignedIndex(assignment.scheduleRowIndex, assignment.nextIndex + 1);
  }
  
  // Build description with photo indicator if present
  const hasPhoto = ticketData.attachments && ticketData.attachments.length > 0;
  let fullDescription = ticketData.description;
  if (hasPhoto) {
    fullDescription += '\n\n📷 [Photo attached]';
    // Add attachment reference to Additional Info column
  }
  
  const rowData = [
    new Date(), ticketId, '', userName, ticketData.ticketTypeName,
    fullDescription, '-', '-', userEmail, '', assignedStaff.name,
    ticketData.location || '-', '-', '-', ticketData.priority || 'Medium',
    hasPhoto ? 'Photo attached: ' + JSON.stringify(ticketData.attachments[0]) : '', '', 'Pending'
  ];
  
  sheet.appendRow(rowData);
  
  // Notifications
  const notificationData = { ...ticketData, hasPhoto };
  notifySpaceOfNewTicket(ticketId, userName, userEmail, notificationData, assignedStaff);
  notifyStaffDirectly(ticketId, userName, userEmail, notificationData, assignedStaff);
  sendTicketConfirmationEmail(userEmail, userName, ticketId, notificationData, assignedStaff.name);
  
  // Build confirmation widgets
  const confirmWidgets = [
    {
      decoratedText: {
        topLabel: 'Type',
        text: `${ticketData.ticketIcon} ${ticketData.ticketTypeName}`
      }
    },
    {
      decoratedText: {
        topLabel: 'Location',
        text: ticketData.location || 'Not specified'
      }
    },
    {
      decoratedText: {
        topLabel: 'Priority',
        text: ticketData.priority || 'Medium'
      }
    },
    {
      decoratedText: {
        topLabel: 'Assigned To',
        text: assignedStaff.name,
        startIcon: { knownIcon: 'PERSON' }
      }
    }
  ];
  
  // Add photo indicator if present
  if (hasPhoto) {
    confirmWidgets.push({
      decoratedText: {
        topLabel: 'Attachment',
        text: '📷 Photo attached',
        startIcon: { knownIcon: 'PHOTO' }
      }
    });
  }
  
  confirmWidgets.push({
    textParagraph: {
      text: `<i>${ticketData.description.substring(0, 100)}${ticketData.description.length > 100 ? '...' : ''}</i>`
    }
  });
  
  confirmWidgets.push({
    textParagraph: {
      text: '📧 Confirmation sent to your email.\n\n<b>A staff member will contact you shortly.</b>'
    }
  });
  
  // Return confirmation card
  const confirmCard = {
    cardId: 'ticketConfirmation',
    card: {
      header: {
        title: '✅ Ticket Created',
        subtitle: ticketId + (hasPhoto ? ' 📷' : '')
      },
      sections: [{
        widgets: confirmWidgets
      }]
    }
  };
  
  return createCardResponse(confirmCard);
}

// Alias for photo ticket creation
function createTicketWithPhoto(event, userEmail, userName, ticketData) {
  return createTicketInSheet(userEmail, userName, ticketData);
}

// ==================== STATUS COMMAND ====================

function handleStatusCommand(event, userEmail) {
  const isStaff = isUserStaff(userEmail);
  
  let argText = '';
  if (event.chat?.appCommandPayload?.message?.argumentText) {
    argText = event.chat.appCommandPayload.message.argumentText.trim();
  }
  
  logInfo('handleStatusCommand', 'Processing', { userEmail, argText, isStaff });
  
  // Staff: /status mine - Show tickets assigned to me
  if (isStaff && argText.toLowerCase() === 'mine') {
    logCommandEvent(userEmail, '/status mine', 'Showing staff assigned tickets', true);
    return getStaffAssignedTickets(userEmail);
  }
  
  // Staff: /status 0042 note This is my note
  if (isStaff && argText) {
    const noteMatch = argText.match(/^(\d{4})\s+note\s+(.+)$/i);
    if (noteMatch) {
      logCommandEvent(userEmail, '/status note', 'Adding note', true);
      return addTicketNote(noteMatch[1], noteMatch[2], userEmail);
    }
    
    // Staff: /status 0042 Resolved
    const statusMatch = argText.match(/^(\d{4})\s+(.+)$/);
    if (statusMatch) {
      logCommandEvent(userEmail, '/status update', 'Updating status', true);
      return updateTicketStatus(statusMatch[1], statusMatch[2], userEmail);
    }
  }
  
  // Default: Show user's own tickets
  logCommandEvent(userEmail, '/status', 'Showing user tickets', true);
  return getUserTickets(userEmail);
}

function getUserTickets(userEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Requests');
    if (!sheet) return createTextResponse('No tickets found.');
    
    const data = sheet.getDataRange().getValues();
    const openTickets = [];
    
    for (let i = 1; i < data.length; i++) {
      const ticketEmail = data[i][8];
      const status = data[i][17] || 'Pending';
      
      if (ticketEmail?.toLowerCase() === userEmail.toLowerCase() &&
          ['pending', 'open', 'in progress'].includes(status.toLowerCase())) {
        openTickets.push({
          id: data[i][1], type: data[i][4], status: status, assigned: data[i][10]
        });
      }
    }
    
    if (openTickets.length === 0) {
      return createTextResponse('✅ No open tickets.\n\nUse /ticket to create one.');
    }
    
    let response = '📋 *Your Open Tickets:*\n\n';
    openTickets.forEach(t => {
      response += `• *${t.id}* - ${t.type}\n  ${t.status} | ${t.assigned}\n\n`;
    });
    
    return createTextResponse(response);
  } catch (e) {
    logError('getUserTickets', e);
    return createTextResponse('❌ Error retrieving tickets.');
  }
}

/**
 * Shows tickets assigned TO the staff member
 */
function getStaffAssignedTickets(staffEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Requests');
    if (!sheet) return createTextResponse('No tickets found.');
    
    const data = sheet.getDataRange().getValues();
    const staffInfo = SUPPORT_STAFF.find(s => s.email.toLowerCase() === staffEmail.toLowerCase());
    
    // Get staff name - could be full name or partial
    const staffName = staffInfo?.name || '';
    
    // Extract just the surname for matching (e.g., "Mr Saravanakumar" -> "Saravanakumar")
    const nameParts = staffName.split(' ');
    const matchNames = [
      staffName.toLowerCase(),
      nameParts[nameParts.length - 1]?.toLowerCase() // Last part (surname)
    ].filter(Boolean);
    
    logInfo('getStaffAssignedTickets', 'Looking for tickets', { staffEmail, staffName, matchNames });
    
    const assignedTickets = [];
    
    for (let i = 1; i < data.length; i++) {
      const assignedTo = (data[i][10] || '').toString().toLowerCase();
      const status = (data[i][17] || 'Pending').toString();
      
      // Check if any of the name variants match
      const isMatch = matchNames.some(name => assignedTo.includes(name));
      
      if (isMatch && ['pending', 'open', 'in progress'].includes(status.toLowerCase())) {
        assignedTickets.push({
          id: data[i][1],
          type: data[i][4],
          from: data[i][3],
          location: data[i][11],
          status: status,
          priority: data[i][14] || 'Medium',
          desc: String(data[i][5] || '').substring(0, 50)
        });
      }
    }
    
    logInfo('getStaffAssignedTickets', 'Found tickets', { count: assignedTickets.length });
    
    if (assignedTickets.length === 0) {
      return createTextResponse(`✅ No open tickets assigned to you (${staffName || staffEmail}).`);
    }
    
    let response = `📋 *Tickets Assigned to ${staffName || 'You'}:*\n\n`;
    assignedTickets.forEach(t => {
      response += `*${t.id}* - ${t.type}\n`;
      response += `  📍 ${t.location} | ⚡ ${t.priority} | ${t.status}\n`;
      response += `  From: ${t.from}\n`;
      response += `  _${t.desc}${t.desc.length >= 50 ? '...' : ''}_\n\n`;
    });
    
    response += `\n*Commands:*\n`;
    response += `• /status [ID] [status] - Update status\n`;
    response += `• /status [ID] note [text] - Add note`;
    
    return createTextResponse(response);
  } catch (e) {
    logError('getStaffAssignedTickets', e, { staffEmail });
    return createTextResponse('❌ Error retrieving assigned tickets.');
  }
}

/**
 * Adds a note to a ticket without changing status
 */
function addTicketNote(ticketNum, noteText, staffEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Requests');
    const data = sheet.getDataRange().getValues();
    const ticketId = '#' + ticketNum;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === ticketId) {
        const rowIndex = i + 1;
        const staffName = SUPPORT_STAFF.find(s => s.email === staffEmail)?.name || 'Staff';
        const now = new Date().toLocaleString('en-GB');
        
        const currentNotes = data[i][16] || '';
        const newNote = `[${now}] ${staffName}: ${noteText}`;
        sheet.getRange(rowIndex, 17).setValue(currentNotes ? currentNotes + '\n' + newNote : newNote);
        
        logInteraction('NOTE_ADDED', staffEmail, ticketId, noteText, true, '');
        
        // Notify Space about the note
        sendToWebhook(`📝 ${ticketId} - Note added by ${staffName}:\n_"${noteText}"_`);
        
        return createTextResponse(`✅ Note added to ${ticketId}\n\n_"${noteText}"_`);
      }
    }
    
    return createTextResponse(`❌ Ticket #${ticketNum} not found.`);
  } catch (e) {
    logError('addTicketNote', e);
    return createTextResponse('❌ Error adding note.');
  }
}

function updateTicketStatus(ticketNum, newStatus, staffEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Requests');
    const data = sheet.getDataRange().getValues();
    const ticketId = '#' + ticketNum;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === ticketId) {
        const rowIndex = i + 1;
        const staffName = SUPPORT_STAFF.find(s => s.email === staffEmail)?.name || 'Staff';
        const now = new Date().toLocaleString('en-GB');
        
        sheet.getRange(rowIndex, 18).setValue(newStatus);
        
        const currentNotes = data[i][16] || '';
        const newNote = `[${now}] ${staffName}: Status → ${newStatus}`;
        sheet.getRange(rowIndex, 17).setValue(currentNotes ? currentNotes + '\n' + newNote : newNote);
        
        const userEmail = data[i][8];
        if (userEmail) sendStatusUpdateEmail(userEmail, ticketId, newStatus, staffName, data[i][4]);
        
        notifySpaceOfUpdate(ticketId, newStatus, staffName);
        
        logInteraction('STATUS_UPDATE', staffEmail, ticketId, newStatus, true, '');
        
        return createTextResponse(`✅ ${ticketId} → *${newStatus}*`);
      }
    }
    
    return createTextResponse(`❌ Ticket #${ticketNum} not found.`);
  } catch (e) {
    logError('updateTicketStatus', e);
    return createTextResponse('❌ Error updating ticket.');
  }
}

// ==================== FUNCTION HANDLERS FOR CARD ACTIONS ====================
// These are called by onCardClick in Code.gs based on the 'function' field

function selectTicketType(event) {
  const params = event.commonEventObject?.parameters || {};
  const userEmail = getUserEmail(event);
  return handleTypeSelection(userEmail, params);
}

function selectLocation(event) {
  const params = event.commonEventObject?.parameters || {};
  params.formInputs = event.commonEventObject?.formInputs || {};
  const userEmail = getUserEmail(event);
  return handleLocationSelection(userEmail, params);
}

function submitDescription(event) {
  const params = event.commonEventObject?.parameters || {};
  const userEmail = getUserEmail(event);
  const userName = getUserName(event);
  return handleDescriptionSubmit(event, userEmail, userName, params);
}

function cancelTicket(event) {
  const userEmail = getUserEmail(event);
  clearUserState(userEmail);
  return createTextResponse('❌ Ticket creation cancelled.');
}
