import {
  ComcatCommands,
  ComcatCommandReplies,
  ComcatCommandPipeReceive,
} from './type';
import { Debug } from './debug';
import { ComcatRPC } from './rpc';
import { getTransport } from './impl';
import { getUniqueId } from './util';

const debug = new Debug('comcat-pipe');

interface ComcatPipeOptions {
  /**
   * The expected category of the messages.
   *
   * It can be either `string` or `RegExp`. If applied, the incoming message
   * is filtered unless its topic exactly matches the provided string,
   * or passes the `RegExp` test.
   *
   * @type {(string | RegExp)}
   * @memberof ComcatPipeOptions
   */
  topic?: string | RegExp;
}

/**
 * The base class for constructing `Comcat` pipes.
 *
 * @export
 * @class ComcatPipe
 */
export class ComcatPipe {
  private readonly id: string;
  private readonly rpc: ComcatRPC<ComcatCommands, ComcatCommandReplies>;
  private readonly topic: string | RegExp | null;
  private status: 'idle' | 'working' = 'idle';

  public constructor(options: ComcatPipeOptions = {}) {
    const { topic = null } = options;

    this.topic = topic;

    this.rpc = new ComcatRPC(getTransport());
    this.rpc.onRemoteCall = this.onCall.bind(this);

    this.id = getUniqueId();

    window.addEventListener('unload', this.onDispose.bind(this));
  }

  /**
   * Register the pipe and start listening for the messages from the upstream.
   *
   * @returns {Promise<boolean>} A flag indicates whether the registry succeeds or not.
   * @memberof ComcatPipe
   */
  public async start(): Promise<boolean> {
    if (this.status === 'working') {
      return false;
    }

    try {
      const topic = this.topic;
      const topicFilter = getTopicRepr(topic);

      await this.rpc.call({
        name: 'pipe_register',
        params: {
          id: this.id,
          topic: topicFilter,
        },
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * **The default method is only a placeholder. Always override with your own callback.**
   *
   * ---
   *
   * Invoked when messages arrive.
   *
   * Note that the messages arrives here have already been filtered
   * by the `topic` provided in construction options.
   *
   * @param {string} topic The topic of the message
   * @param {unknown} data The content of the message
   * @virtual
   * @memberof ComcatPipe
   */
  public onMessage = (topic: string, data: unknown) => {
    debug.warn(
      `DO NOT use the default "ComcatPipe.onMessage" method.` +
        `It is only a placeholder, and you should always provide your own callback.`
    );
  };

  private onCall(cmd: ComcatCommands, reply: (payload: unknown) => void) {
    switch (cmd.name) {
      case 'pipe_receive':
        return this.onReceive(cmd);

      default:
        break;
    }
  }

  private onDispose() {
    this.rpc.call({
      name: 'pipe_close',
      oneshot: true,
      params: { id: this.id },
    });
    this.rpc.close();
  }

  private onReceive(cmd: ComcatCommandPipeReceive) {
    const { topic, data } = cmd.params;
    this.onMessage(topic, data);
  }
}

function getTopicRepr(topic: string | RegExp | null): string | null {
  if (topic == null || typeof topic == 'string') {
    return topic;
  }

  return topic.source;
}
