#ifndef MYTHREADS_H
#define MYTHREADS_H

Accelerometer acc;

typedef struct {
    float angle;
    char str[16];
    char printable[128];
} mail_t;

Mail<mail_t, 32> outgoingBox;

void readAccel() {
    mail_t *msg = outgoingBox.alloc();
    acc.getAngle(msg->angle);
    acc.floatToStr(msg->angle, msg->str);
    sprintf(msg->printable, "{\"type\":\"angle\",\"data\": %s,\"id\":\"mbed\",\"td\":\"none\"}\n", msg->str);
    outgoingBox.put(msg);

    printf(msg->printable);
}


#endif