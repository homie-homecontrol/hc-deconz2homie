import { HomieNode, HomieProperty, HomieDevice } from "node-homie5";
import { NodeAttributes, HOMIE_TYPE_BOOL, HOMIE_TYPE_INT, HomieID } from "node-homie5/model";
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

    constructor(device: HomieDevice, id: HomieID = 'vibration', attrs: Partial<NodeAttributes> = {}, propConfig: VibrationSensorPropertyConfig = {}) {
        super(device, id, {
            ...{
                name: 'Vibration sensor',
                type: H_SMARTHOME_TYPE_EXT_VIBRATION_SENSOR
            },
            ...attrs
        }, propConfig);


        this.propVibration = this.makeProperty( 'vibration',{
            name: 'Vibration detected',
            datatype: HOMIE_TYPE_BOOL,
            retained: true,
            settable: false,
        });

        this.propVibrationStrength = this.makeProperty('vibration-strength',{
            name: 'Vibration strength',
            datatype: HOMIE_TYPE_INT,
            retained: true,
            settable: false,
        });


    }
}