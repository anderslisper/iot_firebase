    // Firebase path
    var gFirebaseDeviceRoot = gFirebaseRoot + "NO_DEVICE_ID_SET";
    // Current device
    var gDeviceId;
    var gDeviceFullName; // '<deviceid> in <location>'
    var gDeviceParameter = getUrlVar('deviceid');
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
              if (childKey == gDeviceParameter) {
                gSelectedIndex = select.length;
                gDeviceParameter = ''
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
        gDeviceId     = select.options[gSelectedIndex].value;
        gDeviceFullName = select.options[gSelectedIndex].innerHTML;
        gFirebaseDeviceRoot = gFirebaseRoot + '/' + gDeviceId;

        // Callback to page specific function
        deviceIdHasChanged();
    }

