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
                data.ts = Date.now();
                data = JSON.stringify(data);
                console.log('Sending message: '+data);
                broadcast(data);
            }
            catch (e) {
                console.error(e);
            }
        });

        // Connection close
        ws.on('close', () => {
            console.log('WebSocket disconnected.');
        });
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