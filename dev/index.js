// @ts-check

import { Comcat, ComcatPump, ComcatPipe } from './comcat/index.js';

Comcat.enableDebug(true);
// Comcat.setMode("direct");

let intervalHandler = -1;
const pump = new ComcatPump({
  category: 'mock',
});
pump.onConnect = () => {
  intervalHandler = setInterval(() => {
    pump.pump('Kitten', 'such cute');
    pump.pump('Doge', 'much wow');
  }, 10000);
};
pump.onDisconnect = () => {
  clearInterval(intervalHandler);
};
pump.start();

const pipe = new ComcatPipe({
  topic: 'Doge',
});
pipe.onMessage = (topic, data) => {
  if (window.document.visibilityState === 'hidden') {
    return;
  }

  console.log('[mock pipe]', topic, data);
};
pipe.start();
