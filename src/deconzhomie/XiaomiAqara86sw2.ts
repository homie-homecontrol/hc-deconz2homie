import { ButtonNode, MaintenanceNode, WeatherNode } from "hc-node-homie-smarthome";
import { takeUntil, filter, tap } from "rxjs/operators";
import { DeconzMessage } from "../deconz";
import { ZHAHumidity, ZHAPressure, ZHASwitch, ZHASwitchState, ZHATemperature } from "../deconz/deconz.model";
import { SensorDevice } from "./SensorDevice";
import { SensorDefinition } from "./SensorRessourceCollator";

export class XiaomiAqara86sw2 extends SensorDevice {
    protected created = false;

    protected maintenanceNode: MaintenanceNode;
    protected button1: ButtonNode;
    protected button2: ButtonNode;
    protected button3: ButtonNode;
    protected switch: SensorDefinition<ZHASwitch>;;

    public async create() {
        if (this.created) { return Promise.resolve(); }

        this.switch = this.getSensorDefByType('ZHASwitch');


        this.maintenanceNode = this.add(new MaintenanceNode(this, {}, { batteryLevel: true, lastUpdate: true, lowBattery: false, reachable: true }));
        this.maintenanceNode.lastUpdate = this.getDateForLastUpdate(this.switch.definition);
        this.maintenanceNode.reachable = this.switch.definition.config.reachable;
        this.maintenanceNode.batteryLevel = this.switch.definition.config.battery;

        this.button1 = this.add(new ButtonNode(this, { id: 'button-1', name: 'Left button' }, { buttonStates: ['press'], settable: false }));
        this.button2 = this.add(new ButtonNode(this, { id: 'button-2', name: 'Right button' }, { buttonStates: ['press'], settable: false }));
        this.button3 = this.add(new ButtonNode(this, { id: 'button-3', name: 'Both buttons' }, { buttonStates: ['press'], settable: false }));

        this.subscribeEvents();

        this.created = true;
    }



    private subscribeEvents() {
        // update on button press
        this.events$.pipe(takeUntil(
            this.onDestroy$),
            filter(message => message.r === 'sensors' && !!message.state && message.id === this.switch?.id)
        ).subscribe({
            next: message => {
                if (message.state.buttonevent === 1002) {
                    this.button1.action = 'press';
                } else if (message.state.buttonevent === 2002) {
                    this.button2.action = 'press';
                } else if (message.state.buttonevent === 3002) {
                    this.button3.action = 'press';
                }
                this.maintenanceNode.lastUpdate = this.getDateForLastUpdate(message);
            }
        });

    }
}