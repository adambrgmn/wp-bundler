import EventEmitter from 'events';
import express from 'express';
import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketEvent } from './types';

interface ServerEvents {
  listen: void;
  connection: WebSocket;
  disconnect: { code: number; reason: string };
}

export class Server extends EventEmitter {
  protected port: number;
  protected app = express();
  protected server = http.createServer(this.app);
  protected wss = new WebSocketServer({ server: this.server });

  constructor(port: number) {
    super();
    this.port = port;
    this.setupWebsockets();
  }

  listen() {
    this.server.listen(this.port, () => {
      this.emit('listen', undefined);
    });
  }

  close() {
    for (let client of this.wss.clients) client.close();
    this.server.close();
  }

  broadcast(event: WebSocketEvent) {
    for (let client of this.wss.clients) {
      client.send(JSON.stringify(event));
    }
  }

  protected setupWebsockets() {
    this.wss.on('connection', (ws) => {
      ws.on('close', (code, reason) => {
        this.emit('disconnect', { code, reason: reason.toString('utf-8') });
      });
      this.emit('connection', ws);
    });
  }

  emit<E extends keyof ServerEvents>(eventName: E, payload: ServerEvents[E]) {
    return super.emit(eventName, payload);
  }

  once<E extends keyof ServerEvents>(eventName: E, listener: (payload: ServerEvents[E]) => any) {
    return super.once(eventName, listener);
  }

  on<E extends keyof ServerEvents>(eventName: E, listener: (payload: ServerEvents[E]) => any) {
    return super.on(eventName, listener);
  }

  addListener<E extends keyof ServerEvents>(eventName: E, listener: (payload: ServerEvents[E]) => any) {
    return super.addListener(eventName, listener);
  }

  off<E extends keyof ServerEvents>(eventName: E, listener: (payload: ServerEvents[E]) => any) {
    return super.off(eventName, listener);
  }

  removeListener<E extends keyof ServerEvents>(eventName: E, listener: (payload: ServerEvents[E]) => any) {
    return super.removeListener(eventName, listener);
  }
}
