/**
 * Bulk Delete Calendar Events
 * 
 * This script finds and deletes Google Calendar events that match a specific title.
 * It allows selecting a specific calendar by its ID.
 */

/**
 * Creates a simple UI to get parameters from the user
 */
function showDeleteEventsByTitleUI() {
  var ui = SpreadsheetApp.getUi();
  
  var calendarIdPrompt = ui.prompt('Calendar Selection',
      'Enter Calendar ID (leave blank for your default calendar):',
      ui.ButtonSet.OK_CANCEL);
  
  if (calendarIdPrompt.getSelectedButton() == ui.Button.CANCEL) {
    return;
  }
  
  var calendarId = calendarIdPrompt.getResponseText();
  
  var titlePrompt = ui.prompt('Delete Events by Title',
      'Enter the exact event title to delete:',
      ui.ButtonSet.OK_CANCEL);
  
  if (titlePrompt.getSelectedButton() == ui.Button.CANCEL) {
    return;
  }
  
  var eventTitle = titlePrompt.getResponseText();
  
  try {
    // Confirm before deletion
    var calendarName = calendarId === '' ? 'your default calendar' : calendarId;
    var confirmResult = ui.alert(
      'Confirm Deletion',
      'This will delete ALL events titled "' + eventTitle + '" from ' + calendarName + '. Continue?',
      ui.ButtonSet.YES_NO);
    
    if (confirmResult == ui.Button.NO) {
      return;
    }
    
    var result = deleteEventsByTitle(eventTitle, calendarId);
    ui.alert('Deletion Complete', result.message, ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('Error', 'An error occurred: ' + e.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Creates a menu item when the spreadsheet is opened
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Calendar Tools')
      .addItem('Delete Events by Title', 'showDeleteEventsByTitleUI')
      .addToUi();
}

/**
 * Deletes calendar events matching the given title
 * 
 * @param {string} eventTitle - The exact title of events to delete
 * @param {string} calendarId - Optional calendar ID. If not provided, uses default calendar.
 * @return {Object} Result object containing success status and message
 */
function deleteEventsByTitle(eventTitle, calendarId) {
  if (!eventTitle) {
    return { success: false, message: 'Missing event title' };
  }
  
  try {
    // Get the specified calendar or the default calendar
    var calendar;
    
    if (!calendarId || calendarId.trim() === '') {
      calendar = CalendarApp.getDefaultCalendar();
    } else {
      try {
        calendar = CalendarApp.getCalendarById(calendarId);
        if (!calendar) {
          return { 
            success: false, 
            message: 'Could not find a calendar with ID: ' + calendarId 
          };
        }
      } catch (calError) {
        return { 
          success: false, 
          message: 'Invalid calendar ID: ' + calendarId + '. Error: ' + calError.toString() 
        };
      }
    }
    
    // Use a date range that covers all existing events
    // From 10 years ago to 10 years in the future
    var startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 10);
    
    var endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 10);
    
    // Find all events in this large date range
    var events = calendar.getEvents(startDate, endDate);
    
    var deletedCount = 0;
    var matchingEvents = [];
    
    // Filter events by title and collect them
    for (var i = 0; i < events.length; i++) {
      if (events[i].getTitle() === eventTitle) {
        matchingEvents.push(events[i]);
      }
    }
    
    var totalMatching = matchingEvents.length;
    
    if (totalMatching === 0) {
      return { 
        success: true, 
        message: 'No events with the title "' + eventTitle + '" were found.' 
      };
    }
    
    // Delete all matching events
    for (var j = 0; j < matchingEvents.length; j++) {
      matchingEvents[j].deleteEvent();
      deletedCount++;
    }
    
    return {
      success: true,
      message: 'Successfully deleted ' + deletedCount + ' event(s) with the title "' + eventTitle + '".'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error deleting events: ' + error.toString()
    };
  }
}

/**
 * Standalone function to delete events without UI
 * Can be called directly from the script editor
 */
function bulkDeleteEventsByTitle() {
  // Set the event title you want to delete
  var eventTitle = "Event Title Here";
  
  // Set the calendar ID (leave empty for default calendar)
  var calendarId = "";  // e.g. "example@group.calendar.google.com"
  
  var result = deleteEventsByTitle(eventTitle, calendarId);
  Logger.log(result.message);
  return result;
}
