import { ReducerMap, createStore } from '../basic-rx';
import { State } from './model';
import { ResourcesReducer, ServiceReducer, SettingsReducer } from './reducers';
import { InitialApplicationState } from './state';

export * from './model';
export * from './reducers';
export * from './state';


export const AppActionReducerMap: ReducerMap<State> = {
    service: ServiceReducer,
    settings: SettingsReducer,
    resources: ResourcesReducer,
}

export const store = createStore(InitialApplicationState, AppActionReducerMap);

