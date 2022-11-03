import { Observable, Observer } from "rxjs";
import { EventEmitter } from "ws";
import WebSocket = require('ws');
import { DeconzMessage } from "./DeconzEvents";





export interface DeconzWebSocketOptions {
    hostname: string;
    port: number;
    token: string;
    secure?: boolean;
    pingInterval?: number;
    pingTimeout?: number;
    reconnectInterval?: number;
    reconnectMaxRetries?: number;
    autoConnect?: boolean;
    openObserver?: Observer<void>;
    closeObserver?: Observer<{code: number, reason: string, shouldClose: boolean}>;

}

const defaultWebSocketOptions = <DeconzWebSocketOptions>{
    hostname: "",
    port: 1883,
    token: "",
    secure: false,
    pingInterval: 10000,
    pingTimeout: 3000,
    reconnectInterval: 10000,
    reconnectMaxRetries: Infinity,
    autoConnect: true
}


export function DeconzWebSocket(wsOptions: DeconzWebSocketOptions) {

    return new Observable<DeconzMessage>(subscriber => {
        let awaitPong = null;
        let pinger = null;
        let shouldClose = false;
        const options = { ...defaultWebSocketOptions, ...wsOptions };
    
        const makeAddress = (): string => {
            const protocol = options.secure ? 'wss' : 'ws';
            const address=`${protocol}://${options.hostname}:${options.port}`
            return address;
        }

        const isReady = (socket: WebSocket) => {
            return socket && socket.readyState === WebSocket.OPEN && !shouldClose;
        }

        const onPing = (socket: WebSocket) => {
            if (isReady(socket)) {
                socket.pong('pong');
            }
        }

        const onPong = (socket: WebSocket) => {
            if (awaitPong) {
                clearTimeout(awaitPong);
            }
            pinger = setTimeout(() => {
                ping(socket);
            }, options.pingInterval);
        }

        const onOpen = (socket: WebSocket) => {
            if (options.openObserver){
                options.openObserver.next();
            }
            ping(socket);
        }

        const ping = (socket: WebSocket) => {
            if (isReady(socket)) {
                socket.ping('ping');
                awaitPong = setTimeout(() => {
                    subscriber.error(new Error('Timeout'));
                    socket.terminate();
                }, options.pingTimeout);
            }
        }

        const error = (socket: WebSocket, err: Error) => {
            subscriber.error(err);
            try {
                socket.close();
            } catch { }
        }

        const onClose = (code, reason) => {
            if (pinger) {
                clearTimeout(pinger);
                pinger = null;
            }

            if (awaitPong) {
                clearTimeout(awaitPong);
                awaitPong = null;
            }

            if (options.closeObserver){
                options.closeObserver.next({code, reason, shouldClose});
            }

            if (shouldClose) {
                subscriber.complete();
            } else {
                subscriber.error(new Error(`Unexpected websocket close. Code: [${code}], Reason: [${reason}]`));
            }
        }

        const onMessage = (msg) => {
            try {
                subscriber.next(<DeconzMessage>JSON.parse(msg));
            } catch (err) {
                // message parsing errors are ignored
            }
        }

        try {

            const socket = new WebSocket(makeAddress());
            subscriber.add(() => {
                if (socket) {
                    try {
                        shouldClose = true;
                        socket.close();
                    } catch (err) {
                    }
                }
            })


            socket.on('open', () => onOpen(socket));
            socket.on('ping', data => onPing(socket));
            socket.on('pong', data => onPong(socket));
            socket.on('message', data => onMessage(data));
            socket.on('error', err => { error(socket, err) });
            socket.on('close', (code, reason) => onClose(code, reason));



        } catch (err) {
            this.onClose();
            subscriber.error(err);
        }
    })

}







export interface IDeconzSockerOptions {
    secure?: boolean;
    pingInterval?: number;
    pingTimeout?: number;
    reconnectInterval?: number;
    reconnectMaxRetries?: number;
    autoConnect?: boolean;
}

const defaultOptions = <IDeconzSockerOptions>{
    secure: false,
    pingInterval: 10000,
    pingTimeout: 3000,
    reconnectInterval: 10000,
    reconnectMaxRetries: Infinity,
    autoConnect: true
}





export class DeconzSocket extends EventEmitter {
    hostname: string;
    port: number;
    token: string;
    options: IDeconzSockerOptions;

    socket: WebSocket;

    retries = 0;
    shouldClose = false;

    awaitPong = null;
    pinger = null;

    constructor(hostname: string, port: number, token: string, options: IDeconzSockerOptions = defaultOptions) {
        super();
        this.hostname = hostname;
        this.port = port;
        this.token = token;
        this.options = { ...defaultOptions, ...options };

        if (this.options.autoConnect) {
            this.connect();
        }
    }

    public connect() {
        if (this.retries++ >= this.options.reconnectMaxRetries) {
            this.emit('reconnect-max-retries', this.options.reconnectMaxRetries);
        }

        try {
            this.socket = new WebSocket(this.makeAddress());
        } catch (err) {
            this.onClose(err, null);
            throw err;
        }

        this.socket.on('open', () => this.onOpen());
        this.socket.on('ping', data => this.onPing());
        this.socket.on('pong', data => this.onPong());
        this.socket.on('message', data => this.onMessage(data));
        this.socket.on('error', err => this.onError(err));
        this.socket.on('unexpected-response', (req, res) => this.onUnexpectedResponse(req, res));
        this.socket.on('close', (code, reason) => this.onClose(code, reason));
    }


    protected makeAddress() {
        const protocol = this.options.secure ? 'wss' : 'ws';
        return `${protocol}://${this.hostname}:${this.port}`;
    }



    public close() {
        this.shouldClose = true;
        this.socket.close();
        this.socket = null;
    }

    parseData(data) {
        try {
            return JSON.parse(data);
        } catch (err) {
            return this.emit('error', err);
        }
    }

    get isReady() {
        return this.socket && this.socket.readyState === WebSocket.OPEN && !this.shouldClose;
    }

    ping() {
        if (this.isReady) {
            this.socket.ping('ping');
            this.awaitPong = setTimeout(() => {
                this.emit('pong-timeout');
                this.socket.terminate();
            }, this.options.pingTimeout);
        }
    }

    onOpen() {
        this.retries = 0;
        this.emit('open');
        this.ping();
    }

    onClose(code, reason) {
        if (this.pinger) {
            clearTimeout(this.pinger);
            this.pinger = null;
        }

        if (this.awaitPong) {
            clearTimeout(this.awaitPong);
            this.awaitPong = null;
        }

        if (!this.shouldClose) {
            setTimeout(() => this.connect(), this.options.reconnectInterval);
        } else {
            this.emit('close', code, reason);
        }
    }

    onPing() {
        if (this.isReady) {
            this.socket.pong('pong');
        }
    }

    onPong() {
        if (this.awaitPong) {
            clearTimeout(this.awaitPong);
        }

        this.pinger = setTimeout(this.ping.bind(this), this.options.pingInterval);
        this.emit('pong');
    }

    onMessage(data) {
        const payload = this.parseData(data);
        if (payload) {
            this.emit('message', payload);
        }
    }

    onUnexpectedResponse(req, res) {
        if (res && res.statusCode == 401) {
            return this.emit('unauthorized'), req, res;
        }

        return this.emit('unexpected-response', req, res);
    }

    onError(err) {
        this.emit('error', err);
    }

}