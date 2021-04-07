import { Debug } from '../../debug';
import { ComcatTransport, ComcatRPCProtocol } from '../../type';
import { blackhole } from '../../util';
import { ComcatTransportDirect } from '../direct';
import { scheduler } from './scheduler';

const debug = new Debug('comcat-transport-direct');

export class ComcatTransportDirectSchedulerProxy implements ComcatTransport {
  public onMessage: (message: ComcatRPCProtocol) => void = blackhole;

  private proxy: ComcatTransportDirect | null;

  public constructor(proxy: ComcatTransportDirect) {
    this.proxy = proxy;
    scheduler.connect(this);
  }

  public connect(): void {
    // Nothing
  }

  public disconnect(): void {
    this.proxy = null;
  }

  public postMessage(message: any): void {
    debug.log(`[loop-back]`, message);

    setTimeout(() => this.proxy?.onMessage(message));
  }
}
