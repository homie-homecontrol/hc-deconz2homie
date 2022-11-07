import { takeUntil, switchMapTo, tap, map, withLatestFrom, delayWhen, timer, catchError, of, distinctUntilChanged, pairwise, filter, Observable } from "rxjs";
import { apiCall } from "../deconz";
import { Globals } from "../globals";
import { store, AuthStatus } from "../state";
import * as winston from "winston";
import { onAction } from "../basic-rx";
import { settingsLoadedAction, updateAuthStatusAction, loadSettingsAction } from "../state/actions";


const log = winston.child({
    type: 'deconzAuthenticationSE',
});




export function setupAuthenticationSideEffects(onDestroy$: Observable<boolean>) {
    store.addSideEffect(actions$ => actions$.pipe(
        onAction(settingsLoadedAction),
        withLatestFrom(store.select(state => state.settings.deconz)),
        tap(a => { console.log('setupAuthenticationSideEffects: ', a) }),
        map(([a,b])=> a),
        takeUntil(onDestroy$),
        switchMapTo(apiCall(api => api.checkAPIToken())),
        map(result => {
            if (!result) {
                return updateAuthStatusAction({ authStatus: 'failed' });
            } else {
                return updateAuthStatusAction({ authStatus: 'authenticated' });
            }
        })

    )
    );

    // const tokenRequestWait$ = store.state$.pipe(
    //     map(state => state.settings.deconz.tokenRequestWait)
    // )

    // store.addSideEffect(
    //     store.state$.pipe(
    //         takeUntil(onDestroy$),
    //         whileAppState(['settingsLoaded', 'ready']),
    //         onAuthStatus(['failed', 'requestTokenFailed']),
    //         tap(_ => {
    //             store.updateState({ service: {authStatus: 'requestToken' }});
    //         }),
    //         withLatestFrom(tokenRequestWait$),
    //         delayWhen(([_, tokenRequestWait]) => timer(tokenRequestWait * 1000)),
    //         switchMapTo(
    //             apiCall(api => api.requestAPIToken()).pipe(
    //                 map(apiToken => ({ apiToken, authStatus: <AuthStatus>'authenticated' })),
    //                 catchError(err => of({ apiToken: '', authStatus: <AuthStatus>'requestTokenFailed' }))
    //             )),
    //         tap(updates => {
    //             store.updateState({ service: {authStatus: updates.authStatus}, settings: { deconz: { apiToken: updates.apiToken } } });
    //         }),
    //     )
    // )


    // // log user information about authentication workflow
    // store.addSideEffect(
    //     store.state$.pipe(
    //         takeUntil(onDestroy$),
    //         map(state => state.service.authStatus),
    //         distinctUntilChanged(),
    //         tap((authStatus) => {
    //             if (authStatus === 'failed') {
    //                 log.warn(`The provided API token was empty or invalid.`);
    //             } else if (authStatus === 'requestToken') {
    //                 log.warn(`Attempt to request a new token will start in 20 seconds. Please ensure to click on 'Authenticate App' in the deconz web config within this timeframe.`);
    //             } else if (authStatus === 'requestTokenFailed') {
    //                 log.warn(`Error requesting token. Did you click on 'Authenticate App' in the deconz web config site?`);
    //             } else if (authStatus === 'authenticated') {
    //                 log.info(`Successfully authenticated with deconz.`);
    //             }
    //         })
    //     )
    // )

    // // log user information about authentication workflow
    // store.addSideEffect(
    //     store.state$.pipe(
    //         takeUntil(onDestroy$),
    //         map(state => state.service.authStatus),
    //         pairwise(),
    //         filter(([oldAuthStatus, authStatus]) => (oldAuthStatus === 'requestToken' && authStatus === 'authenticated')),
    //         withLatestFrom(store.state$),
    //         tap(([[_, __], state]) => {
    //             log.warn(`Successfully retrieved new token: [${state.settings.deconz.apiToken}]. `);
    //             log.warn(`Please set this via ${Globals.SERVICE_NAMESPACE}_DECONZ_API_TOKEN environment variable before the next start.`);
    //         })
    //     )
    // )

}
