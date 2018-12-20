'use strict';

const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
//const admin = require('firebase-admin');
//admin.initializeApp(functions.config().firebase);

const firebaseRoot  = functions.config().database.root;
const adminEmail    = functions.config().admin.email;
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
exports.sendEmail = functions.database.ref(firebaseRoot + '{deviceId}/device_twin/reported').onWrite(async (change, context) => {
  const deviceId = context.params.deviceId
  const val = change.after.val();

//  admin.database().ref(firebaseRoot+deviceId).once('value', function(snapshot) {
//    name = deviceId;
//    try {
//        name = snapshot.val().name;
//    }
//    catch(err) {
//        console.log(err)
//    }
//  });
  console.log(val);
  console.log('DeviceId: ' + deviceId); //+ ' with name:' + name);
  
  const mailOptions = {
    from: '"Gundbyn IoT mailer" <' + gmailEmail + '>',
    to: adminEmail,
  };

  // Building Email message.
  mailOptions.subject = val.tempAlert ? 'TEMP alert warning!!!' : 'Reported state update';
  mailOptions.text = "New state of device '" + deviceId + 
        "' is: \n" + JSON.stringify(val, null, 4) + 
        "\n\nhttps://" + process.env.GCLOUD_PROJECT + ".firebaseapp.com/"
  
  try {
    await mailTransport.sendMail(mailOptions);
  } catch(error) {
    console.error('There was an error while sending the email:', error);
  }
  return null;
});
