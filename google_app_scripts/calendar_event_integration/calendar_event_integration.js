function syncCalendarEvents(e) {
    // var sourceCalendarId = PropertiesService.getScriptProperties().getProperty('SOURCE_CALENDAR_ID');
    var targetCalendarId = PropertiesService.getScriptProperties().getProperty('TARGET_CALENDAR_ID');
    var tag = '*'; // Tag to look for in event titles
  
    // var sourceCalendar = CalendarApp.getCalendarById(sourceCalendarId);
    var targetCalendar = CalendarApp.getCalendarById(targetCalendarId);
  
    var event = e.calendarEvent;
    if (event.getTitle().includes(tag)) {
      var targetEvents = targetCalendar.getEvents(event.getStartTime(), event.getEndTime(), { search: event.getTitle() });
      if (targetEvents.length === 0) {
        targetCalendar.createEvent(event.getTitle(), event.getStartTime(), event.getEndTime(), {
          description: event.getDescription(),
          location: event.getLocation(),
          guests: event.getGuestList().map(guest => guest.getEmail()).join(',')
        });
      }
    }
  }