import {
  ComcatCommands,
  ComcatCommandReplys,
  ComcatPumpMode,
  ComcatTransportMode,
} from '../type';
import { ComcatRPC } from './rpc';
import { getTransport } from './transport';

interface ComcatPumpOptions {
  category: string;
  mode: ComcatPumpMode;
  transport: ComcatTransportMode;
}

export abstract class ComcatPump {
  private readonly category: string;
  private readonly id: number;
  private readonly mode: ComcatPumpMode;
  private readonly rpc: ComcatRPC<ComcatCommands, ComcatCommandReplys>;
  private status: 'idle' | 'pending' | 'working' = 'idle';

  public constructor(options: ComcatPumpOptions) {
    const { category, mode, transport } = options;

    this.category = category;
    this.mode = mode;

    this.rpc = new ComcatRPC(getTransport(transport));
    this.rpc.onRemoteCall = this.onCall.bind(this);

    this.id = Date.now();

    window.addEventListener('unload', this.onDispose.bind(this));
  }

  public async start(): Promise<boolean> {
    if (this.status === 'working') {
      return false;
    }

    try {
      await this.rpc.call({
        name: 'pump_register',
        params: {
          id: this.id,
          mode: this.mode,
          category: this.category,
        },
      });

      const isGranted = await this.rpc.call({
        name: 'pump_open',
        params: {
          id: this.id,
          mode: this.mode,
          category: this.category,
        },
      });
      if (!isGranted) {
        this.status = 'pending';
        return false;
      }

      this.onOpen();

      return true;
    } catch (error) {
      console.error(error);

      return false;
    }
  }

  public stop() {
    this.disconnect();
  }

  protected abstract connect(): void;
  protected abstract disconnect(): void;
  protected abstract dispose(): void;

  protected pump(topic: string, data: any): Promise<boolean> {
    // FIXME 返回类型
    // @ts-ignore
    return this.rpc.call({
      name: 'pump_emit',
      oneshot: true,
      params: { topic, data },
    });
  }

  private onCall(cmd: ComcatCommands, reply: (payload: any) => void) {
    switch (cmd.name) {
      case 'pump_open':
        // FIXME 万一连接失败？
        this.onOpen();
        reply(true);
        break;

      default:
        break;
    }
  }

  private onOpen() {
    this.connect();
    this.status = 'working';

    console.log(`pump "${this.category}" activated.`);
  }

  private onDispose() {
    this.disconnect();
    this.dispose();

    this.rpc.call({
      name: 'pump_close',
      oneshot: true,
      params: { id: this.id, category: this.category },
    });
    this.rpc.close();
  }
}
