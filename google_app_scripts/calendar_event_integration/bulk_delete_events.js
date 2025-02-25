/**
 * Delete Test Recurring Events
 * 
 * This script deletes all calendar events that have titles starting with "testrecurring"
 * from a specific calendar.
 */

/**
 * Deletes all events with titles starting with "testrecurring" from the specified calendar
 */
function deleteTestRecurringEvents() {
    // Calendar ID for the target calendar
    var calendarId = PropertiesService.getScriptProperties().getProperty('TARGET_CALENDAR_ID');
    
    try {
      // Get the specified calendar
      var calendar = CalendarApp.getCalendarById(calendarId);
      
      if (!calendar) {
        Logger.log('Could not find the specified calendar.');
        return;
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
      
      // Filter events by title prefix and collect them
      for (var i = 0; i < events.length; i++) {
        var eventTitle = events[i].getTitle();
        if (eventTitle.startsWith("testrecurring")) {
          matchingEvents.push(events[i]);
        }
      }
      
      var totalMatching = matchingEvents.length;
      
      if (totalMatching === 0) {
        Logger.log('No events with titles starting with "testrecurring" were found.');
        return;
      }
      
      // Delete all matching events
      for (var j = 0; j < matchingEvents.length; j++) {
        matchingEvents[j].deleteEvent();
        deletedCount++;
      }
      
      Logger.log('Successfully deleted ' + deletedCount + ' event(s) with titles starting with "testrecurring".');
    } catch (error) {
      Logger.log('Error deleting events: ' + error.toString());
    }
  }
  