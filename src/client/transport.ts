import {
  ComcatRPCProtocal,
  ComcatTransport,
  ComcatTransportMode,
} from '../type';
import Worker from 'web-worker:../worker/index';
import { Debug } from './debug';

const debug = new Debug('comcat-transport');

export function getTransport(mode: ComcatTransportMode): ComcatTransport {
  if (mode === 'SharedWorker') {
    return new ComcatTransportSharedWorker();
  }

  return debug.panic(`No such transport implement for "${mode}".`);
}

export class ComcatTransportSharedWorker implements ComcatTransport {
  public onMessage: (message: ComcatRPCProtocal) => void = () => {};

  private readonly worker: SharedWorker;

  public constructor() {
    this.worker = new Worker();
    this.worker.port.onmessage = this.onPortMessage.bind(this);
  }

  public connect() {
    this.worker.port.start();
  }

  public disconnect() {
    this.worker.port.close();
  }

  public postMessage(message: any) {
    debug.log(`[out]`, message);

    this.worker.port.postMessage(message);
  }

  private onPortMessage(event: MessageEvent<any>) {
    const message = event.data as ComcatRPCProtocal;

    debug.log(`[in]`, message);

    this.onMessage(message);
  }
}
