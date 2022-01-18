import { EventEmitter } from "ws";
import { DeconzSocket, IDeconzSockerOptions } from "./DeconzSocket";
import * as http from 'http';
import { GroupState, LightsState } from "./deconz.model";

export interface DeconzMessage{
    /**
     * The type of the message:
     *  - event - the message holds an event.
     */
    t: string; // type of message ('event')

    /** 
     * The event type of the message:
     *  - added - resource has been added;
     *  - changed - resource attributes have changed;
     *  - deleted - resource has been deleted.
     *  - scene-called - a scene has been recalled.
    */
    e: 'added' | 'changed' | 'deleted' | 'scene-called';

    /**
     * The resource type to which the message belongs:
     *  - groups - message relates to a group resource;
     *  - lights - message relates to a light resource;
     *  - scenes - message relates to a scene under a group resource;
     *  - sensors - message relates to a sensor resource.
     */
    r: 'groups' | 'lights' | 'scenes' | 'sensors';

    /**
     * The id of the resource to which the message relates, e.g. 5 for /sensors/5.
     * Not for scene-called events.
     */
    id?: string;

    /**
     * The uniqueid of the resource to which the message relates, e.g. 00:0d:6f:00:10:65:8a:6e-01-1000.
     * Only for light and sensor resources.
     */
    uniqueid?: string;

    /**
     * The group id of the resource to which the message relates.
     * Only for scene-called events.
     */
    gid?: string;

    /**
     * The scene id of the resource to which the message relates.
     * Only for scene-called events.
     */
    scid?: string;

    /**
     * Depending on the websocketnotifyall setting: a map containing all or only the changed config attributes of a sensor resource.
     * Only for changed events.
     */
    config?: any;

    /**
     * The (new) name of a resource.
     * Only for changed events.
     */
    name?: string;

    /**
     * Depending on the websocketnotifyall setting: a map containing all or only the changed state attributes of a group, light, or sensor resource.
     * Only for changed events.
     */
    state?: Partial<LightsState> | Partial<GroupState> | any;

    /**
     * The full group resource. 
     * Only for added events of a group resource.
     */
    group?: any;

    /**
     * The full light resource.
     * Only for added events of a light resource.
     */
    light?: any;

    /**
     * The full sensor resource.
     * Only for added events of a sensor resource.
     */
    sensor?: any;

    /**
     * undocumented? attributes changed?
     */
    attr: any;
}

export declare interface DeconzEvents {
    on(event: 'open', cb: () => void): this;
    on(event: 'close', cb: (code: number, reason: string) => void): this;
    on(event: 'error', cb: (error: Error) => void): this;
    on(event: 'unexpected-response', cb: (req:http.ClientRequest, res:http.IncomingMessage) => void): this;

    on(event: 'event', cb: (event: DeconzMessage) => void): this;

    on(event: 'event-state', cb: (event: DeconzMessage) => void): this;
    on(event: 'event-state-lights', cb: (event: DeconzMessage) => void): this;
    on(event: 'event-state-groups', cb: (event: DeconzMessage) => void): this;
    on(event: 'event-state-sensors', cb: (event: DeconzMessage) => void): this;

    on(event: 'event-scene-called', cb: (event: DeconzMessage) => void): this;

    on(event: 'event-attr', cb: (event: DeconzMessage) => void): this;
    on(event: 'event-attr-lights', cb: (event: DeconzMessage) => void): this;
    on(event: 'event-attr-groups', cb: (event: DeconzMessage) => void): this;
    on(event: 'event-attr-sensors', cb: (event: DeconzMessage) => void): this;

    on(event: 'event-added', cb: (event: DeconzMessage) => void): this;
    on(event: 'event-added-lights', cb: (event: DeconzMessage) => void): this;
    on(event: 'event-added-groups', cb: (event: DeconzMessage) => void): this;
    on(event: 'event-added-sensors', cb: (event: DeconzMessage) => void): this;

    on(event: 'event-deleted', cb: (event: DeconzMessage) => void): this;
    on(event: 'event-deleted-lights', cb: (event: DeconzMessage) => void): this;
    on(event: 'event-deleted-groups', cb: (event: DeconzMessage) => void): this;
    on(event: 'event-deleted-sensors', cb: (event: DeconzMessage) => void): this;
}


export class DeconzEvents extends EventEmitter {

    private socket: DeconzSocket;

    constructor(hostname: string, port: number, token: string, options: IDeconzSockerOptions = null) {
        super();
        this.socket = new DeconzSocket(hostname, port, token, options);

        this.socket.on('open', () => this.onOpen());
        this.socket.on('message', data => this.onMessage(data));
        this.socket.on('error', err => this.onError(err));
        this.socket.on('unexpected-response', (req, res) => this.onUnexpectedResponse(req, res));
        this.socket.on('close', (code, reason) => this.onClose(code, reason));
    }


    public connect() {
        this.socket.connect();
    }


    onOpen() {
        this.emit('open');
    }

    onClose(code: number, reason: string) {
        this.emit('close', code, reason);
    }


    onMessage(data: DeconzMessage) {
        if (!data || data?.t !== 'event') { return; }

        if (data?.e === 'changed' && data?.state){
            this.emit('event-state', data);
            this.emit(`event-state-${data.r}`, data);
        }else if (data?.e === 'changed' && data?.attr){
            this.emit('event-attr', data);
            this.emit(`event-attr-${data.r}`, data);
        }else if (data.e === 'scene-called'){
            this.emit('event-scene-called', data);
        }else if (data.e === 'added'){
            this.emit('event-added', data);
            this.emit(`event-added-${data.r}`, data);
        }else if (data.e === 'deleted'){
            this.emit('event-deleted', data);
            this.emit(`event-deleted-${data.r}`, data);
        }
        this.emit('event', data);
        

    }

    onUnexpectedResponse(req:http.ClientRequest, res:http.IncomingMessage) {
        return this.emit('unexpected-response', req, res);
    }

    onError(err) {
        this.emit('error', err);
    }

    public close() {
        this.socket.close();
    }
}