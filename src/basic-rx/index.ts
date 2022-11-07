import { Subject, take, switchMapTo, merge, observeOn, queueScheduler, takeUntil, Observable, map, asyncScheduler } from 'rxjs';
import { log } from 'winston';
import { Action, ReducerMap } from './model';
import { createRootReducer } from './reducer';
import { createSideEffects } from './sideEffect';
import { createState } from './state';

export * from './model';
export * from './reducer';
export * from './sideEffect';
export * from './state';
export * from './actions';


export function createStore<STATE>(initialApplicationState: STATE, reducerMap: ReducerMap<STATE>) {

    const { stateAction, state$, stopState$ } = createState(initialApplicationState, createRootReducer(reducerMap));
    const { sideEffects$, addSideEffect, actions$, dispatchAction } = createSideEffects();

    const initState$ = new Subject<boolean>();

    // subscribe to the state
    initState$.pipe(
        take(1),
        switchMapTo(state$)
    ).pipe(observeOn(queueScheduler), takeUntil(stopState$)).subscribe({
        next: o => { },
        complete: () => {
            // log.info('Stopped state update subscription.');
        },
        error: err => {
            // log.error('FATAL: State update subscription stopped. Exiting!');
            process.kill(process.pid, 'SIGINT');
        }
    });

    // subscribe to actions
    initState$.pipe(
        take(1),
        switchMapTo(merge(actions$))
    ).pipe(observeOn(queueScheduler), takeUntil(stopState$)).subscribe({
        next: o => {
            if (!!o && Object.prototype.hasOwnProperty.call(o, 'type') && typeof o.type === 'string') {
                // console.log('action -> state forward: ', o);
                const action = o as Action;
                stateAction(action);
                // log.info(`Action: ${action.type}`, { props: action.props })
            }
        },
        complete: () => {
            // log.info('Stopped state update subscription.');
        },
        error: err => {
            // log.error('FATAL: State update subscription stopped. Exiting!');
            process.kill(process.pid, 'SIGINT');
        }
    });



    // subscribe to effects
    initState$.pipe(
        take(1),
        switchMapTo(merge(sideEffects$))
    ).pipe(observeOn(queueScheduler), takeUntil(stopState$)).subscribe({
        next: o => {
            if (!!o && Object.prototype.hasOwnProperty.call(o, 'type') && typeof o.type === 'string') {
                // console.log('side effect source -> action forward: ', o);
                const action = o as Action;
                dispatchAction(action);
                // log.info(`Action: ${action.type}`, { props: action.props })
            }
        },
        complete: () => {
            // log.info('Stopped state update subscription.');
        },
        error: err => {
            // log.error('FATAL: State update subscription stopped. Exiting!');
            process.kill(process.pid, 'SIGINT');
        }
    });


    function initState() {
        initState$.next(true);
    }

    function stopState() {
        stopState$.next(true);
    }

    function select<T>(project: (state: STATE) => T): Observable<T> {
        return state$.pipe(map(project));
    }

    return {
        initState,
        state$,
        select,
        stopState$: stopState$.asObservable(),
        addSideEffect,
        dispatchAction,
        stopState,
    }




}


