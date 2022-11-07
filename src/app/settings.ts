import { HomieID, isHomieID } from 'node-homie/model';
import { mergeMap } from 'rxjs';
import { onAction, STORE_INIT_ACTION } from '../basic-rx';
import { Globals } from '../globals';
import { store } from '../state';
import { settingsLoadedAction, loadSettingsAction } from '../state/actions';

function getEnvVar(name: string): string | undefined {
    return process.env[`${Globals.SERVICE_NAMESPACE}_${name}`];
}

function stringENVVal(name: string, defval: string): string {
    return getEnvVar(name) || defval;
}

function homieIDENVVal(name: string, defval: HomieID): string {
    const val = getEnvVar(name) || defval;
    if (!isHomieID(val)) {
        throw new Error(`[${val}] is not a valid homie-id`);
    }
    return val;
}

function csvENVVal(name: string, defval: string[]): string[] {
    if (getEnvVar(name)) {
        return process.env[name]!.split(',');
    }
    return defval;
}

function boolENVVal(name: string, defval: boolean): boolean {
    const val = getEnvVar(name);
    if (!val) { return defval; }

    if (val.toLowerCase() === 'true' || val === '1') {
        return true;
    } else if (val.toLowerCase() === 'false' || val === '0') {
        return false;
    } else {
        return defval;
    }

}

function numberENVVal(name: string, defval: number): number {
    const val = getEnvVar(name) || defval;
    const _number: number = (typeof val === 'string') ? parseInt(val, 10) : val;
    return isNaN(_number) ? defval : _number;
}


export function setupSettingsSideEffects() {
    store.addSideEffect(actions$ => actions$.pipe(
        onAction(STORE_INIT_ACTION),
        mergeMap(_ => {
            const settings = {
                controller: {
                    ctrlId: homieIDENVVal(`CTRL_ID`, 'hc-deconz2homie-1'),
                    ctrlName: stringENVVal(`CTRL_NAME`, 'deCONZ to homie interface controller'),
                },
                deconz: {
                    host: stringENVVal(`DECONZ_HOST`, 'localhost'),
                    port: numberENVVal(`DECONZ_PORT`, 80),
                    wsPort: numberENVVal(`DECONZ_WS_PORT`, 8080),
                    secure: boolENVVal(`DECONZ_SECURE`, false),
                    tokenRequestWait: numberENVVal(`DECONZ_TOKEN_REQUEST_WAIT`, 20),
                    apiToken: stringENVVal(`DECONZ_API_TOKEN`, '')
                },
                mqtt: {
                    url: stringENVVal(`MQTT_URL`, ''),
                    username: stringENVVal(`MQTT_USERNAME`, ''),
                    password: stringENVVal(`MQTT_PASSWORD`, ''),
                    topicRoot: stringENVVal(`MQTT_TOPIC_ROOT`, 'homie')
                }
            };

            return [loadSettingsAction({ settings }), settingsLoadedAction()];
        })
    )
    )
}




