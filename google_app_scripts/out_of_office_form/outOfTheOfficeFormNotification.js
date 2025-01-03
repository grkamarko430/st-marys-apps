function onFormSubmit(e) {
  Logger.log(JSON.stringify(e));
  
  // Open the form by its ID
  var form = FormApp.openById('119iFJQUDm1GsKjrqUNvjdSJdGFzZf_qIaCapY0EZeFQ'); // Replace with your form ID
  Logger.log(form);
  Logger.log(form.getResponses());

  // Get the latest response
  var formResponses = form.getResponses();
  var latestResponse = formResponses[formResponses.length - 1];
  Logger.log("latestResponse: " + latestResponse);
  
  // Get the item responses from the latest response
  var responses = latestResponse.getItemResponses();
  Logger.log("responses: " + responses);
  
  // Extract the necessary information from the responses
  var name = responses[0].getResponse(); // Assuming the name is the second field
  var startDate = responses[1].getResponse(); // Assuming the start date is the third field
  var endDate = responses[2].getResponse(); // Assuming the end date is the fourth field
  var reason = responses[3].getResponse(); // Assuming the reason is the fifth field
  var requesterEmail = responses[4].getResponse(); // Assuming the requester's email is the sixth field
  
  Logger.log("Name: " + name);
  Logger.log("Start Date: " + startDate);
  Logger.log("End Date: " + endDate);
  Logger.log("Reason: " + reason);
  Logger.log("Requester Email: " + requesterEmail);
  
  // Define the email recipients as an array
  var recipients = ["grkamarko430@gmail.com"]; // Replace with the actual email addresses
  var approverEmail = "grkamarko430@gmail.com"; // Replace with the actual approver's email
  
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
  
  // Send the email to all recipients
  MailApp.sendEmail(recipients.join(','), subject, body);
  MailApp.sendEmail(approverEmail, subject, body);
}

function getApprovalLink(name, startDate, endDate, reason, requesterEmail, isApproved) {
  var scriptUrl = "https://script.google.com/macros/s/AKfycbzn4JDKCtsyDBi5pBncZ-PgN1D07LNXbQtuDstq5iqmogPsTQFLrhuBAteavcFlkR1RAg/exec"; // Replace with your deployment URL
  return scriptUrl + "?name=" + encodeURIComponent(name) +
         "&startDate=" + encodeURIComponent(startDate) +
         "&endDate=" + encodeURIComponent(endDate) +
         "&reason=" + encodeURIComponent(reason) +
         "&requesterEmail=" + encodeURIComponent(requesterEmail) +
         "&approved=" + isApproved;
}

function doGet(e) {
  Logger.log("Handling doGet with parameters: " + JSON.stringify(e.parameter));
  var name = e.parameter.name;
  var startDate = e.parameter.startDate;
  var endDate = e.parameter.endDate;
  var reason = e.parameter.reason;
  var requesterEmail = e.parameter.requesterEmail;
  var approved = e.parameter.approved === 'true';
  
  // Open the specific spreadsheet by its ID
  var spreadsheetId = '1emPPuVCCD0kMGbF-EZeANHK1VVx9DgwENaj5NePVmew'; // Replace with your spreadsheet ID
  var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName("OOTORequests");
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
  MailApp.sendEmail(recipients.join(','), subject, body);
  
  return ContentService.createTextOutput("Request " + (approved ? "approved" : "denied") + ".");
}