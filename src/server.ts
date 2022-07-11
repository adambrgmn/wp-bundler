import chokidar from 'chokidar';
import EventEmitter from 'events';
import * as http from 'http';
import debounce from 'lodash.debounce';
import { WebSocket, WebSocketServer } from 'ws';

import { BundlerConfig } from './schema';
import { WebSocketEvent } from './types';
import { isNotNullable } from './utils/assert';
import { getMetadata } from './utils/read-pkg';

interface ServerEvents {
  'server.listen': void;
  'server.connection': WebSocket;
  'server.disconnect': { code: number; reason: string };
  'watcher.change': { files: string[] };
}

interface ServerOptions {
  port: number;
  host: string;
  cwd: string;
}

export class Server extends EventEmitter {
  private port: number;
  private host: string;
  private cwd: string;

  private config: BundlerConfig = undefined as any;

  private server: http.Server = undefined as any;
  private wss: WebSocketServer = undefined as any;
  private watcher: chokidar.FSWatcher | undefined = undefined;

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

  prepare() {
    let { config } = getMetadata(this.cwd, __dirname);
    this.config = config;

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

  private setupWebsockets() {
    this.wss.on('connection', (ws) => {
      this.emit('server.connection', ws);
      ws.on('close', (code, reason) => {
        this.emit('server.disconnect', { code, reason: reason.toString('utf-8') });
      });
    });
  }

  private setupFileWatcher() {
    let ignored = [
      'vendor',
      'node_modules',
      '**/*.mo',
      this.config.outdir,
      this.config.assetLoader.path,
      this.config.translations?.pot,
      ...(this.config.translations?.pos ?? []),
    ].filter(isNotNullable);

    let watcher = chokidar.watch('.', { cwd: this.cwd, persistent: true, ignored });

    let changed = new Set<string>();
    const emit = debounce(() => {
      this.emit('watcher.change', { files: Array.from(changed) });
      changed.clear();
    }, 500);

    const onFileChange = (path: string) => {
      changed.add(path);
      emit();
    };

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
