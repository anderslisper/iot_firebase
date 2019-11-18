    // Called from common_functions::deviceIdChanged when device has changed to allow for local adaptions
    function deviceIdHasChanged() {
        readData('desired');
        readData('reported');
        updateTelemetryChart();
    }

    // Read settings data from firebase and update input boxes for either bank='desired' or 'reported'
    function readData(bank) {
      var prefix = bank.charAt(0) + '_'; // DOM ids are prefixed by either 'd_' or 'r_'
      var all = document.getElementsByTagName("*");
      for (var i = 0; i < all.length; i++) {
        if (all[i].id.startsWith(prefix) && all[i].tagName == "INPUT") {
            all[i].value = "";
        }
      }
      firebase.database().ref(gFirebaseDeviceRoot + '/device_twin/' + bank).once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          try {
            if (childSnapshot.key.endsWith("Time")) {
                var d = new Date(childSnapshot.val());
                document.getElementById(prefix + childSnapshot.key).innerHTML = 
                    d.toISOString().substring(0,10) + " " + d.toISOString().substring(11,19);
            } else {
                if (prefix == "r_") {
                    document.getElementById(prefix + childSnapshot.key).innerHTML = childSnapshot.val();
                } else {
                    document.getElementById(prefix + childSnapshot.key).value = childSnapshot.val();
                }
            }
          }
          catch(err) {
            console.log("No matching DOM object for key '" + childSnapshot.key + "'");
          }
        });
      });
    }

    // Save settings data to firebase
    function saveData() {
      var f = document.getElementById('d_tempSetPoint');
      var tempSetPointVal = f.options[f.selectedIndex].value;
      var telemetryIntervalVal = document.getElementById('d_telemetryInterval').value;
      var fallbackDateVal = document.getElementById('d_fallbackDate').value;
      var fallbackTempVal = document.getElementById('d_fallbackTemp').value;
      var d = new Date();
      firebase.database().ref(gFirebaseDeviceRoot + '/device_twin/desired').set({
        tempSetPoint: parseFloat(tempSetPointVal), 
        telemetryInterval: parseFloat(telemetryIntervalVal),
        fallbackDate: fallbackDateVal,
        fallbackTemp: fallbackTempVal,
        updateTime: d.toISOString()
      });
    }

    // Load telemetry data for current device and show chart
    function updateTelemetryChart() {
        var f = document.getElementById('d_duration');
        if (gDurationParameter != '') {
            for(i = 0; i < f.length; i++) {
                if (gDurationParameter == f[i].value) {
                    f.selectedIndex = i;
                    break;
                }
            }
            gDurationParameter = ''
        }
        
        gDuration = f.options[f.selectedIndex].value;

        setCookie("duration", gDuration, 30);
        console.log("set Duration: " + gDuration);

        var data = new google.visualization.DataTable();
        data.addColumn('date',   'Time');
        data.addColumn('number', 'Actual temp');
        data.addColumn('number', 'Set temp');
        data.addColumn('number', 'Outdoor temp');
        data.addColumn('number', 'Wind (m/s)');

        firebase.database().ref(gFirebaseDeviceRoot + '/telemetry').once('value', function(snapshot) {
          var tempOutdoor = 0;
          var tempCurrent = 0;
          var tempSetPoint = 0;
          var wind = 0;
          var logDate;
          var counterTotal = 0;
          var counterShown = 0;
          var youngest = new Date().getTime()-gDuration*60*60*1000;
          snapshot.forEach(function(childSnapshot) {
            var childData = childSnapshot.val();
            counterTotal++;
            logDate = new Date(childData.utctime);
            if (gDuration == 0 || logDate.getTime() > youngest) {
                counterShown++;
                tempOutdoor = 0;
                tempCurrent = 0;
                tempSetPoint = 0;
                wind = 0;
                try {
                    tempOutdoor = Number(childData.outdoor.temp);
                } catch(err) {
                    //console.log(err)
                }
                try {
                    wind = Number(childData.outdoor.wind);
                } catch(err) {
                    //console.log(err)
                }
                try {
                    tempCurrent = Number(childData.tempCurrent);
                } catch(err) {
                    //console.log(err)
                }
                try {
                    tempSetPoint = Number(childData.tempSetPoint);
                } catch(err) {
                    //console.log(err)
                }
                data.addRow( [logDate, tempCurrent, tempSetPoint, tempOutdoor, wind] ); 
            }
          });
          var options = {
              title: gDeviceFullName,
              curveType: 'none',
              hAxis: {format: 'HH:mm\ndd MMM'},
              legend: { position: 'bottom' },
              chartArea:{left:35,top:70}
          };

          var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));
          chart.draw(data, options);
          
          document.getElementById("r_latestDate").innerHTML     = logDate.toISOString().substring(0,10);
          document.getElementById("r_latestTime").innerHTML     = logDate.toISOString().substring(11,19);
          document.getElementById("r_latestSetPoint").innerHTML = tempSetPoint + " \xB0C"; // degC
          document.getElementById("r_latestTemp").innerHTML     = tempCurrent + " \xB0C";  // degC
          document.getElementById("r_latestOutdoor").innerHTML  = tempOutdoor + " \xB0C";  // degC
          document.getElementById("r_latestWind").innerHTML     = wind + " m/s";
          
          document.getElementById('counterTotal').innerHTML = counterTotal;
          document.getElementById('counterShown').innerHTML = counterShown;
        });
    }
