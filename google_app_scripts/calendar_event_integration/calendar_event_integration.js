function syncCalendarEvents(e) {
    var sourceCalendarId = 'source-calendar-id@example.com';
    var targetCalendarId = 'target-calendar-id@example.com';
    var tag = 'SpecificTag'; // Replace with the specific name or tag to look for in event titles
  
    var sourceCalendar = CalendarApp.getCalendarById(sourceCalendarId);
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