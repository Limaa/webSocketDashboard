(() => {
    "use strict";

    const WebSocket = require('ws');

    const wsPort = 8888;
    const wss = new WebSocket.Server({port: wsPort});
    console.log('WebSocket started. Listening on port ' + wsPort);

    wss.on('connection', (ws, req) => {
        console.log('Received connection from %s', req.connection.remoteAddress);

        // Message Relay
        ws.on('message', (message) => {
            console.log('Message received: %s', message);
            try {
                var data = JSON.parse(message);

                if (data.type != "devicePing") {
                    data.ts = Date.now();
                    data = JSON.stringify(data);
                    console.log('Sending message: '+data);
                    broadcast(data);
                }
            }
            catch (e) {
                console.error(e);
            }
        });

        // Connection close
        ws.on('close', () => {
            console.log('WebSocket disconnected.');
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
                id: 'mbed',
                ts: Date.now()
            };
            broadcast(JSON.stringify(msg));
        }, 2000);
// DEVICE SIMULATION ----------------------------------------
    });

    function broadcast(msg) {
        wss.clients.forEach((ws) => {
            try {
                ws.send(msg);
            }
            catch (e) {
                console.error(e);
            }
        });
    }
})();