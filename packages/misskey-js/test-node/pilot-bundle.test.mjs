import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

test('browser SDK bundles only routing metadata and the portable error DTO', async () => {
	const bundle = await build({ entryPoints: [fileURLToPath(new URL('../built/api.js', import.meta.url))],
		bundle: true, platform: 'browser', format: 'esm', write: false, metafile: true });
	const inputs = Object.keys(bundle.metafile.inputs).map(path => `/${path.replaceAll('\\', '/')}`);
	const contracts = inputs.filter(path => path.includes('/built/contracts/'));
	assert.deepEqual(contracts.map(path => path.split('/built/contracts/')[1]).sort(),
		['api/backend/transport/errors.schema.js', 'api/shared/api-routing.js']);
	// The exact portable DTO is allowed; no broad backend/feature exception.
	const dependencies = inputs.filter(path => !contracts.includes(path));
	assert.equal(dependencies.some(path => /\/backend\/|\/features\/|\/typeorm\/|\/@nestjs\/|\/@orpc\/server\//.test(path)), false);
	assert.equal(dependencies.filter(path => /\/valibot\//.test(path)).length, 1);
	console.log(`Browser API bundle: ${bundle.outputFiles[0].contents.length} bytes, ${inputs.length} modules; portable routing helper and error DTO only`);
});
