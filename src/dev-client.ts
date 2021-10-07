import { WebSocketEvent } from './types';

let url = new URL(`ws://${window.WP_BUNDLER_HOST}:${window.WP_BUNDLER_PORT}`);
const socket = new WebSocket(url);

socket.addEventListener('error', handleError);
socket.addEventListener('close', handleClose);
socket.addEventListener('open', handleOpen);
socket.addEventListener('message', handleMessage);

function handleError(event: Event) {
  log.error(new Error('A socket connection error occured'));
  console.log(event);
}

function handleClose(event: CloseEvent) {
  if (event.wasClean) {
    log.info('Dev server closed and connection lost');
  } else {
    log.error(new Error(`Dev server disconnected unexpectedly: ${event.code} ${event.reason}`));
  }

  log.info('Refresh to try and re-establish connection');
}

function handleOpen() {
  log.info('Dev server connection established');
}

function handleMessage(event: MessageEvent<unknown>) {
  try {
    let data = parseSocketEvent(event);

    switch (data.type) {
      case 'reload':
        log.info('Source code updated, reloading.');
        window.requestIdleCallback(() => {
          socket.close();
          window.location.reload();
        });
        break;

      default:
        log.info(`Unknown event sent with type ${data.type}`);
    }
  } catch (error) {
    log.error(new Error('Could not parse incoming data properly'));
    console.log(event.data);
  }
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
