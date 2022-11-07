import { firstValueFrom, map, Observable, switchMap, take } from 'rxjs';
import { store } from '../state';
import { DeconzAPI } from './DeconzAPI';

export * from './colors.func';
export * from './deconz.model';
export * from './DeconzAPI';
export * from './DeconzSocket';

export function getAPI(): Observable<DeconzAPI> {
    return store.state$.pipe(
        map(state => state.settings.deconz),
        map(settings => new DeconzAPI(settings.host, settings.port, settings.apiToken, settings.secure)),
        take(1)
    )
}

export function apiCall<T>(call: (api: DeconzAPI) => Promise<T>): Observable<T> {
    return getAPI().pipe(
        switchMap(api => call(api))
    )

}