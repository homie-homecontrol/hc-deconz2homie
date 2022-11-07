import { createAction, props } from "../basic-rx/actions";
import { LightResource } from "../deconz";
import { AppState, AuthStatus, SettingsState } from "./model";


export const loadSettingsAction = createAction('load-settings', props<{settings: SettingsState}>());
export const settingsLoadedAction = createAction('appstate-settings-loaded');

export const updateAppStateAction = createAction('update-appstate', props<{appState: AppState}>());

export const updateAuthStatusAction = createAction('update-authstatus', props<{authStatus: AuthStatus}>());

export const addLightAction = createAction('add-light', props<{ id: string, light: LightResource }>())
export const updateLightAction = createAction('update-light', props<{ id: string, light: LightResource, oldLight?: LightResource }>())
export const removeLightAction = createAction('remove-light', props<{ id: string, light?: LightResource }>())