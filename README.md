# :cat:Comcat

[![Version][version-badge]][npm]
[![License][license-badge]](LICENSE)

<!-- ![Downloads][download-badge] -->

> :construction: Currently WIP. :construction:
>
> It works fine but needs polishing. **Use with caution**.

Share single connection between multiple browser tabs/windows and more.

## Introduction

This library is currently aimed to solve a common problem:

> I want to consume some messages pushed by the backend, but I don't want to
> create a new connection every time I open a new tab/window.

`Comcat` offers some critical features around this topic, including:

- Broadcast messages to all tabs;
- Keep **one and only one** connection alive across tabs;

With the unique characteristics of [`SharedWorker`][mdn-sharedworker], `Comcat` can automatically reconnect if the tab owns the connection is closed or even crashed. If you are keen on how it is accomplished, please refer to [How it works](#how-it-works).

## Disclaimer

`Comcat` **guarantees** eliminating duplicate connections or messages, but **does not guarantee** the integrity of all incoming messages. That means, messages **may be** lost in certain edge cases.

If it is a major concern over the message integrity, `Comcat` may not be suit to your app. Relevant details are discussed in [Caveats](#caveats).

## Get Started

### Install

```bash
npm install comcat
```

OR

```bash
yarn add comcat
```

### Usage

For demonstration purpose, here we implement a minimal example to share time information across tabs.

```typescript
// example.ts

import { ComcatPump, ComcatPipe } from 'comcat';

class TimePollingPump extends ComcatPump {
  private readonly interval = 60 * 1000;
  private intervalHandler = -1;

  protected connect() {
    this.intervalHandler = setInterval(() => {
      fetch('http://worldtimeapi.org/api/ip')
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          this.pump('Time', data.datetime);
          this.pump('Unix', data.unixtime);
        });
    }, this.interval);
  }

  protected disconnect() {
    clearInterval(this.intervalHandler);
  }
}

const pump = new TimePollingPump({
  category: 'example',
});
pump.start();

const pipe = new ComcatPipe({
  topic: 'Time',
});
pipe.onMessage = (topic, data) => {
  console.log('The current time is: ', data);
};
pipe.start();
```

## The Concepts

### Overview

![overview](assets/overview.png)

### Pump

`Pump` behaves like a "Message Provider". It is responsible for creating the connection to the backend and then feed the messages to the further consumer.

You have full control of how to connect, and disconnect, to the source of the message, often the server. Moreover, it is up to you to determine when and what to send. `Comcat` only manages the timing of connection and disconnection for you.

If needed, you can create multiple `Pump`s to deal with various sources. `Comcat`
uses `category` to identify different groups of pumps. Only pumps within the same group, classified by the same `category` per se, will be scheduled to keep only one active connection.

### Pipe

`Pipe` is the "Message Receiver". It notifies the user when the message arrives, and is meant to be a intermediary between `Comcat` and the consumer.

`Pipe` provides basic filtering based on `topic`, but you can choose whether to accept the incoming message, or even modify the content before
it is pushed to the consumer.

## Recipes

The repository contains several examples covering the basic usage. Please see [example/README.md](example/README.md)

## APIs

### ComcatPump

The base class for implementing customized pumps.

Because it is an "abstract" class, `ComcatPump` should never be instantiated directly. You need to derive your own class from it.

A typical customized pump looks like this:

```typescript
// myPump.ts

import { ComcatPump } from 'comcat';

class MyPump extends ComcatPump {
  protected connect() {
    /**
     * Do the connection here.
     *
     * ...and some other works maybe
     */
  }

  protected disconnect() {
    /**
     * Do the disconnection here.
     */
  }
}
```

#### new ComcatPump(options)

```typescript
public constructor(options: ComcatPumpOptions);

interface ComcatPumpOptions {
  category: string;
}
```

_`category`_:

An identifier to classify different message sources.

Each category is coupled with only one type of connection, so you can not create multiple pumps with same category.

#### ComcatPump.start

```typescript
public start: () => void;
```

Register the pump and try to start the underlying connection.

Because the connection is managed by `Comcat`, it may be postponed until scheduled.

#### ComcatPump.connect

```typescript
protected abstract connect: () => void;
```

> :warning: Please notice that `connect` is an "abstract" method, which means you should always implement it in your derived class.

Invoked when `Comcat` tries to connect to your backend. Basically your connection code goes here.

#### ComcatPump.disconnect

```typescript
protected abstract disconnect: () => void;
```

> :warning: Please notice that `disconnect` is an "abstract" method, which means you should always implement it in your derived class.

Invoked when `Comcat` tries to disconnect to your backend. Basically your disconnection code goes here.

Don't permanently dispose anything here, for your pump may be rearranged connecting again.

#### ComcatPump.pump

```typescript
protected pump: (topic: string, data: any) => Promise<void>;
```

Send the message with a specified topic.

_`topic`_:

The category of the message. It is used to help filtering messages in different aspects.

_`data`_:

The content of the message. Can be anything that `SharedWorker` supports, but with some restrictions. Please see [_Transferring data to and from workers: further details_][mdn-transfer]

### ComcatPipe

The base class for constructing `Comcat` pipes.

A typical customized pipe looks like this:

```typescript
import { ComcatPipe } from 'comcat';

const pipe = new ComcatPipe({
  topic: 'MyTopic',
});
pipe.onMessage = (topic, data) => {
  /**
   * Do some works with the data.
   */
};
```

#### new ComcatPipe(options)

```typescript
public constructor(options?: ComcatPipeOptions);

interface ComcatPipeOptions {
  topic?: string | RegExp;
}
```

_`topic`_: [optional]

The expected category of the messages. It can be either `string` or `RegExp`. If applied, the incoming message is filtered unless its topic exactly matches the provided string, or passes the `RegExp` test.

#### ComcatPipe.start

```typescript
public start: () => Promise<boolean>;
```

Register the pipe and start listening for the messages from the upstream.

Returns true if registry succeeds, or vice versa.

#### ComcatPipe.onMessage

```typescript
public onMessage: (topic: string, data: any) => void;
```

> :warning: **The default method is only a placeholder. Always override with your own callback.**

Invoked when messages arrive.

Note that the messages arrives here have already been filtered by the `topic` provided in construction options.

_`topic`_:

The topic of the message;

_`data`_:

The content of the message;

### Comcat

Provides global settings that alter how `Comcat` works.

#### Comcat.setMode

```typescript
public setMode: (mode: 'default' | 'direct' = 'default') => void;
```

Specify the underlying implementation.

By default `Comcat` uses `SharedWebworker` to share connection and send messages across tabs/windows. If `SharedWebworker` is not supported, `Comcat` will fall back to the `direct` mode.

When running in `direct` Mode, all cross-tab features are disabled due to lack of cross-tab ability. The connection activated by `pump` is created per tab. The messages sent by `pump` are broadcasted back to the pipes on the same tab. Thus, it behaves just like a normal event bus.

Usually you should just leave it be.

```javascript
import { Comcat } from 'comcat';

Comcat.setMode('direct');
```

#### Comcat.enableDebug

```typescript
public enableDebug: (flag: boolean) => void;
```

Determines whether enabling the full debug logging, including inner status and transport information.

Comcat will log every message through the transport, and some basic status information to the console. By default, these output is suppressed.

You can enable the full log like following:

```javascript
import { Comcat } from 'comcat';

Comcat.enableDebug(true);
```

Be careful, this may output enormous content. However, the logs from the worker is always complete and not affected by the setting.

## How it works

### Why `SharedWorker`

First let's revisit the two main goals we ought to achieve:

> - Broadcast messages to all tabs;
> - Keep **one and only one** connection alive across tabs;

Broadcasting alone is a relatively simple task. To send messages between tabs, a bunch of techniques can be adopted:

- [window.postMessage()][mdn-postmessage]
- [Storage Event][mdn-storageevent]
- [Broadcast Channel API][mdn-broadcast]

So the true challenge here is the second part. Ideally we need to implement a certain kind of scheduler that:

- Stay alive as long as at least one tab is running (same origin);
- Can be accessed from all opened tabs with same origin;
- Decide which tab has the right to connect and push messages;
- Recover from the situation where the tab currently owns the connection is closed/freezed;

The mechanism of `SharedWorker` fits the first two requirements perfectly. It is running on a separate thread. All tabs with the same origin can access the worker. And the best part is, it will keep alive even if the original spawner of the worker is crashed, as long as at least one tab with the same origin is running.

Furthermore, `SharedWorker` provides bi-directional, message-based communication to send data between main thread and the worker. We can easily turn it into a mediate proxy and broadcast the message from one tab to other tabs.

In conclusion, `SharedWorker` is the best option makes maintaining and rerouting the connection possible.

### The Consensus Problem

Consider it roughly, the situation we are facing is quite similar to distributed systems. For example, when managing a replicated log, the system is always trying to:

- Ensure a unique leader to accept log entries from clients;
- Re-elect if the leader is crashed;

The magic working behind the scene is known as "Consensus Algorithm". With the concept of such algorithm, we can convert our problem to:

- Ensure a unique leader(tab) to connect to a backend and broadcast messages;
- Re-elect if the leader(tab) is closed/freezed;

Among the various algorithms, [Raft][raft] is relatively easy to understand and implement. However, it is designed for the purpose like building distributed log system, so it is still a little complicated against our needs. After all, we don't aim for strict safety. Besides, browser tabs are more likely to be opened and closed frequently, which is quite opposite to a stable cluster.

Eventually, a tailored version of Raft is applied. The distributed part of the algorithm is ditched, since a scheduler working on `SharedWorker` plays the role as a centralized coordinator, which can chop down all consensus procedure between tabs. The concept of `term` is kept to detect stale leader, thus help quickly recovering from abnormal situations.

#### Overview

##### Actor

`Actor` is the counterpart of `Server` in the original Raft algorithm. It is either in one of the following state:

`Leader`

- Has full permission to broadcast message;
- Maintains heartbeat every 3 seconds to prevent election timeouts. If failed, convert to `Candidate`;

`Candidate`

- Initiate an election every 5 seconds; If succeed, convert to `Leader`;

##### Dealer

`Dealer`, aka the scheduler, is responsible for:

- Check if the election from `Candidate` is valid;
- Check if the heartbeat from `Leader` is valid;
- Check if `Actor` has the permission to broadcast messages;

...according to the certain rules. Details see below.

#### RPC

The communication between `Actor` and `Dealer` is proceeded using remote procedure call(RPC), built on top of `SharedWorker` messaging mechanism. There are three types of RPCs.

##### Election RPC

Invoked by `Candidate` to attempt to become leader.

```typescript
interface RaftRequestElect {
  // Actor's term
  term: number;
  // Actor's ID
  candidateId: string;
}
interface RaftResponseElect {
  // true if election succeed
  isGranted: boolean;
  // Dealer's term
  term: number;
}
```

##### Heartbeat RPC

Invoked by `Leader` to maintain its authority.

```typescript
interface RaftRequestHeartbeat {
  // Actor's term
  term: number;
}
interface RaftResponseHeartbeat {
  // true if there's another valid leader
  isExpired: boolean;
  // Dealer's term
  term: number;
}
```

##### Message Request RPC

Invoked by `Leader` to check permission for broadcasting.

```typescript
interface RaftRequestMessaging<T> {
  // Actor's ID
  leaderId: number;
  // The message to be sent
  message: T;
}
type RaftResponseMessaging = void;
```

#### The Algorithm

##### Election

The election is initiated by `Candidate` and issued every 5 seconds.

When the election stage starts:

- [`Actor`] Increase the local term by 1, and send it with `Election RPC` to `Dealer`
- [`Dealer`] Check the incoming term(`a`) against local term(`b`):
  - If `a > b`, election succeed
    - Override the local term with the incoming term
    - Record the id of current leader
    - Accept and reply with incoming term
  - Else, election failed
    - Reject and reply with the local term
- [`Actor`] Check the reply:
  - If the election is granted,
    - Convert to `Leader`
    - Start heartbeat loop
  - Else,
    - Override the local term with the incoming term
    - Start election loop

##### Heartbeat

The heartbeat is initiated by `Leader` and issued every 3 seconds.

When the heartbeat stage starts:

- [`Actor`] Increase the local term by 1, and send it with `Heartbeat RPC` to `Dealer`
- [`Dealer`] Check the incoming term(`a`) against local term(`b`):
  - If `a > b`, heartbeat check succeed
    - Override the local term with the incoming term
    - Accept and reply with incoming term
  - Else, heartbeat check failed
    - Reject and reply with the local term
- [`Actor`] Check the reply:
  - If the heartbeat is expired,
    - Override the local term with the incoming term
    - Convert to `Candidate`
    - Start election loop
  - Else,
    - Restart heartbeat loop

##### Message Request

The message request is initiated by `Leader` and manually invoked from user land.

When the message request stage starts:

- [`Actor`] Send its own id along `Message Request RPC` to `Dealer`
- [`Dealer`] Check the incoming id(`a`) against current leader id(`b`):
  - If `a == b`, request check succeed
    - Send the message
  - Else, request check failed

#### Caveats

TL;DR: Messages **may be lost** during the shifting of `Leader`s.

Consider the following cases:

##### Case 1

> The tab owns the connection is closed. X seconds later another tab is elected as leader and establishes the connection instead.

Message lost after tab closing is unavoidable. One of our goals is to keep one and one connection alone, so there must be a vacancy period before a new `Leader` is elected. A possible way to solve this is to keep multiple connections, but apparently it is off-target here.

##### Case 2

> The tab owns the connection is freezed for a few seconds and then recovered. It is not the leader now, and it is waiting for confirmation from heartbeat request. During that exact period, one or more message requests are issued;

As previously mentioned, if a stale `Leader` is tying to send messages, those requests will be instantly failed due to the leader id check. That means, those messages from the stale `Leader` will be "ditched" right away. Please be advised that this is **intentional**.

Supposed that the actual connection we talked about is created by Websocket. While a stale `Leader` is waiting for heartbeat request, its connection is being **kept open**. If the server pushes a message right now, both the stale `Leader` and the current `Leader` will receive the message, and trying to issue a broadcast at the same time. This causes the same message being sent twice, which breaks the no-duplicate guarantee.

### Generating the embedded `SharedWorker`

Obviously, it is awkward for user to manually copy the distributed worker file to somewhere like `public` folder, then provide the instantiated worker as part of startup procedure. Thus, the inlined worker is a much better solution.

If you searched for how to embed workers, such as MDN, it tells you something like this:

```javascript
var blob = new Blob('Worker code goes here');
var worker = new Worker(window.URL.createObjectURL(blob));
```

This works well for `Worker`(aka `Dedicated worker`). But when it comes to `SharedWorker`, the object URL will cause serious problem.

According to [MDN][mdn-objecturl]:

> Each time you call createObjectURL(), a new object URL is created, even if you've already created one for the same object.

...which means every tab will generate its unique object URL, even if the worker code is always the same. In conclusion, different tabs will point to different `SharedWorker` if they are not instantiated by the same URL.

So what is next?

Again according to [WHATWG][spec-sharedworker]:

> Any same-origin URL (including blob: URLs) can be used. data: URLs can also be used, but they create a worker with an opaque origin.

This shed some light on what URLs can be provided as valid `scriptURL` for `SharedWorker` constructor. So the final solution is simple: Convert the code into a DataURL.

```javascript
var url = `data:text/javascript,${code}`;
var worker = new Worker(url);
```

This technique meets all the desired needs:

- Easily generated and embedded;
- The result URL is always the same as long as the worker code maintains unchanged;

Now each tab can point to the same worker. Problem solved.

## Browser Compatibility

Because the core functionality is heavily rely on `SharedWorker`, the minimum requirements are aligned with `SharedWorker` as follows:

- `Chrome`: 4
- `Firefox`: 29

You can refer to ["Can I Use"][caniuse-sharedworker] for more compatibility details.

## Q&A

> Any plans for IE suppo...

NO.

## Roadmap

- [ ] (Maybe) Extend `Pump` concept to enable sending messages to `Leader Pump`, to further support two-way communication sharing single connection;
- [ ] Better debug information;

## Todos

- [x] ~~Move topic filtering of pipe to the worker;~~
- [x] ~~Only output debug info if enabled~~;
- [x] ~~Use simplified raft-like consensus algorithm to ensure single connection;~~
- [x] ~~Use Data URL to achieve inline SharedWorker;~~
- [ ] Prevent creating multiple `pump` with same `category`;
- [x] Topic wildcard;
- [ ] Deal with leader connection error;

## License

[MIT](LICENSE)

<!-- Badges -->

[version-badge]: https://img.shields.io/npm/v/comcat.svg
[npm]: https://www.npmjs.com/package/comcat
[download-badge]: https://img.shields.io/npm/dt/comcat.svg
[license-badge]: https://img.shields.io/npm/l/comcat.svg

<!-- References -->

[caniuse-sharedworker]: https://caniuse.com/mdn-api_sharedworker
[spec-sharedworker]: https://html.spec.whatwg.org/multipage/workers.html#shared-workers-and-the-sharedworker-interface
[mdn-sharedworker]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#shared_workers
[mdn-objecturl]: https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL#memory_management
[mdn-postmessage]: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
[mdn-storageevent]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#responding_to_storage_changes_with_the_storageevent
[mdn-broadcast]: https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
[mdn-transfer]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#transferring_data_to_and_from_workers_further_details
[raft]: https://raft.github.io/
