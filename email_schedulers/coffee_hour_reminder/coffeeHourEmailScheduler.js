var SPREADSHEET_ID = '16wDD8wXsJOQQ_jGDYbq3HxcSEIGB7AvHF2kPDcTWM2M'; // Google Sheet "Coffee Hour Hosting 2024 - 2025" 
var EMAIL_TEMPLATE_ID = '1OB9D_P5EKylooce7DWcae8Wh0Ke1guUPlmKBzTnXZHY' // Google Doc "Coffee Hour Email Instructions" in https://drive.google.com/drive/folders/1EQOyz7UlzWme1_CTcxpjBKNKH6XkFqNv
var ATTACHMENTS = [DriveApp.getFileById('1shafaAPgLAMYFEvoqQUsI9pcCmpT7F8E')] // Google Doc "Coffee Percolator Instructions.docx" in https://drive.google.com/drive/folders/1EQOyz7UlzWme1_CTcxpjBKNKH6XkFqNv


function sendReminderEmails() {
  // Open the specific spreadsheet using its ID
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getActiveSheet();
  
  // Get data starting from A3
  var dataRange = sheet.getRange("A2:D" + sheet.getLastRow());
  var data = dataRange.getValues();
  
  // Get today's date
  var today = new Date();
  
  // Iterate through each row of data (skipping the header row)
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var eventDate = new Date(row[0]);
    var family = row[2]
    var emails = row[3];
    
    // Calculate the date four days before the event
    var reminderDate = new Date(eventDate.getTime());
    reminderDate.setDate(reminderDate.getDate() - 4);
    
    // Check if today is the reminder date
    if (today.toDateString() === reminderDate.toDateString()) {
      // Send the email
      sendEmail(family, eventDate, emails);
    }
  }
}

// function to get the instructions for coffee hour
function getCoffeeHourInstructions() {
  try {
    var doc = DocumentApp.openById(EMAIL_TEMPLATE_ID);
    var body = doc.getBody();
    return body.getText();
  } catch (e) {
    Logger.log('Error retrieving document: ' + e.message);
    return '';
  }
}

function sendEmail(family, eventDate, emails) {
  var emailAddresses = formatEmailAddresses(emails); 
  var subject = "REMINDER - Coffee Hour Hosts " + eventDate.toDateString();
  console.log(ATTACHMENTS)

  var message_body = getCoffeeHourInstructions();
  var message = message_body.replace(/\n/g, '<br>');
  
  MailApp.sendEmail({
    to: emailAddresses, 
    subject: subject, 
    htmlBody: message, 
    attachments: ATTACHMENTS});
}

// function to format and return the email address for each family
function formatEmailAddresses(emailString) {
  if (typeof emailString !== 'string') {
    throw new Error('Input must be a string');
  }
  return emailString.split(',').map(email => email.trim()).join(', ');
}
