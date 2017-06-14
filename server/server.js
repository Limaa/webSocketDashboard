const WebSocket = require('ws');

const wsPort = 8888;
const wss = new WebSocket.Server({ port: wsPort });
console.log('WebSocket started. Listening on port '+wsPort);
var count = 0;

function heartbeat() {
    this.isAlive = true;
}

function ping() {
    wss.clients.forEach(function each(ws, req) {
        if (ws.isAlive === false) {
            console.log('No response from ping. Closing connection with %s', req.connection.remoteAddress);
            return ws.termninate();
        }

        ws.isAlive = false;
        ws.ping('', false, true);
    });
}

function sendAll() {
    wss.clients.forEach(function (ws, req) {
        console.log('sending: '+count);
        ws.send(count++);
    });
}

wss.on('connection', function connection(ws, req) {
    ws.isAlive = true;
    ws.on('pong', heartbeat);

    console.log('Received connection from %s', req.connection.remoteAddress);

    ws.on('message', function incoming(message) {
        console.log('Message received: %s', message);
        var reversedMessage = message.split('').reverse().join('');
        console.log('Sending back: %s', reversedMessage);
        ws.send(reversedMessage);
    });

    ws.on('close', function () {
        console.log('disconnected');
    });
});

setInterval(ping, 30000);
setInterval(sendAll, 1000);