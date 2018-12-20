var config = {
    apiKey: "<api key>",
    authDomain: "<project>.firebaseapp.com",
    databaseURL: "https://<project>.firebaseio.com",
    projectId: "<project>",
    storageBucket: "<project>.appspot.com",
};

firebase.initializeApp(config);
var provider = new firebase.auth.GoogleAuthProvider();
firebase.auth().signInWithPopup(provider).then(function(result) {
  // This gives you a Google Access Token. You can use it to access the Google API.
  var token = result.credential.accessToken;
  // The signed-in user info.
  var user = result.user;
  // ...
  console.log(gFirebaseRoot)
}).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  // The email of the user's account used.
  var email = error.email;
  // The firebase.auth.AuthCredential type that was used.
  var credential = error.credential;
  // ...
  console.log(errorCode, errorMessage, credential)
});

var gFirebaseRoot = "users/<user id>/"
  