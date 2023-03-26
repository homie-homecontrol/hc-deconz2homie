import { HomieProperty, HomieDevice } from "node-homie";
import { NodeAttributes, HOMIE_TYPE_INT, HomieID } from "node-homie/model";
import { BaseNodePropertyConfig, H_SMARTHOME_TYPE_EXTENSTION } from "hc-node-homie-smarthome/model";
import { BaseSmarthomeNode } from "hc-node-homie-smarthome";

export const H_SMARTHOME_TYPE_EXT_ORIENTATION_SENSOR = `${H_SMARTHOME_TYPE_EXTENSTION}=orientation`;

export const H_SMARTHOME_TYPE_EXT_ORIENTATION_SENSOR_PROPS = ['orientation-x', 'orientation-y', 'orientation-z', 'tilt-angle'] as const;
export type SmarthomeTypeOrientationSensorProps = typeof H_SMARTHOME_TYPE_EXT_ORIENTATION_SENSOR_PROPS[number];

export interface OrientationSensorPropertyConfig extends BaseNodePropertyConfig<SmarthomeTypeOrientationSensorProps> {

}


export class OrientationNode extends BaseSmarthomeNode<OrientationSensorPropertyConfig> {
    public readonly propOrientationX: HomieProperty;
    public readonly propOrientationY: HomieProperty;
    public readonly propOrientationZ: HomieProperty;
    public readonly propTiltAngle: HomieProperty;


    public set orientationX(value: number) {
        this.propOrientationX.value = String(value);

    }
    public get orientationX(): number {
        return parseInt(this.propOrientationX.value);
    }

    public set orientationY(value: number) {
        this.propOrientationY.value = String(value);

    }
    public get orientationY(): number {
        return parseInt(this.propOrientationY.value);
    }

    public set orientationZ(value: number) {
        this.propOrientationZ.value = String(value);

    }
    public get orientationZ(): number {
        return parseInt(this.propOrientationZ.value);
    }

    public set tiltAngle(value: number) {
        // if (!this.propConfig.buttonEvent) { return; }
        this.propTiltAngle.value = String(value);

    }
    public get tiltAngle(): number {
        // if (!this.propConfig.buttonEvent) { return undefined; }
        return parseInt(this.propTiltAngle.value);
    }

    constructor(device: HomieDevice,  attrs: Partial<NodeAttributes> = {}, propConfig: OrientationSensorPropertyConfig = {}) {
        super(device, {
            ...{
                id: 'orientation',
                name: 'Orientation information',
                type: H_SMARTHOME_TYPE_EXT_ORIENTATION_SENSOR
            },
            ...attrs
        }, propConfig);


        this.propOrientationX = this.makeProperty( {
            id: 'orientation-x',
            name: 'Orientation angle x axis',
            datatype: HOMIE_TYPE_INT,
            retained: true,
            settable: false,
        });

        this.propOrientationY = this.makeProperty( {
            id: 'orientation-y',
            name: 'Orientation angle y axis',
            datatype: HOMIE_TYPE_INT,
            retained: true,
            settable: false,
        });

        this.propOrientationZ = this.makeProperty({
            id: 'orientation-z', 
            name: 'Orientation angle z axis',
            datatype: HOMIE_TYPE_INT,
            retained: true,
            settable: false,
        });

        this.propTiltAngle = this.makeProperty( {
            id: 'tilt-angle',
            name: 'Tilt angle',
            datatype: HOMIE_TYPE_INT,
            retained: true,
            settable: false,
        });

    }
}