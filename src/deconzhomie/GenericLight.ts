import { parseRGBColor, rgbColorToString } from "node-homie/util";
import { ColorLightNode, DimmerNode, MaintenanceNode, SwitchNode } from "hc-node-homie-smarthome";
import { filter, switchMap, takeUntil, tap } from "rxjs/operators";
import { adjustRGB, getRGBFromLightState, rgbToXYBri, xyBriToRgb } from "../deconz/colors.func";
import { isLightResource, LightResource } from "../deconz/deconz.model";
import { FactoryDevice } from "./FactoryDevice";
import { ColorLightNodePropertyConfig } from "hc-node-homie-smarthome/model";

import { lastValueFrom } from "rxjs";

export class GenericLight extends FactoryDevice<LightResource> {
    protected created = false;

    protected maintenanceNode: MaintenanceNode;

    public async create() {
        if (this.created) { return; }
        if (isLightResource(this.resource)) {
            this.maintenanceNode = this.add(new MaintenanceNode(this, {}, { batteryLevel: false, lastUpdate: true, lowBattery: false, reachable: true }));
            this.maintenanceNode.lastUpdate = new Date(this.resource.lastseen);
            this.maintenanceNode.reachable = this.resource.state.reachable;

            const switchNode = this.add(new SwitchNode(this));
            switchNode.state = this.resource.state.on;

            switchNode.propState.onSetMessage$.pipe(takeUntil(this.onDestroy$)).subscribe({
                next: async event => {
                    try {
                        this.log.debug(`Setting state ${event.value} (${typeof event.value}) for ${this.attributes.name}`);
                        await this.api.setLightState(this.deviceId, { on: event.value as boolean });
                        event.property.value = event.valueStr;
                    } catch (err) {
                        this.log.error(`Error setting value [${event.value}] for switch [${event.property.pointer}]`);
                    }
                }
            });


            if (this.resource.state.bri !== undefined) {
                const dimmerNode = this.add(new DimmerNode(this));
                dimmerNode.brightness = Math.ceil((this.resource.state.bri / 255) * 100);

                dimmerNode.propBrightness.onSetMessage$.pipe(takeUntil(this.onDestroy$)).subscribe({
                    next: async event => {
                        try {
                            const normalizedValue = Math.max(0, Math.min(100, event.value as number));
                            const val = Math.ceil(normalizedValue * 255 / 100);
                            this.log.debug(`Setting state ${val} (${typeof val}) for ${event.property.pointer}`);
                            await this.api.setLightState(this.deviceId, { on: true, bri: val });
                            event.property.value = String(normalizedValue);
                        } catch (err) {
                            this.log.error(`Error setting value [${event.value}] for brightness [${event.property.pointer}]`);
                        }
                    }
                });

            }

            if (this.resource.hascolor) {

                const propConfig: ColorLightNodePropertyConfig = this.resource.ctmin > 0 ? { ctmin: this.resource.ctmin, ctmax: this.resource.ctmax } : { ctmin: 153, ctmax: 555 };
                const colorNode = this.add(new ColorLightNode(this, {}, propConfig));

                colorNode.color = getRGBFromLightState(this.resource.state); // ColorConverter.xyBriToRgb(this.resource.state.xy[0], this.resource.state.xy[1], Math.round((this.resource.state?.bri / 255) * 100));
                colorNode.colorTemperature = this.resource.state.ct;
                colorNode.propColor.onSetMessage$.pipe(takeUntil(this.onDestroy$)).subscribe({
                    next: async event => {
                        try {
                            this.log.debug(`Setting state ${event.value} (${typeof event.value}) for ${event.property.pointer}`);

                            const hrgb = adjustRGB(parseRGBColor(event.valueStr)); // we always adjut rgb to linearly scale each channel up until one channel is 255
                            const xy = rgbToXYBri(hrgb);
                            const res = await this.api.setLightState(this.deviceId, { xy: [xy[0], xy[1]] });

                            const remoteXY = res[0]?.success[`/lights/${this.deviceId}/state/xy`];
                            if (remoteXY) {
                                const rrgb = xyBriToRgb({ x: remoteXY[0], y: remoteXY[1], bri: xy[2] })
                                this.log.silly('Set result from deconz: ', { xy, res, backConversion: rrgb });
                                event.property.value = rgbColorToString(rrgb);
                            } else {
                                event.property.value = rgbColorToString(hrgb);
                            }

                        } catch (err) {
                            this.log.error('Error setting color: ', { err })
                        }
                    }
                });


                colorNode.propColorTemperature.onSetMessage$.pipe(takeUntil(this.onDestroy$)).subscribe({
                    next: async event => {
                        try {
                            this.log.debug(`Setting state ${event.value} (${typeof event.value}) for ${event.property.pointer}`);
                            await this.api.setLightState(this.deviceId, { ct: event.value as number });
                            colorNode.colorTemperature = event.value as number;
                        } catch (err) {
                            this.log.error('Error setting colortemp: ', { err })
                        }
                    }
                });
            }

        }

        this.subscribeEvents();

        this.created = true;
    }


    private subscribeEvents() {
        this.events$.pipe(
            takeUntil(this.onDestroy$),
            filter(message => message.r === 'lights' && message.uniqueid === this.resource.uniqueid && !!message.state),
        ).subscribe({
            next: message => {
                const switchNode = this.nodes['switch'] as SwitchNode;
                if (switchNode.state !== message.state.on) {
                    switchNode.state = message.state.on;
                }

                if (message.state?.bri !== undefined) {
                    const brightness = Math.ceil((message.state?.bri / 255) * 100);
                    const dimmerNode = this.nodes['dimmer'] as DimmerNode;
                    if (brightness !== dimmerNode.brightness) {
                        dimmerNode.brightness = brightness;
                    }
                }

                if (this.resource.hascolor) {
                    const color = getRGBFromLightState(message.state);
                    const colorNode = this.nodes['colorlight'] as ColorLightNode;
                    if (!!color && color !== colorNode.color) {
                        colorNode.color = color;
                    }

                    const colorTemperature = message?.state?.ct;
                    if (!!colorTemperature && colorTemperature !== colorNode.colorTemperature) {
                        colorNode.colorTemperature = colorTemperature;
                    }
                }
            }
        });

        // Update name
        this.events$.pipe(
            takeUntil(this.onDestroy$),
            filter(message => message.e === 'changed' && !message.state && message.r === 'lights' && message.uniqueid === this.resource.uniqueid),
            filter(message => message.attr?.name && message.attr?.name !== this.attributes.name),
            switchMap(message => this.deviceChangeTransaction(() => {
                this.log.verbose(`Updating name for ${this.pointer} - ${message.attr?.name}`);
                this.setAttribute('name', message.attr?.name)
                return lastValueFrom(this.publishAttribute$('name'));
            }))
        ).subscribe();
    }
}