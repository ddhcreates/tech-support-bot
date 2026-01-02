# 🏫 Tech Support Bot - Complete Setup Guide

A step-by-step guide to deploy this IT helpdesk chatbot for your school. No coding experience required!

---

## 📋 What You'll Need Before Starting

Before you begin, gather these:

| Item | What It Is | Where to Get It |
|------|-----------|-----------------|
| Google Workspace Admin access | To create/configure apps | Your school's IT admin |
| A Google Cloud Platform account | Free, for bot configuration | console.cloud.google.com |
| A Google Sheet | To store ticket data | You'll create this |
| 30-60 minutes | Setup time | ☕ Grab a coffee! |

---

## 🎯 What You'll Create

By the end of this guide, you'll have:
- ✅ A chatbot in Google Chat that your staff can message
- ✅ Automatic ticket creation and tracking
- ✅ AI-powered responses (using Google's Gemini)
- ✅ Email notifications
- ✅ Photo attachment support
- ✅ Staff scheduling and rotation

---

# Part 1: Create Your Google Sheet

The bot stores all tickets in a Google Sheet. Let's set that up first.

## Step 1.1: Create a New Spreadsheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Click **+ Blank** to create a new spreadsheet
3. Name it: `Tech Support Tickets`

## Step 1.2: Create the "Requests" Tab

This is where tickets are stored.

1. At the bottom, you'll see a tab called "Sheet1"
2. **Right-click** on it → **Rename** → Type `Requests`
3. In **Row 1**, add these column headers:

| Column | Header |
|--------|--------|
| A | Timestamp |
| B | Ticket ID |
| C | Legacy1 |
| D | User Name |
| E | Ticket Type |
| F | Description |
| G | Legacy2 |
| H | Legacy3 |
| I | User Email |
| J | Legacy4 |
| K | Assigned To |
| L | Location |
| M | Legacy5 |
| N | Legacy6 |
| O | Priority |
| P | Additional Info |
| Q | Notes |
| R | Status |

4. **Freeze Row 1**: Click **View** → **Freeze** → **1 row**

## Step 1.3: Create the "Schedule" Tab

This manages staff duty rotation.

1. Click the **+** at the bottom to add a new sheet
2. Name it `Schedule`
3. Add these columns in Row 1:

| Column | Header |
|--------|--------|
| A | Day |
| B | Staff Names (comma-separated) |
| C | Last Assigned Index |

4. Fill in your schedule (example):

| A | B | C |
|---|---|---|
| Day | Staff Names | Last Assigned Index |
| Monday | John Doe, Jane Smith | 0 |
| Tuesday | John Doe, Jane Smith | 0 |
| Wednesday | John Doe | 0 |
| Thursday | Jane Smith, Mike Wilson | 0 |
| Friday | Mike Wilson, John Doe | 0 |

## Step 1.4: Create the "Leave" Tab

For managing staff time off.

1. Click **+** to add a new sheet
2. Name it `Leave`
3. Add columns:

| Column | Header |
|--------|--------|
| A | Staff Name |
| B | Leave Start |
| C | Leave End |
| D | Reason |

## Step 1.5: Copy the Sheet ID

1. Look at your browser's address bar
2. The URL looks like: `https://docs.google.com/spreadsheets/d/`**`XXXXXXXXXXXXXXXXXX`**`/edit`
3. Copy the long string of letters and numbers (the **XXXXXXXXXX** part)
4. **Save this!** You'll need it later.

---

# Part 2: Set Up Google Cloud Platform

## Step 2.1: Create a GCP Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Sign in with your Google Workspace account
3. Click the project dropdown (top left, next to "Google Cloud")
4. Click **New Project**
5. Project name: `school-techsupport-bot` (or similar)
6. Click **Create**
7. Wait for it to create, then select it from the dropdown

## Step 2.2: Enable the Google Chat API

1. In the search bar at the top, type: `Google Chat API`
2. Click on **Google Chat API** in the results
3. Click the blue **Enable** button
4. Wait for it to enable

## Step 2.3: Configure the Chat App

1. After enabling, click **Configuration** in the left menu
2. Fill in the following:

### App Information
| Field | What to Enter |
|-------|---------------|
| App name | Tech Support Bot |
| Avatar URL | (leave blank or add an icon URL) |
| Description | IT helpdesk bot for our school |

### Functionality
- ☑️ **Check:** Receive 1:1 messages
- ☑️ **Check:** Join spaces and group conversations

### Connection Settings
| Field | What to Select |
|-------|---------------|
| App URL | Apps Script project |

*(We'll add the Deployment ID later)*

### Slash Commands

Click **Add Slash Command** for each of these:

| Command ID | Name | Description |
|------------|------|-------------|
| 1 | /ticket | Create a support ticket |
| 2 | /status | Check or update ticket status |
| 3 | /leave | Request time off (staff) |
| 4 | /schedule | View duty roster (staff) |
| 5 | /help | Show available commands |

### Visibility
| Field | What to Select |
|-------|---------------|
| Make this Chat app available to specific people and groups | Select your school's domain |

5. Click **Save** (but don't close this page yet!)

---

# Part 3: Get a Gemini API Key

The bot uses Google's AI (Gemini) to provide smart responses.

## Step 3.1: Get Your API Key

1. Open a new tab and go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **Get API Key** (top right or in the menu)
4. Click **Create API Key**
5. Select your GCP project
6. **Copy the API key** that appears
7. **Save this somewhere safe!** You'll need it later.

> ⚠️ **Important:** Keep this key secret! Don't share it or post it publicly.

---

# Part 4: Create the Apps Script Project

## Step 4.1: Create a New Project

1. Go to [script.google.com](https://script.google.com)
2. Click **New Project**
3. Click on "Untitled project" at the top
4. Name it: `Tech Support Bot`

## Step 4.2: Create the Script Files

You need to create these files. For each one:
1. Click **+** next to "Files" in the left sidebar
2. Select **Script**
3. Name it (without the .gs extension - it adds automatically)
4. Delete any default code
5. Paste the code provided below

### File 1: Code.gs

Create a file named `Code` and paste this **entire** content:

```javascript
/**
 * Tech Support Bot - Main Entry Point
 * 
 * ⚠️ CONFIGURATION REQUIRED: Update the values below for your school
 */

// ==================== YOUR CONFIGURATION - UPDATE THESE! ====================

// Your Google Sheet ID (from Part 1, Step 1.5)
const SHEET_ID = 'YOUR_SHEET_ID_HERE';

// Optional: Knowledge Base Sheet ID (leave empty if not using)
const KB_SHEET_ID = '';

// Your Google Chat Space ID (get this after adding bot to a space)
const TECH_SUPPORT_SPACE = 'spaces/YOUR_SPACE_ID';

// Gemini AI Configuration (don't change unless models change)
const GEMINI_MODEL_FLASH = 'gemini-2.0-flash';
const GEMINI_MODEL_PRO = 'gemini-1.5-pro-latest';

// ==================== SUPPORT STAFF - UPDATE FOR YOUR SCHOOL ====================
// Add all your IT support staff here

const SUPPORT_STAFF = [
  { name: 'Your Name', email: 'your.email@yourschool.edu', role: 'ICT Head' },
  { name: 'Staff Member 2', email: 'staff2@yourschool.edu', role: 'Support' },
  { name: 'Staff Member 3', email: 'staff3@yourschool.edu', role: 'Support' }
  // Add more staff as needed - do NOT use Mr/Mrs prefixes
];

// ==================== TICKET TYPES - CUSTOMIZE AS NEEDED ====================

const TICKET_TYPES = {
  '1': { key: 'printer', name: 'Printer Problem', icon: '🖨️' },
  '2': { key: 'wifi', name: 'WiFi/Network Issue', icon: '📶' },
  '3': { key: 'account', name: 'Account/Password Help', icon: '🔑' },
  '4': { key: 'projector', name: 'Projector/Display', icon: '📽️' },
  '5': { key: 'computer', name: 'Computer Problem', icon: '💻' },
  '6': { key: 'speaker', name: 'Speaker/Audio', icon: '🔊' },
  '7': { key: 'software', name: 'Software Issue', icon: '💾' },
  '8': { key: 'cctv', name: 'CCTV/Security', icon: '📹' },
  '9': { key: 'student_ipad', name: 'Student iPad', icon: '📱' },
  '10': { key: 'biometric', name: 'Biometric/Attendance', icon: '👆' },
  '11': { key: 'inventory', name: 'Inventory Request', icon: '📦' }
};

// ==================== DO NOT MODIFY BELOW THIS LINE ====================
// (Unless you know what you're doing!)

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
```

---

*(Continue with the remaining files in the same way. Each file should be created separately in Apps Script.)*

**For the remaining files, copy them from:** 
- `TicketManager.gs`
- `GeminiService.gs` 
- `ScheduleManager.gs`
- `NotificationService.gs`
- `LoggingService.gs`

*(These files are provided in the full code package)*

---

## Step 4.3: Update the Manifest

1. In the left sidebar, click on **Project Settings** (gear icon)
2. Check **Show "appsscript.json" manifest file in editor**
3. Go back to Editor
4. Click on `appsscript.json`
5. Replace the contents with:

```json
{
    "timeZone": "Asia/Kolkata",
    "exceptionLogging": "STACKDRIVER",
    "runtimeVersion": "V8",
    "oauthScopes": [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/script.external_request",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/script.send_mail"
    ]
}
```

**Note:** Change `Asia/Kolkata` to your timezone if needed.

## Step 4.4: Add the Gemini API Key

1. Click **Project Settings** (gear icon) in the left sidebar
2. Scroll down to **Script Properties**
3. Click **Add script property**
4. Property: `GEMINI_API_KEY`
5. Value: Paste your API key from Part 3
6. Click **Save**

## Step 4.5: Deploy the Bot

1. Click **Deploy** → **New deployment**
2. Click the gear icon next to "Select type"
3. Select **Add-on**
4. Description: `Initial deployment`
5. Click **Deploy**
6. **IMPORTANT:** Copy the **Deployment ID** that appears
7. Click **Done**

## Step 4.6: Connect to GCP

1. Go back to your GCP Console tab (Chat API Configuration)
2. Find the **Deployment ID** field
3. Paste your Deployment ID
4. Click **Save**

---

# Part 5: Create a Support Space

## Step 5.1: Create the Space

1. Open Google Chat
2. Click **+** next to Spaces
3. Click **Create Space**
4. Name: `Tech Support Team`
5. Add your IT staff members
6. Click **Create**

## Step 5.2: Add the Bot to the Space

1. In your new Space, click the Space name at the top
2. Click **Apps & integrations**
3. Click **Add apps**
4. Search for **Tech Support Bot**
5. Click **Add**

## Step 5.3: Get the Space ID

1. Look at the URL - it will look like: `https://chat.google.com/room/XXXXXXX`
2. The Space ID format is: `spaces/XXXXXXX`
3. Update `TECH_SUPPORT_SPACE` in Code.gs with this value

## Step 5.4: Set Up Space Webhook (for notifications)

1. In the Space, click the Space name → **Apps & integrations**
2. Find **Incoming Webhooks** and click **Add**
3. Name it: `Bot Notifications`
4. Copy the webhook URL
5. In Apps Script, go to **Project Settings** → **Script Properties**
6. Add: `SPACE_WEBHOOK_URL` = (paste the webhook URL)

---

# Part 6: Test Your Bot

## Step 6.1: Test Functions

In Apps Script:

1. Select `testGeminiDirectly` from the function dropdown
2. Click **Run**
3. Check the logs - should say "Hello, the Gemini API is working!"

4. Select `testEmailSending`
5. Update the email in the function to your email
6. Click **Run**
7. Check your email for the test message

## Step 6.2: Test the Bot

1. Open Google Chat
2. Search for **Tech Support Bot**
3. Start a conversation
4. Type `/help` - should see commands
5. Type `/ticket` - should see ticket type buttons
6. Complete a test ticket

---

# Part 7: Customize for Your School

## Things to Update

### In Code.gs:

| Variable | What to Change |
|----------|---------------|
| `SHEET_ID` | Your Google Sheet ID |
| `TECH_SUPPORT_SPACE` | Your Space ID |
| `SUPPORT_STAFF` | Your staff names and emails |
| `TICKET_TYPES` | Add/remove ticket types for your needs |

### In NotificationService.gs:

| Function | What to Change |
|----------|---------------|
| Email templates | Update school name in emails |
| `testEmailSending()` | Update test email address |

### In appsscript.json:

| Property | What to Change |
|----------|---------------|
| `timeZone` | Your timezone |

---

# Part 8: Going Live

## Checklist Before Launch

- [ ] All staff added to `SUPPORT_STAFF` array
- [ ] Google Sheet shared with all staff
- [ ] Schedule tab filled in
- [ ] Bot tested with /ticket flow
- [ ] Emails sending correctly
- [ ] Space notifications working

## Rolling Out to Staff

1. Share the Space with all staff
2. Distribute the USER_GUIDE.md
3. Give STAFF_GUIDE.md to IT team
4. Test with a few users first
5. Announce to the whole school!

---

# 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Bot not responding | Check Deployment ID in GCP matches Apps Script |
| "Unable to process" | Check for errors in Apps Script Executions |
| Gemini not working | Verify API key in Script Properties |
| Emails not sending | Check appsscript.json has email scopes |
| Cards not showing | Ensure response format uses hostAppDataAction wrapper |

## Getting Help

- **Google Chat API Docs:** https://developers.google.com/chat
- **Apps Script Docs:** https://developers.google.com/apps-script
- **Gemini AI Docs:** https://ai.google.dev/docs

---

# 📦 Complete File Package

Make sure you have all these files:

| File | Purpose |
|------|---------|
| Code.gs | Main entry point |
| TicketManager.gs | Ticket operations |
| GeminiService.gs | AI integration |
| ScheduleManager.gs | Staff scheduling |
| NotificationService.gs | Emails & webhooks |
| LoggingService.gs | Audit logging |
| appsscript.json | Configuration |

---

*Happy deploying! 🚀*

*If this works for your school, pass it on! 🎓*
