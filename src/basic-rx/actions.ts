import { Observable, filter, map } from "rxjs";
import { Action, ActionCreator, ActionCreatorTyped, BaseAction, TypedAction } from "./model"

export function createAction<T extends string, PROPS>(type: T, propsType?: PROPS): ActionCreatorTyped<T, PROPS> {
    const creator = (props?: PROPS): TypedAction<T> & { props: PROPS } => {
        return {
            type,
            props
        }
    }
    return applyActionType(type, creator) as ActionCreatorTyped<T, PROPS> ;
}

export function props<PROPS>(): PROPS{
    return {} as PROPS;
}

function applyActionType<T extends string>(type: T, actionCreator: ActionCreator): ActionCreatorTyped {
    return Object.defineProperty(actionCreator, 'type', { value: type, writable: false }) as ActionCreatorTyped<T>;
}

export function isAction<T2 extends string, PROPS2>(action: BaseAction, actionCreator: ActionCreatorTyped<T2, PROPS2>): action is Action<T2, PROPS2> {
    return action.type === actionCreator.type;
}

export function onAction<A extends BaseAction, T extends string, PROPS>(actionType: ActionCreatorTyped<T, PROPS> | ActionCreatorTyped<T, PROPS>[]) {
    return (obs: Observable<A>): Observable<Action<T, PROPS>> => {
        return obs.pipe(
           filter(action => {
            if (Array.isArray(actionType)){
                return actionType.some(at => isAction(action, at))
            }else{
                return isAction(action, actionType);
            }
           }),
           map(action => action as unknown as Action<T, PROPS>)
        )
    }
}

