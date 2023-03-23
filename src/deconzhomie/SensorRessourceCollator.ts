import { DictionaryStore, OnDestroy, OnInit } from "node-homie5/misc";
import { Subject } from "rxjs";
import { bufferTime, mapTo, takeUntil, tap } from "rxjs/operators";
import { SensorResource } from "../deconz/deconz.model";

export interface SensorDefinition<T extends SensorResource = SensorResource> {
    id: string;
    mac: string;
    definition: T;
}

export interface SensorResourceSet {
    [uniqueid: string]: SensorDefinition
}

export interface Sensor {
    mac: string;
    sensors: SensorResourceSet
}

export function isSensor(obj: any): obj is Sensor {
    return !!obj && !!obj.mac && !!obj.sensors;
}



export interface Sensors {
    [mac: string]: Sensor;
}


export class SensorRessourceCollator implements OnInit, OnDestroy {

    protected _onDestroy$ = new Subject<boolean>();
    public onDestroy$ = this._onDestroy$.asObservable();

    protected insertSensorResourceAction$ = new Subject<SensorDefinition>();

    protected store = new DictionaryStore<Sensor>(item => item.mac);

    public events$ = this.store.events$;


    public insert(id: string, definition: SensorResource) {
        // console.log('Add: ', id, definition);
        if (id !== undefined && id !== null && definition !== undefined && definition !== null) {
            this.insertSensorResourceAction$.next({ id, mac: this.macFromResource(definition), definition });
        }
    }

    public insertMany(sensors: { [id: string]: SensorResource }) {
        Object.entries(sensors).forEach(([id, definition]) => this.insert(id, definition));
    }

    public remove(id: string) {
        // not implemented yet
    }

    public getSensor(mac: string): Sensor {
        return this.store.getItem(mac);
    }

    public findById(id: string): SensorDefinition | null {
        for (const mac in this.store.state) {
            const sensor = this.store.getItem(mac);
            if (sensor) {
                for (const uniqueid in sensor.sensors) {
                    if (Object.prototype.hasOwnProperty.call(sensor.sensors, uniqueid)) {
                        const sensorDefinition = sensor.sensors[uniqueid];
                        if (sensorDefinition.id === id) {
                            return sensorDefinition;
                        }
                    }
                }
            }
        }
        return null;
    }

    public getAll() {
        return { ...this.store.state };
    }

    async onInit(): Promise<void> {

        this.insertSensorResourceAction$.pipe(
            takeUntil(this.onDestroy$),
            bufferTime(750)
        ).subscribe({
            next: resources => {
                this.insertRessources(resources);
            }
        });

    }


    private macFromResource(resource: SensorResource) {
        if (resource.uniqueid.includes(':') && resource.uniqueid.includes('-')) {
            return resource.uniqueid.split('-')[0];
        }
    }

    private toSensors(resources: SensorDefinition[]): Sensors {
        const result: Sensors = {};
        resources.forEach((sensor) => {
            if (Object.keys(result).includes(sensor.mac)) {
                result[sensor.mac].sensors[sensor.definition.uniqueid] = (sensor);
            } else {
                result[sensor.mac] = { mac: sensor.mac, sensors: { [sensor.definition.uniqueid]: sensor } };
            }
        })
        return result;
    }


    private insertRessources(resources: SensorDefinition[]) {

        const sensors: Sensors = this.toSensors(resources);

        Object.entries(sensors).forEach(([mac, sensor]) => {
            if (this.store.hasId(mac)) {
                const oldSensor = this.store.getItem(mac);
                this.store.addOrUpdate({ mac: sensor.mac, sensors: { ...oldSensor.sensors, ...sensor.sensors } })
            } else {
                this.store.addOrUpdate(sensor);
            }
        });

    }



    async onDestroy(): Promise<void> {
        this._onDestroy$.next(true);
    }




}