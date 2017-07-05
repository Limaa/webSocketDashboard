#ifndef ACCELEROMETER_H
#define ACCELEROMETER_H

#include "mbed.h"
#include "FXOS8700Q.h"

class Accelerometer {
public:
    Accelerometer() : i2c(PTE25, PTE24), acc(i2c, FXOS8700CQ_SLAVE_ADDR1) {
         mPI = 3.14159265358979323846264338327950288;
         acc.enable();
    }

    ~Accelerometer() {
        acc.disable();
    }

    void getX(float &x) {
        acc.getX(x);
    }

    void getAngle(float &x) {
        acc.getX(x);
        x = x*90 + (8*sin(x*mPI)) - 2;
    }

    void floatToStr(float x, char* buffer) {
        int d1 = x;                             // Get the integer part (678).
        float f2 = x - d1;                      // Get fractional part (678.0123 - 678 = 0.0123).
        int d2 = (unsigned int)(f2 * 10000);    // Or this one: Turn into integer.
        sprintf(buffer, "%d.%04d\r\n", d1, d2);
    }

    void getAngleStr(char* buffer) {
        float x;
        getAngle(x);
        floatToStr(x, buffer);
    }
private:
    double mPI;
    I2C i2c;
    FXOS8700QAccelerometer acc;
};

#endif
