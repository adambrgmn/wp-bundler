import chokidar from 'chokidar';
import debounce from 'lodash.debounce';

import { BundlerConfig } from './schema.js';
import { BundlerOptions } from './types.js';
import { isNotNullable } from './utils/assert.js';
import { TypedEventEmitter } from './utils/event-emitter.js';

interface WatcherEvents {
  'watcher.change': { files: string[] };
}

export class Watcher extends TypedEventEmitter<WatcherEvents> {
  #config: BundlerConfig;
  #watcher: chokidar.FSWatcher;

  constructor({ config, project }: BundlerOptions) {
    super();
    this.#config = config;
    this.#watcher = this.#setupFileWatcher(project.paths.root);
  }

  close() {
    this.#watcher.close();
  }

  #setupFileWatcher(root: string) {
    let ignored = [
      'vendor',
      'node_modules',
      '**/*.mo',
      this.#config.outdir,
      this.#config.assetLoader.path,
      this.#config.translations?.pot,
      ...(this.#config.translations?.pos ?? []),
    ].filter(isNotNullable);

    let watcher = chokidar.watch('.', { cwd: root, persistent: true, ignored });

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
