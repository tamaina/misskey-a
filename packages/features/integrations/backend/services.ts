/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SystemWebhookEntityService } from './serializers/SystemWebhookEntityService.js';
import type { SystemWebhooksRepository } from '@/models/_.js';

export interface IntegrationServicesDependencies {
	systemWebhooksRepository: SystemWebhooksRepository;
}

/** Compose this feature without starting resources or resolving a container. */
export function createIntegrationServices(deps: IntegrationServicesDependencies) {
	const systemWebhookEntityService = new SystemWebhookEntityService(deps.systemWebhooksRepository);

	return {
		SystemWebhookEntityService: systemWebhookEntityService,
	};
}

export type IntegrationServices = ReturnType<typeof createIntegrationServices>;
