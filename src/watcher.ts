import chokidar from 'chokidar';
import debounce from 'lodash.debounce';

import { BundlerConfig } from './schema';
import { isNotNullable } from './utils/assert';
import { TypedEventEmitter } from './utils/event-emitter';
import { getMetadata } from './utils/read-pkg';

interface WatcherEvents {
  'watcher.change': { files: string[] };
}

export class Watcher extends TypedEventEmitter<WatcherEvents> {
  #config: BundlerConfig;
  #watcher: chokidar.FSWatcher;

  constructor(cwd: string) {
    super();

    let { config } = getMetadata(cwd, __dirname);

    this.#config = config;
    this.#watcher = this.#setupFileWatcher(cwd);
  }

  close() {
    this.#watcher.close();
  }

  #setupFileWatcher(cwd: string) {
    let ignored = [
      'vendor',
      'node_modules',
      '**/*.mo',
      this.#config.outdir,
      this.#config.assetLoader.path,
      this.#config.translations?.pot,
      ...(this.#config.translations?.pos ?? []),
    ].filter(isNotNullable);

    let watcher = chokidar.watch('.', { cwd: cwd, persistent: true, ignored });

    let changed = new Set<string>();

    const emit = debounce(() => {
      this.emit('watcher.change', { files: Array.from(changed) });
      changed.clear();
    }, 500);

    const onFileChange = (path: string) => {
      changed.add(path);
      emit();
    };

    return watcher.on('ready', () => {
      watcher.on('change', onFileChange);
      watcher.on('add', onFileChange);
      watcher.on('unlink', onFileChange);
    });
  }
}
