const url = new URL('/esbuild', `http://${window.WP_BUNDLER_HOST}:${window.WP_BUNDLER_PORT}`);

setup();

async function setup() {
  let eventSource = new EventSource(url);

  eventSource.addEventListener('open', () => {
    log.info('Dev server connection established');
  });

  eventSource.addEventListener('error', (event) => {
    log.error(new Error(`Dev server errored`));
    console.log(event);
  });

  eventSource.addEventListener('change', (e) => {
    const { added, removed, updated } = parseEventPayload(e.data);

    if (!added.length && !removed.length && updated.length === 1) {
      for (const link of document.getElementsByTagName('link')) {
        const url = new URL(link.href);

        if (url.host === window.location.host && url.pathname === updated[0]) {
          const next = link.cloneNode() as HTMLLinkElement;
          next.href = updated[0] + '?' + Math.random().toString(36).slice(2);
          next.onload = () => link.remove();
          link.parentNode?.insertBefore(next, link.nextSibling);
          return;
        }
      }
    }

    window.location.reload();
  });
}

type Payload = { added: string[]; removed: string[]; updated: string[] };

function parseEventPayload(payload: string) {
  try {
    let value = JSON.parse(payload);
    if (typeof value === 'object' && value != null) return value as Payload;

    throw new Error('Bad data format');
  } catch (error) {
    throw new Error('Could not parse event payload', { cause: error });
  }
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
