import { HomieDevice } from "node-homie";
import { DeviceAttributes, HomieID, IDAttributeImpl } from "node-homie/model";
import { MQTTConnectOpts } from "node-homie/model";
import {
    H_SMARTHOME_TYPE_CONTACT, H_SMARTHOME_TYPE_MOTION_SENSOR,
    H_SMARTHOME_TYPE_POWERMETER, H_SMARTHOME_TYPE_THERMOSTAT, H_SMARTHOME_TYPE_WEATHER
} from "hc-node-homie-smarthome/model";
import * as winston from "winston";
import { Core } from "../core/Core";
import { DeconzAPI } from "../deconz/DeconzAPI";
import { isGroupResource, isLightResource, LightResource, Resource, SHASensorType } from "../deconz/deconz.model";
import { FactoryDevice } from "./FactoryDevice";
import { GenericLight } from "./GenericLight";
import { GestureSensor } from "./GestureSensor";
import { MotionSensor } from "./MotionSensor";
import { H_SMARTHOME_TYPE_EXT_GUESTURE_SENSOR } from "./nodes/GestureNode";
import { WeatherSensor } from "./WeatherSensor";
import { XiaomiAqara86sw2 } from "./XiaomiAqara86sw2";
import { XiaomiAqaraCube } from "./XiaomiAqaraCube";
import { Sensor, SensorResourceSet } from "./SensorRessourceCollator";
import { GenericLightGroup } from "./GenericLightGroup";
import { Observable } from "rxjs";
import { DeconzMessage } from "../deconz/DeconzEvents";
import { Group } from "./Group";
import { VibrationSensor, VIBRATION_SENSOR } from "./VibrationSensor";
import { ContactSensor } from "./ContactSensor";
import { RxMqtt } from "node-homie/mqtt";

export declare type FactoryDeviceClass = {
    new(attrs: Partial<DeviceAttributes> & IDAttributeImpl, mqttOptions: RxMqtt, api: DeconzAPI, events$: Observable<DeconzMessage>, sensor: Resource | Sensor | Group, deviceId?: string): FactoryDevice;
};

export interface DeviceTypeClasses {
    [type: string]: FactoryDeviceClass
}


export class DeviceFactory {

    private deviceTypes: DeviceTypeClasses = {}

    protected readonly log: winston.Logger;

    private readonly deviceClassMapping: { [sensorType in SHASensorType]?: string } = {
        ZHAHumidity: H_SMARTHOME_TYPE_WEATHER,
        ZHATemperature: H_SMARTHOME_TYPE_WEATHER,
        ZHAPressure: H_SMARTHOME_TYPE_WEATHER,
        ZHAPresence: H_SMARTHOME_TYPE_MOTION_SENSOR,
        ZHALightLevel: H_SMARTHOME_TYPE_MOTION_SENSOR,
        ZHAConsumption: H_SMARTHOME_TYPE_POWERMETER,
        ZHAPower: H_SMARTHOME_TYPE_POWERMETER,
        ZHAOpenClose: H_SMARTHOME_TYPE_CONTACT,
        ZHASwitch: H_SMARTHOME_TYPE_EXT_GUESTURE_SENSOR,
        ZHAThermostat: H_SMARTHOME_TYPE_THERMOSTAT,
        ZHAVibration: VIBRATION_SENSOR
    }


    constructor(private core: Core, private events$: Observable<DeconzMessage>, protected sharedMqtt: RxMqtt, protected parentId?: string) {
        this.log = winston.child({
            type: this.constructor.name
        });

        this.registerDeviceTypeClass('light', GenericLight);
        this.registerDeviceTypeClass('group', GenericLightGroup);
        this.registerDeviceTypeClass(H_SMARTHOME_TYPE_MOTION_SENSOR, MotionSensor);
        this.registerDeviceTypeClass(H_SMARTHOME_TYPE_WEATHER, WeatherSensor);
        this.registerDeviceTypeClass(H_SMARTHOME_TYPE_EXT_GUESTURE_SENSOR, GestureSensor);
        this.registerDeviceTypeClass(H_SMARTHOME_TYPE_CONTACT, ContactSensor);
        this.registerDeviceTypeClass(VIBRATION_SENSOR, VibrationSensor);
        this.registerDeviceTypeClass('lumi.sensor_cube.aqgl01', XiaomiAqaraCube);
        this.registerDeviceTypeClass('lumi.sensor_86sw2', XiaomiAqara86sw2);

    }

    public registerDeviceTypeClass(type: string, typeClass: FactoryDeviceClass) {
        this.deviceTypes[type] = typeClass
    }

    public async createLightDevice(api: DeconzAPI, ressource: LightResource, deviceId: string): Promise<HomieDevice> {
        if (!isLightResource(ressource)) { return undefined; }
        this.log.info(`Create light device: ${ressource.name} `);
        const typeClass = this.deviceTypes['light'];
        // ressource.uniqueid
        const dev = new typeClass(
            {
                id: `light-${deviceId}`,
                name: ressource.name,
                parent: this.parentId,
                root: this.parentId
            },
            // {
            //     url: this.core.settings.mqtt_url,
            //     username: this.core.settings.mqtt_user,
            //     password: this.core.settings.mqtt_password,
            //     topicRoot: this.core.settings.mqtt_topic_root
            // }, 
            this.sharedMqtt,
            api, this.events$, ressource, deviceId);

        await dev.create()
        return dev;
    }

    public async createLightGroupDevice(api: DeconzAPI, ressource: Group, deviceId: string): Promise<HomieDevice> {
        if (!isGroupResource(ressource.resource)) { return undefined; }
        this.log.info(`Create group device: ${ressource.resource.name} `);
        const typeClass = this.deviceTypes['group'];
        // ressource.uniqueid
        const dev = new typeClass(
            {
                id: `group-${deviceId}`,
                name: ressource.resource.name,
                parent: this.parentId,
                root: this.parentId
            },
            // {
            //     url: this.core.settings.mqtt_url,
            //     username: this.core.settings.mqtt_user,
            //     password: this.core.settings.mqtt_password,
            //     topicRoot: this.core.settings.mqtt_topic_root
            // }, 
            this.sharedMqtt,
            api, this.events$, ressource, deviceId);

        await dev.create()
        return dev;
    }

    public determineSensorDeviceInfo(resources: SensorResourceSet): { typeClass: FactoryDeviceClass, id: string, name: string, uniqueid: string } {

        for (const uniqueid in resources) {
            if (Object.prototype.hasOwnProperty.call(resources, uniqueid)) {
                const resource = resources[uniqueid];
                this.log.info(`Ressource [${resource.definition.type}]`);

                if (resource.definition.modelid === 'lumi.sensor_cube.aqgl01') {
                    return {
                        id: `cube-${resource.id}`,
                        name: resource.definition.name,
                        typeClass: this.deviceTypes['lumi.sensor_cube.aqgl01'],
                        uniqueid
                    }
                }

                if (resource.definition.modelid === 'lumi.sensor_86sw2') {
                    return {
                        id: `switch-${resource.id}`,
                        name: resource.definition.name,
                        typeClass: this.deviceTypes['lumi.sensor_86sw2'],
                        uniqueid
                    }
                }

                if (Object.keys(this.deviceClassMapping).includes(resource.definition.type)) {
                    const mappingIndex = this.deviceClassMapping[resource.definition.type];
                    this.log.info(`Determine sensor class for: id: [${resource.id}], name: [${resource.definition.name}] type: [${resource.definition.type}] mapping index: [${mappingIndex}]`);
                    const deviceType = this.deviceTypes[mappingIndex];
                    if (!deviceType) { continue; }
                    return {
                        id: `sensor-${resource.id}`,
                        name: resource.definition.name,
                        typeClass: this.deviceTypes[mappingIndex],
                        uniqueid
                    }
                }
            }
        }
        return undefined;
    }

    public async createSensorDevice(api: DeconzAPI, sensor: Sensor): Promise<HomieDevice> {



        const deviceInfo = this.determineSensorDeviceInfo(sensor.sensors)
        // const typeClass = 
        if (!deviceInfo) { return undefined; }
        if (!this.sharedMqtt.connectionInfo.connected){
            throw new Error(`${deviceInfo.id} -- cannot create sensor - mqtt not connected!`);
        }

        this.log.info(`Create sensor device for ${sensor.mac} - ${deviceInfo.name}`);

        const dev = new deviceInfo.typeClass(
            {
                id: deviceInfo.id,
                name: deviceInfo.name,
                parent: this.parentId,
                root: this.parentId
            },
            // {
            //     url: this.core.settings.mqtt_url,
            //     username: this.core.settings.mqtt_user,
            //     password: this.core.settings.mqtt_password,
            //     topicRoot: this.core.settings.mqtt_topic_root
            // }, 
            this.sharedMqtt,
            api, this.events$, sensor);

        await dev.create()
        return dev;
    }


}