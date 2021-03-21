import { ComcatRPCCommand, ComcatRPCProtocal, ComcatTransport } from '../type';

const DEFAULT_TIMEOUT = 1000 * 60;

type DeferedCallback = (data: any) => void;

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
  ) => void = () => {};

  private readonly callbacks: { [ack: number]: DeferedCallback } = {};
  private readonly timeout: number;
  private readonly transport: ComcatTransport;
  private ack: number = -1;

  public constructor(
    transport: ComcatTransport,
    options: ComcatRPCOptions = {}
  ) {
    const { timeout = DEFAULT_TIMEOUT } = options;
    this.timeout = timeout;

    this.transport = transport;
    transport.onMessage = this.onMessage.bind(this);
  }

  // TODO 返回类型
  public call(command: C): Promise<unknown> {
    const ack = ++this.ack;

    const msg: ComcatRPCProtocal = {
      ack,
      type: 'call',
      payload: command,
    };
    this.transport.postMessage(msg);

    if (command.oneshot) {
      return Promise.resolve();
    }

    return Promise.race([
      this.createDeferedPromise(ack),
      this.createTimeoutPromise(),
    ]);
  }

  public close() {
    this.transport.disconnect();
  }

  private createDeferedPromise(ack: number): Promise<unknown> {
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

  private onCall(
    message: ComcatRPCProtocal,
    reply: (msg: ComcatRPCProtocal) => void
  ) {
    const out = (payload: any) => {
      const res: ComcatRPCProtocal = {
        ack: message.ack,
        type: 'reply',
        payload,
      };

      reply(res);
    };

    this.onRemoteCall(message.payload as C, out);
  }

  private onReply(message: ComcatRPCProtocal) {
    const callback = this.popDeferedCallback(message.ack);
    if (!callback) {
      return;
    }

    callback(message.payload);
  }

  private onMessage(message: ComcatRPCProtocal) {
    const reply = (msg: ComcatRPCProtocal) => {
      this.transport.postMessage(msg);
    };

    switch (message.type) {
      case 'call':
        return this.onCall(message, reply);
      case 'reply':
        return this.onReply(message);
      default:
        const _exhaustiveCheck: never = message.type;
        return _exhaustiveCheck;
    }
  }

  private popDeferedCallback(ack: number): DeferedCallback | null {
    const callback = this.callbacks[ack];
    if (!callback) {
      return null;
    }

    delete this.callbacks[ack];
    return callback;
  }
}
