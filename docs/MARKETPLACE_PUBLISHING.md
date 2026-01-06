# Publishing Tech Support Bot to Google Workspace Marketplace (Private/Internal)

## Overview

Publishing privately to the Marketplace makes your app available to **everyone in your domain** automatically - no need to manually add individual emails.

**Good news:** Private apps are published **immediately** with no Google review required.

---

## Prerequisites Checklist

Before starting, ensure you have:

- [x] GCP Project: `ams-techsupport-bot-02`
- [x] Apps Script deployed as Add-on (you have a Deployment ID)
- [x] OAuth consent screen configured
- [ ] App icon (128x128 PNG)
- [ ] At least 1 screenshot
- [ ] Terms of Service URL (can be a simple Google Doc)
- [ ] Privacy Policy URL (can be a simple Google Doc)

---

## Step-by-Step Guide

### Step 1: Prepare Your Assets

Before going to GCP, prepare these files:

#### Required Graphics

| Asset | Size | Format | Description |
|-------|------|--------|-------------|
| **App Icon** | 128x128 px | PNG | Main app icon |
| **Screenshot 1** | 1280x800 px (min) | PNG/JPG | Show ticket creation |
| **Screenshot 2** | 1280x800 px | PNG/JPG | Show status view (optional but recommended) |

#### App Details (copy these)

| Field | Value |
|-------|-------|
| **App Name** | Tech Support Bot |
| **Short Description** | AI-powered IT helpdesk chatbot for ticket management |
| **Category** | Productivity / IT & Admin |

#### Long Description (copy this)

```
Tech Support Bot is an AI-powered IT helpdesk solution for schools and organizations.

Features:
• Create support tickets via Google Chat
• Automatic ticket assignment to IT staff
• AI-powered troubleshooting assistance
• Photo attachments for error screenshots
• Email notifications for updates
• Staff schedule and leave management

Built on Google Workspace - no additional software needed.
```

---

### Step 2: Enable Google Workspace Marketplace SDK

1. Go to GCP Console: https://console.cloud.google.com

2. Select your project: `ams-techsupport-bot-02`

3. Go to **APIs & Services** → **Library**

4. Search for: `Google Workspace Marketplace SDK`

5. Click **Enable**

---

### Step 3: Configure App Settings

1. After enabling, go to the **Marketplace SDK Configuration page**:
   
   https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk

2. Fill out **App Configuration** section:

#### App Visibility
- Select: **Private** *(Important! This makes it internal to your domain)*

#### Installation Settings
- Select: **Admin Only Install** (recommended for IT control)
  - OR **Individual + Admin Install** if you want users to self-install

#### App Integration
- Check: **Google Chat app**

#### Google Workspace Add-on (Deployment ID)
- Click **Select Deployment**
- Paste your Apps Script Deployment ID:
  - To find it: Apps Script → Deploy → Manage Deployments → Copy ID

#### OAuth Scopes
- These should auto-populate from your Apps Script manifest
- Verify they include:
  - `https://www.googleapis.com/auth/spreadsheets`
  - `https://www.googleapis.com/auth/script.external_request`
  - `https://www.googleapis.com/auth/gmail.send`

#### Developer Information
| Field | Value |
|-------|-------|
| Developer Name | Anita Methodist School IT |
| Developer Email | ict.facilitator@anitamethodist.com |
| Developer Website | (your school website or leave blank) |

3. Click **Save Draft**

---

### Step 4: Create Store Listing

1. Go to **Store Listing** tab (same SDK page):

   https://console.cloud.google.com/apis/api/appsmarket-component.googleapis.com/googleapps_sdk_publish

2. Fill out **App Details**:

| Field | Value |
|-------|-------|
| App Name | Tech Support Bot |
| Short Description | AI-powered IT helpdesk chatbot for ticket management and support |
| Detailed Description | (use the long description from Step 1) |
| Category | Education → Education Admin |
| Language | English |

3. Upload **Graphic Assets**:
   - **App Icon**: Upload your 128x128 PNG
   - **Screenshots**: Upload at least 1 screenshot (1280x800 or larger)

4. Fill out **Support Links**:

| Field | Value |
|-------|-------|
| Terms of Service URL | Create a Google Doc with simple terms, get share link |
| Privacy Policy URL | Create a Google Doc with simple policy, get share link |
| Support Email | ict.facilitator@anitamethodist.com |

5. **Distribution** (optional):
   - Leave "All Regions" selected, or select India only

6. Click **Save Draft**

---

### Step 5: Publish

1. Review all sections - make sure there are no red warning icons

2. Click **Submit For Review**

3. Since this is a **Private** app, it will be **published immediately!**

---

### Step 6: Install for Your Organization

After publishing:

1. Go to **Google Admin Console**: https://admin.google.com

2. Navigate to: **Apps** → **Google Workspace Marketplace apps** → **Apps list**

3. Find **Tech Support Bot** in the internal apps

4. Click it → **Install** → Choose:
   - **Everyone in this organization** (all users)
   - OR specific Organizational Units

5. Click **Continue** → **Finish**

---

### Step 7: Verify Access

1. Have a staff member search for "Tech Support Bot" in Google Chat

2. They should find it without needing to be manually added to visibility list

3. On first use, they'll need to authorize (normal for Add-ons)

---

## Quick Reference: Terms of Service Template

Create a Google Doc with this content (or customize):

```
TECH SUPPORT BOT - TERMS OF SERVICE

1. This application is provided for internal use by [Your School Name] staff only.

2. By using this bot, you agree to use it responsibly for IT support requests.

3. All data is stored in the organization's Google Workspace account.

4. The IT department reserves the right to modify or discontinue the service.

5. For questions, contact: ict.facilitator@anitamethodist.com

Last updated: January 2026
```

---

## Quick Reference: Privacy Policy Template

Create a Google Doc with this content (or customize):

```
TECH SUPPORT BOT - PRIVACY POLICY

Data Collected:
- Your email address (from Google account)
- Your name (from Google account)
- Ticket descriptions and photos you submit
- Ticket status and notes

Data Storage:
- All data is stored in Google Sheets within the organization's Google Workspace

Data Sharing:
- Data is not shared with any third parties
- Data is accessible only to IT support staff

Data Retention:
- Ticket data is retained for operational purposes

Contact:
For privacy questions, contact: ict.facilitator@anitamethodist.com

Last updated: January 2026
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Enable billing" warning | Ignore for private apps (no charges) |
| Missing deployment ID | Apps Script → Deploy → Manage Deployments |
| Screenshot size error | Resize to at least 1280x800 pixels |
| Can't find Store Listing tab | Enable Marketplace SDK first |
| App not visible after publish | Wait 5-10 minutes, then refresh Marketplace |

---

## Summary

| Step | Action | Time |
|------|--------|------|
| 1 | Prepare assets (icon, screenshots, docs) | 15 min |
| 2 | Enable Marketplace SDK | 2 min |
| 3 | Configure app settings | 10 min |
| 4 | Create store listing | 10 min |
| 5 | Publish | 1 min |
| 6 | Install in Admin Console | 5 min |
| **Total** | | **~45 minutes** |

Once published, all staff in your domain can discover and use the bot without manual email entry!
