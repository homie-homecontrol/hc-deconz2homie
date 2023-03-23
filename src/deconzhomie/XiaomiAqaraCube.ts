import { HomieNode, HomieProperty } from "node-homie5";
import { HOMIE_TYPE_ENUM, HOMIE_TYPE_FLOAT, HOMIE_TYPE_INT } from "node-homie5/model";
import { H_SMARTHOME_TYPE_EXTENSTION } from "hc-node-homie-smarthome/model";
import { MaintenanceNode } from "hc-node-homie-smarthome";
import { takeUntil, filter, tap } from "rxjs/operators";
import { DeconzMessage } from "../deconz/DeconzEvents";
import { ZHASwitch } from "../deconz/deconz.model";
import { SensorDevice } from "./SensorDevice";
import { SensorDefinition } from "./SensorRessourceCollator";


const GestureMap = {
    '1': 'shake',
    '2': 'fall',
    '3': 'flip90',
    '4': 'flip180',
    '5': 'slide',
    '6': 'tap',
    '7': 'rotate-cw',
    '8': 'rotate-ccw',

}

export class XiaomiAqaraCube extends SensorDevice {
    protected created = false;

    protected maintenanceNode: MaintenanceNode;
    protected cubeNode: HomieNode;

    protected propGesture: HomieProperty;
    protected propAngle: HomieProperty;
    protected propRawGesture: HomieProperty;
    protected propRawEvent: HomieProperty;

    protected rotate: SensorDefinition<ZHASwitch>;
    protected guesture: SensorDefinition<ZHASwitch>;


    public async create() {
        if (this.created) { return Promise.resolve(); }

        this.rotate = this.getByExtension('000c');
        this.guesture = this.getByExtension('0012');

        if (!this.rotate || !this.guesture) {
            throw new Error(`Cannot find all required resources for device: ${this.id} (${this.attributes.name})`);
        }

        this.maintenanceNode = this.add(new MaintenanceNode(this, undefined, {}, { batteryLevel: true, lastUpdate: true, lowBattery: false, reachable: true }));
        this.maintenanceNode.lastUpdate = this.getDateForLastUpdate(this.rotate.definition);
        this.maintenanceNode.reachable = this.rotate.definition.config.reachable;
        this.maintenanceNode.batteryLevel = this.rotate.definition.config.battery;

        this.cubeNode = this.add(new HomieNode(this, 'cube', {
            name: 'Cube data',
            type: `${H_SMARTHOME_TYPE_EXTENSTION}=aqara-magic-cube`
        }));

        this.propGesture = this.cubeNode.add(new HomieProperty(this.cubeNode, 'gesture', {
            name: 'Gesture',
            datatype: HOMIE_TYPE_ENUM,
            retained: false,
            settable: false,
            format: Object.values(GestureMap).join(',')
        }));
        this.propAngle = this.cubeNode.add(new HomieProperty(this.cubeNode, 'angle', {
            name: 'Rotation angle',
            datatype: HOMIE_TYPE_FLOAT,
            retained: false,
            settable: false,
        }));
        this.propRawGesture = this.cubeNode.add(new HomieProperty(this.cubeNode, 'raw-gesture', {
            name: 'Raw gesture data',
            datatype: HOMIE_TYPE_INT,
            retained: false,
            settable: false,
        }));
        this.propRawEvent = this.cubeNode.add(new HomieProperty(this.cubeNode, 'raw-event', {
            name: 'Raw event data',
            datatype: HOMIE_TYPE_INT,
            retained: false,
            settable: false,
        }));

        this.subscribeEvents();

        this.created = true;
    }


    private subscribeEvents() {
        // update on guesture event
        this.events$.pipe(takeUntil(
            this.onDestroy$),
            filter(message => message.r === 'sensors' && !!message.state && (message.id === this.guesture.id || message.id === this.rotate.id))
        ).subscribe({
            next: message => {
                if (message.id === this.guesture.id) {
                    this.propGesture.value = GestureMap[String(message.state.gesture)];
                } else if (message.id === this.rotate.id) {
                    this.propGesture.value = GestureMap[String(message.state.gesture)];
                    this.propAngle.value = String(message.state.buttonevent / 100);
                }

                this.propRawGesture.value = String(message.state.gesture);
                this.propRawEvent.value = String(message.state.buttonevent);

                this.maintenanceNode.lastUpdate = this.getDateForLastUpdate(message);
            }
        });

    }


}