(function(){

    var st = {
        DISCONNECTED: 'disconnected',
        CONNECTING: 'connecting',
        CONNECTION_FAILED: 'connectionFailed'
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
                default:
                    console.log('default');
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

            this._registerEvents();
        }

        _registerEvents() {
            this.btnConnect.addEventListener('click', function () {
                ee.emitEvent('changeFsmState', [st.CONNECTING]);
            });
        }

        _disconnectedState() {
            this.currentState = st.DISCONNECTED;
            this.btnConnect.style.display = '';
            this.btnDisconnect.style.display = 'none';
            this.btnConnecting.style.display = 'none';
            this.btnConnected.style.display = 'none';
            this.btnDisconnected.style.display = '';
        }

        __connectingState() {
            console.log('Trying to connect...');
            this.currentState = st.CONNECTING;
            this.btnConnect.style.display = 'none';
            this.btnDisconnect.style.display = 'none';
            this.btnConnecting.style.display = '';
            this.btnConnected.style.display = 'none';
            this.btnDisconnected.style.display = '';

            setTimeout(function () {
                console.log('Could not connect to WebSocketServer');
                ee.emitEvent('changeFsmState', [st.CONNECTION_FAILED]);
            }, 2000);
        }

        changeFsmState(state) {
            switch(state) {
                case st.DISCONNECTED:
                    this._disconnectedState();
                    break;
                case st.CONNECTING:
                    this.__connectingState();
                    break;
                default:
                    console.log('default');
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
            this.chart = new Chart(this.ctx, {
                type: obj.type,
                data: obj.data,
                options: obj.options
            })
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

