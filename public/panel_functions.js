    // Called from common_functions::deviceIdChanged when device has changed to allow for local adaptions
    function deviceIdHasChanged() {
        readSetPoint('desired');
        readSetPoint('reported');
    }

    // Read settings data from firebase and update input boxes for either bank='desired' or 'reported'
    function readSetPoint(bank) {
      firebase.database().ref(gFirebaseDeviceRoot + '/device_twin/' + bank).once('value').then(function(snapshot) {
		  try {
			document.getElementById(bank).innerHTML = snapshot.val().tempSetPoint;
		  }
		  catch(err) {
			console.log("No matching DOM object for key '" + snapshot.key + "'");
		  }
      });
    }

    // Save settings data to firebase
    function saveSetPoint(tempSetPointVal) {
      var d = new Date();
      firebase.database().ref(gFirebaseDeviceRoot + '/device_twin/desired/').update({
        tempSetPoint: parseFloat(tempSetPointVal),
		updateTime: d.toISOString()		
      });
    }
