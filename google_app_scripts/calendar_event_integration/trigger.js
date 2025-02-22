function createTrigger() {
    var sourceCalendarId = 'source-calendar-id@example.com';
    ScriptApp.newTrigger('syncCalendarEvents')
      .forUserCalendar(sourceCalendarId)
      .onEventUpdated()
      .create();
  }