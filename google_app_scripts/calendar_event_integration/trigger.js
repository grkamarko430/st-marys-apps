function emailSyncTrigger() {
  // Delete any existing triggers first to avoid duplicates
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'syncCalendarEvents') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  var sourceCalendarId = PropertiesService.getScriptProperties().getProperty('SOURCE_CALENDAR_ID');
  ScriptApp.newTrigger('syncCalendarEvents')
    .forUserCalendar(sourceCalendarId)
    .onEventUpdated()
    .create();
  
  Logger.log("Trigger created successfully for calendar ID: " + sourceCalendarId);
}