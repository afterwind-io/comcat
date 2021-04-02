/**
 * The following code is only for demonstration purpose.
 *
 * DO NOT use it in production.
 */

import { ComcatPipe } from 'comcat';

const pipe = new ComcatPipe();
pipe.onMessage = (topic: string, data: any) => {
  if (window.document.visibilityState === 'hidden') {
    return;
  }

  /**
   * Do some works with the data
   */
  console.log(topic, data);
};

pipe.start();
