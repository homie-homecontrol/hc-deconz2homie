import { BaseStateReducer, StateReducer } from "../basic-rx";
import { isAction } from "../basic-rx/actions";
import { addLightAction, removeLightAction, settingsLoadedAction, updateAppStateAction, updateAuthStatusAction, loadSettingsAction } from "./actions";
import { ResourcesState, ServiceState, SettingsState } from "./model";



export const SettingsReducer: StateReducer<SettingsState> = (state, action) => {
    if (action === undefined || action === null) { return state; }
    if (isAction(action, loadSettingsAction)) {
        return {
            ...state,
            controller: BaseStateReducer(state.controller, action.props.settings.controller),
            deconz: BaseStateReducer(state.deconz, action.props.settings.deconz),
            mqtt: BaseStateReducer(state.mqtt, action.props.settings.mqtt)
        }
    }
    return state;
}

export const ServiceReducer: StateReducer<ServiceState> = (state, action) => {
    if (action === undefined || action === null) { return state; }
    if (isAction(action, updateAppStateAction)) {
        return {
            ...state,
            appState: action.props.appState
        }
    } else if (isAction(action, updateAuthStatusAction)) {
        return {
            ...state,
            authStatus: action.props.authStatus
        }
    }else if (isAction(action, settingsLoadedAction)){
        return {
            ...state,
            appState: 'settingsLoaded'
        }
    }
    return state;
}

export const ResourcesReducer: StateReducer<ResourcesState> = (state, action) => {
    if (action === undefined || action === null) { return state; }
    if (isAction(action, addLightAction)) {
        return state
    } else if (isAction(action, removeLightAction)) {
        return state
    } else if (isAction(action, updateAppStateAction)) {
        return state
    }
    return state;
}
