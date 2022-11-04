import { Observable, Observer } from "rxjs";
import WebSocket from "ws";
import { DeconzMessage } from "./deconz.model";


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

