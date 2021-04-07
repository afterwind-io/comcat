import { RaftResponseElect, RaftResponseHeartbeat } from '../../raft';
import { ComcatRPC } from '../../rpc';
import { ComcatCommands, ComcatCommandReplies } from '../../type';
import { PipeScheduler } from '../shared/pipeScheduler';
import { ComcatTransportDirectSchedulerProxy } from './proxy';

class ComcatDirectScheduler {
  private pipeScheduler: PipeScheduler = new PipeScheduler();

  public connect(transport: ComcatTransportDirectSchedulerProxy) {
    const rpc = new ComcatRPC<ComcatCommands, ComcatCommandReplies>(transport);
    rpc.onRemoteCall = (msg, reply) => this.onCall(rpc, msg, reply);
  }

  private onCall = (
    rpc: ComcatRPC<ComcatCommands, ComcatCommandReplies>,
    command: ComcatCommands,
    reply: (payload: any) => void
  ) => {
    switch (command.name) {
      // We don't keep track of pumps so it should be always success.
      case 'pump_register':
        return reply(true);

      /**
       * In `direct` mode, since all transport happens within the context of
       * same tab, there is no need to elect a leader and so forth. So we just
       * accept all requests.
       */
      case 'pump_raft_elect':
        const resElect: RaftResponseElect = {
          isGranted: true,
          term: 0,
        };
        return reply(resElect);
      case 'pump_raft_heartbeat':
        const resHeartbeat: RaftResponseHeartbeat = {
          isExpired: false,
          term: 0,
        };
        return reply(resHeartbeat);
      case 'pump_raft_messaging':
        const message = command.params.raft.message;
        return reply(this.pipeScheduler.broadcast(message));

      // We don't keep track of pumps so just drop it.
      case 'pump_close':
        rpc.close();
        break;

      case 'pipe_register':
        const { id, topic } = command.params;
        return reply(this.pipeScheduler.register(id, topic, rpc));

      case 'pipe_close':
        return this.pipeScheduler.unregister(command.params.id);

      default:
        break;
    }
  };
}

export const scheduler = new ComcatDirectScheduler();
