// Set up the trigger to run the onFormSubmit function when a form is submitted
function createTrigger() {
    var form = FormApp.openById('119iFJQUDm1GsKjrqUNvjdSJdGFzZf_qIaCapY0EZeFQ'); // Replace with your form ID
    ScriptApp.newTrigger('onFormSubmit')
             .forForm(form)
             .onFormSubmit()
             .create();
  }