(() => {
    "use strict";

    const WebSocket = require('ws');
    const math = require('mathjs');

    var count = 0;
    const wsPort = 8888;
    const wss = new WebSocket.Server({port: wsPort});
    console.log('WebSocket started. Listening on port ' + wsPort);

    wss.on('connection', (ws, req) => {
        ws.isAlive = true;
        console.log('Received connection from %s', req.connection.remoteAddress);

        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('message', (message) => {
            console.log('Message received: %s', message);
            var reversedMessage = message.split('').reverse().join('');
            console.log('Sending back: %s', reversedMessage);
            ws.send(reversedMessage);
        });

        ws.on('close', () => {
            console.log('WebSocket disconnected.');
        });
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

    function broadcast() {
        wss.clients.forEach((ws) => {
            console.log('sending: '+count);
            var msg = {
                type: "angle",
                data: math.sin((count++)/10),
                id:   'wss',
                ts: Date.now()
            };
            ws.send(JSON.stringify(msg));
        });
    }

    setInterval(ping, 10000);
    setInterval(broadcast, 100);
})();