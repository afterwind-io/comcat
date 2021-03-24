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

export interface ComcatCommandPing {
  name: 'ping';
}
export type ComcatCommandReplyPing = {
  ping: boolean;
};

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

export interface ComcatCommandPumpOpen {
  name: 'pump_open';
  params: {
    id: string;
    mode: ComcatPumpMode;
    category: string;
  };
}
export type ComcatCommandReplyPumpOpen = {
  pump_open: boolean;
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

export interface ComcatCommandPumpEmit {
  name: 'pump_emit';
  oneshot: true;
  params: ComcatBroadcastMessage;
}
export type ComcatCommandReplyPumpEmit = {
  pump_emit: never;
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
  | ComcatCommandPing
  | ComcatCommandPumpRegister
  | ComcatCommandPumpOpen
  | ComcatCommandPumpClose
  | ComcatCommandPumpEmit
  | ComcatCommandPipeRegister
  | ComcatCommandPipeReceive
  | ComcatCommandPipeClose;

export type ComcatCommandReplies = ComcatCommandReplyPing &
  ComcatCommandReplyPumpRegister &
  ComcatCommandReplyPumpOpen &
  ComcatCommandReplyPumpClose &
  ComcatCommandReplyPumpEmit &
  ComcatCommandReplyPipeRegister &
  ComcatCommandReplyPipeReceive &
  ComcatCommandReplyPipeClose;
