/**
 * The following code is only for demonstration purpose.
 *
 * DO NOT use it in production.
 */

import { ComcatPump } from 'comcat';

class WebsocketPump extends ComcatPump {
  private ws: WebSocket | null = null;

  protected connect() {
    const ws = new WebSocket('wss://echo.websocket.org/');
    ws.onmessage = this.onMessage.bind(this);

    this.ws = ws;
  }

  protected disconnect() {
    this.ws.close();
    this.ws = null;
  }

  private onMessage(event: MessageEvent<any>) {
    const message = event.data;
    this.pump('<user_defined_topic>', message);
  }
}

const pump = new WebsocketPump({
  category: '<user_defined_category>',
});
pump.start();
