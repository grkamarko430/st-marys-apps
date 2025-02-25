/**
 * Synchronizes calendar events from a source calendar to a target calendar.
 * Events are only synchronized if they contain a specific tag in their title.
 * This function can be triggered by a calendar event change or called manually.
 * If the job fails, an email notification is sent to administrators.
 * 
 * @param {Object} e - Optional event object containing calendarId and eventId when triggered by a calendar event.
 */
function syncCalendarEvents(e) {
  Logger.log("Starting syncCalendarEvents function");
  Logger.log("Event object: " + JSON.stringify(e));
  try {
    // Get calendar IDs from either the event object or script properties
    var sourceCalendarId = e ? e.calendarId : PropertiesService.getScriptProperties().getProperty('SOURCE_CALENDAR_ID');
    var targetCalendarId = PropertiesService.getScriptProperties().getProperty('TARGET_CALENDAR_ID');
    var tag = '*'; // Tag to identify events that should be synchronized
    
    Logger.log("Source calendar ID: " + sourceCalendarId);
    Logger.log("Target calendar ID: " + targetCalendarId);
    Logger.log("Looking for events with tag: " + tag);
    
    // Access calendar objects using the Calendar API
    var sourceCalendar = CalendarApp.getCalendarById(sourceCalendarId);
    var targetCalendar = CalendarApp.getCalendarById(targetCalendarId);
    
    if (!sourceCalendar) {
      Logger.log("ERROR: Source calendar not found with ID: " + sourceCalendarId);
      return;
    }
    
    if (!targetCalendar) {
      Logger.log("ERROR: Target calendar not found with ID: " + targetCalendarId);
      return;
    }
    
    Logger.log("Successfully accessed source calendar: " + sourceCalendar.getName());
    Logger.log("Successfully accessed target calendar: " + targetCalendar.getName());
    
    // Determine if this is being run from a trigger with a specific event or manually
    if (e && e.eventId) {
      // Process only the specific event that triggered this function
      Logger.log("Processing specific event with ID: " + e.eventId);
      processEvent(sourceCalendar, targetCalendar, e.eventId, tag);
    } else {
      // Fallback to scanning all events (for manual runs)
      Logger.log("No specific event ID provided - running full scan");
      processAllEvents(sourceCalendar, targetCalendar, tag);
    }
    
    Logger.log("Sync completed successfully");
    
  } catch (error) {
    // Log any errors that occur during synchronization
    Logger.log("ERROR in syncCalendarEvents: " + error.toString());
    Logger.log("Error stack: " + error.stack);
    
    // Send email notification about the failure
    sendErrorNotification(error);
  }
}

/**
 * Processes a specific event by ID
 *
 * @param {Calendar} sourceCalendar - The source calendar object
 * @param {Calendar} targetCalendar - The target calendar object
 * @param {String} eventId - The ID of the specific event to process
 * @param {String} tag - The tag to look for in event titles
 */
function processEvent(sourceCalendar, targetCalendar, eventId, tag) {
  try {
    // Get the specific event by ID
    var event = sourceCalendar.getEventById(eventId);
    
    if (!event) {
      Logger.log("Event not found with ID: " + eventId);
      return;
    }
    
    Logger.log("Found event: " + event.getTitle());
    
    // Process only if the event has the specified tag in its title
    if (event.getTitle().includes(tag)) {
      Logger.log("Event has tag - checking if it exists in target calendar");
      
      // Check if the event already exists in target calendar
      var targetEvents = targetCalendar.getEvents(
        event.getStartTime(), 
        event.getEndTime(), 
        { search: event.getTitle() }
      );
      
      Logger.log("Found " + targetEvents.length + " potential matching events in target calendar");
      
      if (targetEvents.length === 0) {
        Logger.log("Creating new event in target calendar: " + event.getTitle());
        Logger.log("Start: " + event.getStartTime() + ", End: " + event.getEndTime());
        Logger.log("Location: " + (event.getLocation() || "None"));
        
        var guestList = event.getGuestList();
        Logger.log("Number of guests: " + guestList.length);
        
        // Create new event in target calendar with same details as source event
        targetCalendar.createEvent(event.getTitle(), event.getStartTime(), event.getEndTime(), {
          description: event.getDescription(),
          location: event.getLocation(),
          guests: guestList.map(function(guest) { 
            Logger.log("Adding guest: " + guest.getEmail());
            return guest.getEmail(); 
          }).join(',')
        });
        
        Logger.log("Successfully created new event: " + event.getTitle());
      } else {
        Logger.log("Event already exists in target calendar - skipping: " + event.getTitle());
      }
    } else {
      Logger.log("Event does not have the required tag - ignoring");
    }
  } catch (error) {
    Logger.log("Error processing event: " + error.toString());
    throw error; // Re-throw to be caught by the main function
  }
}

/**
 * Processes all events in the source calendar within a time range
 * This is used as a fallback when running the script manually
 * 
 * @param {Calendar} sourceCalendar - The source calendar object
 * @param {Calendar} targetCalendar - The target calendar object
 * @param {String} tag - The tag to look for in event titles
 */
function processAllEvents(sourceCalendar, targetCalendar, tag) {
  // Define time range for events to check: from 1 hour ago to far in the future
  var now = new Date();
  var oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
  var fiveYearsLater = new Date(now.getTime() + (5 * 365 * 24 * 60 * 60 * 1000));
  
  Logger.log("Checking for events between: " + oneHourAgo.toISOString() + " and " + fiveYearsLater.toISOString());
  
  // Fetch events from source calendar within the defined time range
  var events = sourceCalendar.getEvents(oneHourAgo, fiveYearsLater);
  Logger.log("Found " + events.length + " events to check in source calendar");
  
  var taggededEventsCount = 0;
  var createdEventsCount = 0;
  var skippedEventsCount = 0;
  
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    Logger.log("Checking event " + (i+1) + "/" + events.length + ": " + event.getTitle());
    
    // Process only events with the specified tag in their title
    if (event.getTitle().includes(tag)) {
      taggededEventsCount++;
      Logger.log("Event has tag - checking if it exists in target calendar");
      
      // Check if the event already exists in target calendar
      var targetEvents = targetCalendar.getEvents(event.getStartTime(), event.getEndTime(), { search: event.getTitle() });
      Logger.log("Found " + targetEvents.length + " potential matching events in target calendar");
      
      if (targetEvents.length === 0) {
        Logger.log("Creating new event in target calendar: " + event.getTitle());
        Logger.log("Start: " + event.getStartTime() + ", End: " + event.getEndTime());
        Logger.log("Location: " + (event.getLocation() || "None"));
        
        // Get the guest list for this event
        var guestList = event.getGuestList();
        Logger.log("Number of guests: " + guestList.length);
        
        // Create new event in target calendar with same details as source event
        targetCalendar.createEvent(event.getTitle(), event.getStartTime(), event.getEndTime(), {
          description: event.getDescription(),
          location: event.getLocation(),
          guests: guestList.map(function(guest) { 
            Logger.log("Adding guest: " + guest.getEmail());
            return guest.getEmail(); 
          }).join(',')
        });
        
        Logger.log("Successfully created new event: " + event.getTitle());
        createdEventsCount++;
      } else {
        Logger.log("Event already exists in target calendar - skipping: " + event.getTitle());
        skippedEventsCount++;
      }
    }
  }
  
  Logger.log("Scan summary:");
  Logger.log("Total events checked: " + events.length);
  Logger.log("Tagged events found: " + taggededEventsCount);
  Logger.log("Events created: " + createdEventsCount);
  Logger.log("Events skipped (already exist): " + skippedEventsCount);
}

/**
 * Sends an email notification when the calendar sync job fails.
 * The email includes error details and execution context information.
 *
 * @param {Error} error - The error object that was caught
 */
function sendErrorNotification(error) {
  try {
    // Email recipients from script property (fallback to default if not set)
    var recipients = PropertiesService.getScriptProperties().getProperty('EMAIL_RECIPIENTS');
    
    // Get calendar IDs for context
    var sourceCalendarId = PropertiesService.getScriptProperties().getProperty('SOURCE_CALENDAR_ID');
    var targetCalendarId = PropertiesService.getScriptProperties().getProperty('TARGET_CALENDAR_ID');
    
    // Build email subject
    var subject = "Calendar Sync Error: St. Mary's Calendar Integration";
    
    // Build email body with detailed information
    var body = "The calendar synchronization job failed with the following error:\n\n";
    body += "Error message: " + error.toString() + "\n\n";
    body += "Error stack trace: " + (error.stack || "No stack trace available") + "\n\n";
    body += "--- Context Information ---\n";
    body += "Timestamp: " + new Date().toString() + "\n";
    body += "Source Calendar ID: " + sourceCalendarId + "\n";
    body += "Target Calendar ID: " + targetCalendarId + "\n";
    
    // Send the email
    MailApp.sendEmail({
      to: recipients,
      subject: subject,
      body: body
    });
    
    Logger.log("Error notification email sent to " + recipients);
  } catch (emailError) {
    // Log if there's an error sending the notification
    Logger.log("Failed to send error notification email: " + emailError.toString());
  }
}