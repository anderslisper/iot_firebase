
    // Called from common_functions::deviceIdChanged when device has changed to allow for local adaptions
    function deviceIdHasChanged() {
        updateTelemetryTable();
        
        var a = document.getElementById('portal');
        a.href = "index.html?deviceid=" + gDeviceName;

    }
    
    // Create new device
    function createDevice() {
      var devId   = document.getElementById('newDeviceId').value;
      var devName = document.getElementById('newDeviceName').value;
      var loc     = document.getElementById('newLocation').value;
      devId = devId.replace(/[^a-zA-Z0-9_]/g, ""); // Remove all funny chars
      if (devId != '' && devName != '') {
          var d = new Date();
          firebase.database().ref(gFirebaseRoot + '/' + devId + '/device_twin/desired').set({
            tempSetPoint: 21, 
            telemetryInterval: 1200,
            reboot: "",
            updateTime: d.toISOString()
          });
          firebase.database().ref(gFirebaseRoot + '/' + devId).update({
            name: devName, 
            location: loc
          });
          
        document.getElementById('newDeviceId').value = "";
        document.getElementById('newDeviceName').value = "";
        document.getElementById('newLocation').value = "";
        loadDevices();
      }
    }

    // Order reboot of device
    function rebootDevice() {
      var d = new Date();
      rebootVal = d.toISOString();
      firebase.database().ref(gFirebaseDeviceRoot + '/device_twin/desired/reboot').set(rebootVal);
    }

    // Delete device
    function deleteDevice() {
      firebase.database().ref(gFirebaseDeviceRoot).remove();
    }

    // CLASS Telemetry
    function Telemetry() {
        this.tempCurrent = 0.0;
        this.tempSetPoint = 0.0;
        this.wind = 0.0;
        this.tempOutdoor = 0.0;
        this.noEnties = 0;
        this.updateKey = "";
        this.removeKeys = [];
        
        this.add = function(key, data) {
            this.tempCurrent += data.tempCurrent;
            this.tempSetPoint += data.tempSetPoint;
            this.wind += data.outdoor.wind;
            this.tempOutdoor += data.outdoor.temp;
            this.noEnties++;
            if (this.updateKey == "") {
              this.updateKey = key;
              this.utctime = data.utctime;
              //console.log("Will update " + key);
            } else {
              this.removeKeys.push(key);  
              //console.log("Will remove " + key);
            }
        }

        this.updateDatabase = function() {
          if (this.updateKey != "") {
            averTempCurrent  = Math.round((this.tempCurrent  / this.noEnties) * 10) / 10;
            averTempSetPoint = Math.round((this.tempSetPoint / this.noEnties) * 10) / 10;
            averWind         = Math.round((this.wind         / this.noEnties) * 10) / 10;
            averTempOutdoor  = Math.round((this.tempOutdoor  / this.noEnties) * 10) / 10;
            firebase.database().ref(gFirebaseDeviceRoot + '/telemetry/' + this.updateKey).set({
              tempCurrent: averTempCurrent, 
              tempSetPoint: averTempSetPoint,
              tempAlert: false,
              utctime: this.utctime,
              outdoor: { 
                temp: averTempOutdoor,
                wind: averWind,
                fetched_utctime: this.utctime
              }
            });
          
            for (var key in this.removeKeys) { 
              firebase.database().ref(gFirebaseDeviceRoot + '/telemetry/' + this.removeKeys[key]).remove();
            }
          }
        }
    }
    
    // Compact to 1 entry per hour for the "date"
    function compactDay(date) {
      //console.log("update " + date);
      firebase.database().ref(gFirebaseDeviceRoot + '/telemetry').once('value', function(snapshot) {
        var telemetryObjects = [];
        var currHour = -1;
        var telemetry = null;
        snapshot.forEach(function(childSnapshot) {
          var childData = childSnapshot.val();
          if (childData.utctime.substring(0,10) == date) {
            var hour = parseInt(childData.utctime.substring(11,13));
            if (hour != currHour) {
              currHour = hour;
              telemetry = new Telemetry();
              telemetryObjects.push(telemetry);
            }
            telemetry.add(childSnapshot.key, childData);
          }
        });
        for (var t in telemetryObjects) {
          //console.log("Handling object " + telemetryObjects[t].updateKey + " with " + telemetryObjects[t].noEnties + " entries");
          telemetryObjects[t].updateDatabase();
        }
      });
    }
    
    // Remove all entries for this "date"
    function removeDay(date) {
      //console.log("remove " + date);
      firebase.database().ref(gFirebaseDeviceRoot + '/telemetry').once('value', function(snapshot) {
        var removeVector = []
        snapshot.forEach(function(childSnapshot) {
          var childData = childSnapshot.val();
          if (childData.utctime.substring(0,10) == date) {
            removeVector.push(childSnapshot.key);
          }
        });
        for (var key in removeVector) {
          firebase.database().ref(gFirebaseDeviceRoot + '/telemetry/' + removeVector[key]).remove();
          //console.log("Removing key " + removeVector[key]);
        }
      });
    }
    
    // Load telemetry data for current device and show table
    function updateTelemetryTable() {
        firebase.database().ref(gFirebaseDeviceRoot + '/telemetry').once('value', function(snapshot) {
          var logDate;
          var telemetryMap = new Map()
          snapshot.forEach(function(childSnapshot) {
            var childData = childSnapshot.val();
            logDate = childData.utctime.substring(0,10);
            cnt = telemetryMap.get(logDate)
            if (isNaN(cnt)) {
                cnt = 0
            }
            telemetryMap.set(logDate, cnt + 1)
          });
          
          var daysTable = document.getElementById("table_days");
          while (daysTable.firstChild) {
            daysTable.removeChild(daysTable.firstChild);
          }

          var row = daysTable.insertRow(0);
          row.insertCell(0).innerHTML = "Date:";
          row.insertCell(1).innerHTML = "#Entries:";
          row.insertCell(2).innerHTML = "Command:";

          for (let day of telemetryMap.keys()) {
            entries = telemetryMap.get(day);
            row = daysTable.insertRow(-1);
            row.insertCell(0).innerHTML = day;
            row.insertCell(1).innerHTML = entries;

            var btn = document.createElement('input');
            btn.type = "button";
            btn.className = "btn";
            if (entries > 24) {
              btn.value = "Compact";
              btn.onclick = (function() {compactDay(day);});
            } else {
              btn.value = "Remove";
              btn.onclick = (function() {removeDay(day);});
            }
            row.insertCell(2).appendChild(btn);
          }
        });
    }
