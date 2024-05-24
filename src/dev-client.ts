const url = new URL('/esbuild', `http://${window.WP_BUNDLER_HOST}:${window.WP_BUNDLER_PORT}`);

let eventSource = new EventSource(url);
let retry = { count: 0 };

eventSource.addEventListener('open', () => {
  log.info('Dev server connection established');
  retry.count = 0;
});

eventSource.addEventListener('error', () => {
  retry.count += 1;

  if (retry.count > 5) {
    log.error(new Error(`Dev server connection failed. Closing connection.`));
    eventSource.close();
  } else {
    log.error(new Error(`Dev server errored`));
  }
});

eventSource.addEventListener('change', (e: MessageEvent<string>) => {
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

type Payload = { added: string[]; removed: string[]; updated: string[] };

function parseEventPayload(payload: string) {
  try {
    let value = JSON.parse(payload) as Payload;
    if (typeof value === 'object' && value != null) return value;

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
    console.error(error);
  },
};

declare global {
  interface Window {
    WP_BUNDLER_HOST: string;
    WP_BUNDLER_PORT: number;
  }
}
