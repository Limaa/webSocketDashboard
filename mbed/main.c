#include "mbed.h"
#include "Accelerometer.h"
#include "Connection.h"
#include "rtos.h"
#include "MyThreads.h"

Connection conn;
DigitalOut led(LED_RED);

void init() {
    printf("Websocket Example v1.0.0\r\n");

    conn.init();
}

void handleIncomingWebSocketData() {
    char buffer[128];
    if (conn.ws.read(buffer)) {
        printf("Mensagem recebida do wss: %s\r\n", buffer);
        for (char *p = strtok(buffer," "); p != NULL; p = strtok(NULL, " "))
        {
            printf(" - %s\r\n", p);
        }
    }
}

void handleOutgoingWebSocketData() {
    osEvent evt = outgoingBox.get();
    if (evt.status == osEventMail) {
        mail_t *msg = (mail_t*) evt.value.p;
        int error_c = conn.ws.send(msg->printable);
        outgoingBox.free(msg);
    }
}

Thread t1;
Thread t2;

int main() {

    RtosTimer accelerometerTimer(readAccel);
    accelerometerTimer.start(500);

    t1.start(handleIncomingWebSocketData);
    t2.start(handleOutgoingWebSocketData);

    while (true) {
        led = !led;
        wait(0.5);
    }
}
