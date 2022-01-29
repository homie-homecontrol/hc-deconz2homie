import { HomieNode, HomieProperty, HomieDevice } from "node-homie";
import { HomieNodeAtrributes, HOMIE_TYPE_BOOL, HOMIE_TYPE_INT } from "node-homie/model";
import { BaseNodePropertyConfig, H_SMARTHOME_TYPE_EXTENSTION } from "hc-node-homie-smarthome/model";
import { BaseSmarthomeNode } from "hc-node-homie-smarthome";

export const H_SMARTHOME_TYPE_EXT_VIBRATION_SENSOR = `${H_SMARTHOME_TYPE_EXTENSTION}=vibration`;

export const H_SMARTHOME_TYPE_EXT_VIBRATION_SENSOR_PROPS = ['vibration', 'vibration-strength'] as const;
export type SmarthomeTypeVibrationSensorProps = typeof H_SMARTHOME_TYPE_EXT_VIBRATION_SENSOR_PROPS[number];

export interface VibrationSensorPropertyConfig extends BaseNodePropertyConfig<SmarthomeTypeVibrationSensorProps> {

}


export class VibrationSensorNode extends BaseSmarthomeNode<VibrationSensorPropertyConfig> {
    public readonly propVibration: HomieProperty;
    public readonly propVibrationStrength: HomieProperty;

    public set vibration(value: boolean) {
        this.propVibration.value = String(value);

    }
    public get vibration(): boolean {
        return this.propVibration.value === 'true';
    }

    public set vibrationStrength(value: number) {
        // if (!this.propConfig.buttonEvent) { return; }
        this.propVibrationStrength.value = String(value);

    }
    public get vibrationStrength(): number {
        // if (!this.propConfig.buttonEvent) { return undefined; }
        return parseInt(this.propVibrationStrength.value);
    }

    constructor(device: HomieDevice, attrs: Partial<HomieNodeAtrributes> = {}, propConfig: VibrationSensorPropertyConfig = {}) {
        super(device, {
            ...{
                id: 'vibration',
                name: 'Vibration sensor',
                type: H_SMARTHOME_TYPE_EXT_VIBRATION_SENSOR
            },
            ...attrs
        }, propConfig);


        this.propVibration = this.makeProperty({
            id: 'vibration',
            name: 'Vibration detected',
            datatype: HOMIE_TYPE_BOOL,
            retained: true,
            settable: false,
        });

        this.propVibrationStrength = this.makeProperty({
            id: 'vibration-strength',
            name: 'Vibration strength',
            datatype: HOMIE_TYPE_INT,
            retained: true,
            settable: false,
        });


    }
}