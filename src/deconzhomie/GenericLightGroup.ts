import { parseRGBColor, rgbColorToString } from "node-homie/util";
import { ColorLightNode, DimmerNode,  SwitchNode } from "hc-node-homie-smarthome";
import { bufferWhen, debounceTime, filter, switchMap, take, takeUntil } from "rxjs/operators";
import { adjustRGB, getRGBFromLightState,  rgbToXYBri, xyBriToRgb } from "../deconz/colors.func";
import { isGroupResource } from "../deconz/deconz.model";
import { FactoryDevice } from "./FactoryDevice";
import { ColorLightNodePropertyConfig } from "hc-node-homie-smarthome/model";
import { Group } from "./Group";
import { LightSceneNode } from "./nodes/SceneNode";
import { lastValueFrom } from "rxjs";

export class GenericLightGroup extends FactoryDevice<Group> {
    protected created = false;

    // protected maintenanceNode: MaintenanceNode;


    public async create() {
        if (this.created) { return Promise.resolve(); }
        if (isGroupResource(this.resource.resource)) {
            this.log.silly(`Lightgroup [${this.id}]`, { res: this.resource });


            const switchNode = this.add(new SwitchNode(this));
            switchNode.state = this.resource.resource.action.on;

            switchNode.propState.onSetMessage$.pipe(takeUntil(this.onDestroy$)).subscribe({
                next: async event => {
                    try {
                        await this.api.setGroupAction(this.deviceId, { on: event.value as boolean });
                        event.property.value = event.valueStr;

                    } catch (err) {
                        this.log.error(`Error setting value [${event.value}] for switch [${event.property.pointer}]`);
                    }
                }
            });


            if (this.resource.resource.action.bri !== undefined) {
                const dimmerNode = this.add(new DimmerNode(this));
                // dimmerNode.brightness = Math.round((this.resource.resource.action.bri / 255) * 100);
                this.updateBrightness()

                dimmerNode.propBrightness.onSetMessage$.pipe(takeUntil(this.onDestroy$)).subscribe({
                    next: async event => {
                        try {
                            const normalizedValue = Math.max(0, Math.min(100, event.value as number));
                            const val = Math.ceil(normalizedValue * 255 / 100);
                            this.log.debug(`Setting state ${val} (${typeof val}) for ${event.property.pointer}`);
                            await this.api.setGroupAction(this.deviceId, { on: true, bri: val });
                            event.property.value = String(normalizedValue);
                        } catch (err) {
                            this.log.error(`Error setting value [${event.value}] for brightness [${event.property.pointer}]`);
                        }
                    }
                });

            }

            if (!!this.resource.resource.scenes) {
                const scenesNode = this.add(new LightSceneNode(this, {}, { scenes: this.resource.resource.scenes.map(scene => scene.name.replace(/,/g, '_')) }));

                scenesNode.propRecall.onSetMessage$.pipe(takeUntil(this.onDestroy$)).subscribe({
                    next: async event => {
                        try {
                            for (let index = 0; index < this.resource.resource.scenes.length; index++) {
                                const scene = this.resource.resource.scenes[index];
                                const sceneName = scene.name.replace(/,/g, '_');
                                if (sceneName === event.value) {
                                    await this.api.recallScene(this.deviceId, scene.id);
                                }
                                event.property.value = sceneName;
                            }
                        } catch (err) {
                            this.log.error(`Error setting value [${event.value}] for scene [${event.property.pointer}]`);
                        }
                    }
                });

            }

            // if (this.resource.hascolor) {

            const propConfig: ColorLightNodePropertyConfig = { ctmin: 153, ctmax: 555 };
            const colorNode = this.add(new ColorLightNode(this, {}, propConfig));

            colorNode.color = getRGBFromLightState(this.resource.resource.action); // ColorConverter.xyBriToRgb(this.resource.state.xy[0], this.resource.state.xy[1], Math.round((this.resource.state?.bri / 255) * 100));
            colorNode.colorTemperature = this.resource.resource.action.ct;
            colorNode.propColor.onSetMessage$.pipe(takeUntil(this.onDestroy$)).subscribe({
                next: async event => {
                    try {
                        this.log.debug(`Setting state ${event.value} (${typeof event.value}) for ${event.property.pointer}`);

                        const hrgb = adjustRGB(parseRGBColor(event.valueStr)); // we always adjut rgb to linearly scale each channel up until one channel is 255
                        const xy = rgbToXYBri(hrgb);
                        const res = await this.api.setGroupAction(this.deviceId, { xy: [xy[0], xy[1]] });
                        // this.log.info('Set result from deconz: ', {res})
                        const remoteXY = res[0]?.success[`/groups/${this.deviceId}/action/xy`];
                        if (remoteXY) {
                            const rrgb = xyBriToRgb({ x: remoteXY[0], y: remoteXY[1], bri: xy[2] })
                            this.log.silly('Set result from deconz: ', { xy, res, backConversion: rrgb });
                            event.property.value = rgbColorToString(rrgb);
                        } else {
                            event.property.value = rgbColorToString(hrgb);
                        }


                        // const xybri=rgbToXYBri(parseRGBColor(event.valueStr));
                        // this.log.info('Set result from deconz: ', { xy: rgbToXY(parseRGBColor(event.valueStr)), res: await this.api.setGroupAction(this.deviceId, { xy: [xybri[0], xybri[1]], bri: xybri[2] }) });
                        // event.property.value = event.valueStr;


                    } catch (err) {
                        this.log.error('Error setting color: ', { err })
                    }
                }
            });


            colorNode.propColorTemperature.onSetMessage$.pipe(takeUntil(this.onDestroy$)).subscribe({
                next: async event => {
                    try {
                        this.log.debug(`Setting state ${event.value} (${typeof event.value}) for ${event.property.pointer}`);
                        await this.api.setGroupAction(this.deviceId, { ct: event.value as number });
                        colorNode.colorTemperature = event.value as number;
                    } catch (err) {
                        this.log.error('Error setting colortemp: ', { err })
                    }
                }
            });



            // }

        }

        this.subscribeEvents();

        this.created = true;
    }



    private subscribeEvents() {
        // direct group state updates
        this.events$.pipe(
            takeUntil(this.onDestroy$),
            filter(message => message.r === 'groups' && message.id === this.resource.resource.id && !!message.state),
        ).subscribe({
            next: message => {
                const switchNode = this.nodes['switch'] as SwitchNode;
                const onState = message.state.all_on || message.state.any_on;
                if (switchNode.state !== onState) {
                    switchNode.state = onState;
                }
            }
        });

        const lightsUpdates$ = this.events$.pipe(filter(message => message.r === 'lights' && !!message.state && this.resource.resource.lights.includes(message.id)));

        lightsUpdates$.pipe(
            takeUntil(this.onDestroy$),
            bufferWhen(() => lightsUpdates$.pipe(debounceTime(200), take(1))),
        ).subscribe({
            next: lights => {
                lights.forEach(light => {
                    this.resource.lightBrightness[light.id] = light.state.bri;
                })
                this.updateBrightness();
            }
        });

        // Update name
        this.events$.pipe(
            takeUntil(this.onDestroy$),
            filter(message => message.e === 'changed' && !message.state && message.r === 'groups' && message.id === this.resource.resource.id),
            filter(message => message.name && message.name !== this.attributes.name),
            switchMap(message => this.deviceChangeTransaction(async () => {
                this.log.verbose(`Updating name for ${this.pointer} - ${message.attr?.name}`);
                this.attributes = {...this.attributes, name: message.attr?.name}
                return true;
            }))
        ).subscribe();

    }

    private updateBrightness() {
        const brightnesses = Object.values(this.resource.lightBrightness).map(bri => Math.round((bri / 255) * 100))
        const brightness = brightnesses.length === 0 ? 0 : brightnesses.reduce((prev, cur) => Math.round((prev + cur) / 2));
        const dimmerNode = this.nodes['dimmer'] as DimmerNode;
        if (brightness !== dimmerNode.brightness) {
            dimmerNode.brightness = brightness;
        }
    }

}