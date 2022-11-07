
export type PartialRecurse<T> = {
    [P in keyof T]?: PartialRecurse<T[P]>;
};


// =======================================================
// REDUCERS
// =======================================================


export type StateReducer<T> = (state: T, action: BaseAction) => T;

export type ReducerMap<T> = {
    [P in keyof T]: StateReducer<T[P]>;
}


// =======================================================
// ACTIONS
// =======================================================

export type BaseAction = {
    type: string;
}

export interface TypedAction<T extends string> extends BaseAction {
    readonly type: T;
}

export type Action<T extends string = string, PROPS = any> = TypedAction<T> & { props: PROPS }

export type ActionCreator<T extends string = string, PROPS = any> = (props?: PROPS) => Action<T, PROPS>

export type ActionCreatorTyped<T extends string = string, PROPS = any> = ActionCreator<T, PROPS> & TypedAction<T>