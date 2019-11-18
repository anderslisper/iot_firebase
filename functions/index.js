'use strict';

const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

//const firebaseRoot  = functions.config().database.root;
const adminEmail    = functions.config().admin.email;
const alertEmail    = functions.config().tempalert.email;
const gmailEmail    = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

// Sends an email when a device's reported state is reported
exports.sendEmail = functions.database.ref('{deviceId}/device_twin/reported').onWrite(async (change, context) => {
  const deviceId = context.params.deviceId
  const val = change.after.val();

  console.log(val);

  var mailTo = adminEmail
  var subject = ""
  if (val.tempAlert) {
      if (alertEmail != "") {
          mailTo += "," + alertEmail
      }
      subject = 'TEMP alert warning!!!';
      console.log("Temperature alert from '" + deviceId + "' sent to " + mailTo); //+ ' with name:' + name);
  }
  else {
      subject = 'Reported state update';
      console.log("New state reported from '" + deviceId + "' sent to " + mailTo); //+ ' with name:' + name);
  }

  const mailOptions = {
    from: '"Gundbyn IoT mailer" <' + gmailEmail + '>',
    to: mailTo,
    subject: subject,
    text: "New state of device '" + deviceId + 
        "' is: \n" + JSON.stringify(val, null, 4) + 
        "\n\nhttps://" + process.env.GCLOUD_PROJECT + ".firebaseapp.com/?deviceid=" + deviceId
  };
  
  try {
    await mailTransport.sendMail(mailOptions);
  } catch(error) {
    console.error('There was an error while sending the email:', error);
  }
  return null;
});
