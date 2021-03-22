export declare type ComcatTransportMode = 'SharedWorker';

interface ComcatPipeOptions {
  topic: string | RegExp;
  transport: ComcatTransportMode;
}

export declare abstract class ComcatPipe {
  private readonly id;
  private readonly rpc;
  private readonly topic;
  private status;
  constructor(options: ComcatPipeOptions);
  start(): Promise<boolean>;
  protected abstract dispose(): void;
  protected abstract onMessage(topic: string, data: unknown): void;
  private onCall;
  private onDispose;
  private onReceive;
}

export declare type ComcatPumpMode = 'standalone' | 'unique';

interface ComcatPumpOptions {
  category: string;
  mode: ComcatPumpMode;
  transport: ComcatTransportMode;
}

export declare abstract class ComcatPump {
  private readonly category;
  private readonly id;
  private readonly mode;
  private readonly rpc;
  private status;
  constructor(options: ComcatPumpOptions);
  start(): Promise<boolean>;
  stop(): void;
  protected abstract connect(): void;
  protected abstract disconnect(): void;
  protected abstract dispose(): void;
  protected pump(topic: string, data: any): Promise<boolean>;
  private onCall;
  private onOpen;
  private onDispose;
}

export declare const Comcat: {
  /**
   * Determines whether enabling the full debug logging,
   * including inner status and transport information.
   *
   * May output too much logs, so be careful.
   *
   * @param {boolean} flag
   */
  enableDebug(flag: boolean): void;
};
