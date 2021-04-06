import typescript from 'rollup-plugin-typescript2';

import * as path from 'path';
const webWorkerLoader = require(path.resolve(
  __dirname,
  '../third-party/worker-loader'
));

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/comcat.js',
  },
  plugins: [
    webWorkerLoader({
      targetPlatform: 'browser',
      extensions: ['.ts'],
    }),
    typescript({
      tsconfig: 'src/tsconfig.json',
      tsconfigOverride: {
        compilerOptions: {
          declaration: false,
          removeComments: true,
        },
      },
    }),
  ],
};
