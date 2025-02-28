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
      processEvent(sourceCalendar, targetCalendar, e.eventId, tag, sourceCalendarId, targetCalendarId);
    } else {
      // Fallback to scanning all events (for manual runs)
      Logger.log("No specific event ID provided - running full scan");
      processAllEvents(sourceCalendar, targetCalendar, tag, sourceCalendarId, targetCalendarId);
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
 * @param {String} sourceCalendarId - The source calendar ID
 * @param {String} targetCalendarId - The target calendar ID
 */
function processEvent(sourceCalendar, targetCalendar, eventId, tag, sourceCalendarId, targetCalendarId) {
  try {
    // Get the specific event by ID
    var event = sourceCalendar.getEventById(eventId);
    
    if (!event) {
      Logger.log("Event not found with ID: " + eventId + " using CalendarApp. Trying with advanced API...");
      // Try using the advanced Calendar API to get the event
      var advancedEvent = getEventWithAdvancedApi(sourceCalendarId, eventId);
      if (!advancedEvent) {
        Logger.log("Event not found with advanced API either. Skipping.");
        return;
      }
      
      // If we found the event with the advanced API, process it
      processEventWithAdvancedApi(advancedEvent, sourceCalendarId, targetCalendarId, tag);
      return;
    }
    
    Logger.log("Found event: " + event.getTitle());
    
    // Process only if the event has the specified tag in its title
    if (event.getTitle().includes(tag)) {
      Logger.log("Event has tag - checking if it's recurring");
      
      // Check if the event is recurring
      try {
        var isRecurring = event.isRecurringEvent();
        if (isRecurring) {
          Logger.log("Event is recurring - processing with advanced API");
          // Get the event using the advanced API to handle recurring events properly
          var advancedEvent = getEventWithAdvancedApi(sourceCalendarId, eventId);
          if (advancedEvent) {
            processEventWithAdvancedApi(advancedEvent, sourceCalendarId, targetCalendarId, tag);
            return;
          }
        }
      } catch (recurrenceError) {
        Logger.log("Error checking if event is recurring: " + recurrenceError.toString());
        // Continue processing if we can't determine if it's recurring
      }
      
      Logger.log("Processing non-recurring event using standard CalendarApp");
      
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
        
        // Create standard non-recurring event
        createNormalEvent(targetCalendar, event, guestList);
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
 * Processes an event using the advanced Calendar API
 * Handles both recurring and non-recurring events
 * 
 * @param {Object} event - The event object from the advanced Calendar API
 * @param {String} sourceCalendarId - The source calendar ID
 * @param {String} targetCalendarId - The target calendar ID
 * @param {String} tag - The tag to filter events
 */
function processEventWithAdvancedApi(event, sourceCalendarId, targetCalendarId, tag) {
  try {
    Logger.log("Processing event with advanced API: " + event.summary);
    
    // Check if event contains the required tag
    if (!event.summary || !event.summary.includes(tag)) {
      Logger.log("Event does not have the required tag - ignoring");
      return;
    }
    
    // Check if the event already exists in target calendar by using extendedProperties
    var existingEvent = findEventInTargetCalendar(event, targetCalendarId);
    
    if (existingEvent) {
      Logger.log("Event already exists in target calendar - updating: " + event.summary);
      updateEventInTargetCalendar(existingEvent.id, event, targetCalendarId);
    } else {
      Logger.log("Event not found in target calendar - creating new event: " + event.summary);
      createEventInTargetCalendar(event, sourceCalendarId, targetCalendarId);
    }
  } catch (error) {
    Logger.log("Error processing event with advanced API: " + error.toString());
    throw error;
  }
}

/**
 * Gets an event using the advanced Calendar API
 * 
 * @param {String} calendarId - The calendar ID
 * @param {String} eventId - The event ID
 * @return {Object} The event object or null if not found
 */
function getEventWithAdvancedApi(calendarId, eventId) {
  try {
    Logger.log("Getting event with advanced API: " + eventId);
    var event = Calendar.Events.get(calendarId, eventId);
    Logger.log("Successfully retrieved event: " + event.summary);
    return event;
  } catch (error) {
    Logger.log("Error getting event with advanced API: " + error.toString());
    return null;
  }
}

/**
 * Finds an event in the target calendar using source event properties
 * Uses extendedProperties to find matched events
 * 
 * @param {Object} sourceEvent - The source event from the advanced API
 * @param {String} targetCalendarId - The target calendar ID
 * @return {Object} The matching event in the target calendar, or null if not found
 */
function findEventInTargetCalendar(sourceEvent, targetCalendarId) {
  try {
    // Try to find event using query parameters
    var timeMin = sourceEvent.start.dateTime || sourceEvent.start.date;
    var timeMax = sourceEvent.end.dateTime || sourceEvent.end.date;
    
    // Add the query parameter for the source event ID in extendedProperties
    var query = "extendedProperties.private.sourceEventId='" + sourceEvent.id + "'";
    
    var events = Calendar.Events.list(targetCalendarId, {
      timeMin: timeMin,
      timeMax: timeMax,
      q: sourceEvent.summary,
      privateExtendedProperty: "sourceEventId=" + sourceEvent.id
    });
    
    if (events.items && events.items.length > 0) {
      return events.items[0];
    }
    
    // If we didn't find it with extendedProperties, try a more basic search
    events = Calendar.Events.list(targetCalendarId, {
      timeMin: timeMin,
      timeMax: timeMax,
      q: sourceEvent.summary,
      singleEvents: true
    });
    
    if (events.items && events.items.length > 0) {
      // Find the first event with matching title and time
      for (var i = 0; i < events.items.length; i++) {
        var event = events.items[i];
        if (event.summary === sourceEvent.summary) {
          return event;
        }
      }
    }
    
    return null;
  } catch (error) {
    Logger.log("Error finding event in target calendar: " + error.toString());
    return null;
  }
}

/**
 * Creates an event in the target calendar using the advanced Calendar API
 * Handles recurring events properly by copying recurrence rules
 * 
 * @param {Object} sourceEvent - The source event object
 * @param {String} sourceCalendarId - The source calendar ID
 * @param {String} targetCalendarId - The target calendar ID
 * @return {Object} The created event
 */
function createEventInTargetCalendar(sourceEvent, sourceCalendarId, targetCalendarId) {
  try {
    // Create a new event object
    var newEvent = {
      summary: sourceEvent.summary,
      description: sourceEvent.description,
      location: sourceEvent.location,
      start: sourceEvent.start,
      end: sourceEvent.end,
      attendees: sourceEvent.attendees,
      // Store source event information in extended properties
      extendedProperties: {
        private: {
          sourceEventId: sourceEvent.id,
          sourceCalendarId: sourceCalendarId
        }
      }
    };
    
    // Handle recurring events by copying the recurrence rule
    if (sourceEvent.recurrence) {
      newEvent.recurrence = sourceEvent.recurrence;
    }
    
    // Create the event
    var createdEvent = Calendar.Events.insert(newEvent, targetCalendarId);
    Logger.log("Successfully created event in target calendar: " + createdEvent.id);
    return createdEvent;
  } catch (error) {
    Logger.log("Error creating event in target calendar: " + error.toString());
    throw error;
  }
}

/**
 * Updates an event in the target calendar
 * 
 * @param {String} eventId - The ID of the event to update
 * @param {Object} sourceEvent - The source event to use for update data
 * @param {String} targetCalendarId - The target calendar ID
 * @return {Object} The updated event
 */
function updateEventInTargetCalendar(eventId, sourceEvent, targetCalendarId) {
  try {
    // Get the current event first
    var currentEvent = Calendar.Events.get(targetCalendarId, eventId);
    
    // Update the event properties
    var updatedEvent = {
      summary: sourceEvent.summary,
      description: sourceEvent.description,
      location: sourceEvent.location,
      start: sourceEvent.start,
      end: sourceEvent.end,
      attendees: sourceEvent.attendees,
      recurrence: sourceEvent.recurrence,
      // Preserve the extendedProperties
      extendedProperties: currentEvent.extendedProperties || {
        private: {
          sourceEventId: sourceEvent.id
        }
      }
    };
    
    // Update the event
    var result = Calendar.Events.update(updatedEvent, targetCalendarId, eventId);
    Logger.log("Successfully updated event in target calendar: " + result.id);
    return result;
  } catch (error) {
    Logger.log("Error updating event in target calendar: " + error.toString());
    throw error;
  }
}

/**
 * Helper function to create a normal (non-recurring) event
 */
function createNormalEvent(calendar, sourceEvent, guestList) {
  calendar.createEvent(sourceEvent.getTitle(), sourceEvent.getStartTime(), sourceEvent.getEndTime(), {
    description: sourceEvent.getDescription(),
    location: sourceEvent.getLocation(),
    guests: guestList.map(function(guest) { 
      return guest.getEmail(); 
    }).join(',')
  });
  
  Logger.log("Successfully created new event: " + sourceEvent.getTitle());
}

/**
 * Processes all events in the source calendar within a time range
 * This is used as a fallback when running the script manually
 * 
 * @param {Calendar} sourceCalendar - The source calendar object
 * @param {Calendar} targetCalendar - The target calendar object
 * @param {String} tag - The tag to look for in event titles
 * @param {String} sourceCalendarId - The source calendar ID
 * @param {String} targetCalendarId - The target calendar ID
 */
function processAllEvents(sourceCalendar, targetCalendar, tag, sourceCalendarId, targetCalendarId) {
  // Define time range for events to check
  var now = new Date();
  var oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
  var fiveYearsLater = new Date(now.getTime() + (5 * 365 * 24 * 60 * 60 * 1000));
  
  Logger.log("Checking for events between: " + oneHourAgo.toISOString() + " and " + fiveYearsLater.toISOString());
  
  // Use the advanced Calendar API for better handling of recurring events
  try {
    Logger.log("Using advanced Calendar API to process all events");
    
    // Format dates for the API
    var timeMin = oneHourAgo.toISOString();
    var timeMax = fiveYearsLater.toISOString();
    
    // List all events from the source calendar
    var events = Calendar.Events.list(sourceCalendarId, {
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: false, // Get recurring events as single instances
      maxResults: 2500 // Get a reasonable number of events
    });
    
    if (!events.items || events.items.length === 0) {
      Logger.log("No events found in the specified time range");
      return;
    }
    
    Logger.log("Found " + events.items.length + " events to process with advanced API");
    
    // Process each event
    var processedCount = 0;
    var skippedCount = 0;
    
    for (var i = 0; i < events.items.length; i++) {
      var event = events.items[i];
      
      // Only process events with the tag
      if (event.summary && event.summary.includes(tag)) {
        Logger.log("Processing event " + (i + 1) + " of " + events.items.length + ": " + event.summary);
        
        try {
          processEventWithAdvancedApi(event, sourceCalendarId, targetCalendarId, tag);
          processedCount++;
        } catch (eventError) {
          Logger.log("Error processing event " + event.id + ": " + eventError.toString());
          skippedCount++;
        }
        
        // Add a small delay to avoid hitting quota limits
        if (i % 10 === 9 && i < events.items.length - 1) {
          Utilities.sleep(100);
        }
      } else {
        skippedCount++;
      }
    }
    
    Logger.log("Advanced API processing complete. Processed: " + processedCount + ", Skipped: " + skippedCount);
  } catch (advancedApiError) {
    Logger.log("Error using advanced Calendar API: " + advancedApiError.toString());
    Logger.log("Falling back to standard CalendarApp processing");
    
    // Fallback to the original implementation
    processAllEventsWithCalendarApp(sourceCalendar, targetCalendar, tag, oneHourAgo, fiveYearsLater);
  }
}

/**
 * Processes all events using the standard CalendarApp (fallback method)
 */
function processAllEventsWithCalendarApp(sourceCalendar, targetCalendar, tag, oneHourAgo, fiveYearsLater) {
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
      
      // Check if the event is recurring - if so, skip it for now
      // (Advanced API handling is done separately)
      var isRecurring = false;
      try {
        isRecurring = event.isRecurringEvent();
        if (isRecurring) {
          Logger.log("Event is recurring - skipping in standard process: " + eventTitle);
          skippedEventsCount++;
          return; // Skip this iteration
        }
      } catch (e) {
        Logger.log("Error checking if event is recurring: " + e.toString());
        // Continue processing if we can't determine if it's recurring
      }
      
      // Check if event exists in target calendar using the pre-fetched events
      var eventExists = potentialTargetEvents.some(function(targetEvent) {
        return targetEvent.getTitle() === eventTitle && 
               targetEvent.getStartTime().getTime() === event.getStartTime().getTime() &&
               targetEvent.getEndTime().getTime() === event.getEndTime().getTime();
      });
      
      if (!eventExists) {
        Logger.log("Creating new event in target calendar: " + eventTitle);
        var guestList = event.getGuestList();
        
        // Create standard non-recurring event
        createNormalEvent(targetCalendar, event, guestList);
        
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
 * Safely checks if an event is recurring
 * 
 * @param {CalendarEvent} event - The event to check
 * @return {Boolean} True if the event is recurring, false otherwise
 */
function safeIsRecurringEvent(event) {
  try {
    return event.isRecurringEvent();
  } catch (error) {
    Logger.log("Error checking recurrence status: " + error.toString());
    return false;
  }
}