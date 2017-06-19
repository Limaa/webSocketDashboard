(function(){
    "use strict";

    const canvasHeight = 60;//120;
    const graphLabelSize = 100;

    const st = {
        DISCONNECTED: 'disconnected',
        CONNECTING: 'connecting',
        CONNECTION_FAILED: 'connectionFailed',
        DEVICE_DISCONNECTED: 'deviceDisconnected',
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

            setTimeout(() => {
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

            this._registerEvents();        }
        _registerEvents() {
            this.btnConnect.addEventListener('click', () => {
                ee.emitEvent('changeFsmState', [st.CONNECTING]);
            });

            this.btnDisconnect.addEventListener('click', () => {
                this.ws.close();
                this.ws = undefined;
                ee.emitEvent('changeFsmState', [st.DISCONNECTED]);
            });
        }

        _registerWsEvents() {
            this.ws.onopen = () => {
                console.log('Connetion with WebSocketServer opened');
                ee.emitEvent('changeFsmState', [st.DEVICE_DISCONNECTED]);
            };

            this.ws.onmessage = (event) => {
                console.log('MESSAGE RECEIVED');
                try {
                    var data = JSON.parse(event.data);
                    ee.emitEvent(data.type, [data]);
                    console.log(data);
                }
                catch (e) {
                    console.log('Error parsing message received');
                    console.log(event);
                }
            };

            this.ws.onerror = () => {
            };

            this.ws.onclose = (event) => {
                console.log('Connection with WebSocketServer closed');
                if (event.code !== 1000) {
                    console.log('Could not connect to WebSocketServer');
                    console.log(event);
                    ee.emitEvent('changeFsmState', [st.CONNECTION_FAILED]);
                }
                else {
                    console.log('CLOSED OK');
                }
            };
        }

        send(msg) {
            this.ws.send(msg);
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

            if (this.ws) {
                this.ws.close();
                this.ws = undefined;
            }
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
            if (this.wsAddress.value === '') {
                this.wsAddress.value = '127.0.0.1';
            }
            if (this.wsPort.value === '') {
                this.wsPort.value = '8888';
            }

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
                case st.DEVICE_DISCONNECTED:
                case st.CONNECTED:
                    this._connectedState();
                    break;
            }
        }
    }

    class DeviceMgr {
        constructor() {
            this.currentState = 'initial';

            this.angle = document.getElementById('system-input-angle');

            this.kp = document.getElementById('system-input-kp');
            this.ki = document.getElementById('system-input-ki');
            this.kd = document.getElementById('system-input-kd');

            this.btnDeviceDisconnected = document.getElementById('btnDeviceDisconnected');
            this.btnDeviceSend = document.getElementById('btnDeviceSend');

            this.intervalId = undefined;
        }

        _checkDevice() {
            console.log('checking for device');
            ee.emitEvent('checkDevice');
        }

        _stopChecking() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
            this.intervalId = undefined;
        }

        deviceResponse(data) {
            console.log('device responded');
            this._stopChecking();

            this.angle.value = data.angle;

            this.kp.value = data.kp;
            this.ki.value = data.ki;
            this.kd.value = data.kd;

            ee.emitEvent('changeFsmState', [st.CONNECTED]);
        }

        _disconnectedState() {
            this.currentState = st.DISCONNECTED;

            this.angle.value = 0;
            this.angle.disabled = true;

            this.kp.value = 0;
            this.kp.disabled = true;
            this.ki.value = 0;
            this.ki.disabled = true;
            this.kd.value = 0;
            this.kd.disabled = true;

            this.btnDeviceDisconnected.style.display = '';
            this.btnDeviceSend.style.display = 'none';

            this._stopChecking();
        }

        _deviceDisconnectedState() {
            this._disconnectedState();
            this.currentState = st.DEVICE_DISCONNECTED;

            this.intervalId = setInterval(this._checkDevice, 1000);
        }

        _connectedState() {
            this.currentState = st.CONNECTED;

            this.angle.disabled = false;

            this.kp.disabled = false;
            this.ki.disabled = false;
            this.kd.disabled = false;

            this.btnDeviceDisconnected.style.display = 'none';
            this.btnDeviceSend.style.display = '';

            this._stopChecking();

            // TODO: check values ov angle, kp, ki, kd have changed, show that to user and send data to websocketServer
        }

        changeFsmState(state) {
            switch(state) {
                case st.DISCONNECTED:
                    this._disconnectedState();
                    break;
                case st.DEVICE_DISCONNECTED:
                    this._deviceDisconnectedState();
                    break;
                case st.CONNECTED:
                    this._connectedState();
                    break;
            }
        }
    }

    class TerminalMgr {
        constructor() {
            this.currentState = 'initial';

            this.terminalMessages = document.getElementById('terminal-messages');
            this.inputInfo = document.getElementById('terminal-input-info');
            this.btnSend = document.getElementById('terminal-btn-send');
        }

        _eraseMessages() {
            while (this.terminalMessages.firstChild) {
                this.terminalMessages.removeChild(this.terminalMessages.firstChild);
            }
        }

        insertMessage(event) {
            var time = document.createElement('p');
            var timeText = document.createTextNode(new Date(event.ts).toLocaleTimeString());
            time.classList.add('pull-right');
            time.appendChild(timeText);

            var msg = document.createElement('p');
            var msgText = event.id + ':' + event.type + ': ' + event.data;
            msgText = document.createTextNode(msgText);
            msg.appendChild(msgText);

            var msgContainer = document.createElement('div');
            msgContainer.appendChild(time);
            msgContainer.appendChild(msg);

            this.terminalMessages.appendChild(msgContainer);
            this.terminalMessages.scrollTop = this.terminalMessages.scrollHeight;
        }

        _disconnectedState() {
            this.currentState = st.DISCONNECTED;

            this._eraseMessages();
            this.insertMessage({
                type: '',
                data: 'Disconnected from WebSocketServer',
                id: '',
                ts: +Date.now()
            });

            this.inputInfo.disabled = true;
            this.btnSend.classList.add('disabled');
        }

        _connectedState() {
            this.currentState = st.CONNECTED;

            this._eraseMessages();

            this.inputInfo.disabled = false;
            this.btnSend.classList.remove('disabled');
        }

        changeFsmState(state) {
            switch(state) {
                case st.DISCONNECTED:
                    this._disconnectedState();
                    break;
                case st.DEVICE_DISCONNECTED:
                case st.CONNECTED:
                    this._connectedState();
                    break;
            }
        }
    }

    class MyChart {
        constructor() {
            var data = {
                labels : [],
                datasets : [{
                    data : []
                }]
            };
            var obj = {
                canvasId: 'myChart',
                type: 'line',
                data: data,
                options: {
                    animation: false
                }
            };

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
            this.chart.data.datasets.forEach((dataset) => {
                dataset.data.push(data);
            });
            this.chart.update();
        }

        insertData(label, data) {
            this.chart.data.labels.push(label);
            if (this.chart.data.labels.length > graphLabelSize) {
                this.chart.data.labels.shift();
            }

            this.chart.data.datasets.forEach((dataset) => {
                dataset.data.push(data);
                if (dataset.data.length > graphLabelSize) {
                    dataset.data.shift();
                }
            });
            this.chart.update();
        }
    }

    var alertMgr = new AlertMgr();
    var wssMgr = new WebSocketServerMgr();
    var deviceMgr = new DeviceMgr();
    var terminalMgr = new TerminalMgr();
    var pidChart = new MyChart();
    ee.addListener('changeFsmState', (state) => {
        console.log('mudando de estado para ' + state); // TODO: remove this after debug
        alertMgr.changeFsmState(state);
        wssMgr.changeFsmState(state);
        deviceMgr.changeFsmState(state);
        terminalMgr.changeFsmState(state);
    });
    ee.emitEvent('changeFsmState', [st.DISCONNECTED]);

    ee.addListener('checkDevice', () => {
        var msg = {
            type: 'checkDevice',
            data: '',
            id: 'webClient',
            ts: +Date.now()
        };
        wssMgr.send(JSON.stringify(msg));
    });
    ee.addListener('deviceResponse', (event) => {
        deviceMgr.deviceResponse(event.data);
    });
    ee.addListener('angle', (event) => {
        terminalMgr.insertMessage(event);

        var label = new Date(event.ts).toLocaleTimeString();
        var data = event.data;
        pidChart.insertData(label, data);
    });
})();
