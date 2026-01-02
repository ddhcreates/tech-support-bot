# 🔧 Tech Support Bot - Administrator Guide

Complete technical documentation for maintaining and administering the Tech Support Bot system.

---

## 📋 System Overview

### Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Google Chat    │────▶│  Google Apps Script  │────▶│  Google Sheets  │
│  (Users & Staff)│     │  (Bot Logic)         │     │  (Data Store)   │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                                  │
                                  ▼
                        ┌──────────────────┐
                        │  Gemini AI API   │
                        │  (Smart Responses)│
                        └──────────────────┘
```

### Account Ownership

| Component | Account | Notes |
|-----------|---------|-------|
| GCP Project | ict.facilitator@anitamethodist.com | API keys, Chat app config |
| Apps Script | automations@anitamethodist.com | Bot code, deployments |
| Gemini API | ict.facilitator@anitamethodist.com | API key stored in Script Properties |
| Google Sheet | Shared with both accounts | Data storage |

---

## 📁 File Structure

```
chatbot/
├── Code.gs                 # Main entry point, event handlers
├── TicketManager.gs        # Ticket creation, status, notes
├── GeminiService.gs        # AI responses, image analysis
├── ScheduleManager.gs      # Staff scheduling, assignments
├── NotificationService.gs  # Emails, Space webhooks, DM caching
├── LoggingService.gs       # Interaction logging
├── appsscript.json         # Manifest with scopes
└── docs/
    ├── USER_GUIDE.md       # End user documentation
    ├── STAFF_GUIDE.md      # Staff operations guide
    └── ADMIN_GUIDE.md      # This file
```

---

## 📄 File Descriptions

### Code.gs - Main Entry Point

**Purpose:** Handles all Google Chat events and routes to appropriate handlers.

**Key Functions:**
| Function | Purpose |
|----------|---------|
| `onMessage(event)` | Handles incoming messages, detects photos |
| `onAppCommand(event)` | Routes slash commands (/ticket, /status, etc.) |
| `onCardClick(event)` | Handles button clicks on interactive cards |
| `onAddedToSpace(event)` | Welcome message when bot added |
| `handlePhotoMessage()` | Processes photo attachments |
| `createTextResponse()` | Formats text for Workspace Add-ons |
| `createCardResponse()` | Formats cards for Workspace Add-ons |

**Configuration Constants:**
```javascript
const SHEET_ID = '1y9DV4t62fn94M_cT3knObWBorrQ0G3Kbx4MpLpVvWb4';
const KB_SHEET_ID = '';  // Optional Knowledge Base
const TECH_SUPPORT_SPACE = 'spaces/AAQA0I8YXwE';
const GEMINI_MODEL_FLASH = 'gemini-2.0-flash';
const GEMINI_MODEL_PRO = 'gemini-1.5-pro-latest';
```

**Staff List (update when team changes):**
```javascript
const SUPPORT_STAFF = [
  { name: 'Daniel Herbert', email: 'ict.facilitator@anitamethodist.com', role: 'ICT Head' },
  { name: 'Saravanakumar K', email: 'systemsadmin@anitamethodist.com', role: 'Admin' },
  { name: 'Shummy Metilda', email: 'shummy.metilda@anitamethodist.com', role: 'Support' },
  { name: 'Anitha Christiba', email: 'anita.prince@anitamethodist.com', role: 'Support' },
  { name: 'Esther Preethi', email: 'esther.preethi@anitamethodist.com', role: 'Support' }
];
```

> **Note:** Staff names should NOT include Mr/Mrs prefixes for better matching with Sheet data.

---

### TicketManager.gs - Ticket Operations

**Purpose:** Card-based ticket creation flow, status updates, notes.

**Key Functions:**
| Function | Purpose |
|----------|---------|
| `startTicketFlow()` | Initiates ticket creation with type buttons |
| `handleTypeSelection()` | Processes ticket type selection |
| `handleLocationSelection()` | Processes location input |
| `handleDescriptionSubmit()` | Final submission with priority |
| `createTicketInSheet()` | Saves ticket to Google Sheet |
| `handleStatusCommand()` | Routes /status subcommands |
| `getStaffAssignedTickets()` | Shows tickets assigned to staff |
| `addTicketNote()` | Adds notes without status change |
| `updateTicketStatus()` | Changes ticket status |

**Ticket Types (modify to add/remove):**
```javascript
const TICKET_TYPES = {
  '1': { key: 'printer', name: 'Printer Problem', icon: '🖨️' },
  '2': { key: 'wifi', name: 'WiFi/Network Issue', icon: '📶' },
  // ... more types
};
```

---

### GeminiService.gs - AI Integration

**Purpose:** Gemini AI for smart responses and image analysis.

**Key Functions:**
| Function | Purpose |
|----------|---------|
| `callGemini()` | Core API call to Gemini |
| `handleWithGemini()` | Processes user messages with AI |
| `getKBContext()` | Retrieves relevant FAQ context |
| `analyzeImageWithGemini()` | Analyzes photo attachments |
| `categorizeIssue()` | Auto-categorizes ticket descriptions |
| `testGeminiDirectly()` | Test function for debugging |

**Gemini API Configuration:**
- API Key stored in: Script Properties → `GEMINI_API_KEY`
- Model: `gemini-2.0-flash` (fast, multimodal capable)
- Fallback: `gemini-1.5-pro-latest` (complex tasks)

---

### ScheduleManager.gs - Staff Scheduling

**Purpose:** Daily assignments, leave management, rotation.

**Key Functions:**
| Function | Purpose |
|----------|---------|
| `getAvailableStaffForToday()` | Gets staff available (excluding leave) |
| `getNextAssignment()` | Round-robin assignment with logging |
| `handleScheduleCommand()` | Shows weekly roster |
| `handleLeaveCommand()` | Leave request info |
| `updateLastAssignedIndex()` | Tracks rotation |
| `testRotation()` | **Diagnostic:** Debug rotation issues |
| `resetScheduleSheet()` | **Diagnostic:** Reset Schedule sheet structure |

---

### NotificationService.gs - Communications

**Purpose:** Email, Space webhooks, direct notifications.

**Key Functions:**
| Function | Purpose |
|----------|---------|
| `sendToWebhook()` | Posts to Tech group space |
| `notifySpaceOfNewTicket()` | New ticket announcement |
| `notifySpaceOfUpdate()` | Status change notification |
| `sendTicketConfirmationEmail()` | Email to ticket creator |
| `sendStaffAssignmentEmail()` | Email to assigned staff |
| `sendStatusUpdateEmail()` | Status change email to user |
| `sendDailyTicketSummary()` | Daily summary (9 AM trigger) |
| `cacheStaffDMSpace()` | Caches staff DM space IDs |
| `testEmailSending()` | Test function |

**Space Webhook URL:**
Located in `getSpaceWebhookUrl()` - update if space changes.

---

### LoggingService.gs - Audit Trail

**Purpose:** Logs all interactions to ChatLogs sheet.

**Key Functions:**
| Function | Purpose |
|----------|---------|
| `logInteraction()` | Main logging function |
| `logErrorWithDetails()` | Error logging |
| `logMessageEvent()` | Message interaction logs |
| `logCommandEvent()` | Command logs |
| `logCardClickEvent()` | Button click logs |
| `logEmailEvent()` | Email send logs |
| `logGeminiEvent()` | AI interaction logs |

**Log Columns:**
Timestamp | Type | User | Input | Output | Success | Details | Error

---

## 🔐 Configuration & Secrets

### Script Properties

Access: Apps Script → Project Settings → Script Properties

| Property | Description | Owner |
|----------|-------------|-------|
| `GEMINI_API_KEY` | Gemini AI API key | ict.facilitator |
| `SPACE_WEBHOOK_URL` | Optional webhook override | - |

### OAuth Scopes (appsscript.json)

```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/script.send_mail"
  ]
}
```

---

## 🌐 GCP Configuration

### Project Details
- **Project:** ams-techsupport-bot-02
- **Owner:** ict.facilitator@anitamethodist.com

### Chat API Settings

Location: GCP Console → APIs & Services → Google Chat API → Configuration

| Setting | Value |
|---------|-------|
| App name | Tech Support Bot |
| Avatar URL | (your icon URL) |
| Description | IT helpdesk bot for Anita Methodist School |
| Functionality | Receive 1:1 messages, Join spaces |
| Connection | Apps Script Deployment |
| Deployment ID | (copy from Apps Script) |
| Slash Commands | /ticket, /status, /leave, /schedule, /help |
| Visibility | Internal (Anita Methodist Workspace) |

### Slash Command IDs

| ID | Command | Description |
|----|---------|-------------|
| 1 | /ticket | Create support ticket |
| 2 | /status | Check/update ticket status |
| 3 | /leave | Request time off |
| 4 | /schedule | View duty roster |
| 5 | /help | Show help message |

---

## 📊 Google Sheet Structure

### Sheet ID
`1y9DV4t62fn94M_cT3knObWBorrQ0G3Kbx4MpLpVvWb4`

### Requests Tab (Columns)

| Column | Letter | Content |
|--------|--------|---------|
| 1 | A | Timestamp |
| 2 | B | Ticket ID (#0001) |
| 3 | C | (Legacy) |
| 4 | D | User Name |
| 5 | E | Ticket Type |
| 6 | F | Description |
| 7 | G | (Legacy) |
| 8 | H | (Legacy) |
| 9 | I | User Email |
| 10 | J | (Legacy) |
| 11 | K | Assigned To |
| 12 | L | Location |
| 13 | M | (Legacy) |
| 14 | N | (Legacy) |
| 15 | O | Priority |
| 16 | P | Additional Info (attachments) |
| 17 | Q | Notes |
| 18 | R | Status |

### Schedule Tab
- Day of week
- Staff assignments
- Last assigned index (for rotation)

### Leave Tab
- Staff name
- Leave start date
- Leave end date
- Reason

### ChatLogs Tab (auto-created)
- Interaction logs for debugging

---

## 🚀 Deployment Process

### Creating a New Deployment

1. Open Apps Script project
2. Click **Deploy** → **New deployment**
3. Select type: **Add-on**
4. Fill in description
5. Click **Deploy**
6. Copy the **Deployment ID**

### Updating GCP

1. Go to GCP Console → Chat API → Configuration
2. Paste new **Deployment ID**
3. Save

### Testing Changes

For code changes that don't need new deployment:
1. Edit files in Apps Script
2. Save
3. Test directly (bot uses HEAD version)

For manifest changes (scopes, etc.):
1. Create new deployment
2. Update GCP with new Deployment ID
3. Test

---

## 🔧 Common Maintenance Tasks

### Adding a New Staff Member

1. Add to `SUPPORT_STAFF` array in Code.gs
2. Add to Schedule tab in Google Sheet
3. Share Google Sheet with their email

### Removing a Staff Member

1. Remove from `SUPPORT_STAFF` array
2. Remove from Schedule tab
3. Reassign any open tickets

### Adding a New Ticket Type

In TicketManager.gs, add to `TICKET_TYPES`:
```javascript
'12': { key: 'new_type', name: 'New Type Name', icon: '🆕' }
```

### Updating Gemini Model

In Code.gs, update constants:
```javascript
const GEMINI_MODEL_FLASH = 'gemini-2.0-flash';
```

### Changing Space Webhook

In NotificationService.gs, update `getSpaceWebhookUrl()` or set `SPACE_WEBHOOK_URL` in Script Properties.

### Rotating API Keys

1. Generate new key in Google AI Studio
2. Update Script Properties → `GEMINI_API_KEY`
3. Test with `testGeminiDirectly()` function

---

## 🐛 Debugging

### Test Functions

Run these in Apps Script to diagnose issues:

| Function | Purpose |
|----------|---------|
| `testGeminiDirectly()` | Test Gemini API connection |
| `testEmailSending()` | Test email delivery |
| `testLogging()` | Verify ChatLogs sheet |
| `testRotation()` | Debug ticket assignment rotation |
| `resetScheduleSheet()` | Reset Schedule sheet structure |

### Checking Logs

**Apps Script Logs:**
- Apps Script → Executions → View logs

**GCP Logs:**
- GCP Console → Logging → Logs Explorer
- Filter: `resource.type="chat.googleapis.com/Project"`

**ChatLogs Sheet:**
- Check the ChatLogs tab in Google Sheet
- Filter by Type: ERROR to see failures

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Bot not responding | Wrong deployment ID | Update GCP config |
| "Unable to process" | Missing function | Check for undefined functions |
| Cards not working | Wrong response format | Use Workspace Add-ons format |
| Gemini timeout | Model overloaded | Retry, or use flash model |
| Emails not sending | Missing scope | Add scope to manifest, redeploy |
| All tickets to one person | Schedule sheet wrong structure | Run `resetScheduleSheet()` |
| `/status mine` error | Data type issue | Ensure all Sheet cells are text |
| Users must "Configure" bot | Workspace Add-on requires auth | Normal - one-time per user |

---

## 🔄 Backup & Recovery

### Code Backup

All code is saved in:
`/Users/dan/Documents/Development/Antigravity/chatbot/`

Git recommended for version control.

### Data Backup

Google Sheet automatically has version history:
- File → Version history → See version history

### Disaster Recovery

1. Code: Restore from local files or Git
2. Create new Apps Script project
3. Copy all .gs files
4. Create new deployment
5. Update GCP Chat API with new Deployment ID
6. Test

---

## 📞 Support Contacts

| Issue | Contact |
|-------|---------|
| GCP/API issues | ict.facilitator@anitamethodist.com |
| Apps Script access | automations@anitamethodist.com |
| Bot functionality | ICT Facilitator |
| Google Workspace | Google Admin Console |

---

## 📎 Quick Links

- **Apps Script Project:** (link to your project)
- **GCP Console:** https://console.cloud.google.com/
- **Google Sheet:** https://docs.google.com/spreadsheets/d/1y9DV4t62fn94M_cT3knObWBorrQ0G3Kbx4MpLpVvWb4
- **AI Studio (API Keys):** https://aistudio.google.com/app/apikey
- **Chat API Config:** https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat

---

## ⚠️ Important Notes

### Workspace Add-on Authorization

This bot is deployed as a **Google Workspace Add-on**. This means:
- Each user must authorize the bot **once** when they first use it
- Users will see a "Configure" button on first interaction
- After authorizing, the bot works seamlessly
- This is normal and expected behavior for Add-ons

---

*Last updated: January 2, 2026*
