// import { takeUntil, switchMapTo, interval, shareReplay, map, withLatestFrom, Observable, tap, concat } from "rxjs";
// import { apiCall, RessourceMap, LightResource } from "../deconz";
// import { store, onAuthStatus } from "../state";
// import { addLightAction, removeLightAction, updateLightAction } from "../state/actions";


// export interface DataMap<T> {
//     [id: string]: T
// }

// export function setupResourceUpdateSideEffects(onDestroy$: Observable<boolean>) {
//     const pollResources$ = store.state$.pipe(
//         onAuthStatus(['authenticated']),
//         tap(v => {
//             console.log('starting resource polling');

//         }),
//         takeUntil(onDestroy$),
//         switchMapTo(
//             concat(
//                 apiCall(api => api.getRessources()),
//                 interval(120 * 1000).pipe(
//                     switchMapTo(apiCall(api => api.getRessources())),
//                 )
//             )
//         ),
//         shareReplay(1)
//     )


//     const updateLights$ = pollResources$.pipe(
//         map(resources => resources.lights as RessourceMap<LightResource>),
//         withLatestFrom(store.state$.pipe(map(state => state.resources.lights))),
//         map(([lights, currentStateLights]) => {
//             const { addedKeys, updatedKeys, removedKeys } = mapDelta(currentStateLights, lights, (l1, l2) => { return l1.etag === l2.etag });
//             addedKeys.forEach(id => {
//                 const light = lights[id];
//                 store.dispatchAction(addLightAction({ id, light }));
//             });
//             updatedKeys.forEach(id => {
//                 const light = lights[id];
//                 store.dispatchAction(updateLightAction({ id, light }));
//             })
//             removedKeys.forEach(id => {
//                 const light = currentStateLights[id];
//                 store.dispatchAction(removeLightAction({ id, light }));
//             })
//         })
//     )
//     store.addSideEffect(updateLights$);
// }



// function mapDelta<R extends DataMap<T>, T = R[keyof R]>(dataMap1: R, dataMap2: R, compare: (obj1: T, obj2: T) => boolean = (obj1, obj2) => obj1 === obj2) {
//     const keysMap1 = Object.keys(dataMap1);
//     const keysMap2 = Object.keys(dataMap2);

//     const addedKeys: string[] = [];
//     const updatedKeys: string[] = [];
//     const removedKeys: string[] = [];

//     // iterate through dataMap1 and identify all objs that have been removed or updated
//     for (let i = 0; i < keysMap1.length; i++) {
//         const keyMap1 = keysMap1[i];
//         if (Object.prototype.hasOwnProperty.call(dataMap2, keyMap1)) {
//             const obj1 = dataMap1[keyMap1];
//             const obj2 = dataMap2[keyMap1];
//             if (compare(obj1, obj2)) {
//                 updatedKeys.push(keyMap1);
//             }
//         } else {
//             removedKeys.push(keyMap1);
//         }
//     }

//     // iterate through dataMap2 and identify all objs that have been added
//     for (let i = 0; i < keysMap2.length; i++) {
//         const keyMap2 = keysMap2[i];
//         if (!Object.prototype.hasOwnProperty.call(dataMap1, keyMap2)) {
//             addedKeys.push(keyMap2);
//         }
//     }

//     return { addedKeys, updatedKeys, removedKeys }
// }
