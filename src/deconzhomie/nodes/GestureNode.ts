import { HomieNode, HomieProperty, HomieDevice } from "node-homie";
import { HomieNodeAtrributes, HOMIE_TYPE_BOOL, HOMIE_TYPE_INT } from "node-homie/model";
import { H_SMARTHOME_TYPE_EXTENSTION } from "hc-node-homie-smarthome/model";

export const H_SMARTHOME_TYPE_EXT_GUESTURE_SENSOR = `${H_SMARTHOME_TYPE_EXTENSTION}=guesturesensor`;

export interface GestureSensorPropertyConfig {
    gesture: boolean;
    buttonEvent: boolean;
}


export class GestureSensorNode extends HomieNode {
    private propConfig: GestureSensorPropertyConfig;

    public readonly propGesture: HomieProperty;
    public readonly propButtonEvent: HomieProperty;

    public set gesture(value: number) {
        if (!this.propConfig.gesture) { return; }
        this.propGesture.value = String(value);

    }
    public get gesture(): number {
        if (!this.propConfig.gesture) { return undefined; }
        return parseInt(this.propGesture.value);
    }

    public set buttonEvent(value: number) {
        if (!this.propConfig.buttonEvent) { return; }
        this.propButtonEvent.value = String(value);

    }
    public get buttonEvent(): number {
        if (!this.propConfig.buttonEvent) { return undefined; }
        return parseInt(this.propButtonEvent.value);
    }


    constructor(device: HomieDevice, attrs: Partial<HomieNodeAtrributes> = {}, propConfig: GestureSensorPropertyConfig = { gesture: true, buttonEvent: true }) {
        super(device, {
            ...{
                id: 'gesture-sensor',
                name: 'Gesture sensor',
                type: H_SMARTHOME_TYPE_EXT_GUESTURE_SENSOR
            },
            ...attrs
        });

        this.propConfig = propConfig;

        if (this.propConfig.gesture) {
            this.propGesture = this.add(new HomieProperty(this, {
                id: 'gesture',
                name: 'Gesture event',
                datatype: HOMIE_TYPE_INT,
                retained: false,
                settable: false,
            }));
        }

        if (this.propConfig.buttonEvent) {
            this.propButtonEvent = this.add(new HomieProperty(this, {
                id: 'button-event',
                name: 'Button event',
                datatype: HOMIE_TYPE_INT,
                retained: false,
                settable: false,
            }));
        }

    }
}