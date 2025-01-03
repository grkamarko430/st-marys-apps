function onFormSubmit(e) {
  // Get the form responses
  var responses = e.values;
  
  // Extract the necessary information from the responses
  var name = responses[1]; // Assuming the name is the second field
  var startDate = responses[2]; // Assuming the start date is the third field
  var endDate = responses[3]; // Assuming the end date is the fourth field
  var reason = responses[4]; // Assuming the reason is the fifth field
  var requesterEmail = responses[5]; // Assuming the requester's email is the sixth field
  
  // Define the email recipients
  var recipients = "group@example.com"; // Replace with the actual email group
  var approverEmail = "approver@example.com"; // Replace with the actual approver's email
  
  // Define the email subject and body
  var subject = "Day Out of Office Request";
  var body = "A new day out of office request has been submitted.\n\n" +
             "Name: " + name + "\n" +
             "Start Date: " + startDate + "\n" +
             "End Date: " + endDate + "\n" +
             "Reason: " + reason + "\n\n" +
             "Please review the request and approve or deny it using the following links:\n" +
             "Approve: " + getApprovalLink(name, startDate, endDate, reason, requesterEmail, true) + "\n" +
             "Deny: " + getApprovalLink(name, startDate, endDate, reason, requesterEmail, false);
  
  // Send the email
  MailApp.sendEmail(recipients, subject, body);
  MailApp.sendEmail(approverEmail, subject, body);
}

function getApprovalLink(name, startDate, endDate, reason, requesterEmail, isApproved) {
  var scriptUrl = ScriptApp.getService().getUrl();
  return scriptUrl + "?name=" + encodeURIComponent(name) +
         "&startDate=" + encodeURIComponent(startDate) +
         "&endDate=" + encodeURIComponent(endDate) +
         "&reason=" + encodeURIComponent(reason) +
         "&requesterEmail=" + encodeURIComponent(requesterEmail) +
         "&approved=" + isApproved;
}

function doGet(e) {
  var name = e.parameter.name;
  var startDate = e.parameter.startDate;
  var endDate = e.parameter.endDate;
  var reason = e.parameter.reason;
  var requesterEmail = e.parameter.requesterEmail;
  var approved = e.parameter.approved === 'true';
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Requests");
  sheet.appendRow([name, startDate, endDate, reason, approved ? "Approved" : "Denied"]);
  
  var subject = "Your Day Out of Office Request";
  var body = "Your request for a day out of office has been " + (approved ? "approved" : "denied") + ".\n\n" +
             "Name: " + name + "\n" +
             "Start Date: " + startDate + "\n" +
             "End Date: " + endDate + "\n" +
             "Reason: " + reason + "\n\n" +
             "Status: " + (approved ? "Approved" : "Denied");
  
  // Notify the requester and the group
  MailApp.sendEmail(requesterEmail, subject, body);
  MailApp.sendEmail("group@example.com", subject, body);
  
  return ContentService.createTextOutput("Request " + (approved ? "approved" : "denied") + ".");
}

// Set up the trigger to run the onFormSubmit function when a form is submitted
function createTrigger() {
  var form = FormApp.openById('119iFJQUDm1GsKjrqUNvjdSJdGFzZf_qIaCapY0EZeFQ'); // Replace with your form ID
  ScriptApp.newTrigger('onFormSubmit')
           .forForm(form)
           .onFormSubmit()
           .create();
}
