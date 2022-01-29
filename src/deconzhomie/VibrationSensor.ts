import { DefaultNoMotionIntervals } from "hc-node-homie-smarthome/model";
import { MaintenanceNode, MotionSensorNode } from "hc-node-homie-smarthome";
import { takeUntil, filter } from "rxjs/operators";
import { ZHALightLevel, ZHAPresence, ZHAVibration, ZHAVibrationState } from "../deconz/deconz.model";
import { SensorDevice } from "./SensorDevice";
import { SensorDefinition } from "./SensorRessourceCollator";
import { VibrationSensorNode } from "./nodes/VibrationSensorNode";
import { OrientationNode } from "./nodes/OrientationNode";

export const VIBRATION_SENSOR = 'vibration-sensor';

export class VibrationSensor extends SensorDevice {
    protected created = false;

    protected maintenanceNode: MaintenanceNode;
    protected vibrationNode: VibrationSensorNode;
    protected orientationNode: OrientationNode;
    protected vibrationResource: SensorDefinition<ZHAVibration>;


    public async create() {
        if (this.created) { return Promise.resolve(); }

        this.log.info('Sensors: ', { sensor: this.sensor });

        this.vibrationResource = this.getSensorDefByType('ZHAVibration');

        this.maintenanceNode = this.add(new MaintenanceNode(this, {}, { batteryLevel: true, lastUpdate: true, lowBattery: false, reachable: true }));
        this.maintenanceNode.lastUpdate = this.getDateForLastUpdate(this.vibrationResource.definition);
        this.maintenanceNode.reachable = this.vibrationResource.definition.config.reachable;
        this.maintenanceNode.batteryLevel = this.vibrationResource.definition.config.battery;

        this.vibrationNode = this.add(new VibrationSensorNode(this));
        this.orientationNode = this.add(new OrientationNode(this));

        this.vibrationNode.vibration = this.vibrationResource ? this.vibrationResource.definition.state.vibration : false;
        this.vibrationNode.vibrationStrength = this.vibrationResource ? this.vibrationResource.definition.state.vibrationstrength : 0;

        this.orientationNode.orientationX = this.vibrationResource ? this.vibrationResource.definition.state.vibration[0] : 0;
        this.orientationNode.orientationY = this.vibrationResource ? this.vibrationResource.definition.state.vibration[1] : 0;
        this.orientationNode.orientationZ = this.vibrationResource ? this.vibrationResource.definition.state.vibration[2] : 0;
        this.orientationNode.tiltAngle = this.vibrationResource ? this.vibrationResource.definition.state.tiltangle : 0;

        this.subscribeEvents();
        this.created = true;
    }



    private subscribeEvents() {
        // update vibration info
        this.events$.pipe(takeUntil(
            this.onDestroy$),
            filter(message => message.r === 'sensors' && !!message.state && message.id === this.vibrationResource?.id)
        ).subscribe({
            next: message => {
                const state = message.state as ZHAVibrationState;
                this.log.info('State: ', { state });
                this.vibrationNode.vibration = state.vibration;
                this.vibrationNode.vibrationStrength = state.vibrationstrength;

                this.orientationNode.orientationX = state.orientation[0];
                this.orientationNode.orientationY = state.orientation[1];
                this.orientationNode.orientationZ = state.orientation[2];

                this.orientationNode.tiltAngle = state.tiltangle;
                this.maintenanceNode.lastUpdate = this.getDateForLastUpdate(message);
            }
        });

        // // update lux
        // this.events$.pipe(takeUntil(
        //     this.onDestroy$),
        //     filter(message=> message.r === 'sensors' && !!message.state && message.id === this.lightlevelResource?.id),
        // ).subscribe({
        //     next: message =>{
        //         this.motionNode.lux = message.state.lux
        //         this.maintenanceNode.lastUpdate = this.getDateForLastUpdate(message);
        //     }
        // });
    }

}