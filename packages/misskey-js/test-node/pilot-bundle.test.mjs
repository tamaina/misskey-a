import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

test('browser SDK bundles routing metadata without backend or schema modules', async () => {
	const bundle = await build({ entryPoints: [fileURLToPath(new URL('../built/api.js', import.meta.url))],
		bundle: true, platform: 'browser', format: 'esm', write: false, metafile: true });
	const inputs = Object.keys(bundle.metafile.inputs);
	assert.equal(inputs.some(path => /\/backend\/|\/features\/|\/typeorm\/|\/@nestjs\/|\/@orpc\/server\/|\/valibot\//.test(path)), false);
	const contracts = inputs.filter(path => path.includes('/built/contracts/'));
	assert.deepEqual(contracts.map(path => path.split('/built/contracts/')[1]), ['api/shared/api-routing.js']);
	console.log(`Browser API bundle: ${bundle.outputFiles[0].contents.length} bytes, ${inputs.length} modules; portable routing helper only`);
});
