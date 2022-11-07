import { MQTTConnectOpts } from "node-homie/model"
import { SettingsControllerState, SettingsDeconzState, SettingsState, State, ServiceState } from "./model"
// import { StateReducer, PartialRecurse } from "./reducers"




export const InitialSettingsControllerState: SettingsControllerState = {
    ctrlId: 'hc-deconz2homie-1',
    ctrlName: 'deCONZ to homie interface controller'
}

export const InitialSettingsDeconzState: SettingsDeconzState = {
    host: "localhost",
    port: 80,
    wsPort: 8080,
    secure: false,
    tokenRequestWait: 20,
    apiToken: undefined
}

export const InitialMqttState: MQTTConnectOpts = {
    url: 'mqtt://localhost',
    username: '',
    password: '',
    topicRoot: 'homie'
}

export const InitialSettingsState: SettingsState = {
    controller: InitialSettingsControllerState,
    deconz: InitialSettingsDeconzState,
    mqtt: InitialMqttState
}

export const InitialServiceState: ServiceState = {
    appState: 'init',
    authStatus: "unauthenticated",
}



export const InitialApplicationState: State = {
    service: InitialServiceState,
    settings: InitialSettingsState,
    resources: {
        lights: {},
        groups: {},
        sensors: {}
    }
}





// export function onAppState<T extends State>(states: AppState[]) {
//     return (obs: Observable<T>): Observable<T> => {
//         return obs.pipe(
//             whileAppState(states),
//             distinctUntilKeyChanged('service', (x, y) => x.appState === y.appState)
//         )
//     }
// }

// export function whileAppState<T extends State>(states: AppState[], distinct = false) {
//     return (obs: Observable<T>): Observable<T> => {
//         return obs.pipe(
//             filter(state => states.includes(state.service.appState))
//         )
//     }
// }

// export function onAuthStatus<T extends State>(authStates: AuthStatus[]) {
//     return (obs: Observable<T>): Observable<T> => {
//         return obs.pipe(
//             filter(state => authStates.includes(state.service.authStatus)),
//             distinctUntilKeyChanged('service', (x, y) => x.authStatus === y.authStatus)
//         )
//     }
// }
