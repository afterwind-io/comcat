// @ts-check

import { Comcat, ComcatPump, ComcatPipe } from './comcat/index.js';

Comcat.enableDebug(true);
// Comcat.setMode("direct");

class MockPollingPump extends ComcatPump {
  interval = 10000;
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
}

class MockPipe extends ComcatPipe {
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
});
pump.start();

const pipe = new MockPipe({
  topic: 'Doge',
});
pipe.start();