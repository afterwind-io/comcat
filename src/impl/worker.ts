import InlineWorker from 'web-worker:./worker/index';
import { ComcatTransport, ComcatRPCProtocol } from '../type';
import { Debug } from '../debug';
import { blackhole } from '../util';

const debug = new Debug('comcat-transport-worker');

export class ComcatTransportSharedWorker implements ComcatTransport {
  public onMessage: (message: ComcatRPCProtocol) => void = blackhole;

  private worker: SharedWorker | null;

  public constructor() {
    this.worker = new InlineWorker();
    this.worker.port.onmessage = this.onPortMessage.bind(this);
  }

  public connect() {
    this.worker?.port.start();
  }

  public disconnect() {
    this.onMessage = blackhole;

    this.worker?.port.close();
    this.worker = null;
  }

  public postMessage(message: any) {
    debug.log(`[out]`, message);

    this.worker?.port.postMessage(message);
  }

  private onPortMessage(event: MessageEvent<any>) {
    const message = event.data as ComcatRPCProtocol;

    debug.log(`[in]`, message);

    this.onMessage(message);
  }
}
