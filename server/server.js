(() => {
    "use strict";

    const WebSocket = require('ws');
    const math = require('mathjs');

    var count = 0;
    const wsPort = 8888;
    const wss = new WebSocket.Server({port: wsPort});
    console.log('WebSocket started. Listening on port ' + wsPort);

    wss.on('connection', (ws, req) => {
        console.log('Received connection from %s', req.connection.remoteAddress);

        // Ping Pong
        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        // Message Relay
        ws.on('message', (message) => {
            console.log('Message received: %s', message);
            var reversedMessage = message.split('').reverse().join('');
            console.log('Sending back: %s', reversedMessage);
            try {
                ws.send(reversedMessage);
            }
            catch (e) {
                console.error(e);
            }
        });

        // Connection close
        ws.on('close', () => {
            console.log('WebSocket disconnected.');
            clearInterval(ws.broadcastId); // TODO: remove when device simulation is no longer used
        });

// DEVICE SIMULATION ----------------------------------------
        setTimeout(() => {
            console.log('sending DEVICE response');
            var msg = {
                type: 'devicePong',
                data: {
                    angle: 46,
                    kp: 3,
                    ki: 0.0035,
                    kd: 4.6
                },
                id: 'embeddedSystem',
                ts: Date.now()
            };
            broadcast(JSON.stringify(msg));
            ws.broadcastId = setInterval(broadcast, 100);
        }, 2000);
// DEVICE SIMULATION ----------------------------------------
    });

    function ping() {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                console.log('No response from ping. Closing connection.');
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping('', false, true);
        });
    }
    setInterval(ping, 10000);

// DEVICE SIMULATION ----------------------------------------
    function broadcast(msg) {
        wss.clients.forEach((ws) => {
            if (!msg) {
                console.log('sending: '+count);
                msg = {
                    type: "angle",
                    data: math.sin((count++)/10),
                    id:   'wss',
                    ts: Date.now()
                };
                msg = JSON.stringify(msg);
            }
            try {
                ws.send(msg);
            }
            catch (e) {
                console.error(e);
            }
        });
    }
// DEVICE SIMULATION ----------------------------------------
})();