import WebSocket from 'ws';
import express from 'express';
import SocketIO from 'socket.io';
import path from 'path';
import http from 'http';

export class Server {
    private web: express.Express;
    private servers: http.Server[] = [];
    private closing: boolean = false;

    private io: SocketIO.Server;

    private document: string = '';

    public constructor() {
        this.web = express();
        this.web.use(
            express.static(path.join(__dirname, '../public'), {maxAge: 0})
        );

        this.io = SocketIO();

        this.io.on('connection', socket => {
            socket.emit('document', {
                data: this.document,
            });
        });
    }

    public async listen(port: number): Promise<void> {
        return new Promise(resolve => {
            const server = this.web.listen(port, resolve);
            this.io.listen(server);
            this.servers.push(server);
        });
    }

    public async stop(): Promise<void> {
        this.closing = true;

        await new Promise(this.io.close.bind(this.io));
        await Promise.all(this.servers.map(server => new Promise<void>((resolve, reject) => {
            server.close(error => {
                error ? reject(error) : resolve();
            });
        })));
    }

    public useStatic(path: string): void {
        this.web.use(
            express.static(path, {maxAge: 0})
        );
    }

    public setDocument(document: string) {
        this.document = document;
        
        this.io.emit('document', {
            data: document,
        });
    }

    public commit(offset: number, length: number, text: string) {
        this.document = this.document.substring(0, offset) + text + this.document.substring(offset + length);
        
        this.io.emit('commit', {
            start: offset,
            length,
            data: text,
        });
    }
}
