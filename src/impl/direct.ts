import { ComcatRPCProtocol, ComcatTransport } from '../type';
import { Debug } from '../debug';
import { blackhole } from '../util';
import { ComcatTransportDirectSchedulerProxy } from './direct/proxy';

const debug = new Debug('comcat-transport-direct');

export class ComcatTransportDirect implements ComcatTransport {
  public onMessage: (message: ComcatRPCProtocol) => void = blackhole;

  private proxy: ComcatTransportDirectSchedulerProxy;

  public constructor() {
    this.proxy = new ComcatTransportDirectSchedulerProxy(this);
  }

  public connect(): void {
    // Nothing
  }

  public disconnect(): void {
    // Nothing
  }

  public postMessage(message: any): void {
    debug.log(`[out]`, message);

    this.proxy.onMessage(message);
  }
}
