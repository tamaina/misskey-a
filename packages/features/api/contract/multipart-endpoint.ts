/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Route, AnyContractProcedure } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from './definition.js';
import { jsonObject } from './json-object.js';

export interface MultipartEndpointContractRegistration {
	readonly input: v.GenericSchema;
	readonly output: v.GenericSchema;
	readonly wireInput: v.GenericSchema;
	readonly contract: AnyContractProcedure;
	readonly file: v.BlobSchema<undefined>;
}

const multipartDefinitions = new WeakMap<object, MultipartEndpointContractRegistration>();

/** Own the legacy attributes and required native Blob without changing upload transport. */
export function defineMultipartEndpointContract<const Entries extends v.ObjectEntries, Output extends v.GenericSchema>(
	route: Route,
	attributes: Entries & { readonly file?: never },
	output: Output,
) {
	if (attributes === null || typeof attributes !== 'object' || Array.isArray(attributes)) {
		throw new Error('Multipart contract attributes require an entry map');
	}
	if (Object.hasOwn(attributes, 'file')) {
		throw new Error('Multipart contract attributes cannot declare the reserved file field');
	}
	const input = jsonObject<Entries>(attributes);
	const file = Object.freeze(v.blob());
	const wireInput = jsonObject({ ...input.entries, file });
	const { contract } = defineEndpointContract(route, wireInput, output);
	const definition = Object.freeze({ input, output, wireInput, transport: 'multipart/form-data', contract } as const);
	multipartDefinitions.set(definition, Object.freeze({ input, output, wireInput, contract, file }));
	return definition;
}

/** Only the exact frozen bundle minted by the multipart factory is supported. */
export function getMultipartEndpointContractRegistration(definition: object): MultipartEndpointContractRegistration | undefined {
	return multipartDefinitions.get(definition);
}
