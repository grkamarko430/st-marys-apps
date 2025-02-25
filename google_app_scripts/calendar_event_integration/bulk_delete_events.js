/**
 * Bulk Delete Calendar Events
 * 
 * This script finds and deletes Google Calendar events that match a specific title.
 */

/**
 * Creates a simple UI to get parameters from the user
 */
function showDeleteEventsByTitleUI() {
  var ui = SpreadsheetApp.getUi();
  
  var titlePrompt = ui.prompt('Delete Events by Title',
      'Enter the exact event title to delete:',
      ui.ButtonSet.OK_CANCEL);
  
  if (titlePrompt.getSelectedButton() == ui.Button.CANCEL) {
    return;
  }
  
  var eventTitle = titlePrompt.getResponseText();
  
  try {
    // Confirm before deletion
    var confirmResult = ui.alert(
      'Confirm Deletion',
      'This will delete ALL events titled "' + eventTitle + '" from your calendar. Continue?',
      ui.ButtonSet.YES_NO);
    
    if (confirmResult == ui.Button.NO) {
      return;
    }
    
    var result = deleteEventsByTitle(eventTitle);
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
 * @return {Object} Result object containing success status and message
 */
function deleteEventsByTitle(eventTitle) {
  if (!eventTitle) {
    return { success: false, message: 'Missing event title' };
  }
  
  try {
    // Get the primary calendar
    var calendar = CalendarApp.getDefaultCalendar();
    
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
  
  var result = deleteEventsByTitle(eventTitle);
  Logger.log(result.message);
  return result;
}
