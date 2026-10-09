/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { registryGetContract } from './endpoints/i/registry/get.contract.js';
import { registryGetAllContract } from './endpoints/i/registry/get-all.contract.js';
import { registryGetDetailContract } from './endpoints/i/registry/get-detail.contract.js';
import { registryKeysContract } from './endpoints/i/registry/keys.contract.js';
import { registryKeysWithTypeContract } from './endpoints/i/registry/keys-with-type.contract.js';
import { registryRemoveContract } from './endpoints/i/registry/remove.contract.js';
import { registryScopesWithDomainContract } from './endpoints/i/registry/scopes-with-domain.contract.js';
import { registrySetContract } from './endpoints/i/registry/set.contract.js';

export const preferencesContract = {
	get: registryGetContract,
	getAll: registryGetAllContract,
	getDetail: registryGetDetailContract,
	keys: registryKeysContract,
	keysWithType: registryKeysWithTypeContract,
	remove: registryRemoveContract,
	scopesWithDomain: registryScopesWithDomainContract,
	set: registrySetContract,
};
