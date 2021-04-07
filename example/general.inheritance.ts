/**
 * The following code is only for demonstration purpose.
 *
 * DO NOT use it in production.
 */

import {
  ComcatPump,
  ComcatPumpOptions,
  ComcatPipe,
  ComcatPipeOptions,
} from 'comcat';

/**
 * NOTE
 *
 * This example shows how to create a new class derived from `ComcatPump`,
 * or `ComcatPipe`, to achieve a little bit "cleaner" code.
 */

/**
 * In case you need your own constructor parameters,
 * you can extend the definition from `ComcatPumpOptions`.
 */
interface PollingPumpOptions extends ComcatPumpOptions {
  myParams?: any;
}

class PollingPump extends ComcatPump {
  private readonly interval = 60 * 1000;
  private intervalHandler = -1;

  public constructor(options: PollingPumpOptions) {
    super(options);

    // ...
  }

  /**
   * When override the default callback, you should always use "Arrow Function".
   */
  public onConnect = () => {
    this.intervalHandler = setInterval(() => {
      fetch('http://worldtimeapi.org/api/ip')
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          /**
           * Now you can directly use `pump` method.
           */
          this.pump('Time', data.datetime);
          this.pump('Unix', data.unixtime);
        });
    }, this.interval);
  };

  public onDisconnect = /** Also "Arrow Function" here. */ () => {
    clearInterval(this.intervalHandler);
  };
}

const pump = new PollingPump({ category: 'example' });
pump.start();

/**
 * Now let's create a derived pipe. It's basically the same as creating a pump.
 */

interface MyPipeOptions extends ComcatPipeOptions {
  myParams?: any;
}

class MyPipe extends ComcatPipe {
  public constructor(options: MyPipeOptions) {
    super(options);

    // ...
  }

  public onMessage = /** Also "Arrow Function" here. */ (
    topic: string,
    data: unknown
  ) => {
    // ...
  };
}

const pipe = new MyPipe({ topic: 'example' });
pipe.start();
