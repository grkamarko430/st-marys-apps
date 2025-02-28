/**
 * Configure the initial settings for the calendar integration script
 * This needs to be run once before using the integration
 */
function setupCalendarIntegration() {
  // Get permission scopes for advanced Calendar API
  var calendar = Calendar.Events.list('primary', {
    maxResults: 1
  });
  
  Logger.log("Advanced Calendar API permissions granted");
  
  // Display instructions for setting script properties
  Logger.log("Please set the following script properties:");
  Logger.log("1. SOURCE_CALENDAR_ID: The ID of the calendar to copy events from");
  Logger.log("2. TARGET_CALENDAR_ID: The ID of the calendar to copy events to");
  Logger.log("3. EMAIL_RECIPIENTS: Comma-separated list of emails to notify on failures");
  
  // Show current properties if they exist
  var props = PropertiesService.getScriptProperties();
  var sourceCalendarId = props.getProperty('SOURCE_CALENDAR_ID');
  var targetCalendarId = props.getProperty('TARGET_CALENDAR_ID');
  var emailRecipients = props.getProperty('EMAIL_RECIPIENTS');
  
  Logger.log("Current settings:");
  Logger.log("SOURCE_CALENDAR_ID: " + (sourceCalendarId || "Not set"));
  Logger.log("TARGET_CALENDAR_ID: " + (targetCalendarId || "Not set"));
  Logger.log("EMAIL_RECIPIENTS: " + (emailRecipients || "Not set"));
  
  // You can use the UI to set these properties
  if (!sourceCalendarId || !targetCalendarId) {
    Logger.log("Please set the required properties using the script editor:");
    Logger.log("1. File > Project properties > Script properties");
  }
}

/**
 * Sets the script properties programmatically - alternative to UI method
 * 
 * @param {String} sourceCalendarId - The ID of the source calendar
 * @param {String} targetCalendarId - The ID of the target calendar
 * @param {String} emailRecipients - Comma-separated list of email recipients for notifications
 */
function setScriptProperties(sourceCalendarId, targetCalendarId, emailRecipients) {
  var props = PropertiesService.getScriptProperties();
  
  if (sourceCalendarId) {
    props.setProperty('SOURCE_CALENDAR_ID', sourceCalendarId);
  }
  
  if (targetCalendarId) {
    props.setProperty('TARGET_CALENDAR_ID', targetCalendarId);
  }
  
  if (emailRecipients) {
    props.setProperty('EMAIL_RECIPIENTS', emailRecipients);
  }
  
  Logger.log("Script properties updated successfully");
}

/**
 * Lists all calendars in the user's account
 * Helps identify calendar IDs for setup
 */
function listAllCalendars() {
  // Use advanced Calendar API
  try {
    var calendars = Calendar.CalendarList.list();
    Logger.log("Found " + calendars.items.length + " calendars:");
    
    for (var i = 0; i < calendars.items.length; i++) {
      var calendar = calendars.items[i];
      Logger.log((i + 1) + ". " + calendar.summary);
      Logger.log("   ID: " + calendar.id);
      Logger.log("   Access Role: " + calendar.accessRole);
    }
  } catch (error) {
    Logger.log("Error listing calendars with advanced API: " + error.toString());
    
    // Fallback to CalendarApp
    var calendars = CalendarApp.getAllCalendars();
    Logger.log("Found " + calendars.length + " calendars using CalendarApp:");
    
    for (var i = 0; i < calendars.length; i++) {
      var calendar = calendars[i];
      Logger.log((i + 1) + ". " + calendar.getName());
      Logger.log("   ID: " + calendar.getId());
    }
  }
}

/**
 * Tests the calendar integration with a single event
 * Useful for verifying that the setup works properly
 */
function testCalendarIntegration() {
  var props = PropertiesService.getScriptProperties();
  var sourceCalendarId = props.getProperty('SOURCE_CALENDAR_ID');
  var targetCalendarId = props.getProperty('TARGET_CALENDAR_ID');
  
  if (!sourceCalendarId || !targetCalendarId) {
    Logger.log("ERROR: Source or target calendar ID not set. Run setupCalendarIntegration first.");
    return;
  }
  
  // Create a test event in the source calendar
  var now = new Date();
  var oneHourLater = new Date(now.getTime() + (60 * 60 * 1000));
  var title = "* Test Event " + now.toISOString();
  
  try {
    Logger.log("Creating test event in source calendar...");
    
    // Create with advanced API
    var event = {
      summary: title,
      description: "This is a test event created by the calendar integration script",
      start: {
        dateTime: now.toISOString()
      },
      end: {
        dateTime: oneHourLater.toISOString()
      }
    };
    
    var createdEvent = Calendar.Events.insert(event, sourceCalendarId);
    Logger.log("Test event created with ID: " + createdEvent.id);
    
    // Wait a moment
    Utilities.sleep(2000);
    
    // Call the sync function with the event ID
    var triggerEvent = {
      calendarId: sourceCalendarId,
      eventId: createdEvent.id
    };
    
    Logger.log("Syncing the test event...");
    syncCalendarEvents(triggerEvent);
    
    Logger.log("Test completed. Check the target calendar for the test event.");
    
    // Clean up - delete the test event from source calendar
    Logger.log("Cleaning up test event...");
    Calendar.Events.remove(sourceCalendarId, createdEvent.id);
    
  } catch (error) {
    Logger.log("Error in test: " + error.toString());
  }
}
