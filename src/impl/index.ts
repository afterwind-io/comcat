import { ComcatTransport } from '../type';
import { Debug } from '../debug';
import { global } from '../global';
import { ComcatTransportDirect } from './direct';
import { ComcatTransportSharedWorker } from './worker';

const debug = new Debug('comcat-transport');

export function getTransport(): ComcatTransport {
  if (global.mode === 'default') {
    if (!window.SharedWorker) {
      debug.warn('SharedWorker is not supported. Fall back to direct mode.');
      return new ComcatTransportDirect();
    }

    try {
      return new ComcatTransportSharedWorker();
    } catch (error) {
      console.error(error);

      debug.warn('Failed to construct SharedWorker. Fall back to direct mode.');
      return new ComcatTransportDirect();
    }
  }

  if (global.mode === 'direct') {
    return new ComcatTransportDirect();
  }

  if (global.mode === 'legacy') {
    return debug.panic(`Not implemented.`);
  }

  return debug.panic(`No such mode for "${global.mode}".`);
}
