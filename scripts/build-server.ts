import esbuild from 'esbuild';
import path from 'path';

async function buildServer() {
  console.log('📦 Bundling server app for Vercel Serverless Functions...');
  const entryPoint = path.resolve(process.cwd(), 'src/serverApp.ts');
  const outfile = path.resolve(process.cwd(), 'api/_serverApp.bundle.js');

  await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    outfile,
    target: 'node20',
    sourcemap: false,
    banner: {
      js: '// Lumir Production Serverless App Bundle — generated automatically'
    }
  });

  console.log(`✓ Server app bundled successfully at: ${outfile}`);
}

buildServer().catch((err) => {
  console.error('❌ Failed to bundle server app:', err);
  process.exit(1);
});
