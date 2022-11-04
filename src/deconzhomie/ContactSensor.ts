import { ContactNode, MaintenanceNode } from "hc-node-homie-smarthome";
import { takeUntil, filter } from "rxjs/operators";
import { ZHAOpenClose } from "../deconz";
import { SensorDevice } from "./SensorDevice";
import { SensorDefinition } from "./SensorRessourceCollator";

export class ContactSensor extends SensorDevice {
    protected created = false;

    protected maintenanceNode: MaintenanceNode;
    protected contactNode: ContactNode;
    protected openCloseResource: SensorDefinition<ZHAOpenClose>;


    public async create() {
        if (this.created) { return Promise.resolve(); }

        this.openCloseResource = this.getSensorDefByType('ZHAOpenClose');

        this.maintenanceNode =  this.add(new MaintenanceNode(this, {}, { batteryLevel: true, lastUpdate: true, lowBattery: false, reachable: true }));
        this.maintenanceNode.lastUpdate =this.getDateForLastUpdate(this.openCloseResource.definition);
        this.maintenanceNode.reachable = this.openCloseResource.definition.config.reachable;
        this.maintenanceNode.batteryLevel = this.openCloseResource.definition.config.battery;

        this.contactNode =  this.add(new ContactNode(this, {}, { }));

        this.contactNode.state = this.openCloseResource.definition.state.open;

        this.subscribeEvents();
        this.created = true;
    }



    private subscribeEvents(){
        // update state
        this.events$.pipe(takeUntil(
            this.onDestroy$),
            filter(message=> message.r === 'sensors' && !!message.state && message.id === this.openCloseResource?.id)
        ).subscribe({
            next: message =>{
                this.contactNode.state = message.state.open;
                this.maintenanceNode.lastUpdate = this.getDateForLastUpdate(message);
            }
        });

    }

}