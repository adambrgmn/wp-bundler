import * as http from 'node:http';

import { WebSocket, WebSocketServer } from 'ws';

import { WebSocketEvent } from './types.js';
import { TypedEventEmitter } from './utils/event-emitter.js';

interface ServerEvents {
  'server.listen': void;
  'server.connection': WebSocket;
  'server.disconnect': { code: number; reason: string };
}

interface ServerOptions {
  port: number;
  host: string;
}

export class Server extends TypedEventEmitter<ServerEvents> {
  #port: number;
  #host: string;

  #server: http.Server = undefined as any;
  #wss: WebSocketServer = undefined as any;

  constructor({ port, host }: ServerOptions) {
    super();
    this.#port = port;
    this.#host = host;
  }

  listen() {
    let server = http.createServer();

    this.#server = server;
    this.#wss = new WebSocketServer({ server });

    this.setupWebsockets();

    this.#server.listen(this.#port, this.#host, () => {
      this.emit('server.listen', undefined);
    });
  }

  close() {
    for (let client of this.#wss.clients) {
      client.close();
    }

    this.#wss.close();
    this.#server.close();
  }

  broadcast(event: WebSocketEvent) {
    for (let client of this.#wss.clients) {
      client.send(JSON.stringify(event));
    }
  }

  private setupWebsockets() {
    this.#wss.on('connection', (ws) => {
      this.emit('server.connection', ws);

      ws.on('close', (code, reason) => {
        this.emit('server.disconnect', { code, reason: reason.toString('utf-8') });
      });
    });
  }
}
