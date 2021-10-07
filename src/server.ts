import EventEmitter from 'events';
import express, { Express } from 'express';
import * as http from 'http';
import { ServeResult } from 'esbuild';
import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketEvent } from './types';

interface ServerEvents {
  listen: void;
  connection: WebSocket;
  disconnect: { code: number; reason: string };
}

export class Server extends EventEmitter {
  protected port: number;
  protected host: string;

  protected app: Express = undefined as any;
  protected server: http.Server = undefined as any;
  protected wss: WebSocketServer = undefined as any;

  constructor({ port, host }: { port: number; host: string }) {
    super();
    this.port = port;
    this.host = host;
  }

  listen() {
    this.server.listen(this.port, this.host, () => {
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

  proxy({ host, port }: ServeResult) {
    let server = http.createServer((req, res) => {
      const options = {
        hostname: host,
        port,
        path: req.url,
        method: req.method,
        headers: req.headers,
      };

      const proxyReq = http.request(options, (proxyRes) => {
        if (proxyRes.statusCode === 404) {
          res.writeHead(303, { 'Content-Type': 'text/html' });
          res.end('<h1>Asset not found</h1>');
          return;
        }

        res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      });

      req.pipe(proxyReq, { end: true });
    });

    this.server = server;
    this.wss = new WebSocketServer({ server });
    this.setupWebsockets();
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
