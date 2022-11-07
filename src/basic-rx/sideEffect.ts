import { Observable, catchError, of, BehaviorSubject, switchMap, merge, Subject, ignoreElements, filter, map } from "rxjs";
import { isAction } from "./actions";
import { Action, ActionCreatorTyped, BaseAction } from "./model";
import { STORE_INIT_ACTION } from "./state";



export function createSideEffects() {
    const _actions$ = new BehaviorSubject<BaseAction>(STORE_INIT_ACTION());
    const actions$ = _actions$.asObservable();
    const _effects$ = new BehaviorSubject<Observable<BaseAction>[]>([]);

    const dispatchAction = (action: BaseAction) => {
        _actions$.next(action);
    }

    const addSideEffect = (effectCreator: (actions: Observable<BaseAction>) => Observable<BaseAction>, dispatch: boolean = true) => {
        const obs = effectCreator(actions$);
        const obsErrorHandled = obs.pipe(
            catchError((error) => {
                console.error('Error in State Effects subscription!', error);
                return of(<BaseAction>{}).pipe(ignoreElements());
            })
        )

        const finalObs = dispatch ? obsErrorHandled : obsErrorHandled.pipe(ignoreElements());

        _effects$.next([..._effects$.value, finalObs]);
        return finalObs;
    }

    return {
        sideEffects$: _effects$.asObservable().pipe(switchMap(effects => merge(...effects))),
        addSideEffect,
        actions$,
        dispatchAction
    }

}
