#ifndef CONNECTION_H
#define CONNECTION_H

#include "EthernetInterface.h"
#include "Websocket.h"

#define WSS "ws://192.168.0.100:8888/"
EthernetInterface eth;

class Connection {
public:
    Connection() {}

    void init() {
        printf("Initializing Ethernet Interface...\r\n");
        eth.connect(); // TODO: check for errors
        printf("IP Address is %s\n\r", eth.get_ip_address());

        printf("Connecting to WebSocketServer at %s\r\n", WSS);
        Websocket ws(WSS, &eth);
        while (!ws.connect());
        printf("Connected to WebSocketServer\r\n");
    }
private:
}

#endif