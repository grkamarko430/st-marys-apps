# Coffee Hour Reminder Email Scheduler

This Google Apps Script project is designed to send reminder emails to families scheduled to host coffee hour at St. Mary Antiochian Orthodox Church. The script reads data from a Google Sheets spreadsheet and sends reminder emails four days before the scheduled event.

## Files

- `coffeeHourEmailScheduler.gs`: Contains the main script for sending reminder emails.
- `appsscript.json`: Configuration file for the Google Apps Script project.

## Setup

1. **Spreadsheet Setup**:
   - Create a Google Sheets spreadsheet with the following columns:
     - Column A: Event Date
     - Column B: Family Name
     - Column C: Emails (comma-separated)
   - Note the Spreadsheet ID from the URL of your Google Sheets document.

2. **Script Setup**:
   - Open Google Apps Script Editor.
   - Create a new project and replace the default code with the contents of `coffeeHourEmailScheduler.gs`.
   - Update the `SPREADSHEET_ID` variable in the script with your Spreadsheet ID.

3. **Configuration**:
   - Ensure the `appsscript.json` file is configured correctly with the necessary advanced services enabled (Gmail, Sheets, Drive).

## Usage

1. **Scheduling**:
   - The script is designed to be triggered automatically. Set up a time-driven trigger in Google Apps Script to run the `sendReminderEmails` function daily.

2. **Email Content**:
   - The email content is defined in the `sendEmail` function. Customize the message as needed.

## Functions

- `sendReminderEmails()`: Main function to read data from the spreadsheet and send reminder emails.
- `sendEmail(family, eventDate, emails)`: Sends an email to the specified family with event details.
- `formatEmailAddresses(emailString)`: Formats and returns the email addresses from a comma-separated string.

## Advanced Services

Ensure the following advanced services are enabled in your Google Apps Script project:

- Gmail API
- Sheets API
- Drive API

## License

This project is licensed under the MIT License.