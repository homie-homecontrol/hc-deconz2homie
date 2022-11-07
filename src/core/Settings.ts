import { HomieID, isHomieID, MQTTConnectOpts } from 'node-homie/model';
import { Globals } from '../globals';

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






export class Settings {

    mqttOpts: MQTTConnectOpts;

    constructor(

        public controller_id = homieIDENVVal(`CTRL_ID`, 'hc-deconz2homie-1'),
        public controller_name = stringENVVal(`CTRL_NAME`, 'deCONZ to homie interface controller'),

        public deconz_secure = boolENVVal(`DECONZ_SECURE`, false),
        public deconz_host = stringENVVal(`DECONZ_HOST`, 'localhost'),
        public deconz_port = numberENVVal(`DECONZ_PORT`, 80),
        public deconz_ws_port = numberENVVal(`DECONZ_WS_PORT`, 443),
        public deconz_api_token = stringENVVal(`DECONZ_API_TOKEN`, ''),
        public mqtt_url = stringENVVal(`MQTT_URL`, ''),
        public mqtt_user = stringENVVal(`MQTT_USERNAME`, ''),
        public mqtt_password = stringENVVal(`MQTT_PASSWORD`, ''),
        public mqtt_topic_root = stringENVVal(`MQTT_TOPIC_ROOT`, 'homie')

    ) {

        this.mqttOpts = {
            url: this.mqtt_url,
            username: this.mqtt_user,
            password: this.mqtt_password,
            topicRoot: this.mqtt_topic_root
        }
    }

}
