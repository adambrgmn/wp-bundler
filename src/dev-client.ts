import { WebSocketEvent } from './types';

let url = new URL(`ws://${window.WP_BUNDLER_HOST}:${window.WP_BUNDLER_PORT}`);
setup();

function setup() {
  const socket = new WebSocket(url);

  socket.addEventListener('close', handleClose);
  socket.addEventListener('open', handleOpen);
  socket.addEventListener('message', handleMessage);

  function handleClose(event: CloseEvent) {
    if (event.wasClean) {
      log.info('Dev server closed and connection lost');
    } else {
      log.error(new Error(`Dev server disconnected: ${event.code} ${event.reason}`));
    }

    log.info('Retrying in five seconds');
    setTimeout(setup, 5000);
  }

  function handleOpen() {
    log.info('Dev server connection established');
  }

  function handleMessage(event: MessageEvent<unknown>) {
    try {
      let data = parseSocketEvent(event);

      switch (data.type) {
        case 'reload':
          if (isCssOnlyChange(data.files)) {
            log.info('Styles updated, refreshing.');
            window.requestIdleCallback(reloadCss);
          } else {
            log.info('Source code updated, reloading.');
            window.requestIdleCallback(reloadWindow);
          }
          break;

        default:
          log.info(`Unknown event sent with type ${data.type}`);
      }
    } catch (error) {
      log.error(new Error('Could not parse incoming data from socket'));
    }
  }

  function reloadWindow() {
    socket.close();
    window.location.reload();
  }

  function reloadCss() {
    let linkElements = Array.from(document.querySelectorAll('link')).filter((link) =>
      link.id.startsWith('wp-bundler.'),
    );
    for (let link of linkElements) {
      let clone = link.cloneNode();
      link.replaceWith(clone);
    }
  }
}

function isCssOnlyChange(files: string[]) {
  return files.every((e) => e.endsWith('.css'));
}

function parseSocketEvent(event: MessageEvent<unknown>): WebSocketEvent {
  if (typeof event.data !== 'string') throw new Error('Websocket data not passed as string');
  let data = JSON.parse(event.data);
  if (typeof data === 'object' && data != null && 'type' in data) {
    return data;
  }

  throw new Error('Invalid message data');
}

const log = {
  info(message: string) {
    console.log(`[wp-bundler]: ${message}`);
  },
  error(error: unknown) {
    console.error(`[wp-bundler]: An error occured`);
    console.error(error);
  },
};

declare global {
  interface Window {
    WP_BUNDLER_HOST: string;
    WP_BUNDLER_PORT: number;
  }
}
