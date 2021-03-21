import typescript from 'rollup-plugin-typescript2';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';

export default {
  input: 'src/client/index.ts',
  output: {
    dir: 'example/comcat',
  },
  plugins: [
    webWorkerLoader({
      targetPlatform: 'browser',
      extensions: ['.ts'],
    }),
    forceSharedWorker(),
    typescript({
      tsconfig: 'src/client/tsconfig.json',
    }),
  ],
};

/**
 * FIXME
 * 
 * Temporary hack to ensure generating `SharedWorker` constructor,
 * due to the lack of worker type support
 * from `rollup-plugin-web-worker-loader`.
 * 
 * @returns 
 */
function forceSharedWorker() {
  return {
    transform(code, id) {
      if (!id.includes('createBase64WorkerFactory')) {
        return code;
      }

      return code.replace('new Worker', 'new SharedWorker');
    },
  };
}
