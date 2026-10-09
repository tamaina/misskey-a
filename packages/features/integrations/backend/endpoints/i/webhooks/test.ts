/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { WebhookTestService } from '../../../services/WebhookTestService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { iWebhooksTestErrors, iWebhooksTestContract } from './test.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../../api/backend/transport/context.js';
import ms from 'ms';
export interface IWebhooksTestDependencies {
	webhookTestService: Pick<WebhookTestService, 'testUserWebhook'>;
}
export function createIWebhooksTestProcedure(deps: IWebhooksTestDependencies) {
	return implement(iWebhooksTestContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({
			name: 'i/webhooks/test', requireCredential: true, secure: true, kind: 'read:account', limit: {
				duration: ms('15min'),
				max: 60,
			}
		}))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const result = await (async () => {
				try {
					await deps.webhookTestService.testUserWebhook({
						webhookId: ps.webhookId,
						type: ps.type,
						override: ps.override,
					}, me);
				} catch (e) {
					if (e instanceof WebhookTestService.NoSuchWebhookError) {
						throw apiError(iWebhooksTestErrors.noSuchWebhook);
					}
					throw e;
				}
			})();
			return v.parse(requiredSchema(iWebhooksTestContract['~orpc'].outputSchema), result);
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
