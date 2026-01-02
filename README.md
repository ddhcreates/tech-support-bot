# 🤖 Tech Support Bot for Google Chat

A Google Workspace Add-on that provides an IT helpdesk ticketing system via Google Chat, with Gemini AI integration for smart responses.

## ✨ Features

- 🎫 **Interactive Ticket Creation** - Card-based UI with ticket types, locations, priorities
- 📷 **Photo Support** - Users can send photos of issues, analyzed by Gemini AI
- 🤖 **AI-Powered Responses** - Smart suggestions using Google Gemini
- 📋 **Staff Dashboard** - View assigned tickets, add notes, update status
- 📧 **Email Notifications** - Automatic confirmations and updates
- 📊 **Google Sheets Backend** - All data stored in Google Sheets
- 🔄 **Automatic Assignment** - Round-robin staff rotation
- 📅 **Schedule Management** - Weekly duty roster and leave tracking

## 🏫 Perfect For

- Schools and educational institutions
- Small to medium organizations
- IT helpdesk teams using Google Workspace

## 📋 Prerequisites

- Google Workspace account (domain admin recommended)
- Google Cloud Platform project
- Gemini API key (free tier available)

## 🚀 Quick Start

### 1. Create Google Sheet

1. Create a new Google Spreadsheet
2. Create tabs: `Requests`, `Schedule`, `Leave`
3. Copy the Sheet ID from the URL

### 2. Set Up GCP

1. Create a GCP project
2. Enable Google Chat API
3. Configure as Chat App with Apps Script deployment

### 3. Deploy to Apps Script

1. Create new Apps Script project
2. Copy all `.gs` files from `template/` folder
3. Copy `appsscript.json`
4. Update configuration in `Code.gs`:
   - `SHEET_ID` - Your Google Sheet ID
   - `SUPPORT_STAFF` - Your team members
   - `TICKET_TYPES` - Customize as needed

### 4. Set Up Service Account (Required for User Access)

The bot uses a service account so users don't need direct Sheet access:

1. **Create Service Account:**
   - GCP Console → IAM & Admin → Service Accounts
   - Create: `tech-support-bot`
   - Keys tab → Add Key → JSON → Download

2. **Share Sheet with Service Account:**
   - Copy service account email (e.g., `tech-support-bot@project.iam.gserviceaccount.com`)
   - Share your Google Sheet with this email as **Editor**

3. **Enable Google Sheets API:**
   - GCP Console → APIs & Services → Enable APIs
   - Search and enable **Google Sheets API**

4. **Add OAuth2 Library to Apps Script:**
   - Click **+** next to Libraries
   - Enter: `1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF`
   - Select latest version → Add

### 5. Configure Script Properties

In Apps Script → Project Settings → Script Properties, add:

| Property | Value |
|----------|-------|
| `GEMINI_API_KEY` | Your Gemini API key |
| `SPACE_WEBHOOK_URL` | Your Chat Space webhook URL |
| `SERVICE_ACCOUNT_KEY` | Entire JSON content of service account key file |

### 6. Deploy

1. Deploy → New deployment → Add-on
2. Copy Deployment ID
3. Paste into GCP Chat API configuration

## 📁 File Structure

```
template/
├── Code.gs              # Main entry point, configuration
├── TicketManager.gs     # Ticket creation and management
├── GeminiService.gs     # AI integration
├── ScheduleManager.gs   # Staff scheduling
├── NotificationService.gs # Emails and webhooks
├── LoggingService.gs    # Audit logging
├── SheetService.gs      # Service account authentication (NEW)
└── appsscript.json      # Manifest
```

## ⚙️ Configuration

### Support Staff

Edit `SUPPORT_STAFF` in `Code.gs`:

```javascript
const SUPPORT_STAFF = [
  { name: 'IT Admin', email: 'admin@yourschool.edu', role: 'ICT Head' },
  { name: 'Support 1', email: 'support1@yourschool.edu', role: 'Support' }
];
```

> **Note:** Do NOT use Mr/Mrs prefixes for better name matching.

### Ticket Types

Edit `TICKET_TYPES` in `Code.gs`:

```javascript
const TICKET_TYPES = {
  '1': { key: 'printer', name: 'Printer Problem', icon: '🖨️' },
  '2': { key: 'wifi', name: 'WiFi Issue', icon: '📶' }
  // Add more as needed
};
```

### Weekly Schedule

Edit `DEFAULT_WEEKLY_SCHEDULE` in `Code.gs`.

## 🔧 Slash Commands

| Command | Description |
|---------|-------------|
| `/ticket` | Create a support ticket |
| `/status` | View your open tickets |
| `/status mine` | (Staff) View assigned tickets |
| `/status [ID] [status]` | (Staff) Update ticket status |
| `/status [ID] note [text]` | (Staff) Add note to ticket |
| `/schedule` | (Staff) View duty roster |
| `/leave` | (Staff) Request time off |
| `/help` | Show available commands |

## 📊 Google Sheet Structure

### Requests Tab

| Column | Content |
|--------|---------|
| A | Timestamp |
| B | Ticket ID |
| D | User Name |
| E | Ticket Type |
| F | Description |
| I | User Email |
| K | Assigned To |
| L | Location |
| O | Priority |
| P | Additional Info |
| Q | Notes |
| R | Status |

## 🐛 Troubleshooting

### Test Functions

Run in Apps Script:

- `testServiceAccountAccess()` - Test service account connection
- `testGeminiDirectly()` - Test Gemini API
- `testEmailSending()` - Test email delivery
- `testRotation()` - Debug assignment rotation
- `resetScheduleSheet()` - Reset schedule structure

### Common Issues

| Issue | Solution |
|-------|----------|
| Bot not responding | Check Deployment ID in GCP |
| Users must "Configure" | Normal for Add-ons (one-time per user) |
| "Permission denied" for Sheet | Set up service account (see Step 4) |
| All tickets to one person | Run `resetScheduleSheet()` |
| Emails not sending | Check OAuth scopes in manifest |
| Service account error | Enable Google Sheets API in GCP |

## 📝 License

MIT License - Feel free to use, modify, and distribute.

## 🙏 Credits

Originally developed for [school name removed for privacy].

If this helps your organization, consider giving it a ⭐!

## 📚 Documentation

See the `docs/` folder for detailed guides:

- `USER_GUIDE.md` - For end users
- `STAFF_GUIDE.md` - For IT support staff
- `ADMIN_GUIDE.md` - For system administrators
- `DEPLOYMENT_GUIDE.md` - Step-by-step setup

---

Made with ❤️ for the education community
