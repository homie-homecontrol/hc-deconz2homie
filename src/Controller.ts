import { Core } from "./core/Core";
import { HomieDeviceManager } from "node-homie";
import { DeconzAPI } from "./deconz/DeconzAPI";
import { DeconzMessage, LightResource, Ressources, SensorResource } from "./deconz";
import { DeviceFactory } from "./deconzhomie/DeviceFactory";

import { takeUntil, tap, retryWhen, delay, switchMap, share, filter, shareReplay, groupBy, map, mergeMap, bufferTime, toArray, startWith, pairwise, pluck, scan } from 'rxjs/operators';
import { concat, from, interval, merge, Observable, Observer, of, Subject } from "rxjs";
import { Sensor, SensorDefinition, SensorResourceSet, SensorRessourceCollator } from "./deconzhomie/SensorRessourceCollator";
import { createGroup, Group } from "./deconzhomie/Group";
import { HomieControllerBase } from 'node-homie/controller';
import { Globals } from "./globals";
import { DeconzWebSocket } from "./deconz/DeconzSocket";


function macFromResource(resource: SensorResource) {
    if (resource.uniqueid.includes(':') && resource.uniqueid.includes('-')) {
        return resource.uniqueid.split('-')[0];
    }
}


export class Controller extends HomieControllerBase {
    private stopping = false;
    private core: Core;

    // private events: DeconzEvents;
    private api: DeconzAPI;

    // private _events$ = new Subject<DeconzMessage>();
    private _events$ = new Subject<Observable<DeconzMessage>>();
    private events$ = this._events$.asObservable().pipe(switchMap(events => events), shareReplay(1), takeUntil(this.onDestroy$));
    public eventsObs$: Observable<DeconzMessage>;


    protected dm: HomieDeviceManager = new HomieDeviceManager();

    protected deviceFactory: DeviceFactory;


    private sensorCollation = new SensorRessourceCollator();

    constructor(core: Core) {
        super(core.settings.controller_id, core.settings.controller_name, core.settings.mqttOpts);
        this.core = core;
        this.deviceFactory = new DeviceFactory(this.core, this.events$.pipe(filter(msg => msg.e === "changed")));

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
        } else {
            this.log.info('Authentication with deCONZ successful.');
        }





        this.sensorCollation.onInit();

        this.sensorCollation.events$.pipe(takeUntil(this.onDestroy$)).subscribe({
            next: async event => {
                if (event.name === 'add' || event.name === 'update') {
                    this.createSensor(event.item).catch((err) => {
                        this.log.error(`Cannot create sensor for [${event.item.mac}]. Reason: ${err}`, { err });
                    })
                }
            }
        });



        var counterAPI = 0;

        const ressourceUpdates$ = concat(
            // of(null),
            from(this.api.getRessources()),
            interval(60000).pipe(switchMap(_ => this.api.getRessources())),
        ).pipe(
            takeUntil(this.onDestroy$),
            retryWhen((errors: Observable<any>) => {
                return errors.pipe(
                    tap(err => {
                        counterAPI++;
                        this.log.info(`reconnect Counter: ${counterAPI}`);
                        this.log.error(`ressourceUpdates$ error occured, will try to reconnect in 5s: `, { error: err });
                    }),
                    delay(2000)
                );
            }),
            tap(v => { console.log('Got ressources') }),
            shareReplay(1)
        );

        const lights$ = ressourceUpdates$.pipe(
            map(r => r?.lights),
            pairwise()
        )

        const groups$ = ressourceUpdates$.pipe(
            map(r => r?.groups),
            pairwise()
        )

        const sensors$ = ressourceUpdates$.pipe(
            mergeMap(r =>
                from(Object.entries(r.sensors).map(([id, definition]) => (<SensorDefinition>{ id, definition, mac: macFromResource(definition) }))).pipe(
                    groupBy(sensor => sensor.mac),
                    mergeMap(sg => {
                        return sg.pipe(
                            scan((sensors, sensor) => {
                                sensors[sensor.id] = sensor;
                                return sensors;
                            }, <SensorResourceSet>{}),
                            map(sensors => (<Sensor>{ mac: sg.key, sensors }))
                        );
                    }),
                    toArray()
                )
            )
        )

        sensors$.pipe(
            startWith(null),
            pairwise()
        ).subscribe({
            next: sensor => {
                // this.log.info('Sensor: ', { sensor });
            }
        })



        const openObserver: Observer<void> = {
            next: () => {
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
                });
            }, complete: () => { }, error: () => { }
        }


        this.eventsObs$ = DeconzWebSocket({
            hostname: `${this.core.settings.deconz_host}`, port: this.core.settings.deconz_ws_port, token: this.core.settings.deconz_api_token,
            openObserver,
            closeObserver: {
                next: () => {
                    this.log.info("events$ closed")
                }, complete: () => { }, error: () => { }
            }
        }).pipe(
            takeUntil(this.onDestroy$),
            retryWhen((errors: Observable<any>) => {
                return errors.pipe(
                    tap(err => {
                        counter++;
                        this.log.info(`reconnect Counter: ${counter}`);
                        this.log.error(`events$ error occured, will try to reconnect in 5s: `, { error: err });
                    }),
                    delay(2000)
                );
            })
        )

        var counter = 0;


        // if (data?.e === 'changed' && data?.state){
        //     this.emit('event-state', data);
        //     this.emit(`event-state-${data.r}`, data);
        // }else if (data?.e === 'changed' && data?.attr){
        //     this.emit('event-attr', data);
        //     this.emit(`event-attr-${data.r}`, data);
        // }else if (data.e === 'scene-called'){
        //     this.emit('event-scene-called', data);
        // }else if (data.e === 'added'){
        //     this.emit('event-added', data);
        //     this.emit(`event-added-${data.r}`, data);
        // }else if (data.e === 'deleted'){
        //     this.emit('event-deleted', data);
        //     this.emit(`event-deleted-${data.r}`, data);
        // }


        // this.events$.subscribe({
        //     next: (msg) => {
        //         this.log.info("events$: ", { message: msg });
        //     },
        //     error: err => {
        //         this.log.error(`events$ error occured: `, { error: err });
        //     },
        //     complete: () => {
        //         this.log.info('events$ completed');
        //     }
        // })


        // this.events = new DeconzEvents(this.core.settings.deconz_host, this.core.settings.deconz_ws_port, this.core.settings.deconz_api_token, { autoConnect: false });


        // this.events.on('event', event => {
        //     if (event.e === 'changed') {
        //         this._events$.next(event);
        //     }
        // })

        // this.events.on('event-added-sensors', event => {
        //     this.log.info(`ADDED Sensor Event: ${event.id}`, { event });
        //     this.sensorCollation.insert(event.id, event.sensor);
        // })

        // this.events.on('event-added-lights', event => {
        //     this.log.info(`ADDED Lights Event: ${event.id}`, { event });
        //     this.createLight(event.id, event.light).catch((err) => {
        //         this.log.error(`Cannot create light [${event.id}]. Reason: ${err}`, { err });
        //     })
        // })

        // this.events.on('event-deleted', event => {
        //     this.log.info(`DELETED Event: ${event.id}`, { event });
        // })

        // this.events.on('open', () => {
        //     this.log.info('Websocket opened: ');
        //     this.api.getRessources().then(data => {
        //         Object.entries(data.lights).forEach(([id, light]) => {
        //             this.createLight(id, light).catch((err) => {
        //                 this.log.error(`Cannot create light [${id}]. Reason: ${err}`, { err });
        //             })
        //         });
        //         Object.entries(data.groups).forEach(([id, group]) => {
        //             this.createLightGroup(id, createGroup(group, data.lights)).catch((err) => {
        //                 this.log.error(`Cannot create group [${id}]. Reason: ${err}`, { err });
        //             })
        //         });
        //         this.sensorCollation.insertMany(data.sensors);

        //         // this.log.info('Groups: ', data.groups);

        //     });
        // })

        // this.events.on('close', (err) => {
        //     this.log.warn('Websocket connection closed: ', { err });
        // })

        // this.events.on('error', (err) => {
        //     this.log.error('Websocket connection error: ', { err });
        // })


        const e = this.events$.pipe(
            // bufferTime(1500),
            // mergeMap(events => from(events).pipe(groupBy(e => e.uniqueid, e => e.state))),
            // mergeMap(eg => {
            //     return eg.pipe(toArray(), map(a => ({ key: eg.key, events: a })));
            // }),
            takeUntil(this.onDestroy$)
        )

        e.subscribe(
            {
                next: data => {
                    console.log('Data: ', data);
                }
            }
        )


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
        // this.events.connect();
        this.events$.subscribe();
        this._events$.next(this.eventsObs$);

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

        // this.events.close();

    }

}