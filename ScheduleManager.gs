/**
 * Schedule Manager - Staff scheduling and leave management
 */

// ==================== SCHEDULE FUNCTIONS ====================

function initializeScheduleSheets() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    // Schedule sheet
    let scheduleSheet = ss.getSheetByName('Schedule');
    if (!scheduleSheet) {
      scheduleSheet = ss.insertSheet('Schedule');
      scheduleSheet.getRange(1, 1, 1, 8).setValues([
        ['Day', 'Staff_Email_1', 'Staff_Name_1', 'Staff_Email_2', 'Staff_Name_2', 'Staff_Email_3', 'Staff_Name_3', 'Last_Assigned_Index']
      ]);
      
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      days.forEach((day, idx) => {
        const emails = DEFAULT_WEEKLY_SCHEDULE[day] || [];
        const row = [day];
        for (let i = 0; i < 3; i++) {
          if (emails[i]) {
            const staff = ASSIGNABLE_STAFF.find(s => s.email === emails[i]);
            row.push(emails[i], staff?.name || 'Unknown');
          } else {
            row.push('', '');
          }
        }
        row.push(0);
        scheduleSheet.getRange(idx + 2, 1, 1, 8).setValues([row]);
      });
    }
    
    // Leave sheet
    let leaveSheet = ss.getSheetByName('Leave');
    if (!leaveSheet) {
      leaveSheet = ss.insertSheet('Leave');
      leaveSheet.getRange(1, 1, 1, 5).setValues([
        ['Staff_Email', 'Staff_Name', 'Start_Date', 'End_Date', 'Status']
      ]);
    }
  } catch (e) {
    logError('initializeScheduleSheets', e);
  }
}

function getAvailableStaffForToday() {
  try {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let scheduleSheet = ss.getSheetByName('Schedule');
    
    if (!scheduleSheet) {
      initializeScheduleSheets();
      scheduleSheet = ss.getSheetByName('Schedule');
    }
    
    const data = scheduleSheet.getDataRange().getValues();
    let scheduledStaff = [];
    let lastAssignedIndex = 0;
    let scheduleRowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === dayName) {
        scheduleRowIndex = i + 1;
        lastAssignedIndex = parseInt(data[i][7]) || 0;
        
        for (let j = 1; j < 7; j += 2) {
          if (data[i][j]) {
            scheduledStaff.push({ email: data[i][j], name: data[i][j + 1] });
          }
        }
        break;
      }
    }
    
    if (scheduledStaff.length === 0) {
      scheduledStaff = ASSIGNABLE_STAFF.map(s => ({ email: s.email, name: s.name }));
    }
    
    // Filter out staff on leave
    const leaveSheet = ss.getSheetByName('Leave');
    if (leaveSheet) {
      const leaveData = leaveSheet.getDataRange().getValues();
      const onLeave = [];
      
      for (let i = 1; i < leaveData.length; i++) {
        const start = new Date(leaveData[i][2]);
        const end = new Date(leaveData[i][3]);
        const status = leaveData[i][4];
        
        if (status === 'Active' && today >= start && today <= end) {
          onLeave.push(leaveData[i][0].toLowerCase());
        }
      }
      
      scheduledStaff = scheduledStaff.filter(s => !onLeave.includes(s.email.toLowerCase()));
    }
    
    return { availableStaff: scheduledStaff, lastAssignedIndex, scheduleRowIndex, dayName };
    
  } catch (e) {
    logError('getAvailableStaffForToday', e);
    return { availableStaff: ASSIGNABLE_STAFF, lastAssignedIndex: 0, scheduleRowIndex: -1, dayName: 'Unknown' };
  }
}

function getNextAssignment(assignmentInfo) {
  const { availableStaff, lastAssignedIndex } = assignmentInfo;
  
  logInfo('getNextAssignment', 'Calculating', { 
    staffCount: availableStaff.length, 
    lastIndex: lastAssignedIndex,
    staffNames: availableStaff.map(s => s.name)
  });
  
  if (availableStaff.length === 0) {
    logInfo('getNextAssignment', 'No staff available', {});
    return null;
  }
  
  // Calculate next index with proper modulo
  const nextIndex = lastAssignedIndex % availableStaff.length;
  assignmentInfo.nextIndex = nextIndex;
  
  const assignedStaff = availableStaff[nextIndex];
  
  logInfo('getNextAssignment', 'Assigned to', { 
    nextIndex, 
    assignedTo: assignedStaff.name,
    willUpdateTo: nextIndex + 1
  });
  
  return assignedStaff;
}

function updateLastAssignedIndex(rowIndex, newIndex) {
  try {
    if (rowIndex === -1) {
      logInfo('updateLastAssignedIndex', 'No row to update (rowIndex=-1)', {});
      return;
    }
    
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Schedule');
    if (!sheet) {
      logError('updateLastAssignedIndex', new Error('Schedule sheet not found'), {});
      return;
    }
    
    // Column 8 = Last_Assigned_Index
    sheet.getRange(rowIndex, 8).setValue(newIndex);
    
    logInfo('updateLastAssignedIndex', 'Updated', { rowIndex, newIndex });
  } catch (e) {
    logError('updateLastAssignedIndex', e, { rowIndex, newIndex });
  }
}

// ==================== LEAVE COMMAND ====================

function handleLeaveCommand(event, userEmail) {
  if (!isUserStaff(userEmail)) {
    return createTextResponse('❌ Only support staff can request leave.');
  }
  
  return createTextResponse(
    '📅 *Leave Request*\n\n' +
    'To request leave, please email ict.facilitator@anitamethodist.com with:\n' +
    '• Start date\n' +
    '• End date\n' +
    '• Reason\n\n' +
    '_Leave requests are processed manually for now._'
  );
}

// ==================== SCHEDULE COMMAND ====================

function handleScheduleCommand(event, userEmail) {
  if (!isUserStaff(userEmail)) {
    return createTextResponse('❌ Only support staff can view the schedule.');
  }
  
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let scheduleSheet = ss.getSheetByName('Schedule');
    
    if (!scheduleSheet) {
      initializeScheduleSheets();
      scheduleSheet = ss.getSheetByName('Schedule');
    }
    
    const data = scheduleSheet.getDataRange().getValues();
    const today = new Date();
    const todayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    
    let schedule = '📅 *Weekly Schedule*\n\n';
    
    for (let i = 1; i < data.length; i++) {
      const day = data[i][0];
      const staff = [];
      
      for (let j = 2; j < 7; j += 2) {
        if (data[i][j]) staff.push(data[i][j]);
      }
      
      const arrow = day === todayName ? '👉 ' : '    ';
      schedule += `${arrow}*${day}:* ${staff.join(', ') || 'None'}\n`;
    }
    
    // Show who's available today
    const availability = getAvailableStaffForToday();
    if (availability.availableStaff.length > 0) {
      schedule += `\n✅ *Available now:* ${availability.availableStaff.map(s => s.name).join(', ')}`;
    }
    
    return createTextResponse(schedule);
    
  } catch (e) {
    logError('handleScheduleCommand', e);
    return createTextResponse('❌ Error loading schedule.');
  }
}

// ==================== DIAGNOSTIC FUNCTIONS ====================

/**
 * Run this to diagnose rotation issues
 * In Apps Script: Select testRotation → Run → View Logs
 */
function testRotation() {
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  
  Logger.log('=== ROTATION DIAGNOSTIC ===');
  Logger.log('Today is: ' + dayName);
  
  // Check Schedule sheet
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const scheduleSheet = ss.getSheetByName('Schedule');
  
  if (!scheduleSheet) {
    Logger.log('❌ Schedule sheet NOT FOUND');
    Logger.log('Run initializeScheduleSheets() to create it');
    return;
  }
  
  Logger.log('✅ Schedule sheet exists');
  
  const data = scheduleSheet.getDataRange().getValues();
  Logger.log('Headers: ' + JSON.stringify(data[0]));
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    Logger.log(`Row ${i+1}: Day=${row[0]}, Email1=${row[1]}, Name1=${row[2]}, LastIndex=${row[7]}`);
    
    if (row[0] === dayName) {
      Logger.log('>>> This is today\'s row <<<');
    }
  }
  
  // Test getAvailableStaffForToday
  Logger.log('\n=== AVAILABLE STAFF ===');
  const availability = getAvailableStaffForToday();
  Logger.log('Available: ' + JSON.stringify(availability.availableStaff.map(s => s.name)));
  Logger.log('Last Index: ' + availability.lastAssignedIndex);
  Logger.log('Row Index: ' + availability.scheduleRowIndex);
  
  // Test rotation
  Logger.log('\n=== NEXT ASSIGNMENT ===');
  const nextStaff = getNextAssignment(availability);
  Logger.log('Would assign to: ' + nextStaff?.name);
  Logger.log('Next index would be: ' + (availability.nextIndex + 1));
  
  return 'Check Logs for diagnostic output';
}

/**
 * Run this to reset the Schedule sheet with proper structure
 */
function resetScheduleSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  
  // Delete existing if present
  const existing = ss.getSheetByName('Schedule');
  if (existing) {
    ss.deleteSheet(existing);
    Logger.log('Deleted old Schedule sheet');
  }
  
  // Reinitialize
  initializeScheduleSheets();
  Logger.log('Created new Schedule sheet with proper structure');
  
  return 'Schedule sheet reset. Run testRotation() to verify.';
}
