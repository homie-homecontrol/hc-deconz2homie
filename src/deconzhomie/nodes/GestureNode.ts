import { HomieNode, HomieProperty, HomieDevice } from "node-homie";
import { HomieNodeAtrributes, HOMIE_TYPE_BOOL, HOMIE_TYPE_INT } from "node-homie/model";
import { BaseNodePropertyConfig, H_SMARTHOME_TYPE_EXTENSTION } from "hc-node-homie-smarthome/model";
import { BaseSmarthomeNode } from "hc-node-homie-smarthome";

export const H_SMARTHOME_TYPE_EXT_GUESTURE_SENSOR = `${H_SMARTHOME_TYPE_EXTENSTION}=guesturesensor`;

export const H_SMARTHOME_TYPE_EXT_GUESTURE_SENSOR_PROPS = ['gesture', 'button-event'] as const;
export type SmarthomeTypeGuestureSensorProps = typeof H_SMARTHOME_TYPE_EXT_GUESTURE_SENSOR_PROPS[number];

export interface GestureSensorPropertyConfig extends BaseNodePropertyConfig<SmarthomeTypeGuestureSensorProps> {
    gesture: boolean;
    buttonEvent: boolean;
}


export class GestureSensorNode extends BaseSmarthomeNode<GestureSensorPropertyConfig> {
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
        }, propConfig);


        if (this.propConfig.gesture) {
            this.propGesture = this.makeProperty({
                id: 'gesture',
                name: 'Gesture event',
                datatype: HOMIE_TYPE_INT,
                retained: false,
                settable: false,
            });
        }

        if (this.propConfig.buttonEvent) {
            this.propButtonEvent = this.makeProperty({
                id: 'button-event',
                name: 'Button event',
                datatype: HOMIE_TYPE_INT,
                retained: false,
                settable: false,
            });
        }

    }
}