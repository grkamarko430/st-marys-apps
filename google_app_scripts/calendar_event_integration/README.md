# St. Mary's Calendar Event Integration

This Google Apps Script project automatically synchronizes events from a source calendar to a target calendar based on specific tags in the event titles.

## Overview

The Calendar Event Integration system monitors a source calendar for events that contain a specific tag (default: `*`) and copies those events to a target calendar. This helps maintain separate calendars for different purposes while ensuring important events are synchronized between them.

The synchronization includes all event details such as:
- Title (with the tag character removed in the target calendar)
- Description
- Location
- Start and end times
- Guest list
- Recurrence settings

## Files

- **calendar_event_integration.js**: The main script that handles event synchronization
- **trigger.js**: Helper script to set up the automatic trigger

## Setup Instructions

### 1. Script Properties

The script requires the following properties to be set in the Script Properties:

| Property Name | Description | Example |
|---------------|-------------|---------|
| `SOURCE_CALENDAR_ID` | ID of the calendar to monitor for events | `primary` or `church@stmarys.org` |
| `TARGET_CALENDAR_ID` | ID of the calendar where tagged events will be copied | `public@group.calendar.google.com` |
| `EMAIL_RECIPIENTS` | Comma-separated list of email addresses for notifications | `admin@stmarys.org,tech@stmarys.org` |
| `TAG_CHARACTER` | (Optional) Character that marks events for sync | Default is `*` |

To set these properties:
1. In the Apps Script editor, go to **Project Settings** (gear icon)
2. Click on **Script Properties** tab
3. Click **Add Script Property** button
4. Enter the property name and value
5. Repeat for all required properties
6. Click **Save**

### 2. Calendar IDs

To find a Google Calendar ID:
1. Go to [Google Calendar](https://calendar.google.com/)
2. Click the three dots next to the calendar name
3. Select "Settings and sharing"
4. Scroll down to "Integrate calendar"
5. Copy the Calendar ID (looks like: `example@group.calendar.google.com`)

For your primary calendar, you can simply use the word `primary` as the Calendar ID.

### 3. Setting Up the Trigger

1. Open the script in the Google Apps Script editor
2. Select the `trigger.js` file
3. Run the `emailSyncTrigger()` function once to set up automatic synchronization
4. Accept any permissions requested
5. Verify in the Apps Script dashboard that the trigger has been created

## How It Works

1. When an event is updated in the source calendar, the trigger activates the `syncCalendarEvents()` function
2. The function checks for events that occurred in the last hour or will occur any time in the future (up to 5 years ahead)
3. Events containing the tag character (`*`) in their titles are synchronized to the target calendar
4. If an event with the same title already exists in the target calendar (at the same time), it won't be duplicated
5. The tag character is removed from the title when creating the event in the target calendar
6. Recurring events are properly handled - the entire recurrence pattern is copied to the target calendar

## Recurring Events

The integration supports recurring events with the following features:
- The entire recurrence pattern is copied to the target calendar
- Supported recurrence types include:
  - Daily events
  - Weekly events (including specific days of the week)
  - Monthly events
  - Yearly events
  - Custom recurrence patterns
- Changes to individual instances of a recurring series are also synchronized
- Deleting a recurring event removes all instances from the target calendar

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

To view logs:
1. In the Apps Script editor, click on **Executions** in the left sidebar
2. Find the most recent execution of the script
3. Click on it to view the execution logs

## Troubleshooting

### Common Issues

1. **Events not syncing**
   - Verify that events have the correct tag character in the title
   - Check that you have the correct SOURCE_CALENDAR_ID set
   - Ensure the script has permission to access both calendars

2. **Duplicate events appearing**
   - This shouldn't happen under normal operation
   - Try removing all instances of the duplicated event and let it sync fresh

3. **Error emails being sent**
   - Review the error message carefully
   - Ensure all script properties are correctly set
   - Check calendar permissions

### Permission Requirements

The script needs the following permissions:
- Access to read from the source calendar
- Access to write to the target calendar
- Permission to send emails (for error notifications)

## Maintenance

- Check the Apps Script execution logs periodically to ensure the script is running properly
- The trigger is set to run automatically, but you may need to re-run `emailSyncTrigger()` if:
  - You update the script
  - The trigger stops working
  - You change the source calendar

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2023-06-01 | Initial release |
| 1.0.1 | 2023-08-15 | Added error email notifications |
| 1.1.0 | 2023-11-01 | Improved efficiency of calendar searches |
| 1.2.0 | 2024-02-12 | Added support for recurring events |

## Support

For any questions or issues with this integration, please contact the system administrator at admin@stmarys.org.
