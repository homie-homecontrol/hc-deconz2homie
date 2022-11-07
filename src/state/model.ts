import { HomieID, MQTTConnectOpts } from "node-homie/model";
import { RessourceMap, LightResource, GroupResource, SensorResource } from "../deconz";

export type AppState = 'init' | 'settingsLoaded' | 'ready';
export type AuthStatus = 'unauthenticated' | 'requestToken' | 'requestTokenFailed' | 'authenticated' | 'failed';

export interface SettingsControllerState {
    ctrlId: HomieID;
    ctrlName: string;
};

export interface SettingsDeconzState {
    host: string;
    port: number;
    wsPort: number;
    secure: boolean;
    tokenRequestWait: number;
    apiToken: string | undefined;
}


export interface SettingsState {
    controller: SettingsControllerState;
    deconz: SettingsDeconzState;
    mqtt: MQTTConnectOpts;
}

export interface ServiceState{
    appState: AppState;
    authStatus: AuthStatus;
}

export interface ResourcesState{
    lights: RessourceMap<LightResource>;
    groups: RessourceMap<GroupResource>;
    sensors: RessourceMap<SensorResource>;
}

export interface State {
    service: ServiceState;
    settings: SettingsState;
    resources: ResourcesState;
}
