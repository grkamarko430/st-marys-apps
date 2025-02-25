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
        
        // Check if the event is recurring
        var recurrenceData = event.getRecurrence();
        if (recurrenceData && recurrenceData.length > 0) {
          Logger.log("Event is recurring with pattern: " + recurrenceData);
          
          // Create recurring event with the same recurrence pattern
          var newEvent = targetCalendar.createEventSeries(
            event.getTitle(), 
            event.getStartTime(), 
            event.getEndTime(), 
            CalendarApp.newRecurrence().addRawRule(recurrenceData[0]),
            {
              description: event.getDescription(),
              location: event.getLocation(),
              guests: guestList.map(function(guest) { 
                Logger.log("Adding guest: " + guest.getEmail());
                return guest.getEmail(); 
              }).join(',')
            }
          );
          
          Logger.log("Successfully created new recurring event: " + event.getTitle());
        } else {
          // Create standard non-recurring event
          targetCalendar.createEvent(event.getTitle(), event.getStartTime(), event.getEndTime(), {
            description: event.getDescription(),
            location: event.getLocation(),
            guests: guestList.map(function(guest) { 
              Logger.log("Adding guest: " + guest.getEmail());
              return guest.getEmail(); 
            }).join(',')
          });
          
          Logger.log("Successfully created new event: " + event.getTitle());
        }
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
  // Define time range for events to check
  var now = new Date();
  var oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
  var fiveYearsLater = new Date(now.getTime() + (5 * 365 * 24 * 60 * 60 * 1000));
  
  Logger.log("Checking for events between: " + oneHourAgo.toISOString() + " and " + fiveYearsLater.toISOString());
  
  // Fetch events from source calendar within the defined time range
  var events = sourceCalendar.getEvents(oneHourAgo, fiveYearsLater);
  Logger.log("Found " + events.length + " events to check in source calendar");
  
  // Filter events that contain the tag first to reduce the processing set
  var taggedEvents = events.filter(function(event) {
    return event.getTitle().includes(tag);
  });
  
  Logger.log("Found " + taggedEvents.length + " tagged events to process");
  
  var createdEventsCount = 0;
  var skippedEventsCount = 0;
  var batchSize = 10; // Process events in batches of 10
  
  // Process events in batches to improve performance
  for (var i = 0; i < taggedEvents.length; i += batchSize) {
    var batch = taggedEvents.slice(i, i + batchSize);
    Logger.log("Processing batch " + (Math.floor(i/batchSize) + 1) + " of " + Math.ceil(taggedEvents.length/batchSize));
    
    // Pre-fetch target events for the entire batch's time range to reduce API calls
    var batchStartTime = null;
    var batchEndTime = null;
    
    // Find the earliest start time and latest end time in this batch
    batch.forEach(function(event) {
      if (!batchStartTime || event.getStartTime() < batchStartTime) {
        batchStartTime = event.getStartTime();
      }
      if (!batchEndTime || event.getEndTime() > batchEndTime) {
        batchEndTime = event.getEndTime();
      }
    });
    
    // Fetch all potential target events in this time range at once
    var potentialTargetEvents = targetCalendar.getEvents(batchStartTime, batchEndTime);
    
    // Process each event in the batch
    batch.forEach(function(event) {
      var eventTitle = event.getTitle();
      
      // Check if event exists in target calendar using the pre-fetched events
      var eventExists = potentialTargetEvents.some(function(targetEvent) {
        return targetEvent.getTitle() === eventTitle && 
               targetEvent.getStartTime().getTime() === event.getStartTime().getTime() &&
               targetEvent.getEndTime().getTime() === event.getEndTime().getTime();
      });
      
      if (!eventExists) {
        Logger.log("Creating new event in target calendar: " + eventTitle);
        var guestList = event.getGuestList();
        
        // Check if the event is recurring
        var recurrenceData = event.getRecurrence();
        if (recurrenceData && recurrenceData.length > 0) {
          Logger.log("Event is recurring with pattern: " + recurrenceData);
          
          // Create recurring event with the same recurrence pattern
          targetCalendar.createEventSeries(
            eventTitle, 
            event.getStartTime(), 
            event.getEndTime(), 
            CalendarApp.newRecurrence().addRawRule(recurrenceData[0]),
            {
              description: event.getDescription(),
              location: event.getLocation(),
              guests: guestList.map(function(guest) { return guest.getEmail(); }).join(',')
            }
          );
          
          Logger.log("Successfully created new recurring event: " + eventTitle);
        } else {
          // Create standard non-recurring event
          targetCalendar.createEvent(eventTitle, event.getStartTime(), event.getEndTime(), {
            description: event.getDescription(),
            location: event.getLocation(),
            guests: guestList.map(function(guest) { return guest.getEmail(); }).join(',')
          });
          
          Logger.log("Successfully created new event: " + eventTitle);
        }
        
        createdEventsCount++;
      } else {
        skippedEventsCount++;
      }
    });
    
    // Add a small pause between batches to avoid hitting quota limits
    if (i + batchSize < taggedEvents.length) {
      Utilities.sleep(100);
    }
  }
  
  Logger.log("Scan summary:");
  Logger.log("Total events checked: " + events.length);
  Logger.log("Tagged events found: " + taggedEvents.length);
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

/**
 * Checks if an event is part of a recurring series and returns its recurrence pattern
 * 
 * @param {CalendarEvent} event - The event to check
 * @return {Boolean} True if the event is recurring, false otherwise
 */
function isRecurringEvent(event) {
  try {
    var recurrence = event.getRecurrence();
    return recurrence && recurrence.length > 0;
  } catch (error) {
    Logger.log("Error checking recurrence: " + error.toString());
    return false;
  }
}