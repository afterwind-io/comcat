import { ComcatRPC } from '../client/rpc';
import {
  ComcatBroadcastMessage,
  ComcatCommandPumpClose,
  ComcatCommandPumpEmit,
  ComcatCommandPumpOpen,
  ComcatCommandPumpRegister,
  ComcatCommandReplies,
  ComcatCommands,
  ComcatPumpMode,
} from '../type';

interface ComcatPumpRegistry {
  id: string;
  mode: ComcatPumpMode;
  category: string;
  rpc: ComcatRPC<ComcatCommands, ComcatCommandReplies>;
}

export class ComcatPumpScheduler {
  public onBroadcast: (message: ComcatBroadcastMessage) => void = () => {};

  private activeUniquePumpIds: { [category: string]: string | undefined } = {};
  private pumps: ComcatPumpRegistry[] = [];

  public register(
    rpc: ComcatRPC<ComcatCommands, ComcatCommandReplies>,
    cmd: ComcatCommandPumpRegister
  ): boolean {
    const { id, category, mode } = cmd.params;

    const pump = this.pumps.find((p) => p.id === id);
    if (pump) {
      return false;
    }

    const registry: ComcatPumpRegistry = {
      id,
      category,
      mode,
      rpc,
    };
    this.pumps.push(registry);

    rpc.onRemoteCall = this.onCall.bind(this);
    return true;
  }

  private onCall(msg: ComcatCommands, reply: (payload: any) => void) {
    switch (msg.name) {
      case 'pump_open':
        return reply(this.onOpen(msg));

      case 'pump_close':
        return this.onClose(msg);

      case 'pump_emit':
        return this.onEmit(msg);

      default:
        break;
    }
  }

  private onClose(cmd: ComcatCommandPumpClose) {
    const { id, category } = cmd.params;

    const index = this.pumps.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.pumps.splice(index, 1);
    }

    const activePump = this.activeUniquePumpIds[category];
    if (activePump === id) {
      this.pickNextActivePump(category);
    }
  }

  private onEmit(cmd: ComcatCommandPumpEmit) {
    this.onBroadcast(cmd.params);
  }

  private onOpen(cmd: ComcatCommandPumpOpen): boolean {
    const { id, category, mode } = cmd.params;

    if (mode === 'standalone') {
      return true;
    }

    const activePump = this.activeUniquePumpIds[category];
    if (activePump !== void 0) {
      return false;
    }

    this.activeUniquePumpIds[category] = id;
    return true;
  }

  private async pickNextActivePump(category: string) {
    const candidate = this.pumps.filter(
      (p) => p.category === category && p.mode === 'unique'
    )[0];

    if (!candidate) {
      this.activeUniquePumpIds[category] = void 0;
      return;
    }

    const { id, mode, rpc } = candidate;
    rpc.call({
      name: 'pump_open',
      params: {
        id,
        mode,
        category,
      },
    });

    this.activeUniquePumpIds[category] = id;
  }
}
