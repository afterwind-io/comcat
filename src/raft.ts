import { blackhole, getUniqueId } from './util';

const INTERVAL_ELECTION = 5 * 1000;
const INTERVAL_HEARTBEAT = 3 * 1000;

export interface RaftRequestElect {
  term: number;
  candidateId: string;
}
export interface RaftResponseElect {
  isGranted: boolean;
  term: number;
}
export interface RaftRequestHeartbeat {
  term: number;
}
export interface RaftResponseHeartbeat {
  isExpired: boolean;
  term: number;
}
export interface RaftRequestMessaging<T> {
  leaderId: string;
  message: T;
}
export type RaftResponseMessaging = void;

export class RaftActor<T> {
  public onBecomeLeader!: () => void;
  public onBecomeCandidate!: () => void;
  public onElect!: (req: RaftRequestElect) => Promise<RaftResponseElect>;
  public onHeartbeat!: (
    req: RaftRequestHeartbeat
  ) => Promise<RaftResponseHeartbeat>;
  public onMessaging!: (
    req: RaftRequestMessaging<T>
  ) => Promise<RaftResponseMessaging>;

  private readonly id: string = getUniqueId();
  private term: number = 0;
  private status: 'candidate' | 'leader' = 'candidate';

  private loopHandler: number = -1;

  public get isLeader(): boolean {
    return this.status === 'leader';
  }

  public start() {
    this.elect();
  }

  public stop() {
    this.onBecomeLeader = blackhole;
    this.onBecomeCandidate = blackhole;
    this.onElect = blackhole;
    this.onHeartbeat = blackhole;
    this.onMessaging = blackhole;

    window.clearTimeout(this.loopHandler);
  }

  /**
   * Rewind to candidate
   *
   * @memberof RaftActor
   */
  public stepdown() {
    this.status = 'candidate';
    this.onBecomeCandidate();

    this.loop();
  }

  public RequestMessaging(message: T): Promise<void> {
    return this.onMessaging({
      leaderId: this.id,
      message,
    });
  }

  private elect = async () => {
    const { isGranted, term } = await this.onElect({
      term: ++this.term,
      candidateId: this.id,
    });

    if (isGranted) {
      this.status = 'leader';
      this.onBecomeLeader();
    }

    this.term = term;
    this.loop();
  };

  private heartbeat = async () => {
    const { isExpired, term } = await this.onHeartbeat({
      term: ++this.term,
    });

    if (isExpired) {
      this.status = 'candidate';
      this.onBecomeCandidate();
    }

    this.term = term;
    this.loop();
  };

  private loop() {
    window.clearTimeout(this.loopHandler);

    let timeout: number;
    let cycle: () => void;
    if (this.status === 'candidate') {
      cycle = this.elect;
      timeout = INTERVAL_ELECTION;
    } else {
      cycle = this.heartbeat;
      timeout = INTERVAL_HEARTBEAT;
    }

    this.loopHandler = window.setTimeout(cycle, timeout);
  }
}

export class RaftDealer<T> {
  public onMessageRequest!: (message: T) => void;

  private term: number = 0;
  private leaderId: string = '';

  public RequestElect(
    req: RaftRequestElect,
    reply: (res: RaftResponseElect) => void
  ) {
    const { term, candidateId } = req;
    if (term > this.term) {
      this.term = term;
      this.leaderId = candidateId;

      reply({ isGranted: true, term });
    } else {
      reply({ isGranted: false, term: this.term });
    }
  }

  public RequestHeartbeat(
    req: RaftRequestHeartbeat,
    reply: (res: RaftResponseHeartbeat) => void
  ) {
    const { term } = req;
    if (term > this.term) {
      this.term = term;
      reply({ isExpired: false, term });
    } else {
      reply({ isExpired: true, term: this.term });
    }
  }

  public async RequestMessaging(
    req: RaftRequestMessaging<T>,
    reply: (res: RaftResponseMessaging) => void
  ) {
    const { leaderId, message } = req;
    if (leaderId === this.leaderId) {
      this.onMessageRequest(message);
    }

    reply();
  }
}
