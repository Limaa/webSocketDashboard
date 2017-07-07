#ifndef MYTHREADS_H
#define MYTHREADS_H

Thread pidThread;

#define WSS "ws://10.3.2.32:8888/"
EthernetInterface eth;

//---------------------------------------------------
#define SAMPLE_PERIOD 25 // in ms

typedef struct {
        char type[16];
        int kp;
        int ki;
        int kd;
        float angle;
} MotorData_t;

MotorData_t mDat;
Mail<MotorData_t, 32> pidBox;

//---------------------------------------------------
Accelerometer acc;

typedef struct {
    float angle;
    char str[16];
    char printable[128];
} mail_t;

Mail<mail_t, 32> outgoingBox;
Mail<float, 32> angleBox;

//---------------------------------------------------

Mail<int, 32> pwmBox;


///////////////////////////////////////////////////
//          PID
///////////////////////////////////////////////////
float ek1 = 0;
float ek = 0;
float e0 = 0;
float somaE = 0;
long int uk = 0;
char haveE0 = 0;
Mutex pidMutex;

void pidRestart() {
    ek1 = 0;
    ek = 0;
    e0 = 0;
    uk = 0;
    somaE = 0;
    haveE0 = 0;
}

void PID(MotorData_t *mData) {
    printf("Initializing PID Thread\n");
    #define LIM_PID 3000

    int pwmOutput;

    long int P;
    long int I;
    long int D;


    while (1) {
        osEvent evt = angleBox.get();
        if (evt.status == osEventMail) {
            float *actualAngle = (float*) evt.value.p;
            // printf("Started PID loop - SP: %f - RP: %f - KP: %i - KI: %i - KD: %i\n", mData->angle, *actualAngle, mData->kp, mData->ki, mData->kd);

            pidMutex.lock();
            ek1 = ek;
            somaE += ek;
            ek = mData->angle - *actualAngle;

            if (haveE0 == 0) {
                haveE0 = 1;
                e0 = ek;
            }

            // printf("Valores dos erros - ek: %f - ek1: %f - e0: %f - somaE: %f\n", ek, ek1, e0, somaE);

            P = mData->kp*ek;
            I = mData->ki*(SAMPLE_PERIOD/1000)*(((e0 + ek)/2) + somaE); // TODO: e0
            //I = uk1 + (((Ki * T_ms)/1000) * (ek + ek1))/2;
            D = (mData->kd)*(ek-ek1)*(1000/SAMPLE_PERIOD);

            uk = P + I + D;
            // printf("Valores calculados P: %i - I: %i - D: %i - TOTAL: %i\n", P, I, D, uk);

            if (uk > LIM_PID) {
                uk = LIM_PID;
            }
            if (uk < -LIM_PID) {
                uk = -LIM_PID;
            }

            pwmOutput = uk/10;
            pidMutex.unlock();

            int *signal = pwmBox.alloc();
            *signal = pwmOutput;
            pwmBox.put(signal);

            angleBox.free(actualAngle);
        }
    }
}

///////////////////////////////////////////////////
//          Connection
///////////////////////////////////////////////////
enum Flag { type, kp, ki, kd, angle, none};

void init() {
    mDat.kp = 0;
    mDat.ki = 0;
    mDat.kd = 0;
    mDat.angle = 0;

    printf("Websocket Example v1.0.0\r\n");
    printf("Initializing Ethernet Interface...\r\n");
    eth.connect(); // TODO: check for errors
    printf("IP Address is %s\n\r", eth.get_ip_address());
}

void handleIncomingWebSocketData(Websocket *ws) {
    printf("Initializing incoming WebSockets Thread\n");
    Flag status = none;
    while (1) {
        char buffer[128];
        if (ws->read(buffer)) {
            MotorData_t mData;
            mData.kp = 0;
            mData.ki = 0;
            mData.kd = 0;
            mData.angle = 0;
            for (char *p = strtok(buffer," ,:\"{}"); p != NULL; p = strtok(NULL, " ,:\"{} ")) {
                if (status == type) {
                    strcpy(mData.type, p);
                }
                else if (status == kp) {
                    sscanf(p,"%i", &mData.kp);
                    // printf("      - KP: %s - %i\n", p, mData.kp);
                } else if (status == ki) {
                    sscanf(p,"%i", &mData.ki);
                    // printf("      - KI: %s - %i\n", p, mData.ki);
                } else if (status == kd) {
                    sscanf(p,"%i", &mData.kd);
                    // printf("      - KD: %s - %i\n", p, mData.kd);
                } else if (status == angle) {
                    sscanf(p,"%f", &mData.angle);
                    // printf("      - ANGLE: %s - %f\n", p, mData.angle);
                }

                if (strcmp("type", p) == 0)
                    status = type;
                else if (strcmp("kp", p) == 0)
                    status = kp;
                else if (strcmp("ki", p) == 0)
                    status = ki;
                else if (strcmp("kd", p) == 0)
                    status = kd;
                else if (strcmp("angle", p) == 0)
                    status = angle;
                else
                    status = none;
            }

            // printf("Received message -Type: %s Kp: %i - Ki: %i - Kd: %i - Angle: %f\n", mData.type, mData.kp, mData.ki, mData.kd, mData.angle);

            if(strcmp(mData.type, "devicePing") == 0) {
                mail_t *msg = outgoingBox.alloc();
                sprintf(msg->printable, "{\"type\":\"devicePong\",\"data\":{\"kp\":%i,\"ki\":%i,\"kd\":%i,\"angle\":%f},\"id\":\"mbed\",\"ts\":\"none\"}\n", mDat.kp, mDat.ki, mDat.kd, mDat.angle);
                outgoingBox.put(msg);
            }

            if (strcmp(mData.type, "deviceData") == 0) {
                // printf("Received deviceData message - Kp: %i - Ki: %i - Kd: %i - Angle: %f\n", mData.kp, mData.ki, mData.kd, mData.angle);
                pidMutex.lock();
                mDat.kp = mData.kp;
                mDat.ki = mData.ki;
                mDat.kd = mData.kd;
                mDat.angle = mData.angle;
                pidRestart();
                pidMutex.unlock();
            }
        }
    }
}

void handleOutgoingWebSocketData(Websocket *ws) {
    printf("Initializing outgoing WebSockets Thread\n");
    while (1) {
        osEvent evt = outgoingBox.get();
        if (evt.status == osEventMail) {
            mail_t *msg = (mail_t*) evt.value.p;
            int error_c = ws->send(msg->printable);
            outgoingBox.free(msg);
        }
    }
}




///////////////////////////////////////////////////////
//          Accelerometer
///////////////////////////////////////////////////////
void readAccel() {
    float tmp;
    mail_t *msg = outgoingBox.alloc();
    acc.getAngle(tmp);
    msg->angle = tmp;
    acc.floatToStr(msg->angle, msg->str);
    sprintf(msg->printable, "{\"type\":\"angle\",\"data\": %s,\"id\":\"mbed\",\"ts\":\"none\"}\n", msg->str);
    outgoingBox.put(msg);

    float* angle = angleBox.alloc();
    *angle = tmp;
    angleBox.put(angle);
}






/////////////////////////////////////////////////////
//          PWM
/////////////////////////////////////////////////////
#define PWM_BASE_SIGNAL 1300
PwmOut m1(D13);
PwmOut m2(D12);

void pwmInit() {
    m1.period_ms(33);
    m2.period_ms(33);

    m1.pulsewidth_us(0);
    wait_ms(700);
    m1.pulsewidth_us(2000);
    wait_ms(2000);
    m1.pulsewidth_us(1000);

    wait_ms(1000);
    m1.pulsewidth_us(700);

    m2.pulsewidth_us(0);
    wait_ms(700);
    m2.pulsewidth_us(2000);
    wait_ms(2000);
    m2.pulsewidth_us(1000);

    wait_ms(1200);
    m2.pulsewidth_us(700);

    wait_ms(3000);
    m1.pulsewidth_us(PWM_BASE_SIGNAL);
    m2.pulsewidth_us(PWM_BASE_SIGNAL);
}
void pwmOut() {
    printf("Initializing PWM Thread\r\n");


    while (1) {
        osEvent evt = pwmBox.get();
        if (evt.status == osEventMail) {
            int *signal = (int*) evt.value.p;
            // printf("Changing PWM: %i\n", *signal);
            m1.pulsewidth_us(PWM_BASE_SIGNAL+(*signal));
            m2.pulsewidth_us(PWM_BASE_SIGNAL-(*signal));
            pwmBox.free(signal);
        }
    }

}

#endif