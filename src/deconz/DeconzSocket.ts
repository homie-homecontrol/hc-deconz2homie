import { EventEmitter } from "ws";
import WebSocket = require('ws');

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

        if (this.options.autoConnect){
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