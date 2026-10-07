/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { ports } from '../../index/backend/service-ports.js';
import { RegistryApiService } from './services/RegistryApiService.js';
import type { Inputs, Outputs } from '../../index/backend/service-definitions.js';

export const preferencesServices = defineServices({
	RegistryApiService: service(RegistryApiService, [ports.registryItemsRepository, ports.idService, ports.globalEventService]),
});
export const createPreferencesServices = preferencesServices.create;
export type PreferencesServicesDependencies = Inputs<typeof preferencesServices>;
export type PreferencesServices = Outputs<typeof preferencesServices>;
