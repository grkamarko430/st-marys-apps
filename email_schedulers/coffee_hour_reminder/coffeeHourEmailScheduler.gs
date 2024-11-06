var SPREADSHEET_ID = '16wDD8wXsJOQQ_jGDYbq3HxcSEIGB7AvHF2kPDcTWM2M';

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

function sendEmail(family, eventDate, emails) {
  var emailAddresses = formatEmailAddresses(emails); 
  var subject = "REMINDER - Coffee Hour Hosts " + eventDate.toDateString();
  var attachments = [DriveApp.getFileById('1shafaAPgLAMYFEvoqQUsI9pcCmpT7F8E')] // Add more attachments here!!
  console.log(attachments)
  var message = `Dear ${family},<br><br>

    You are scheduled to host coffee hour on <b>${eventDate.toDateString()}</b>. Please see instructions below for set up:<br><br>

    HOW TO HOST COFFEE HOUR:<br>
    1) Please arrive no later than 9:30am to allow time to set up and still return to church in time for Liturgy.<br>
    2) Bring coffee (2 lbs - any brand), creamers (dairy & non-dairy) and cups (8oz disposable cups) if you are making coffee using the coffee urns. For making coffee, the instructions are on the kitchen wall. We have sugar and stirrers in the pantry.<br>
    3) Snacks: eg. granola bars, pre-packaged items or something that fits on a napkin are permissible (muffins, slices of cake, donuts, cookies). Ensure they are shelf stable and do not require refrigeration. Bring napkins if needed.<br>
    4) After coffee hour: please dispose of all items that you brought with you, including creamers, snacks etc. Clean up the coffee table and wipe it down. Make sure all trash has been removed from the hall and placed in the large trash bins. For the coffee machine, dispose of the grounds in the trash, and then rinse out the machine and leave to dry on the counter.<br>
    5) If you would also like to offer the Holy Bread that day, there is a suggested donation of $25 towards that (payable by check or via square to Saint Mary's Antiochian Orthodox Church and marked Holy Bread). This is the wording used for the bulletin if you would like to complete it (or use your own wording), and would appreciate if you can forward that information by replying back to this email & copying Father Damaskinos by the Thursday preceding your hosting date to ensure it appears in the Bulletin: Holy bread and coffee hour are offered by (INSERT FAMILY NAME) in memory of (NAME) and for the health of (NAME).<br><br>

    <b>If you are unable to be physically present to set up on your assigned Sunday</b>, we are offering a <b>Ready-To-Go Coffee Hour Option</b>. These will be picked up and set up in the church hall on your behalf from Wegmans. This set up includes the following and costs $200 (payable by check or via square to Saint Mary's Antiochian Orthodox Church and marked for Coffee Hour Donation). This is the at cost price for these items.<br>
    4 boxes of coffee (3 regular + 1 decaf)<br>
    4 trays of breakfast pastries or cake<br><br>

    If you require any help or guidance on the day, please reach out to our Coffee Hour Stewards; Marie Poulos or Nuha Jabaji who can walk you through the process.<br><br>

    Please remember..."Keep it simple"!<br><br>

    In Christ,<br>
    The Church Office<br>
    St. Mary Antiochian Orthodox Church<br>
    Mailing Address: P.O. Box 1048, Cockeysville, MD 21030<br>
    Church Location: 909 Shawan Road, Cockeysville-Hunt Valley, MD 21030<br>
    (443) 281-8091<br>
    www.nativityofthetheotokos.org<br>
    <b>"And whatsoever ye do, do it heartily, as to the Lord, and not unto men" (Colossians 3:23).</b>`;
  
  MailApp.sendEmail({
    to: emailAddresses, 
    subject: subject, 
    htmlBody: message, 
    attachments: attachments});
}

// function to format abd return the email address for each family
function formatEmailAddresses(emailString) {
  if (typeof emailString !== 'string') {
    throw new Error('Input must be a string');
  }
  return emailString.split(',').map(email => email.trim()).join(', ');
}
