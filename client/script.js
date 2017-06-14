(function(){

    const canvasHeight = 60;//120;

    const st = {
        DISCONNECTED: 'disconnected',
        CONNECTING: 'connecting',
        CONNECTION_FAILED: 'connectionFailed',
        CONNECTED: 'connected'
    };

    var ee = new EventEmitter();

    class AlertMgr {
        constructor() {
            this.currentState = 'initial';
            this.msgAlert = document.getElementById('msgAlert');
        }

        _disconnectedState() {
            this.currentState = st.DISCONNECTED;
            this.msgAlert.style.display = 'none';
            this.msgAlert.classList.remove('alert-success', 'alert-info', 'alert-warning', 'alert-danger');
            this.msgAlert.innerHTML = '';
        }

        _connectionFailedState() {
            this.currentState = st.CONNECTION_FAILED;
            this.msgAlert.style.display = '';
            this.msgAlert.classList.add('alert-danger');
            this.msgAlert.innerHTML = 'Could not connect to WebSocketServer';

            setTimeout(function () {
                ee.emitEvent('changeFsmState', [st.DISCONNECTED]);
            }, 3000);
        }

        changeFsmState(state) {
            switch(state) {
                case st.DISCONNECTED:
                    this._disconnectedState();
                    break;
                case st.CONNECTION_FAILED:
                    this._connectionFailedState();
            }
        }
    }

    class WebSocketServerMgr {
        constructor() {
            this.currentState = 'initial';

            this.btnConnect = document.getElementById('btnConnect');
            this.btnDisconnect = document.getElementById('btnDisconnect');
            this.btnConnecting = document.getElementById('btnConnecting');

            this.btnConnected = document.getElementById('btnConnected');
            this.btnDisconnected = document.getElementById('btnDisconnected');

            this.wsAddress = document.getElementById('wsAddress');
            this.wsPort = document.getElementById('wsPort');

            this.ws = undefined;

            this._registerEvents();
        }

        _registerEvents() {
            this.btnConnect.addEventListener('click', function () {
                ee.emitEvent('changeFsmState', [st.CONNECTING]);
            });

            this.btnDisconnect.addEventListener('click', function () {
                ee.emitEvent('changeFsmState', [st.DISCONNECTED]);
            })
        }

        _registerWsEvents() {
            this.ws.onopen = function (event) {
                console.log('Connetion with WebSocketServer opened');
                ee.emitEvent('changeFsmState', [st.CONNECTED])
            }

            this.ws.onmessage = function (event) {
                console.log('MESSAGE RECEIVED');
                console.log(event.data);
            }

            this.ws.onerror = function (event) {
            }

            this.ws.onclose = function (event) {
                console.log('Connection with WebSocketServer closed');
                if (event.code != 1000) {
                    console.log('Could not connect to WebSocketServer');
                    console.log(event);
                    ee.emitEvent('changeFsmState', [st.CONNECTION_FAILED]);
                }
                else {
                    console.log('CLOSED OK');
                }
            }

        }

        _disconnectedState() {
            this.currentState = st.DISCONNECTED;

            this.btnConnect.style.display = '';
            this.btnDisconnect.style.display = 'none';
            this.btnConnecting.style.display = 'none';

            this.btnConnected.style.display = 'none';
            this.btnDisconnected.style.display = '';

            this.wsAddress.disabled = false;
            this.wsPort.disabled = false;

            if (this.ws) this.ws = undefined;
        }

        _connectingState() {
            console.log('Trying to connect...');
            this.currentState = st.CONNECTING;

            this.btnConnect.style.display = 'none';
            this.btnDisconnect.style.display = 'none';
            this.btnConnecting.style.display = '';

            this.btnConnected.style.display = 'none';
            this.btnDisconnected.style.display = '';

            this.wsAddress.disabled = true;
            this.wsPort.disabled = true;
            if (this.wsAddress.value === '')
                this.wsAddress.value = '127.0.0.1';
            if (this.wsPort.value === '')
                this.wsPort.value = '8888';

            this.ws = new WebSocket('ws://'+this.wsAddress.value+ ':'+this.wsPort.value);
            this._registerWsEvents();
        }

        _connectedState() {
            this.currentState = st.CONNECTED;

            this.btnConnect.style.display = 'none';
            this.btnDisconnect.style.display = '';
            this.btnConnecting.style.display = 'none';

            this.btnConnected.style.display = '';
            this.btnDisconnected.style.display = 'none';

            this.wsAddress.disabled = true;
            this.wsPort.disabled = true;
        }

        changeFsmState(state) {
            switch(state) {
                case st.DISCONNECTED:
                case st.CONNECTION_FAILED:
                    this._disconnectedState();
                    break;
                case st.CONNECTING:
                    this._connectingState();
                    break;
                case st.CONNECTED:
                    this._connectedState();
            }
        }
    }

    class GuiMgr {

        constructor() {
            this.alertMgr = new AlertMgr();
            this.wssMgr = new WebSocketServerMgr();
        }

        changeFsmState(state) {
            this.wssMgr.changeFsmState(state);
            this.alertMgr.changeFsmState(state);
        }
    }

    class MyChart {
        constructor(obj) {
            this.canvasId = obj.canvasId;
            this.ctx = document.getElementById(this.canvasId).getContext('2d');
            this.ctx.canvas.height = canvasHeight;
            this.chart = new Chart(this.ctx, {
                type: obj.type,
                data: obj.data,
                options: obj.options
            });
        }

        update(label, data) {
            this.chart.data.labels.push(label);
            this.chart.data.datasets.forEach(function (dataset) {
                dataset.data.push(data);
            });
            this.chart.update();
        }

        insertData(label, data) {
            this.chart.data.labels.push(label);
            this.chart.data.labels.shift();

            this.chart.data.datasets.forEach(function (dataset) {
                dataset.data.push(data);
                dataset.data.shift();
            });
            this.chart.update();
        }
    }


    var guiMgr = new GuiMgr();
    ee.addListener('changeFsmState', function (state) {
console.log('mudando de estado para '+state); // TODO: remove this after debug
        guiMgr.changeFsmState(state);
    });

    ee.emitEvent('changeFsmState', [st.DISCONNECTED]);
    var data = {
        labels : ['1','2','3','4','5', '6', '7', '8', '9', '10'],
        datasets : [{
            data : [65,59,90,81,56,45,30,20,3,37]
        }]
    }
    var obj = {
        canvasId: 'myChart',
        type: 'line',
        data: data,
        options: {
            animation: false
        }
    }
    var pidChart = new MyChart(obj);

    var hor = 0;
    setInterval(function(){
        pidChart.insertData(hor++, hor*hor);
    }, 2000);

})();


// OLD CODE
// <script>
 
//       // log function
//       log = function(data){
//         $("div#terminal").prepend("</br>" +data);
//         console.log(data);
//       };
 
//       $(document).ready(function () {
//         $("div#message_details").hide()
 
//         var ws;
 
//         $("#open").click(function(evt) {
//           evt.preventDefault();
 
//           var host = $("#host").val();
//           var port = $("#port").val();
//           var uri = $("#uri").val();
 
//           // create websocket instance
//           ws = new WebSocket("ws://" + host + ":" + port + uri);
           
//           // Handle incoming websocket message callback
//           ws.onmessage = function(evt) {
//             log("Message Received: " + evt.data)
//             alert("message received: " + evt.data);
//             };
 
//           // Close Websocket callback
//           ws.onclose = function(evt) {
//             log("***Connection Closed***");
//             alert("Connection close");
//             $("#host").css("background", "#ff0000"); 
//             $("#port").css("background", "#ff0000"); 
//             $("#uri").css("background",  "#ff0000");
//             $("div#message_details").empty();
 
//             };
 
//           // Open Websocket callback
//           ws.onopen = function(evt) { 
//             $("#host").css("background", "#00ff00"); 
//             $("#port").css("background", "#00ff00"); 
//             $("#uri").css("background", "#00ff00");
//             $("div#message_details").show();
//             log("***Connection Opened***");
//           };
//         });
 
//         // Send websocket message function
//         $("#send").click(function(evt) {
//             log("Sending Message: "+$("#message").val());
//             ws.send($("#message").val());
//         });
 
//       });
//     </script>