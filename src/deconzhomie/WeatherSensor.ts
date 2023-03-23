import { MaintenanceNode, WeatherNode } from "hc-node-homie-smarthome";
import { takeUntil, filter } from "rxjs/operators";
import { ZHAHumidity, ZHAPressure, ZHATemperature } from "../deconz/deconz.model";
import { SensorDevice } from "./SensorDevice";
import { SensorDefinition } from "./SensorRessourceCollator";

export class WeatherSensor extends SensorDevice {
    protected created = false;

    protected maintenanceNode: MaintenanceNode;
    protected weatherNode: WeatherNode;
    protected temp: SensorDefinition<ZHATemperature>;
    protected hum: SensorDefinition<ZHAHumidity>;
    protected pres: SensorDefinition<ZHAPressure>;


    public async create() {
        if (this.created) { return Promise.resolve(); }

        this.temp = this.getSensorDefByType('ZHATemperature');
        this.hum = this.getSensorDefByType('ZHAHumidity');
        this.pres = this.getSensorDefByType('ZHAPressure');

        const maintenanceResource = this.temp ? this.temp : this.hum ? this.hum : this.pres ? this.pres : null;

        this.maintenanceNode = this.add(new MaintenanceNode(this, undefined, {}, { batteryLevel: true, lastUpdate: true, lowBattery: false, reachable: true }));
        this.maintenanceNode.lastUpdate = this.getDateForLastUpdate(maintenanceResource?.definition);
        this.maintenanceNode.reachable = maintenanceResource?.definition.config.reachable;
        this.maintenanceNode.batteryLevel = maintenanceResource?.definition.config.battery;

        this.weatherNode = this.add(new WeatherNode(this, undefined, {}, { temperature: !!this.temp, humidity: !!this.hum, pressure: !!this.pres, tempUnit: 'C' }));

        this.updateTemperature();
        this.updateHumidity();
        this.updatePressure();

        this.subscribeEvents();

        this.created = true;
    }

    updateTemperature(temp?: number) {
        if (!this.temp) { return undefined; }
        if (this.temp.definition.manufacturername === 'LUMI') {
            this.weatherNode.temperature = temp ? temp / 100 : this.temp.definition.state.temperature / 100
        } else {
            this.weatherNode.temperature = temp ? temp : this.temp.definition.state.temperature
        }
    }

    updateHumidity(hum?: number) {
        if (!this.hum) { return undefined; }
        if (this.hum.definition.manufacturername === 'LUMI') {
            this.weatherNode.humidity = hum ? hum / 100 : this.hum.definition.state.humidity / 100
        } else {
            this.weatherNode.humidity = hum ? hum : this.hum.definition.state.humidity
        }
    }

    updatePressure(pres?: number) {
        if (!this.pres) { return undefined; }
        this.weatherNode.pressure = pres ? pres : this.pres.definition.state.pressure
    }


    private subscribeEvents() {
        // update temperature
        this.events$.pipe(takeUntil(
            this.onDestroy$),
            filter(message => message.r === 'sensors' && !!message.state && message.id === this.temp?.id)
        ).subscribe({
            next: message => {
                this.updateTemperature(message.state.temperature)
                this.maintenanceNode.lastUpdate = this.getDateForLastUpdate(message);
            }
        });

        // update humidty
        this.events$.pipe(takeUntil(
            this.onDestroy$),
            filter(message => message.r === 'sensors' && !!message.state && message.id === this.hum?.id)
        ).subscribe({
            next: message => {
                this.updateHumidity(message.state.humidity)
                this.maintenanceNode.lastUpdate = this.getDateForLastUpdate(message);
            }
        });

        // update pressure
        this.events$.pipe(takeUntil(
            this.onDestroy$),
            filter(message => message.r === 'sensors' && !!message.state && message.id === this.pres?.id)
        ).subscribe({
            next: message => {
                this.updatePressure(message.state.pressure)
                this.maintenanceNode.lastUpdate = this.getDateForLastUpdate(message);
            }
        });
    }

}