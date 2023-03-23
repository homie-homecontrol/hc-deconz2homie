import { DefaultNoMotionIntervals } from "hc-node-homie-smarthome/model";
import {  MaintenanceNode, MotionSensorNode } from "hc-node-homie-smarthome";
import { takeUntil, filter } from "rxjs/operators";
import { ZHALightLevel, ZHAPresence } from "../deconz/deconz.model";
import { SensorDevice } from "./SensorDevice";
import { SensorDefinition } from "./SensorRessourceCollator";

export class MotionSensor extends SensorDevice {
    protected created = false;

    protected maintenanceNode: MaintenanceNode;
    protected motionNode: MotionSensorNode;
    protected presenceResource: SensorDefinition<ZHAPresence>;
    protected lightlevelResource: SensorDefinition<ZHALightLevel>;


    public async create() {
        if (this.created) { return Promise.resolve(); }

        this.presenceResource = this.getSensorDefByType('ZHAPresence');
        this.lightlevelResource = this.getSensorDefByType('ZHALightLevel');

        this.maintenanceNode =  this.add(new MaintenanceNode(this, undefined, {}, { batteryLevel: true, lastUpdate: true, lowBattery: false, reachable: true }));
        this.maintenanceNode.lastUpdate =this.getDateForLastUpdate(this.presenceResource.definition);
        this.maintenanceNode.reachable = this.presenceResource.definition.config.reachable;
        this.maintenanceNode.batteryLevel = this.presenceResource.definition.config.battery;

        this.motionNode =  this.add(new MotionSensorNode(this, undefined, {}, { lux: !!this.lightlevelResource, noMotion: true, noMotionIntervals: DefaultNoMotionIntervals }));

        this.motionNode.lux = this.lightlevelResource ? this.lightlevelResource.definition.state.lux : 0;
        this.motionNode.motion = this.presenceResource.definition.state.presence;

        this.subscribeEvents();
        this.created = true;
    }



    private subscribeEvents(){
        // update motion
        this.events$.pipe(takeUntil(
            this.onDestroy$),
            filter(message=> message.r === 'sensors' && !!message.state && message.id === this.presenceResource?.id)
        ).subscribe({
            next: message =>{
                this.motionNode.motion = message.state.presence;
                this.maintenanceNode.lastUpdate = this.getDateForLastUpdate(message);
            }
        });

        // update lux
        this.events$.pipe(takeUntil(
            this.onDestroy$),
            filter(message=> message.r === 'sensors' && !!message.state && message.id === this.lightlevelResource?.id),
        ).subscribe({
            next: message =>{
                this.motionNode.lux = message.state.lux
                this.maintenanceNode.lastUpdate = this.getDateForLastUpdate(message);
            }
        });
    }

}