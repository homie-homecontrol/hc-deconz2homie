import { asyncScheduler, merge, observeOn, of, queueScheduler, scan, shareReplay, Subject, takeUntil, tap } from "rxjs";
import { createAction } from "./actions";
import { Action, StateReducer} from "./model";


export const STORE_INIT_ACTION = createAction('basic-rx/store-init');

export function createState<T>(initialState: T, reducer: StateReducer<T>) {
    const stopState$ = new Subject<boolean>();

    const stateAction$ = new Subject<Action>();
    const stateAction = (state: Action) => {
        stateAction$.next(state);
    }

    const state$ = merge(
        stateAction$
    ).pipe(
        observeOn(queueScheduler),
        takeUntil(stopState$),
        // tap(action => console.log('Action on state: ', action)),
        scan(reducer, initialState),
        shareReplay(1)
    )

    return {
        stateAction,
        state$,
        stopState$
    }
}

