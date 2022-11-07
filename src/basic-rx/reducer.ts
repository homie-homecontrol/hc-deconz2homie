import { BaseAction, ActionCreatorTyped, Action, ReducerMap, StateReducer } from "./model";





export function BaseStateReducer<T>(state: T, change: Partial<T>): T {
    if (change === undefined || change === null || state === change) { return state; }

    return {
        ...state,
        ...change
    }
}


export function createRootReducer<T>(reducerMap: ReducerMap<T>): StateReducer<T> {

    return (state: T, action: BaseAction): T => {
        if (action === undefined || action === null) { return state; }
        return Object.keys(state).reduce((currentState, key) => {
            const subState = reducerMap[key](state[key], action);
            if (subState !== state[key]) {
                return { ...currentState, [key]: reducerMap[key](state[key], action) }
            }else{
                return currentState;
            }
        }, state)
    }


}