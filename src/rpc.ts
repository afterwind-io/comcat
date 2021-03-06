import { ComcatRPCCommand, ComcatRPCProtocol, ComcatTransport } from './type';
import { blackhole } from './util';

const DEFAULT_TIMEOUT = 1000 * 60;

type DeferredCallback = (data: any) => void;

interface ComcatRPCOptions {
  timeout?: number;
}

export class ComcatRPC<
  C extends ComcatRPCCommand,
  R extends { [key in C['name']]: any }
> {
  public onRemoteCall: (
    msg: C,
    reply: (payload: any) => void
  ) => void = blackhole;

  private readonly timeout: number;
  private readonly transport: ComcatTransport;
  private callbacks: { [ack: number]: DeferredCallback } = {};
  private ack: number = -1;

  public constructor(
    transport: ComcatTransport,
    options: ComcatRPCOptions = {}
  ) {
    const { timeout = DEFAULT_TIMEOUT } = options;
    this.timeout = timeout;

    this.transport = transport;
    transport.onMessage = this.onMessage.bind(this);
    transport.connect();
  }

  public call<CC extends C>(command: CC): Promise<R[CC['name']]> {
    const ack = ++this.ack;

    const msg: ComcatRPCProtocol = {
      ack,
      type: 'call',
      payload: command,
    };
    this.transport.postMessage(msg);

    if (command.oneshot) {
      return Promise.resolve() as Promise<never>;
    }

    return Promise.race([
      this.createDeferredPromise(ack),
      this.createTimeoutPromise(),
    ]) as Promise<any>;
  }

  public close() {
    this.onRemoteCall = blackhole;
    this.callbacks = {};

    this.transport.disconnect();
  }

  private createDeferredPromise(ack: number): Promise<unknown> {
    return new Promise((resolve) => {
      this.callbacks[ack] = resolve;
    });
  }

  private createTimeoutPromise(): Promise<string> {
    return new Promise((_, reject) => {
      // FIXME 如何终止？
      setTimeout(() => {
        reject('rpc timeout');
      }, this.timeout);
    });
  }

  private onCall(message: ComcatRPCProtocol) {
    const reply = (payload: any) => {
      const msg: ComcatRPCProtocol = {
        ack: message.ack,
        type: 'reply',
        payload,
      };

      this.transport.postMessage(msg);
    };

    this.onRemoteCall(message.payload as C, reply);
  }

  private onReply(message: ComcatRPCProtocol) {
    const callback = this.popDeferredCallback(message.ack);
    if (!callback) {
      return;
    }

    callback(message.payload);
  }

  private onMessage(message: ComcatRPCProtocol) {
    switch (message.type) {
      case 'call':
        return this.onCall(message);
      case 'reply':
        return this.onReply(message);
      default:
        const _exhaustiveCheck: never = message.type;
        return _exhaustiveCheck;
    }
  }

  private popDeferredCallback(ack: number): DeferredCallback | null {
    const callback = this.callbacks[ack];
    if (!callback) {
      return null;
    }

    delete this.callbacks[ack];
    return callback;
  }
}
