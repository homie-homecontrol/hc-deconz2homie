import axios, { AxiosRequestConfig, Method } from 'axios';

import * as winston from "winston";
import { GroupAction, GroupResource, LightsState, Ressources } from "./deconz.model";

export class DeconzAPI {

    hostname: string;
    port: number;
    token: string;
    secure: boolean

    protected readonly apiUrl: string;
    protected readonly defaultAxiosCfg: AxiosRequestConfig;
    protected readonly log: winston.Logger;


    constructor(hostname: string, port: number, token: string, secure = false) {
        this.log = winston.child({
            type: this.constructor.name,
        });

        this.hostname = hostname;
        this.port = port;
        this.token = token;
        this.secure = secure;
        this.apiUrl = this.makeAPIURL();
        this.defaultAxiosCfg = this.makeDefaultConfig();
    }

    protected makeAPIURL(includeToken: boolean = true) {
        const protocol = this.secure ? 'https' : 'http';
        const base =`${protocol}://${this.hostname}:${this.port}/api`;
        return includeToken ? `${base}/${this.token}/` : base;
    }

    protected makeDefaultConfig(): AxiosRequestConfig {
        return {
            url: this.apiUrl,
            timeout: 3000,
            responseType: 'json',
            timeoutErrorMessage: 'timeout'
        }
    }

    protected getRequestConfig(config: AxiosRequestConfig) {
        return { ...this.defaultAxiosCfg, ...config };
    }


    protected async apiCall(method: Method, path: string, payload: any = null, apiUrl: string = this.apiUrl): Promise<any> {

        const config = this.getRequestConfig({ method: method, url: `${apiUrl}${path}` });
        if (!!payload) {
            config.data = payload
        }
        this.log.debug('Request config: ', config);
        return axios.request(config).then((resp) => resp.data);
    }



    public async checkAPIToken(): Promise<boolean> {
        if (this.token === undefined || this.token === null || this.token === "") {
            return Promise.resolve(false);
        }
        return this.apiCall('GET', '').then(_ => { return true; }).catch(err => { 
            if (axios.isAxiosError(err)){
                if (err.response?.status === 403){
                    return false;
                }
            }
            this.log.error(err.toJSON());
            throw new Error('Unknown error connecting to deCONZ. Please check you configuration.');
        });
    }

    public async requestAPIToken(deviceType: string = 'hc-deconz2homie'): Promise<string> {

        return this.apiCall('POST', '', {
            devicetype: deviceType
        }, this.makeAPIURL(false)).then(response => {
            return response?.[0]?.success?.username;
        });
    }

    public async getRessources(): Promise<Ressources> {
        return this.apiCall('GET', '');
    }

    public async setLightState(id: string, state: Partial<LightsState>) {
        return this.apiCall('PUT', `lights/${id}/state`, state);
    }

    public async setGroupAction(id: string, action: Partial<GroupAction>) {
        return this.apiCall('PUT', `groups/${id}/action`, action);
    }

    public async recallScene(groupId: string, sceneId: string) {
        return this.apiCall('PUT', `groups/${groupId}/scenes/${sceneId}/recall`);
    }

    public async getGroupResource(id: string): Promise<GroupResource> {
        return this.apiCall('GET', `groups/${id}`);
    }

}