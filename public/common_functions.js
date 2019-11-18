    // Firebase path
    var gFirebaseDeviceRoot = gFirebaseRoot + "NO_DEVICE_ID_SET";
    // Current device
    var gDeviceId;
    var gDuration;
    var gDeviceFullName; // '<deviceid> in <location>'
    var gDeviceIdParameter = "";
    var gDurationParameter = "";
    var gSelectedIndex = 0;

    function getUrlVar(parameter) {
        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            vars[key] = value;
        });
        var value = ''
        try {
            value = vars[parameter]
        }
        catch (err) {
        }
        return value;
    }

    // Load device list from firebase
    function loadDevices() {
        var select = document.getElementById('deviceId');
        while (select.options.length > 0) {                
            select.remove(0);
        }        
 
        gDeviceIdParameter = getCookie("device_id");
        console.log("device_id: " + gDeviceIdParameter);
        gDurationParameter = getCookie("duration");
        console.log("Duration: " + gDurationParameter);

        firebase.database().ref(gFirebaseRoot).once('value', function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
              var childKey = childSnapshot.key;
              var opt = document.createElement('option');
              opt.value = childKey;
              opt.innerHTML = childKey;
              try {
                name = childSnapshot.val().name;
                loc = childSnapshot.val().location;
                if (loc != undefined) {
                    opt.innerHTML = name + ' in ' + loc;
                }
              }
              catch(err) {
                console.log(err)
              }
              if (childKey == gDeviceIdParameter) {
                gSelectedIndex = select.length;
                gDeviceIdParameter = ''
              }
              select.appendChild(opt);    
            })
            select.selectedIndex = gSelectedIndex;
            deviceIdChanged();
          });
    }
    
    // Called when device has changed
    function deviceIdChanged() {
        var select = document.getElementById('deviceId');
        gSelectedIndex  = select.selectedIndex;
        gDeviceId       = select.options[gSelectedIndex].value;
        gDeviceFullName = select.options[gSelectedIndex].innerHTML;
        gFirebaseDeviceRoot = gFirebaseRoot + '/' + gDeviceId;

        setCookie("device_id", gDeviceId, 30);

        // Callback to page specific function
        deviceIdHasChanged();
    }

    function setCookie(cname, cvalue, exdays) {
      var d = new Date();
      d.setTime(d.getTime() + (exdays*24*60*60*1000));
      var expires = "expires="+ d.toUTCString();
      document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
    
    function getCookie(cname) {
      var name = cname + "=";
      var decodedCookie = decodeURIComponent(document.cookie);
      var ca = decodedCookie.split(';');
      for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
    }
