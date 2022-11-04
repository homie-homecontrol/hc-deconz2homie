
/**
 * General Ressources
 */

export interface Ressources {
    config: any;
    groups: { [id: string]: GroupResource };
    lights: { [id: string]: LightResource };
    sensors: { [id: string]: SensorResource };
    scenes: any;
    rules: any;
    schedules: any;
}

export type Resource = GroupResource | LightResource | SensorResource;

/**
 * Lights
 */

export interface LightsState {
    on: boolean;
    bri: number;
    effect: number;
    hue: number;
    sat: number;
    ct: number;
    xy: [number, number];
    alert: 'none' | 'select' | 'lselect';
    colormode: 'hs' | 'xy' | 'ct';
    // effect: string ?? 
    speed: number;
    reachable: boolean;
}

export interface LightResource {
    colorcapabilities: number;
    ctmax: number;
    ctmin: number;
    lastannounced: string;
    lastseen: string;
    etag: string;
    hascolor: boolean;
    manufacturername: string;
    name: string;
    modelid: string;
    pointsymbol: any;
    powerup: number;
    swversion: string;
    type: string;
    state: LightsState;
    uniqueid: string;
}

export function isLightResource(resource: any): resource is LightResource {
    return resource?.hascolor !== undefined && resource?.state?.on !== undefined;
}

/**
 * Groups
 */

export interface GroupAction {
    on: boolean;
    bri: number;
    hue: number;
    sat: number;
    ct: number;
    xy: [number, number];
    colormode: 'hs' | 'xy' | 'ct';
    effect: string;
    scene: string;
    alert: 'none' | 'select' | 'lselect';
}

export interface GroupState{
    all_on: boolean;
    any_on: boolean;
}

export interface GroupScene {
    id: string;
    lightcount: number;
    name: string;
    transitiontime: number;
}

export interface GroupResource {
    id: string;
    name: string;
    etag: string;
    hidden: boolean;
    devicemembership: string[];
    scenes: GroupScene[];
    lights: string[];
    state: GroupState,
    action: GroupAction;
    type: "LightGroup"
}


export function isGroupResource(resource: any): resource is GroupResource {
    return resource?.type === 'LightGroup' && resource?.devicemembership !== undefined && resource?.state?.all_on !== undefined;
}

/**
 * Sensors
 */

export type CLIPSensorType =
    'CLIPAlarm' | 'CLIPBattery' | 'CLIPCarbonMonoxide' | 'CLIPConsumption' | 'CLIPFire' |
    'CLIPGenericFlag' | 'CLIPGenericStatus' | 'CLIPHumidity' | 'CLIPLightLevel' | 'CLIPOpenClose' | 'CLIPPower' |
    'CLIPPresence' | 'CLIPPressure' | 'CLIPSwitch' | 'CLIPTemperature' | 'CLIPVibration' | 'CLIPWater';

export type SHASensorType =
    'ZHAAirQuality' | 'ZHAAlarm' | 'ZHACarbonMonoxide' | 'ZHAConsumption' | 'ZHAFire' |
    'ZHAHumidity' | 'ZHALightLevel' | 'ZHAOpenClose' | 'ZHAPower' | 'ZHAPresence' |
    'ZHASwitch' | 'ZHAPressure' | 'ZHATemperature' | 'ZHATime' | 'ZHAThermostat' |
    'ZHAVibration' | 'ZHAWater';

export type SensorState = ZHAAirQualityState | ZHAAlarmState | ZHACarbonMonoxideState | ZHAConsumptionState |
    ZHAFireState | ZHAHumidityState | ZHALightLevelState | ZHAOpenCloseState | ZHAPowerState |
    ZHAPresenceState | ZHASwitchState | ZHAPressureState | ZHATemperatureState | ZHATimeState |
    ZHAThermostatState | ZHAVibrationState | ZHAWaterState;


export interface SensorResourceBase<T extends SHASensorType, TS extends SensorState> {
    name: string;
    ep: number;
    etag: string;
    manufacturername: string;
    modelid: string;
    swversion: string;
    type: T;
    uniqueid: string;
    config: {
        battery?: number,
        reachable?: true,
        [index: string]: any
    }
    state: TS;
}

export type ZHAAirQuality = SensorResourceBase<'ZHAAirQuality', ZHAAirQualityState>;
export type ZHAAlarm = SensorResourceBase<'ZHAAlarm', ZHAAlarmState>;
export type ZHACarbonMonoxide = SensorResourceBase<'ZHACarbonMonoxide', ZHACarbonMonoxideState>;
export type ZHAConsumption = SensorResourceBase<'ZHAConsumption', ZHAConsumptionState>;
export type ZHAFire = SensorResourceBase<'ZHAFire', ZHAFireState>;
export type ZHAHumidity = SensorResourceBase<'ZHAHumidity', ZHAHumidityState>;
export type ZHALightLevel = SensorResourceBase<'ZHALightLevel', ZHALightLevelState>;
export type ZHAOpenClose = SensorResourceBase<'ZHAOpenClose', ZHAOpenCloseState>;
export type ZHAPower = SensorResourceBase<'ZHAPower', ZHAPowerState>;
export type ZHAPresence = SensorResourceBase<'ZHAPresence', ZHAPresenceState>;
export type ZHASwitch = SensorResourceBase<'ZHASwitch', ZHASwitchState>;
export type ZHAPressure = SensorResourceBase<'ZHAPressure', ZHAPressureState>;
export type ZHATemperature = SensorResourceBase<'ZHATemperature', ZHATemperatureState>;
export type ZHATime = SensorResourceBase<'ZHATime', ZHATimeState>;
export type ZHAThermostat = SensorResourceBase<'ZHAThermostat', ZHAThermostatState>;
export type ZHAVibration = SensorResourceBase<'ZHAVibration', ZHAVibrationState>;
export type ZHAWater = SensorResourceBase<'ZHAWater', ZHAWaterState>;


export type SensorResource = ZHAAirQuality | ZHAAlarm | ZHACarbonMonoxide | ZHAConsumption |
    ZHAFire | ZHAHumidity | ZHALightLevel | ZHAOpenClose | ZHAPower |
    ZHAPresence | ZHASwitch | ZHAPressure | ZHATemperature | ZHATime |
    ZHAThermostat | ZHAVibration | ZHAWater;

// export interface SensorResourceZHASwitch extends SensorResource{
//     type:'ZHASwitch';
//     state: ZHASwitchState;
// }


export function isSensorResource(resource: any): resource is SensorResource {
    return !isGroupResource(resource) && !isLightResource(resource); // can only be detected indirectly
}
export interface ZHAAirQualityState {
    airquality: 'excellent' | 'good' | 'moderate' | 'poor' | 'unhealthy' | 'out of scale';
    airqualityppb: number;
    lastupdated?: string;
}

export interface ZHAAlarmState {
    alarm: boolean;
    lastupdated: string;
    lowbattery: string;
    tampered: boolean;
}

export interface ZHACarbonMonoxideState {
    carbonmonoxide: boolean;
    lastupdated: string;
    lowbattery: boolean;
    tampered: boolean;
}

export interface ZHAConsumptionState {
    consumption: number;
    lastupdated: string;
    power: number;
}

export interface ZHAFireState {
    fire: boolean;
    lastupdated: string;
    lowbattery: boolean;
    tampered: boolean;
}

export interface ZHAHumidityState {
    humidity: number;
    lastupdated: string;
}

export interface ZHALightLevelState {
    lux: number;
    lightlevel: number;
    dark: boolean;
    daylight: boolean
    lastupdated: string;
}

export interface ZHAOpenCloseState {
    open: boolean;
    lastupdated: string;
}

export interface ZHAPowerState {
    current: number;
    power: number;
    voltage: number;
    lastupdated: string;
}

export interface ZHAPresenceState {
    presence: boolean;
    lastupdated: string;
}

export interface ZHASwitchState {
    buttonevent: number;
    gesture: number;
    eventduration: number;
    x: number;
    y: number;
    angle: number;
    lastupdated: string;
}

export interface ZHAPressureState {
    pressure: number;
    lastupdated: string;
}

export interface ZHATemperatureState {
    temperature: number;
    lastupdated: string;
}

export interface ZHATimeState {
    lastset: string; // Time Type - not clear how this is represented in JSON
    lastupdated: string;
    localtime: string;
    utc: string; // Time Type - not clear how this is represented in JSON
}

export interface ZHAThermostatState {
    on: boolean;
    errorcode: number;
    fanmode: string;
    floortemperature: number;
    heating: boolean;
    mountingmodeactive: boolean;
    temperature: number;
    valve: number;
    windowopen: boolean;
    lastupdated: string;
}

export interface ZHAVibrationState {
    vibration: boolean;
    orientation: [number, number, number];
    tiltangle: number;
    vibrationstrength: number;
    lastupdated: string;
}

export interface ZHAWaterState {
    water: boolean;
    tampered: boolean;
    lastupdated: string;
    lowbattery: boolean;
}


/**
 * Events
 */

export interface DeconzMessage{
    /**
     * The type of the message:
     *  - event - the message holds an event.
     */
    t: string; // type of message ('event')

    /** 
     * The event type of the message:
     *  - added - resource has been added;
     *  - changed - resource attributes have changed;
     *  - deleted - resource has been deleted.
     *  - scene-called - a scene has been recalled.
    */
    e: 'added' | 'changed' | 'deleted' | 'scene-called';

    /**
     * The resource type to which the message belongs:
     *  - groups - message relates to a group resource;
     *  - lights - message relates to a light resource;
     *  - scenes - message relates to a scene under a group resource;
     *  - sensors - message relates to a sensor resource.
     */
    r: 'groups' | 'lights' | 'scenes' | 'sensors';

    /**
     * The id of the resource to which the message relates, e.g. 5 for /sensors/5.
     * Not for scene-called events.
     */
    id?: string;

    /**
     * The uniqueid of the resource to which the message relates, e.g. 00:0d:6f:00:10:65:8a:6e-01-1000.
     * Only for light and sensor resources.
     */
    uniqueid?: string;

    /**
     * The group id of the resource to which the message relates.
     * Only for scene-called events.
     */
    gid?: string;

    /**
     * The scene id of the resource to which the message relates.
     * Only for scene-called events.
     */
    scid?: string;

    /**
     * Depending on the websocketnotifyall setting: a map containing all or only the changed config attributes of a sensor resource.
     * Only for changed events.
     */
    config?: any;

    /**
     * The (new) name of a resource.
     * Only for changed events.
     */
    name?: string;

    /**
     * Depending on the websocketnotifyall setting: a map containing all or only the changed state attributes of a group, light, or sensor resource.
     * Only for changed events.
     */
    state?: Partial<LightsState> | Partial<GroupState> | any;

    /**
     * The full group resource. 
     * Only for added events of a group resource.
     */
    group?: any;

    /**
     * The full light resource.
     * Only for added events of a light resource.
     */
    light?: any;

    /**
     * The full sensor resource.
     * Only for added events of a sensor resource.
     */
    sensor?: any;

    /**
     * undocumented? attributes changed?
     */
    attr: any;
}