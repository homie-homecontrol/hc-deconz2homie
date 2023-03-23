import { Core } from "./core/Core";
import * as winston from "winston";
import { DeviceDiscovery, HomieDeviceManager } from "node-homie5";
import { DeconzEvents, DeconzMessage } from "./deconz/DeconzEvents";
import { DeconzAPI } from "./deconz/DeconzAPI";
import { LightResource } from "./deconz/deconz.model";
import { DeviceFactory } from "./deconzhomie/DeviceFactory";

import { takeUntil, tap } from 'rxjs/operators';
import { Subject } from "rxjs";
import { Sensor, SensorRessourceCollator } from "./deconzhomie/SensorRessourceCollator";
import { OnDestroy, OnInit } from "node-homie5/misc";
import { createGroup, Group } from "./deconzhomie/Group";
import { HomieControllerBase } from 'node-homie5/controller';
import { Globals } from "./globals";

export class Controller extends HomieControllerBase {
    private stopping = false;
    private core: Core;

    private events: DeconzEvents;
    private api: DeconzAPI;

    private _events$ = new Subject<DeconzMessage>();
    public events$ = this._events$.asObservable();

    protected dm: HomieDeviceManager = new HomieDeviceManager();

    protected deviceFactory: DeviceFactory;


    private sensorCollation = new SensorRessourceCollator();

    constructor(core: Core) {
        super(core.settings.controller_id, core.settings.controller_name, core.settings.mqttOpts);
        this.core = core;
        this.deviceFactory = new DeviceFactory(this.core, this.events$,core.settings.controller_id);

    }

    public async onInit() {

        await super.onInit();
        this.api = new DeconzAPI(this.core.settings.deconz_host, this.core.settings.deconz_port, this.core.settings.deconz_api_token, this.core.settings.deconz_secure);

        const valid = await this.api.checkAPIToken();
        if (!valid) {
            this.log.warn(`The provided API token was empty or invalid. Attempt to request a new token.`);
            this.log.warn(`Please ensure to click on 'Authenticate App' in the deconz web config site before starting.`);
            let token = "";
            try {
                token = await this.api.requestAPIToken();
            } catch (err) {
                this.log.warn(`Error requesting token. Did you click on 'Authenticate App' in the deconz web config site?`);
                throw new Error("Error requesting token. Did you click on 'Authenticate App' in the deconz web config site?");
            }
            this.log.warn(`New token received: [${token}]. `);
            this.log.warn(`Please set this via ${Globals.SERVICE_NAMESPACE}_DECONZ_API_TOKEN environment variable and restart`);
            throw new Error("Error requesting token. Did you click on 'Authenticate App' in the deconz web config site?");
        }else{
            this.log.info('Authentication with deCONZ successful.');
        }





        this.sensorCollation.onInit();

        this.sensorCollation.events$.pipe(takeUntil(this.onDestroy$)).subscribe({
            next: async event => {
                if (event.name === 'add' || event.name === 'update') {
                    // this.log.info(`sensor event ${event.name} - ${event.item.mac}`, {sets: event.item.sensors});
                    this.createSensor(event.item).catch((err) => {
                        this.log.error(`Cannot create sensor for [${event.item.mac}]. Reason: ${err}`, { err });
                    })
                }
            }
        });



        this.events = new DeconzEvents(this.core.settings.deconz_host, this.core.settings.deconz_ws_port, this.core.settings.deconz_api_token, { autoConnect: false });


        this.events.on('event', event => {
            if (event.e === 'changed') {
                this._events$.next(event);
            }
        })

        this.events.on('event-added-sensors', event => {
            this.log.info(`ADDED Sensor Event: ${event.id}`, { event });
            this.sensorCollation.insert(event.id, event.sensor);
        })

        this.events.on('event-added-lights', event => {
            this.log.info(`ADDED Lights Event: ${event.id}`, { event });
            this.createLight(event.id, event.light).catch((err) => {
                this.log.error(`Cannot create light [${event.id}]. Reason: ${err}`, { err });
            })
        })

        this.events.on('event-deleted', event => {
            this.log.info(`DELETED Event: ${event.id}`, { event });
        })

        this.events.on('open', () => {
            this.log.info('Websocket opened: ');
            this.api.getRessources().then(data => {
                Object.entries(data.lights).forEach(([id, light]) => {
                    this.createLight(id, light).catch((err) => {
                        this.log.error(`Cannot create light [${id}]. Reason: ${err}`, { err });
                    })
                });
                Object.entries(data.groups).forEach(([id, group]) => {
                    this.createLightGroup(id, createGroup(group, data.lights)).catch((err) => {
                        this.log.error(`Cannot create group [${id}]. Reason: ${err}`, { err });
                    })
                });
                this.sensorCollation.insertMany(data.sensors);

                // this.log.info('Groups: ', data.groups);

            });
        })

        this.events.on('close', (err) => {
            this.log.warn('Websocket connection closed: ', { err });
        })

        this.events.on('error', (err) => {
            this.log.error('Websocket connection error: ', { err });
        })



        this.connectEventListener();

        // intialize controller device
        this.controllerDevice.onInit();
        this.log.verbose('Devices initialization completed!');
    }


    private async createSensor(sensor: Sensor) {
        const device = await this.deviceFactory.createSensorDevice(this.api, sensor);
        if (!device) { return undefined }
        if (this.dm.hasDevice(device.id)) {
            const oldDevice = this.dm.removeDevice(device.id);
            await oldDevice.onDestroy();
        }
        this.dm.add(device);
        return device.onInit();
    }

    private async createLight(id: string, light: LightResource) {
        const device = await this.deviceFactory.createLightDevice(this.api, light, id);
        if (!device) { return undefined }
        if (this.dm.hasDevice(device.id)) {
            const oldDevice = this.dm.removeDevice(device.id);
            await oldDevice.onDestroy();
        }
        this.dm.add(device);
        return device.onInit();
    }

    private async createLightGroup(id: string, light: Group) {
        const device = await this.deviceFactory.createLightGroupDevice(this.api, light, id);
        if (!device) { return undefined }
        if (this.dm.hasDevice(device.id)) {
            const oldDevice = this.dm.removeDevice(device.id);
            await oldDevice.onDestroy();
        }
        this.dm.add(device);
        return device.onInit();
    }



    private connectEventListener() {
        if (this.stopping) { return; }
        this.events.connect();

    }

    public async onDestroy() {
        this.stopping = true;
        this.log.info('Stopping DECONZ controller interface.');
        await super.onDestroy();
        await this.controllerDevice.onDestroy();
        try {
            await this.dm.onDestroy();
            this.log.info('All devices were closed. Ready for shutdown...');
        } catch (err) {
            this.log.error('Error disconnecting devices');
        }

        this.events.close();

    }

}