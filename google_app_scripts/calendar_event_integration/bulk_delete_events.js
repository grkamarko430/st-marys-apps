/**
 * Bulk Delete Calendar Events
 * 
 * This script finds and deletes Google Calendar events that match a specific title.
 * It allows selecting a specific calendar by its ID.
 */

/**
 * Serves HTML content for the web application
 */
function doGet() {
  return HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
          }
          h1 {
            color: #4285f4;
          }
          .form-group {
            margin-bottom: 15px;
          }
          label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
          }
          input[type="text"] {
            width: 100%;
            padding: 8px;
            box-sizing: border-box;
          }
          button {
            background-color: #4285f4;
            color: white;
            border: none;
            padding: 10px 15px;
            cursor: pointer;
            font-size: 16px;
          }
          button:hover {
            background-color: #3367d6;
          }
          #result {
            margin-top: 20px;
            padding: 10px;
            background-color: #f8f9fa;
            border-left: 5px solid #4285f4;
            display: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Bulk Delete Calendar Events</h1>
          
          <div class="form-group">
            <label for="calendarId">Calendar ID (leave blank for default calendar):</label>
            <input type="text" id="calendarId" name="calendarId" placeholder="example@group.calendar.google.com">
          </div>
          
          <div class="form-group">
            <label for="eventTitle">Exact Event Title:</label>
            <input type="text" id="eventTitle" name="eventTitle" required>
          </div>
          
          <button onclick="deleteEvents()">Delete Events</button>
          
          <div id="result"></div>
        </div>
        
        <script>
          function deleteEvents() {
            const calendarId = document.getElementById('calendarId').value;
            const eventTitle = document.getElementById('eventTitle').value;
            
            if (!eventTitle) {
              alert('Please enter an event title');
              return;
            }
            
            const confirmMsg = 'This will delete ALL events titled "' + eventTitle + '" from ' + 
              (calendarId ? calendarId : 'your default calendar') + '. Continue?';
            
            if (confirm(confirmMsg)) {
              document.getElementById('result').innerHTML = 'Processing...';
              document.getElementById('result').style.display = 'block';
              
              google.script.run
                .withSuccessHandler(showResult)
                .withFailureHandler(showError)
                .deleteEventsByTitle(eventTitle, calendarId);
            }
          }
          
          function showResult(result) {
            document.getElementById('result').innerHTML = result.message;
            document.getElementById('result').style.display = 'block';
          }
          
          function showError(error) {
            document.getElementById('result').innerHTML = 'Error: ' + error.message;
            document.getElementById('result').style.display = 'block';
          }
        </script>
      </body>
    </html>
  `)
  .setTitle('Bulk Delete Calendar Events')
  .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Deletes calendar events matching the given title
 * 
 * @param {string} eventTitle - The exact title of events to delete
 * @param {string} calendarId - Optional calendar ID. If not provided, uses default calendar.
 * @return {Object} Result object containing success status and message
 */
function deleteEventsByTitle(eventTitle, calendarId) {
  if (!eventTitle) {
    return { success: false, message: 'Missing event title' };
  }
  
  try {
    // Get the specified calendar or the default calendar
    var calendar;
    
    if (!calendarId || calendarId.trim() === '') {
      calendar = CalendarApp.getDefaultCalendar();
    } else {
      try {
        calendar = CalendarApp.getCalendarById(calendarId);
        if (!calendar) {
          return { 
            success: false, 
            message: 'Could not find a calendar with ID: ' + calendarId 
          };
        }
      } catch (calError) {
        return { 
          success: false, 
          message: 'Invalid calendar ID: ' + calendarId + '. Error: ' + calError.toString() 
        };
      }
    }
    
    // Use a date range that covers all existing events
    // From 10 years ago to 10 years in the future
    var startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 10);
    
    var endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 10);
    
    // Find all events in this large date range
    var events = calendar.getEvents(startDate, endDate);
    
    var deletedCount = 0;
    var matchingEvents = [];
    
    // Filter events by title and collect them
    for (var i = 0; i < events.length; i++) {
      if (events[i].getTitle() === eventTitle) {
        matchingEvents.push(events[i]);
      }
    }
    
    var totalMatching = matchingEvents.length;
    
    if (totalMatching === 0) {
      return { 
        success: true, 
        message: 'No events with the title "' + eventTitle + '" were found.' 
      };
    }
    
    // Delete all matching events
    for (var j = 0; j < matchingEvents.length; j++) {
      matchingEvents[j].deleteEvent();
      deletedCount++;
    }
    
    return {
      success: true,
      message: 'Successfully deleted ' + deletedCount + ' event(s) with the title "' + eventTitle + '".'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error deleting events: ' + error.toString()
    };
  }
}

/**
 * Standalone function to delete events without UI
 * Can be called directly from the script editor
 */
function bulkDeleteEventsByTitle() {
  // Set the event title you want to delete
  var eventTitle = "Event Title Here";
  
  // Set the calendar ID (leave empty for default calendar)
  var calendarId = "";  // e.g. "example@group.calendar.google.com"
  
  var result = deleteEventsByTitle(eventTitle, calendarId);
  Logger.log(result.message);
  return result;
}
