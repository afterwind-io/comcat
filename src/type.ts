import {
  RaftRequestElect,
  RaftRequestHeartbeat,
  RaftRequestMessaging,
  RaftResponseElect,
  RaftResponseHeartbeat,
  RaftResponseMessaging,
} from './client/raft';

export interface ComcatTransport {
  connect(): void;
  disconnect(): void;
  onMessage: (message: ComcatRPCProtocal) => void;
  postMessage(message: any): void;
}

export interface ComcatRPCProtocal {
  ack: number;
  type: 'call' | 'reply';
  payload: ComcatRPCCommand;
}

export interface ComcatRPCCommand {
  name: string;
  oneshot?: boolean;
  params?: any;
}

export type ComcatPumpMode = 'standalone' | 'unique';

export interface ComcatBroadcastMessage {
  topic: string;
  data: any;
}

export interface ComcatCommandPumpRegister {
  name: 'pump_register';
  params: {
    id: string;
    mode: ComcatPumpMode;
    category: string;
  };
}
export type ComcatCommandReplyPumpRegister = {
  pump_register: boolean;
};

export interface ComcatCommandPumpClose {
  name: 'pump_close';
  oneshot: true;
  params: {
    id: string;
    category: string;
  };
}
export type ComcatCommandReplyPumpClose = {
  pump_close: never;
};

/**
 * Command for broadcasting message
 *
 * @deprecated
 * @export
 * @interface ComcatCommandPumpEmit
 */
export interface ComcatCommandPumpEmit {
  name: 'pump_emit';
  oneshot: true;
  params: ComcatBroadcastMessage;
}
/**
 * The response for `ComcatCommandPumpEmit`
 *
 * @deprecated
 * @export
 */
export type ComcatCommandReplyPumpEmit = {
  pump_emit: never;
};

export interface ComcatCommandPumpRaftElect {
  name: 'pump_raft_elect';
  params: {
    category: string;
    raft: RaftRequestElect;
  };
}
export type ComcatCommandReplyPumpRaftElect = {
  pump_raft_elect: RaftResponseElect;
};

export interface ComcatCommandPumpRaftHeartbeat {
  name: 'pump_raft_heartbeat';
  params: {
    category: string;
    raft: RaftRequestHeartbeat;
  };
}
export type ComcatCommandReplyPumpRaftHeartbeat = {
  pump_raft_heartbeat: RaftResponseHeartbeat;
};

export interface ComcatCommandPumpRaftMessaging {
  name: 'pump_raft_messaging';
  params: {
    category: string;
    raft: RaftRequestMessaging<ComcatBroadcastMessage>;
  };
}
export type ComcatCommandReplyPumpRaftMessaging = {
  pump_raft_messaging: RaftResponseMessaging;
};

export interface ComcatCommandPipeRegister {
  name: 'pipe_register';
  params: {
    id: string;
    topic: string;
  };
}
export type ComcatCommandReplyPipeRegister = {
  pipe_register: boolean;
};

export interface ComcatCommandPipeReceive {
  name: 'pipe_receive';
  oneshot: true;
  params: ComcatBroadcastMessage;
}
export type ComcatCommandReplyPipeReceive = {
  pipe_receive: never;
};

export interface ComcatCommandPipeClose {
  name: 'pipe_close';
  oneshot: true;
  params: {
    id: string;
  };
}
export type ComcatCommandReplyPipeClose = {
  pipe_close: never;
};

export type ComcatCommands =
  | ComcatCommandPumpRegister
  | ComcatCommandPumpClose
  | ComcatCommandPumpEmit
  | ComcatCommandPumpRaftElect
  | ComcatCommandPumpRaftHeartbeat
  | ComcatCommandPumpRaftMessaging
  | ComcatCommandPipeRegister
  | ComcatCommandPipeReceive
  | ComcatCommandPipeClose;

export type ComcatCommandReplies = ComcatCommandReplyPumpRegister &
  ComcatCommandReplyPumpClose &
  ComcatCommandReplyPumpEmit &
  ComcatCommandReplyPumpRaftElect &
  ComcatCommandReplyPumpRaftHeartbeat &
  ComcatCommandReplyPumpRaftMessaging &
  ComcatCommandReplyPipeRegister &
  ComcatCommandReplyPipeReceive &
  ComcatCommandReplyPipeClose;
