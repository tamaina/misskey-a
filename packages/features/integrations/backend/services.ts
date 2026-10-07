/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { ports } from '../../index/backend/service-ports.js';
import { SystemWebhookEntityService } from './serializers/SystemWebhookEntityService.js';
import type { Inputs, Outputs } from '../../index/backend/service-definitions.js';

export const integrationServices = defineServices({
	SystemWebhookEntityService: service(SystemWebhookEntityService, [ports.systemWebhooksRepository]),
});
export const createIntegrationServices = integrationServices.create;
export type IntegrationServicesDependencies = Inputs<typeof integrationServices>;
export type IntegrationServices = Outputs<typeof integrationServices>;
