function syncCalendarEvents(e) {
  try {
    var targetCalendarId = PropertiesService.getScriptProperties().getProperty('TARGET_CALENDAR_ID');
    var tag = '*'; // Tag to look for in event titles
    var targetCalendar = CalendarApp.getCalendarById(targetCalendarId);
    
    // Check if the event object exists and has required properties
    if (!e || !e.calendarEvent) {
      Logger.log("Event object is missing or invalid: " + JSON.stringify(e));
      return;
    }
    
    var event = e.calendarEvent;
    if (event.getTitle().includes(tag)) {
      var targetEvents = targetCalendar.getEvents(event.getStartTime(), event.getEndTime(), { search: event.getTitle() });
      if (targetEvents.length === 0) {
        targetCalendar.createEvent(event.getTitle(), event.getStartTime(), event.getEndTime(), {
          description: event.getDescription(),
          location: event.getLocation(),
          guests: event.getGuestList().map(guest => guest.getEmail()).join(',')
        });
        Logger.log("Created new event: " + event.getTitle());
      }
    }
  } catch (error) {
    Logger.log("Error in syncCalendarEvents: " + error.toString());
  }
}