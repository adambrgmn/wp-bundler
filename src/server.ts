import EventEmitter from 'events';
import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import chokidar from 'chokidar';
import debounce from 'lodash.debounce';
import { WebSocketEvent } from './types';

interface ServerEvents {
  'server.listen': void;
  'server.connection': WebSocket;
  'server.disconnect': { code: number; reason: string };
  'watcher.change': { path: string };
}

interface ServerOptions {
  port: number;
  host: string;
  cwd: string;
}

export class Server extends EventEmitter {
  protected port: number;
  protected host: string;
  protected cwd: string;

  protected server: http.Server = undefined as any;
  protected wss: WebSocketServer = undefined as any;
  protected watcher: chokidar.FSWatcher | undefined = undefined;

  constructor({ port, host, cwd }: ServerOptions) {
    super();
    this.port = port;
    this.host = host;
    this.cwd = cwd;
  }

  listen() {
    this.server.listen(this.port, this.host, () => {
      this.emit('server.listen', undefined);
    });
  }

  async prepare() {
    let server = http.createServer();

    this.server = server;
    this.wss = new WebSocketServer({ server });

    this.setupWebsockets();
    this.setupFileWatcher();
  }

  close() {
    this.watcher?.close();

    for (let client of this.wss.clients) client.close();
    this.wss.close();

    this.server.close();
  }

  broadcast(event: WebSocketEvent) {
    for (let client of this.wss.clients) {
      client.send(JSON.stringify(event));
    }
  }

  protected setupWebsockets() {
    this.wss.on('connection', (ws) => {
      this.emit('server.connection', ws);
      ws.on('close', (code, reason) => {
        this.emit('server.disconnect', { code, reason: reason.toString('utf-8') });
      });
    });
  }

  protected setupFileWatcher() {
    let watcher = chokidar.watch('.', {
      cwd: this.cwd,
      persistent: true,
      ignored: /(vendor|node_modules|dist|\.mo$|\.pot?$)/,
    });

    const onFileChange = debounce((path: string) => {
      this.emit('watcher.change', { path });
    }, 500);

    watcher.on('ready', () => {
      watcher.on('change', onFileChange);
      watcher.on('add', onFileChange);
      watcher.on('unlink', onFileChange);
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
