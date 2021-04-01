/**
 * The following code is only for demonstration purpose.
 *
 * DO NOT use it in production.
 */

import { ComcatPump } from 'comcat';

class PollingPump extends ComcatPump {
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

const pump = new PollingPump({
  category: '<user_defined_category>',
  mode: 'unique',
});
pump.start();
