import {
  ComcatRPCProtocal,
  ComcatTransport,
  ComcatTransportMode,
} from '../type';
import Worker from 'web-worker:../worker/index';

export function getTransport(mode: ComcatTransportMode): ComcatTransport {
  if (mode === 'SharedWorker') {
    return new ComcatTransportSharedWorker();
  }

  throw new Error(`No such transport implement for "${mode}".`);
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
    console.log(`[out]`, message);

    this.worker.port.postMessage(message);
  }

  private onPortMessage(event: MessageEvent<any>) {
    const message = event.data as ComcatRPCProtocal;

    console.log(`[in]`, message);

    this.onMessage(message);
  }
}
