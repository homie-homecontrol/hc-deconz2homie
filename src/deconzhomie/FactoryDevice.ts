import { HomieDevice } from "node-homie";
import { H_SMARTHOME_NS_V1 } from "hc-node-homie-smarthome/model";
import { HomieDeviceAtrributes, HomieDeviceMode } from "node-homie/model";
import { MQTTConnectOpts } from "node-homie/model";
import { Observable } from "rxjs";
import { Group, isGroup } from "./Group";
import { isSensor, Sensor } from "./SensorRessourceCollator";
import { DeconzAPI, Resource, DeconzMessage, isLightResource, SensorResource } from "../deconz";


export interface IFactoryDevice<T extends Resource | Sensor | Group = Resource | Sensor | Group> {
    readonly resource: T;
    readonly deviceId: string;
    readonly api: DeconzAPI;
    readonly events$: Observable<DeconzMessage>;
    create(): Promise<void>;
    // handleEventUpdate(message: DeconzMessage);
}


export abstract class FactoryDevice<T extends Resource | Sensor | Group = Resource | Sensor | Group> extends HomieDevice implements IFactoryDevice<T> {
    readonly resource: T;
    readonly deviceId: string;
    readonly api: DeconzAPI;
    readonly events$: Observable<DeconzMessage>;

    constructor(attrs: HomieDeviceAtrributes, mqttOptions: MQTTConnectOpts, api: DeconzAPI, events$: Observable<DeconzMessage>, resource: T, deviceId?: string) {
        super(attrs, mqttOptions, HomieDeviceMode.Device);
        this.api = api;
        this.events$ = events$;
        this.resource = resource;
        this.deviceId = deviceId;

        if (isLightResource(this.resource)) {

            const controllerMeta = this.meta.add({
                id: 'hc-controller', key: `${H_SMARTHOME_NS_V1}/controller`, value: 'hm2deconz', subkeys: [
                    { id: 'device-type', key: `${H_SMARTHOME_NS_V1}/device-type`, value: this.resource.type },
                    { id: 'device-fw', key: `${H_SMARTHOME_NS_V1}/device-fw`, value: this.resource.swversion },
                    { id: 'manufacturer', key: `${H_SMARTHOME_NS_V1}/manufacturer`, value: this.resource.manufacturername },
                    { id: 'model-id', key: `${H_SMARTHOME_NS_V1}/model-id`, value: this.resource.modelid }
                ]
            })
        } else if (isGroup(this.resource)) {

        } else if (isSensor(this.resource)) {
            const resourceSet = this.resource.sensors
            const firstResource = resourceSet[Object.keys(resourceSet)[0]].definition;
            if (!!firstResource) {
                const controllerMeta = this.meta.add({
                    id: 'hc-controller', key: `${H_SMARTHOME_NS_V1}/controller`, value: 'hm2deconz', subkeys: [
                        { id: 'device-fw', key: `${H_SMARTHOME_NS_V1}/device-type`, value: firstResource.swversion },
                        { id: 'manufacturer', key: `${H_SMARTHOME_NS_V1}/manufacturer`, value: firstResource.manufacturername },
                        { id: 'model-id', key: `${H_SMARTHOME_NS_V1}/model-id`, value: firstResource.modelid }
                    ]
                })
            }
        }

    }

    getDateForLastUpdate(definition: SensorResource | DeconzMessage): Date {
        if (!definition?.state?.lastupdated || definition?.state?.lastupdated === 'none') {
            return new Date(0);
        }
        try {
            return new Date(definition.state.lastupdated);
        } catch {
            return new Date(0);
        }
    }

    abstract create(): Promise<void>

    // abstract handleEventUpdate(message: DeconzMessage)

}