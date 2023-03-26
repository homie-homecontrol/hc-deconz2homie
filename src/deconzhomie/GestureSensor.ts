import { MaintenanceNode } from "hc-node-homie-smarthome";
import { takeUntil, filter } from "rxjs/operators";
import { ZHASwitch } from "../deconz/deconz.model";
import { GestureSensorNode } from "./nodes/GestureNode";
import { SensorDevice } from "./SensorDevice";

export class GestureSensor extends SensorDevice {
    protected created = false;

    protected maintenanceNode: MaintenanceNode;

    protected maintenanceResource: ZHASwitch;

    protected gestureNodes: { [id: string]: GestureSensorNode } = {};

    public async create() {
        if (this.created) { return Promise.resolve(); }
        
        for (const uniqueid in this.sensor.sensors) {
            if (Object.prototype.hasOwnProperty.call(this.sensor.sensors, uniqueid)) {

                const sensor = this.sensor.sensors[uniqueid];

                const resource: ZHASwitch = sensor.definition as ZHASwitch;
                this.gestureNodes[sensor.id] = this.add(new GestureSensorNode(this,
                    {
                        id: `gesture-sensor-${sensor.id}`,
                        name: `Gesture sensor-${sensor.id}`,
                    },
                    {
                        gesture: resource.state.gesture !== undefined,
                        buttonEvent: resource.state.buttonevent !== undefined
                    }));
                this.maintenanceResource = resource;
            }
        }


        this.maintenanceNode = this.add(new MaintenanceNode(this, {}, { batteryLevel: true, lastUpdate: true, lowBattery: false, reachable: true }));
        this.maintenanceNode.lastUpdate = this.getDateForLastUpdate(this.maintenanceResource);
        this.maintenanceNode.reachable = this.maintenanceResource.config.reachable;
        this.maintenanceNode.batteryLevel = this.maintenanceResource.config.battery;


        this.subscribeEvents();

        this.created = true;
    }


    private subscribeEvents() {
        // direct group state updates
        this.events$.pipe(takeUntil(
            this.onDestroy$),
            filter(message => message.r === 'sensors' && !!message.state && this.ids.includes(message.id))
        ).subscribe({
            next: message => {
                this.log.info('Switch pressed: ', { event: message });
                const node = this.gestureNodes[message.id];
                if (!node) { return; }

                node.gesture = message.state.gesture;
                node.buttonEvent = message.state.buttonevent;


                this.maintenanceNode.lastUpdate = this.getDateForLastUpdate(message);
            }
        });

        // TODO: listen to events for lights in group to update brightness state
    }

}