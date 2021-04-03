/**
 * The following code is only for demonstration purpose.
 *
 * DO NOT use it in production.
 */

import { ComcatPump } from 'comcat';

class WebsocketPump {
  private readonly pump: ComcatPump;

  private ws: WebSocket | null = null;

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
    return new Promise((resolve, reject) => {
      const ws = new WebSocket('wss://example.com/');

      ws.onopen = () => resolve(true);
      ws.onerror = () => reject();
      ws.onmessage = this.onMessage.bind(this);

      this.ws = ws;
    });
  }

  private onDisconnect() {
    this.ws.close();
    this.ws = null;
  }

  private onMessage(event: MessageEvent<any>) {
    const message = event.data;
    this.pump.pump('example', message);
  }
}

const pump = new WebsocketPump();
pump.start();
