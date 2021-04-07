/**
 * The following code is only for demonstration purpose.
 *
 * DO NOT use it in production.
 */

import { ComcatPipe } from 'comcat';
import { useCallback, useEffect, useState } from 'react';

const useExamplePipe = () => {
  const [message, setMessage] = useState('');

  /**
   * **Pipe should be created only once.**
   *
   * The following code is just a rough idea,
   * see https://reactjs.org/docs/hooks-faq.html#how-to-create-expensive-objects-lazily
   * for more implementations.
   */
  const [pipe] = useState(() => new ComcatPipe({ topic: 'example' }));
  pipe.onMessage = useCallback((topic: string, data: unknown) => {
    setMessage(data as string);
  }, []);

  /**
   * Always stop the pipe when the component enters clean-up phase.
   */
  useEffect(() => () => pipe.stop(), []);

  return message;
};

export const MyComponent = () => {
  const message = useExamplePipe();

  return <p>{message}</p>;
};
