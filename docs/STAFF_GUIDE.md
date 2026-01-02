# 🛠️ Tech Support Bot - Staff Guide

A practical guide for the IT Support Team on using the Tech Support Bot efficiently.

---

## 📍 Quick Reference

| What You Want | Command |
|--------------|---------|
| See tickets assigned to me | `/status mine` |
| Update a ticket status | `/status 0042 Resolved` |
| Add a note to a ticket | `/status 0042 note Called user, waiting callback` |
| View schedule | `/schedule` |
| Request leave | `/leave` |
| All commands | `/help` |

---

## 🎫 Managing Tickets

### Viewing Your Tickets

Type `/status mine` to see all open tickets assigned to you.

You'll see:
- Ticket ID (e.g., #0042)
- Issue type (Printer, WiFi, etc.)
- Location
- Priority
- Who submitted it
- Brief description

**Example output:**
```
📋 Tickets Assigned to Mr Daniel Herbert:

#0042 - Printer Problem
  📍 Z009 | ⚡ High | Pending
  From: Mrs Teacher
  _Paper jam, tried removing but still stuck..._

#0043 - WiFi/Network Issue
  📍 Library | ⚡ Medium | In Progress
  From: Mr Staff
  _Cannot connect to WiFi on laptop..._
```

---

### Updating Ticket Status

To change a ticket's status:

```
/status [ticket number] [new status]
```

**Examples:**
- `/status 0042 In Progress` - Started working on it
- `/status 0042 Resolved` - Issue fixed
- `/status 0042 Waiting for Parts` - Need to order something
- `/status 0042 Closed` - Completed

**What happens:**
1. ✅ Status updates in the Google Sheet
2. 📧 User gets an email notification
3. 💬 Team gets notified in the Tech group space
4. 📝 Action logged with timestamp

---

### Adding Notes Without Changing Status

Sometimes you need to document progress without changing the status:

```
/status [ticket number] note [your notes]
```

**Examples:**
- `/status 0042 note Called user, no answer. Will try again at 2pm`
- `/status 0042 note Ordered replacement toner, arriving Friday`
- `/status 0042 note Met with user, issue is actually with projector not computer`

**What happens:**
1. 📝 Note saved in the Sheet (Notes column)
2. 💬 Team notified in Tech group space
3. Timestamp and your name automatically added

---

## 📅 Schedule & Leave

### Checking the Schedule

Type `/schedule` to see the weekly duty roster.

Shows:
- Who's assigned each day
- Today highlighted
- Leave information

---

### Requesting Leave

Type `/leave` to see leave request instructions.

Leave is managed in the Google Sheet:
1. Open the **Tech Support Sheet**
2. Go to the **Leave** tab
3. Add your leave dates

The bot will automatically skip you in ticket assignments when you're on leave.

---

## 📷 Tickets with Photos

When a user sends a photo:
- The bot analyzes it with AI
- Photo reference is saved with the ticket
- You'll see "📷 [Photo attached]" in the description
- Attachment info is in the Additional Info column

**Tip:** If you need to see the original photo, ask the user to resend it or check if they included it in a follow-up email.

---

## 📬 Notifications You'll Receive

### Ticket Assignment

When you're assigned a new ticket, you get an email with:
- Ticket ID
- Issue type and description
- Who submitted it
- Location
- Priority

### Space Notifications

The Tech group space shows:
- 🆕 New tickets created
- 📝 Status updates
- Notes added to tickets

**Stay in the group!** It's the fastest way to see what's happening.

---

## 🔄 Daily Workflow

### Morning
1. Check `/status mine` for your assigned tickets
2. Review priority - tackle 🔴 Urgent and 🟠 High first
3. Check the Tech group space for overnight tickets

### During the Day
1. Update status as you work: `/status [ID] In Progress`
2. Add notes for anything worth remembering
3. Watch for new assignments in the Space

### When You Fix Something
1. Update status: `/status [ID] Resolved`
2. User automatically gets an email notification
3. Ticket marked complete in the Sheet

### End of Day
1. Check `/status mine` for anything still open
2. Add notes on progress for tomorrow
3. Hand off urgent items if needed

---

## ⚡ Priority Guide

| Priority | Meaning | Response Time |
|----------|---------|---------------|
| 🔴 Urgent | Emergency - school operations affected | ASAP |
| 🟠 High | Blocking someone's work | Within 2 hours |
| 🟡 Medium | Affects work but can manage | Same day |
| 🟢 Low | Nice to fix when possible | Within 48 hours |

---

## 💡 Tips & Tricks

### Quick Status Updates
You can use short status names:
- `Resolved` or `Fixed` or `Done`
- `In Progress` or `Working`
- `Waiting` or `On Hold`

### Multiple Issues
If a user has multiple problems:
- Have them create separate tickets for each
- Easier to track and assign

### Escalation
For issues you can't solve:
- Add a note with what you tried
- Update status to `Escalated`
- Mention in the Tech group space

### When the Bot is Down
- Check the Google Sheet directly
- Users can email ict.facilitator@anitamethodist.com
- Contact the administrator

---

## 📊 The Google Sheet

All ticket data lives in the Google Sheet:
- **Requests tab** - All tickets
- **Schedule tab** - Duty roster
- **Leave tab** - Staff leave dates
- **ChatLogs tab** - Bot interaction logs

You have view/edit access to update tickets manually if needed.

---

## 🆘 Getting Help

**Bot issues?** Contact the ICT Facilitator

**System problems?** Check the ADMIN_GUIDE.md

**Google Sheet questions?** Ask the team lead

---

*Thank you for keeping our tech running! 🎓*
