/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Compile-only integration target: packages/backend/test/fixtures/backend-selector-type-proof.ts.
// Use the actual configured backend compiler options; never execute this file.
import type * as v from 'valibot';
import type { SchemaType } from '../../src/misc/json-schema.js';
import type { ContractEndpointInput, LegacyDeclaredInput } from '../../src/server/api/contract-endpoint.js';
import type { selectorAdminDriveShowFileInput, selectorDriveFilesShowInput } from '../../../features/drive/contract/selector-endpoint-definitions.js';
import type { selectorIRevokeTokenInput } from '../../../features/auth/contract/selector-endpoint-definitions.js';
import type { selectorPagesShowInput } from '../../../features/pages/contract/selector-endpoint-definitions.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Extends<A, B> = [A] extends [B] ? true : false;

// Captured verbatim request type shapes from legacy-sdk-request-shapes.json.
type CapturedAdminFile = { fileId: string } | { url: string };
type CapturedFile = { fileId: string } | { url: string };
type CapturedToken = { tokenId: string } | { token: string | null };
type CapturedPage = { pageId: string } | { name: string; username: string };

// Captured old paramDefs. Avoid importing the legacy database-backed handlers.
const legacyFileParamDef = { anyOf: [
	{ type: 'object', properties: { fileId: { type: 'string', format: 'misskey:id' } }, required: ['fileId'] },
	{ type: 'object', properties: { url: { type: 'string' } }, required: ['url'] },
] } as const;
const legacyTokenParamDef = { anyOf: [
	{ type: 'object', properties: { tokenId: { type: 'string', format: 'misskey:id' } }, required: ['tokenId'] },
	{ type: 'object', properties: { token: { type: 'string', nullable: true } }, required: ['token'] },
] } as const;
const legacyPageParamDef = { anyOf: [
	{ type: 'object', properties: { pageId: { type: 'string', format: 'misskey:id' } }, required: ['pageId'] },
	{ type: 'object', properties: { name: { type: 'string' }, username: { type: 'string' } }, required: ['name', 'username'] },
] } as const;

type BeforeAdminFile = SchemaType<typeof legacyFileParamDef>;
type BeforeFile = SchemaType<typeof legacyFileParamDef>;
type BeforeToken = SchemaType<typeof legacyTokenParamDef>;
type BeforePage = SchemaType<typeof legacyPageParamDef>;
type NativeAdminFile = v.InferOutput<typeof selectorAdminDriveShowFileInput>;
type NativeFile = v.InferOutput<typeof selectorDriveFilesShowInput>;
type NativeToken = v.InferOutput<typeof selectorIRevokeTokenInput>;
type NativePage = v.InferOutput<typeof selectorPagesShowInput>;
type AfterAdminFile = ContractEndpointInput<typeof selectorAdminDriveShowFileInput, 'legacy-declared'>;
type AfterFile = ContractEndpointInput<typeof selectorDriveFilesShowInput, 'legacy-declared'>;
type AfterToken = ContractEndpointInput<typeof selectorIRevokeTokenInput, 'legacy-declared'>;
type AfterPage = ContractEndpointInput<typeof selectorPagesShowInput, 'legacy-declared'>;

// Old backend intersections and opt-in handler types are structurally equivalent.
export type SelectorTypeAssertions = [
	Assert<Extends<BeforeAdminFile, AfterAdminFile>>, Assert<Extends<AfterAdminFile, BeforeAdminFile>>,
	Assert<Extends<BeforeFile, AfterFile>>, Assert<Extends<AfterFile, BeforeFile>>,
	Assert<Extends<BeforeToken, AfterToken>>, Assert<Extends<AfterToken, BeforeToken>>,
	Assert<Extends<BeforePage, AfterPage>>, Assert<Extends<AfterPage, BeforePage>>,
	Assert<Equal<AfterAdminFile, CapturedAdminFile>>, Assert<Equal<AfterFile, CapturedFile>>,
	Assert<Equal<AfterToken, CapturedToken>>, Assert<Equal<AfterPage, CapturedPage>>,
	Assert<Equal<ContractEndpointInput<typeof selectorAdminDriveShowFileInput>, NativeAdminFile>>,
	Assert<Equal<ContractEndpointInput<typeof selectorDriveFilesShowInput, 'native'>, NativeFile>>,
	Assert<Equal<ContractEndpointInput<typeof selectorIRevokeTokenInput>, NativeToken>>,
	Assert<Equal<ContractEndpointInput<typeof selectorPagesShowInput>, NativePage>>,
	Assert<Equal<NativeAdminFile['fileId'], unknown>>, Assert<Equal<NativeFile['fileId'], unknown>>,
	Assert<Equal<NativeToken['tokenId'], unknown>>, Assert<Equal<NativePage['pageId'], unknown>>,
	Assert<Equal<string extends keyof NativeFile ? true : false, true>>,
	Assert<Equal<string extends keyof AfterFile ? true : false, false>>,
	Assert<Equal<LegacyDeclaredInput<Record<string, unknown>>, Record<string, unknown>>>,
	Assert<Equal<LegacyDeclaredInput<{ [key: string]: unknown; required: string; optional?: string }>, { required: string; optional?: string }>>,
	Assert<Equal<LegacyDeclaredInput<string | null>, string | null>>,
];

// @ts-expect-error Handler mode is a closed choice, not an arbitrary caller-provided parameter type.
export type UnsupportedHandlerMode = ContractEndpointInput<typeof selectorDriveFilesShowInput, { fileId: string }>;

export function nativePresenceFixtures(admin: NativeAdminFile, file: NativeFile, token: NativeToken, page: NativePage): void {
	if ('fileId' in admin) {
		// @ts-expect-error Presence does not prove which union branch validated.
		const id: string = admin.fileId; void id;
	}
	if ('fileId' in file) {
		const isUnknown: Assert<Equal<typeof file.fileId, unknown>> = true; void isUnknown;
		// @ts-expect-error The URL branch permits an unknown fileId extra.
		const id: string = file.fileId; void id;
	} else { const url: string = file.url; void url; }
	if ('tokenId' in token) {
		// @ts-expect-error The nullable-token branch permits an unknown tokenId extra.
		const id: string = token.tokenId; void id;
	} else { const value: string | null = token.token; void value; }
	if ('pageId' in page) {
		// @ts-expect-error The name/username branch permits an unknown pageId extra.
		const id: string = page.pageId; void id;
	} else { const name: string = page.name; const username: string = page.username; void name; void username; }
}

export function legacyPresenceFixtures(before: BeforeFile, admin: AfterAdminFile, file: AfterFile, token: AfterToken, page: AfterPage): void {
	if ('fileId' in before) { const id: string = before.fileId; void id; }
	if ('fileId' in admin) { const id: string = admin.fileId; void id; }
	if ('fileId' in file) { const id: string = file.fileId; void id; } else { const url: string = file.url; void url; }
	if ('tokenId' in token) { const id: string = token.tokenId; void id; } else { const value: string | null = token.token; void value; }
	if ('pageId' in page) { const id: string = page.pageId; void id; } else { const name: string = page.name; const username: string = page.username; void name; void username; }
	// Structural compatibility deliberately reproduces the old assumption; it is not validation proof.
	const inactiveSelector = { fileId: 42, url: 'ok' };
	const beforeInactive: BeforeFile = inactiveSelector;
	const afterInactive: AfterFile = inactiveSelector;
	void beforeInactive; void afterInactive;
}
