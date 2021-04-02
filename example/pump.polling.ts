/**
 * The following code is only for demonstration purpose.
 *
 * DO NOT use it in production.
 */

import { ComcatPump } from 'comcat';

class PollingPump {
  private readonly interval = 60 * 1000;
  private readonly pump: ComcatPump;

  private intervalHandler = -1;

  public constructor() {
    this.pump = new ComcatPump({
      category: 'example',
    });
    this.pump.onConnect = this.onConnect.bind(this);
    this.pump.onDisconnect = this.onDisconnect.bind(this);
  }

  public start() {
    this.pump.start();
  }

  private onConnect() {
    this.intervalHandler = setInterval(() => {
      fetch('http://worldtimeapi.org/api/ip')
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          this.pump.pump('Time', data.datetime);
          this.pump.pump('Unix', data.unixtime);
        });
    }, this.interval);
  }

  private onDisconnect() {
    clearInterval(this.intervalHandler);
  }
}

const pump = new PollingPump();
pump.start();
