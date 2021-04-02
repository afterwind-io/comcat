import { blackhole } from '../client/util';
import { ComcatRPCProtocol, ComcatTransport } from '../type';

export class Transport implements ComcatTransport {
  public onMessage: (message: ComcatRPCProtocol) => void = blackhole;

  private port: MessagePort;

  public constructor(port: MessagePort) {
    this.port = port;
    port.onmessage = this.onPortMessage.bind(this);
  }

  public connect() {
    // Do Nothing
  }

  public disconnect() {
    // Do Nothing
  }

  public postMessage(message: any) {
    console.log(`[out]`, message);

    this.port.postMessage(message);
  }

  private onPortMessage(event: MessageEvent<any>) {
    const message = event.data as ComcatRPCProtocol;

    console.log(`[in]`, message);

    this.onMessage(message);
  }
}
