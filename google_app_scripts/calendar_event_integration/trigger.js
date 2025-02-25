/**
 * Creates calendar triggers to automatically run the sync function when events are created or updated.
 * Removes any existing triggers for the syncCalendarEvents function first to avoid duplicates.
 * This function should be run manually to set up the automation.
 */
function emailSyncTrigger() {
  // Delete any existing triggers first to avoid duplicates
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'syncCalendarEvents') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  // Get the source calendar ID from script properties
  var sourceCalendarId = PropertiesService.getScriptProperties().getProperty('SOURCE_CALENDAR_ID');
  
  // Create a new trigger that runs syncCalendarEvents whenever an event is updated in the source calendar
  ScriptApp.newTrigger('syncCalendarEvents')
    .forUserCalendar(sourceCalendarId)
    .onEventUpdated()
    .create();
  
  // Create a new trigger that runs syncCalendarEvents whenever an event is created in the source calendar
  ScriptApp.newTrigger('syncCalendarEvents')
    .forUserCalendar(sourceCalendarId)
    .onEventCreated()
    .create();
  
  Logger.log("Triggers created successfully for calendar ID: " + sourceCalendarId);
}