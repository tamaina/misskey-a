import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkPortableContracts } from '../check-portable-contracts.mjs';

test('package import boundary rejects server imports, type-only escapes and dynamic loading', async () => {
	const features = await mkdtemp(join(tmpdir(), 'misskey-portable-'));
	try {
		await mkdir(join(features, 'api/shared'), { recursive: true });
		await writeFile(join(features, 'api/shared/api-routing.ts'), "import { isContractProcedure } from '@orpc/contract';");
		await writeFile(join(features, 'dto.schema.ts'), "import * as v from 'valibot'; export const dto = v.string();");
		for (const source of [
			"import type { User } from '@nestjs/common';",
			"type User = import('typeorm').Entity;",
			"export * from './implementation.js';",
			"import './missing.schema.js';",
			"import '../escaped.contract.js';",
			"import('./dto.schema.js');",
			"require('./dto.schema.js');",
		]) {
			await writeFile(join(features, 'test.contract.ts'), source);
			assert.ok(checkPortableContracts(features).errors.length > 0, source);
		}
		await writeFile(join(features, 'test.contract.ts'), "export { dto } from './dto.schema.js';");
		await writeFile(join(features, 'api.definition.ts'), "export { dto } from './dto.schema.js';");
		assert.deepEqual(checkPortableContracts(features).errors, []);
		await writeFile(join(features, 'api.definition.ts'), "import type { User } from '@nestjs/common';");
		assert.ok(checkPortableContracts(features).errors.length > 0);
		await writeFile(join(features, 'api.definition.ts'), "export { dto } from './dto.schema.js';");
		assert.deepEqual(checkPortableContracts(features).errors, []);
		await mkdir(join(features, 'api/backend/transport'), { recursive: true });
		await writeFile(join(features, 'api/backend/transport/policy.types.ts'), "import type { InferOutput } from 'valibot'; import type { dto } from '../../../dto.schema.js'; export type Dto = InferOutput<typeof dto>;");
		await writeFile(join(features, 'api.definition.ts'), "import type { Dto } from './api/backend/transport/policy.types.js'; export type Input = Dto;");
		assert.deepEqual(checkPortableContracts(features).errors, []);
		await writeFile(join(features, 'api.definition.ts'), "import type { Dto } from './arbitrary.types.js';");
		await writeFile(join(features, 'arbitrary.types.ts'), "export type Dto = string;");
		assert.ok(checkPortableContracts(features).errors.length > 0);
		await writeFile(join(features, 'api.definition.ts'), "import type { Dto } from './api/backend/transport/policy.types.js'; export type Input = Dto;");
		await writeFile(join(features, 'api/backend/transport/policy.types.ts'), "import type { User } from '@nestjs/common';");
		assert.ok(checkPortableContracts(features).errors.length > 0);
		await writeFile(join(features, 'api/backend/transport/policy.types.ts'), "type Entity = import('typeorm').Entity;");
		assert.ok(checkPortableContracts(features).errors.length > 0);
		await writeFile(join(features, 'api/backend/transport/policy.types.ts'), "export type Dto = string;");
		assert.deepEqual(checkPortableContracts(features).errors, []);
		await writeFile(join(features, 'api/shared/api-routing.ts'), "import fs from 'node:fs';");
		assert.ok(checkPortableContracts(features).errors.length > 0);
	} finally { await rm(features, { recursive: true, force: true }); }
});
