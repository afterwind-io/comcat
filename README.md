# :cat:Comcat

[![Version][version-badge]][npm]
[![License][license-badge]][license]

<!-- ![Downloads][download-badge] -->

> :construction: Currently WIP. :construction:
>
> It works but not ready for production. **Use with caution**.

Share single connection between multiple browser tabs/windows and more.

## Introduction

This library is currently aimed to solve a common problem:

> I want to consume some messages pushed by the backend, but I don't want to
> create a new connection every time I open a new tab/window.

`Comcat` offers some critical features around this topic, including:

- Broadcast messages to all tabs;
- Keep **one and only one** connection alive across tabs;

With the unique characteristics of [`SharedWorker`][mdn-sharedworker], `Comcat` can automatically reconnect if the tab owns the connection is closed or even crashed. If you are keen on how it is accomplished, please refer to [How it works](#how-it-works).

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
  private interval = 60 * 1000;
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

class TimePipe extends ComcatPipe {
  protected onMessage(topic, data) {
    console.log('[mock pipe]', data);
  }
}

const pump = new TimePollingPump({
  category: 'time',
  mode: 'unique',
});
pump.start();

const pipe = new TimePipe({
  topic: 'Time',
});
pipe.start();
```

## The Concepts

### Pump

<!-- 一个`pump`对应一个连接，以`category`区分。

如果`pump`的工作模式为`unique`，则系统确保在多页面实例时，同一个`category`下有且仅有一个`pump`保持连接。 -->

TODO

### Pipe

TODO

## APIs

### `Comcat.setMode`

```typescript
type setMode = (mode: 'default' | 'direct' = 'default') => void;
```

_Specify the underlying implementation._

By default `Comcat` uses `SharedWebworker` to share connection and send messages across tabs/windows. If `SharedWebworker` is not supported, `Comcat` will fall back to the `direct` mode.

When running in `direct` Mode, all cross-tab features are disabled due to lack of cross-tab ability. The connection activated by `pump` is created per tab. The messages sent by `pump` are broadcasted back to the pipes on the same tab. Thus, it behaves just like a normal event bus.

Normally you should just leave it be.

```javascript
import { Comcat } from 'comcat';

Comcat.setMode('direct');
```

### `Comcat.enableDebug`

```typescript
type enableDebug = (flag: boolean) => void;
```

_Determines whether enabling the full debug logging, including inner status and transport information._

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

Broadcasting alone is a relatively simple task. To send messages between tabs, a bunch of techniques can be taken:

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

### Raft Consensus Algorithm - The Simplified Version

Now we have a reliable foundation for scheduler, the remaining problem is how to ???. ???, 

TODO

### Generating the embedded `SharedWorker`

Obviously, it is awkward for user to manually copy the distributed worker file to somewhere like `public` folder, then provide the instantiated worker as part of startup procedure. Thus, the inlined worker is a much better solution.

If you search for how to embed workers, such as MDN, it tells you something like this:

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

Now each tabs can point to the same worker. Problem solved.

## Browser Compatibility

Because the core functionality is heavily rely on `SharedWorker`, the minimum requirements are as follows:

- `Chrome`: 4
- `Firefox`: 29

You can refer to ["Can I Use"][caniuse-sharedworker] for more compatibility details.

## Q&A

> Any plans for IE suppo...

NO.

## Todos

- [x] ~~Move topic filtering of pipe to the worker;~~
- [x] ~~Only output debug info if enabled~~;
- [x] ~~Use simplified raft-like consensus algorithm to ensure single connection;~~
- [x] ~~Use Data URL to achieve inline SharedWorker;~~
- [ ] Prevent creating multiple `pump` with same `category`;

## License

[MIT][license]

[version-badge]: https://img.shields.io/npm/v/comcat.svg
[npm]: https://www.npmjs.com/package/comcat
[download-badge]: https://img.shields.io/npm/dt/comcat.svg
[license]: LICENSE
[license-badge]: https://img.shields.io/npm/l/comcat.svg
[caniuse-sharedworker]: https://caniuse.com/mdn-api_sharedworker
[spec-sharedworker]: https://html.spec.whatwg.org/multipage/workers.html#shared-workers-and-the-sharedworker-interface
[mdn-sharedworker]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#shared_workers
[mdn-objecturl]: https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL#memory_management
[mdn-postmessage]: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
[mdn-storageevent]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#responding_to_storage_changes_with_the_storageevent
[mdn-broadcast]: https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
