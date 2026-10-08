import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

// Reuse Vite's TypeScript transpiler so the Node tests exercise the app's source
// and fixtures without generated files or another test dependency.
const { outputFiles } = await build({
  entryPoints: [fileURLToPath(new URL('../tests/calculations.test.ts', import.meta.url))],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});

await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].contents).toString('base64')}`);
