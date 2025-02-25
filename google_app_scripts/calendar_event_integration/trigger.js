function emailSyncTrigger() {
    var sourceCalendarId = PropertiesService.getScriptProperties().getProperty('SOURCE_CALENDAR_ID');
    ScriptApp.newTrigger('syncCalendarEvents')
      .forUserCalendar(sourceCalendarId)
      .onEventUpdated()
      .create();
  }