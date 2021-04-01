/**
 * The following code is only for demonstration purpose.
 *
 * DO NOT use it in production.
 */

import { ComcatPipe } from 'comcat';

class ActiveTabPipe extends ComcatPipe {
  protected onMessage(topic: string, data: any) {
    if (window.document.visibilityState === 'hidden') {
      return;
    }

    console.log(topic, data);
  }
}

const pipe = new ActiveTabPipe({
  topic: /.*/,
});
pipe.start();
