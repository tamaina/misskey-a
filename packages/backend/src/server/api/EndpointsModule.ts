/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';

import { CoreModule } from '@/core/CoreModule.js';
import { featureProviders, featureTokens } from './feature-providers.js';
import * as endpointsObject from './endpoint-list.js';
import { GetterService } from './GetterService.js';
import { ApiLoggerService } from './ApiLoggerService.js';
import type { Provider } from '@nestjs/common';

const endpoints = Object.entries(endpointsObject);
const endpointProviders = endpoints.map(([path, endpoint]): Provider => {
	if ('createEndpoint' in endpoint) {
		return { provide: `ep:${path}`, inject: [featureTokens[endpoint.feature]], useFactory: endpoint.createEndpoint };
	}

	// Feature-owned endpoint classes expose their real constructor by its canonical
	// name. The remaining eight host-owned class endpoints keep their default export.
	const implementation = 'EndpointImplementation' in endpoint ? endpoint.EndpointImplementation : endpoint.default;
	return { provide: `ep:${path}`, useClass: implementation };
});

@Module({
	imports: [
		CoreModule,
	],
	providers: [
		GetterService,
		ApiLoggerService,
		...featureProviders,
		...endpointProviders,
	],
	exports: [
		...endpointProviders,
	],
})
export class EndpointsModule {}
