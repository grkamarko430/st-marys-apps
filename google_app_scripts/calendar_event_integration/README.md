# St. Mary's Calendar Event Integration

This Google Apps Script project automatically synchronizes events from a source calendar to a target calendar based on specific tags in the event titles.

## Overview

The Calendar Event Integration system monitors a source calendar for events that contain a specific tag (default: `*`) and copies those events to a target calendar. The synchronization includes all event details such as:
- Title
- Description
- Location
- Start and end times
- Guest list

## Files

- **calendar_event_integration.js**: The main script that handles event synchronization
- **trigger.js**: Helper script to set up the automatic trigger

## Setup Instructions

### 1. Script Properties

The script requires the following properties to be set in the Script Properties:

- `SOURCE_CALENDAR_ID`: ID of the calendar to monitor for events (source)
- `TARGET_CALENDAR_ID`: ID of the calendar where tagged events will be copied (destination)
- `EMAIL_RECIPIENTS`: Comma-separated list of email addresses to receive error notifications

To set these properties:
1. In the Apps Script editor, go to **Project Settings** (gear icon)
2. Click on **Script Properties** tab
3. Add properties with their respective values

### 2. Calendar IDs

To find a Google Calendar ID:
1. Go to [Google Calendar](https://calendar.google.com/)
2. Click the three dots next to the calendar name
3. Select "Settings and sharing"
4. Scroll down to "Integrate calendar"
5. Copy the Calendar ID (looks like: `example@group.calendar.google.com`)

### 3. Setting Up the Trigger

Run the `emailSyncTrigger()` function once to set up automatic synchronization. This creates a trigger that will run the sync function whenever an event is updated in the source calendar.

## How It Works

1. When an event is updated in the source calendar, the trigger activates the `syncCalendarEvents()` function
2. The function checks for events that occurred in the last hour or will occur in the next 24 hours
3. Events containing the tag character (`*`) in their titles are synchronized to the target calendar
4. If an event with the same title already exists in the target calendar (at the same time), it won't be duplicated

## Error Handling

If the synchronization job fails for any reason, an error notification email will be automatically sent to the addresses specified in the `EMAIL_RECIPIENTS` script property.

The email includes:
- The specific error message
- Error stack trace for debugging
- Context information including calendar IDs and timestamp

## Logging

The script includes comprehensive logging to help with troubleshooting:
- All major steps are logged
- Error details are captured
- Summary statistics show how many events were processed, created, or skipped

## Maintenance

- Check the Apps Script execution logs periodically to ensure the script is running properly
- The trigger is set to run automatically, but you may need to re-run `emailSyncTrigger()` if changes are made to the script

## Support

For any questions or issues with this integration, please contact the system administrator.
