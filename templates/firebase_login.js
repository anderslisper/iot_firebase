var config = {
    apiKey: "<api key>",
    authDomain: "<project>.firebaseapp.com",
    databaseURL: "https://<project>.firebaseio.com",
    projectId: "<project>",
    storageBucket: "<project>.appspot.com",
};
firebase.initializeApp(config);
firebase.auth().signInWithEmailAndPassword(<user>, <password>).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log('Login Failed!', errorCode, errorMessage);
    });

var gFirebaseRoot = "users/<userid>/"
    