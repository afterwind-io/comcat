// @ts-check

import { ComcatPump, ComcatPipe } from './comcat/index.js';

class MockPollingPump extends ComcatPump {
  interval = 1000;
  intervalHandler = -1;

  connect() {
    this.intervalHandler = setInterval(() => {
      this.pump('Kitten', 'such cute');
      this.pump('Doge', 'much wow');
    }, this.interval);
  }

  disconnect() {
    clearInterval(this.intervalHandler);
  }

  dispose() {
    // Nothing.
  }
}

class MockPipe extends ComcatPipe {
  dispose() {
    // Nothing.
  }

  onMessage(topic, data) {
    if (window.document.visibilityState === 'hidden') {
      return;
    }

    console.log('[mock pipe]', topic, data);
  }
}

const pump = new MockPollingPump({
  category: 'mock',
  mode: 'unique',
  transport: 'SharedWorker',
});
pump.start();

const pipe = new MockPipe({
  topic: 'Doge',
  transport: 'SharedWorker',
});
pipe.start();
