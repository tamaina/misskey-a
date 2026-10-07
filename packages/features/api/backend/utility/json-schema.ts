/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { packedSchemas } from '@features/index/contract/packed.js';

type TypeStringef = 'null' | 'boolean' | 'integer' | 'number' | 'string' | 'array' | 'object' | 'any';
type StringDefToType<T extends TypeStringef> =
	T extends 'null' ? null :
	T extends 'boolean' ? boolean :
	T extends 'integer' ? number :
	T extends 'number' ? number :
	T extends 'string' ? string | Date :
	T extends 'array' ? ReadonlyArray<any> :
	T extends 'object' ? Record<string, any> :
	any;

// https://swagger.io/specification/?sbsearch=optional#schema-object
type OfSchema = {
	readonly anyOf?: ReadonlyArray<Schema>;
	readonly oneOf?: ReadonlyArray<Schema>;
	readonly allOf?: ReadonlyArray<Schema>;
};

export interface Schema extends OfSchema {
	readonly type?: TypeStringef;
	readonly nullable?: boolean;
	readonly optional?: boolean;
	readonly prefixItems?: ReadonlyArray<Schema>;
	readonly items?: Schema;
	readonly unevaluatedItems?: Schema | boolean;
	readonly properties?: Obj;
	readonly required?: ReadonlyArray<Extract<keyof NonNullable<this['properties']>, string>>;
	readonly description?: string;
	readonly example?: any;
	readonly format?: string;
	readonly ref?: keyof typeof packedSchemas;
	readonly selfRef?: boolean;
	readonly enum?: ReadonlyArray<string | null>;
	readonly default?: (this['type'] extends TypeStringef ? StringDefToType<this['type']> : any) | null;
	readonly maxLength?: number;
	readonly minLength?: number;
	readonly maximum?: number;
	readonly minimum?: number;
	readonly pattern?: string;
	readonly additionalProperties?: Schema | boolean;
}

// JSON metadata only: handler payload types come from native contracts.
export type Obj = Record<string, Schema>;
