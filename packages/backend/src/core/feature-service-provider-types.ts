/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ExistingProvider, Provider } from '@nestjs/common';
import type { Definitions, Feature, Port } from '../../../features/index/backend/service-definitions.js';

type Constructor = new (...args: never[]) => object;
type PortValue<P> = P extends Port<string, infer V> ? V : never;
/** The target instance must satisfy the port, not the reverse. */
export function bindLegacyService<const P extends Port, C extends Constructor>(
	port: P, target: C, ..._proof: InstanceType<NoInfer<C>> extends PortValue<P> ? [] : [never]
): ExistingProvider {
	return { provide: port.token, useExisting: target };
}
export function toNestProviders<const D extends Definitions>(name: string, feature: Feature<D>, bindings: readonly ExistingProvider[] = []) {
	const featureToken = Symbol(`${name} services`);
	const entries = Object.entries(feature.definitions);
	const providers: Provider[] = [{
		provide: featureToken,
		inject: feature.ports.map(port => bindings.find(binding => binding.provide === port.token)?.useExisting ?? port.token),
		useFactory: (...values: unknown[]) => {
			const inputs = Object.fromEntries(feature.ports.map((port, index) => [port.name, values[index]]));
			return (feature.create as (input: object) => object)(inputs);
		},
	}, ...entries.flatMap(([key, definition]): Provider[] => [{
		provide: definition.ctor,
		inject: [featureToken],
		useFactory: (services: Record<string, object>) => services[key],
	}, { provide: key, useExisting: definition.ctor }])];
	return { providers, exports: entries.flatMap(([key, definition]) => [definition.ctor, key]) };
}
