import { ComcatCommandReplies, ComcatCommands } from '../type';
import { ComcatRPC } from '../client/rpc';
import { ComcatPipeScheduler } from './pipe';
import { ComcatPumpScheduler } from './pump';
import { Transport } from './transport';

/**
 * NOTE:
 *
 * Fix for typescript complaints during bundling:
 *   semantic error TS2304: Cannot find name 'SharedWorkerGlobalScope'
 */
// @ts-ignore
const worker = (self as unknown) as SharedWorkerGlobalScope;

const pipeSchedueler = new ComcatPipeScheduler();
const pumpScheduler = new ComcatPumpScheduler();

pumpScheduler.onBroadcast = pipeSchedueler.broadcast.bind(pipeSchedueler);

worker.onconnect = (e: MessageEvent<any>) => {
  const port = e.ports[0];

  const rpc = new ComcatRPC<ComcatCommands, ComcatCommandReplies>(
    new Transport(port)
  );
  rpc.onRemoteCall = (msg, reply) => {
    switch (msg.name) {
      case 'pump_register':
        return reply(pumpScheduler.register(rpc, msg));

      case 'pipe_register':
        return reply(pipeSchedueler.register(rpc, msg));

      default:
        break;
    }
  };
};
