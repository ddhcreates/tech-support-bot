/**
 * Notification Service - Email, Space, and Staff DM notifications
 * With comprehensive logging
 */

// ==================== SPACE WEBHOOK ====================

/**
 * Gets the Space webhook URL from Script Properties
 * Set SPACE_WEBHOOK_URL in Apps Script Project Settings → Script Properties
 */
function getSpaceWebhookUrl() {
  const url = PropertiesService.getScriptProperties().getProperty('SPACE_WEBHOOK_URL');
  if (!url) {
    logInfo('getSpaceWebhookUrl', 'No webhook URL configured - set SPACE_WEBHOOK_URL in Script Properties');
  }
  return url || '';
}

function sendToWebhook(message) {
  try {
    const url = getSpaceWebhookUrl();
    if (!url) {
      logInfo('sendToWebhook', 'Webhook not configured, skipping notification');
      return;
    }
    
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ text: message }),
      muteHttpExceptions: true
    });
    
    const code = response.getResponseCode();
    if (code !== 200) {
      logError('sendToWebhook', new Error(`Webhook returned ${code}`), { response: response.getContentText() });
    } else {
      logInfo('sendToWebhook', 'Message sent to Space', { messageLength: message.length });
    }
    
  } catch (e) {
    logError('sendToWebhook', e);
  }
}

// ==================== SPACE NOTIFICATIONS ====================

function notifySpaceOfNewTicket(ticketId, userName, userEmail, ticketData, assignedStaff) {
  try {
    const msg = `🆕 *New Ticket: ${ticketId}*\n\n` +
      `*Type:* ${ticketData.ticketIcon} ${ticketData.ticketTypeName}\n` +
      `*From:* ${userName}\n` +
      `*Location:* ${ticketData.location}\n` +
      `*Priority:* ${ticketData.priority || 'Medium'}\n` +
      `*Assigned:* ${assignedStaff.name}\n\n` +
      `_${ticketData.description.substring(0, 100)}${ticketData.description.length > 100 ? '...' : ''}_`;
    
    sendToWebhook(msg);
    logInteraction('SPACE_NOTIFY', assignedStaff.email, ticketId, 'New ticket notification', true, '');
    
  } catch (e) {
    logError('notifySpaceOfNewTicket', e);
    logInteraction('SPACE_NOTIFY', assignedStaff?.email || 'unknown', ticketId, '', false, e.toString());
  }
}

function notifySpaceOfUpdate(ticketId, newStatus, staffName) {
  try {
    sendToWebhook(`📝 ${ticketId} → *${newStatus}* (by ${staffName})`);
    logInteraction('SPACE_NOTIFY', staffName, ticketId, 'Status update', true, newStatus);
  } catch (e) {
    logError('notifySpaceOfUpdate', e);
  }
}

// ==================== STAFF DM CACHING ====================

/**
 * Caches the DM space ID for a staff member so we can notify them later
 */
function cacheStaffDMSpace(staffEmail, spaceId) {
  try {
    if (!staffEmail || !spaceId) return;
    const cache = CacheService.getScriptCache();
    cache.put('dm_space_' + staffEmail, spaceId, 86400); // 24 hours
    logInfo('cacheStaffDMSpace', 'Cached DM space', { staffEmail, spaceId });
  } catch (e) {
    // Don't throw - this is optional caching
    console.error('cacheStaffDMSpace failed:', e);
  }
}

// ==================== STAFF DM NOTIFICATION ====================

function notifyStaffDirectly(ticketId, userName, userEmail, ticketData, assignedStaff) {
  try {
    // Always send email to assigned staff
    sendStaffAssignmentEmail(assignedStaff.email, assignedStaff.name, ticketId, userName, userEmail, ticketData);
    logInfo('notifyStaffDirectly', 'Staff notified via email', { staff: assignedStaff.name, ticketId });
  } catch (e) {
    logError('notifyStaffDirectly', e);
  }
}

// ==================== EMAIL NOTIFICATIONS ====================
// Update the organization name in the email signatures below

function sendTicketConfirmationEmail(userEmail, userName, ticketId, ticketData, assignedTo) {
  try {
    const subject = `IT Ticket ${ticketId} - ${ticketData.ticketTypeName}`;
    
    const body = `Dear ${userName},

Your support request has been logged:

Ticket ID: ${ticketId}
Type: ${ticketData.ticketTypeName}
Location: ${ticketData.location}
Priority: ${ticketData.priority || 'Medium'}
Description: ${ticketData.description}
Assigned to: ${assignedTo}

A support staff member will contact you shortly.

Regards,
IT Helpdesk
Your Organization Name`;  // <-- UPDATE THIS
    
    MailApp.sendEmail(userEmail, subject, body);
    logEmailEvent(userEmail, subject, true, null);
    logInfo('sendTicketConfirmationEmail', 'Email sent', { to: userEmail, ticketId });
    
  } catch (e) {
    logError('sendTicketConfirmationEmail', e, { userEmail, ticketId });
    logEmailEvent(userEmail, `Ticket ${ticketId} confirmation`, false, e.toString());
  }
}

function sendStaffAssignmentEmail(staffEmail, staffName, ticketId, userName, userEmail, ticketData) {
  try {
    const subject = `[Assigned] ${ticketId} - ${ticketData.ticketTypeName}`;
    
    const body = `Dear ${staffName},

A new support ticket has been assigned to you:

Ticket ID: ${ticketId}
Type: ${ticketData.ticketTypeName}
From: ${userName} (${userEmail})
Location: ${ticketData.location}
Priority: ${ticketData.priority || 'Medium'}

Issue:
${ticketData.description}

Please respond via Google Chat or contact the user directly.

Update status with: /status ${ticketId.replace('#', '')} [new status]
Add notes with: /status ${ticketId.replace('#', '')} note [your notes]

Regards,
Tech Support Bot`;
    
    MailApp.sendEmail(staffEmail, subject, body);
    logEmailEvent(staffEmail, subject, true, null);
    logInfo('sendStaffAssignmentEmail', 'Email sent', { to: staffEmail, ticketId });
    
  } catch (e) {
    logError('sendStaffAssignmentEmail', e, { staffEmail, ticketId });
    logEmailEvent(staffEmail, `Staff assignment ${ticketId}`, false, e.toString());
  }
}

function sendStatusUpdateEmail(userEmail, ticketId, newStatus, staffName, ticketType) {
  try {
    const subject = `Ticket ${ticketId} - ${newStatus}`;
    
    const body = `Your IT ticket ${ticketId} has been updated:

New Status: ${newStatus}
Updated by: ${staffName}
Time: ${new Date().toLocaleString('en-GB')}

If you have questions, reply to this email or contact IT.

Regards,
IT Helpdesk`;
    
    MailApp.sendEmail(userEmail, subject, body);
    logEmailEvent(userEmail, subject, true, null);
    
  } catch (e) {
    logError('sendStatusUpdateEmail', e);
    logEmailEvent(userEmail, `Status update ${ticketId}`, false, e.toString());
  }
}

// ==================== DAILY SUMMARY ====================

function sendDailyTicketSummary() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Requests');
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    let openCount = 0;
    const byAssignee = {};
    
    for (let i = 1; i < data.length; i++) {
      const status = data[i][17] || 'Pending';
      if (['pending', 'open', 'in progress'].includes(status.toLowerCase())) {
        openCount++;
        const assignee = data[i][10] || 'Unassigned';
        byAssignee[assignee] = (byAssignee[assignee] || 0) + 1;
      }
    }
    
    let summary = `📊 *Daily Summary*\n${new Date().toLocaleDateString('en-GB')}\n\n`;
    summary += `*Open Tickets:* ${openCount}\n\n`;
    
    if (Object.keys(byAssignee).length > 0) {
      summary += '*By Staff:*\n';
      Object.entries(byAssignee).forEach(([name, count]) => {
        summary += `• ${name}: ${count}\n`;
      });
    }
    
    sendToWebhook(summary);
    logInteraction('DAILY_SUMMARY', 'system', '', `Open: ${openCount}`, true, '');
    
  } catch (e) {
    logError('sendDailyTicketSummary', e);
  }
}

function setupDailySummary() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'sendDailyTicketSummary') {
      ScriptApp.deleteTrigger(t);
    }
  });
  
  ScriptApp.newTrigger('sendDailyTicketSummary')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
    
  return 'Daily summary trigger set for 9 AM';
}

// ==================== TEST EMAIL ====================

function testEmailSending() {
  // UPDATE THIS to your email address
  const testEmail = 'your.email@yourschool.edu';
  
  try {
    MailApp.sendEmail(testEmail, 'Tech Support Bot - Test Email', 
      'This is a test email from Tech Support Bot.\n\nIf you received this, emails are working!');
    Logger.log('✅ Email sent to: ' + testEmail);
    logEmailEvent(testEmail, 'Test Email', true, null);
    return 'Email sent to ' + testEmail;
  } catch (e) {
    Logger.log('❌ Email failed: ' + e.toString());
    logEmailEvent(testEmail, 'Test Email', false, e.toString());
    return 'Failed: ' + e.toString();
  }
}
