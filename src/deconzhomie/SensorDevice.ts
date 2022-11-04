import { HomieDeviceAtrributes } from "node-homie/model";
import { MQTTConnectOpts } from "node-homie/model";
import { MaintenanceNode } from "hc-node-homie-smarthome";
import { lastValueFrom, Observable } from "rxjs";
import { takeUntil, filter, switchMap } from "rxjs/operators";
import { DeconzAPI } from "../deconz/DeconzAPI";
import { DeconzMessage } from "../deconz";
import { SensorResource, SHASensorType } from "../deconz/deconz.model";
import { FactoryDevice } from "./FactoryDevice";
import { Sensor, SensorDefinition } from "./SensorRessourceCollator";
import { H_SMARTHOME_NS_V1 } from "hc-node-homie-smarthome/model";

export abstract class SensorDevice<T extends Sensor = Sensor> extends FactoryDevice<T> {
    // protected mac: string;
    protected created = false;
    public readonly sensor: Sensor;

    protected ids: string[] = [];

    protected maintenanceNode: MaintenanceNode;

    constructor(attrs: HomieDeviceAtrributes, mqttOptions: MQTTConnectOpts, api: DeconzAPI, events$: Observable<DeconzMessage>, resource: T) {
        super(attrs, mqttOptions, api, events$, resource);
        this.sensor = resource as Sensor;
        // this.mac = mac;

        for (const uniqueid in this.sensor.sensors) {
            if (Object.prototype.hasOwnProperty.call(this.sensor.sensors, uniqueid)) {
                const sensorDef = this.sensor.sensors[uniqueid];
                this.ids.push(sensorDef.id)
            }
        }


        this.meta.addSubKey('hc-controller',
            { id: 'device-mac', key: `${H_SMARTHOME_NS_V1}/device-mac`, value: this.sensor.mac }
        )


        // Update name
        this.events$.pipe(
            takeUntil(this.onDestroy$),
            filter(message => message.e === 'changed' && !message.state && !message.attr && message.r === 'sensors' && this.ids.includes(message.id)),
            filter(message => message.name && message.name !== this.attributes.name),
            switchMap(message => this.deviceChangeTransaction(() => {
                this.log.verbose(`Updating name for ${this.pointer} - ${message.attr?.name}`);
                this.setAttribute('name', message.attr?.name)
                return lastValueFrom(this.publishAttribute$('name'));
            }))
        ).subscribe();
    }

    getSensorDefByType<T extends SensorResource = SensorResource>(type: SHASensorType): SensorDefinition<T> {
        for (const uniqueid in this.sensor.sensors) {
            if (Object.prototype.hasOwnProperty.call(this.sensor.sensors, uniqueid)) {
                const sensorDef = this.sensor.sensors[uniqueid];
                if (sensorDef.definition.type === type) {
                    return sensorDef as SensorDefinition<T>;
                }
            }
        }
        return undefined;
    }

    getByExtension<T extends SensorResource = SensorResource>(ext: string): SensorDefinition<T> {
        const res = Object.entries(this.sensor.sensors).find(([uniqueid, resource]) => uniqueid.endsWith(ext));
        if (!res) { return undefined; }
        return res[1] as SensorDefinition<T>;
    }

    includesSensorId(id: string): boolean {
        return this.ids.includes(id);
    }


}