#include "mbed.h"
#include "EthernetInterface.h"
#include "Websocket.h"
#include "Accelerometer.h"
#include "rtos.h"
#include "MyThreads.h"

Thread t1;
Thread t2;
Thread t3;

Serial pc(USBTX, USBRX); // tx, rx

int main() {
    init();

    Websocket ws(WSS, &eth);
    printf("Connecting to WebSocketServer at %s\r\n", WSS);
    while (!ws.connect());
    printf("Connected to WebSocketServer\r\n");

    printf("Motor initialization...\n");
    pwmInit();

    t1.start(callback(handleIncomingWebSocketData, &ws));
    t2.start(callback(handleOutgoingWebSocketData, &ws));
    t3.start(pwmOut);

    RtosTimer accelerometerTimer(readAccel);
    accelerometerTimer.start(SAMPLE_PERIOD);

    pidThread.start(callback(PID, &mDat));
    // int s = 0;

    while (true) {
        // led = !led;
        // if (pc.readable()) {
        //     char c = pc.getc();
        //     if (c == 'a') {
        //         int *signal = pwmBox.alloc();
        //         *signal = 0;
        //         pwmBox.put(signal);
        //     }

        //     else if (c == 'b') {
        //         int *signal = pwmBox.alloc();
        //         *signal = 250;
        //         pwmBox.put(signal);
        //     }

        //     else if (c == 'c') {
        //         int *signal = pwmBox.alloc();
        //         *signal = -250;
        //         pwmBox.put(signal);
        //     }

        //     else if (c == '+') {
        //         int *signal = pwmBox.alloc();
        //         s += 5;
        //         printf("s = %i\n", s);
        //         *signal = s;
        //         pwmBox.put(signal);
        //     }

        //     else if (c == '-') {
        //         int *signal = pwmBox.alloc();
        //         s -= 5;
        //         printf("s = %i\n", s);
        //         *signal = s;
        //         pwmBox.put(signal);
        //     }
        // }
        // wait(0.5);
    }
}
