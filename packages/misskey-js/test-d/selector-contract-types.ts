// Compile-only integration target: packages/misskey-js/test-d/selector-contract-types.ts.
// Use SDK strict options, including exactOptionalPropertyTypes: true; never execute this file.
import type * as v from 'valibot';
import type { selectorAdminDriveShowFileInput, selectorAdminDriveShowFileOutput, selectorDriveFilesShowInput } from '../built/contracts/drive/contract/selector-endpoint-definitions.js';
import type { selectorIRevokeTokenInput } from '../built/contracts/auth/contract/selector-endpoint-definitions.js';
import type { selectorPagesShowInput } from '../built/contracts/pages/contract/selector-endpoint-definitions.js';
import type { ContractEndpoints } from '../src/contract.types.js';
import type { operations } from '../src/autogen/types.js';
import type { AdminDriveShowFileRequest, AdminDriveShowFileResponse, DriveFilesShowRequest, IRevokeTokenRequest, PagesShowRequest } from '../src/autogen/entities.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

// Captured verbatim request type shapes from legacy-sdk-request-shapes.json.
type CapturedAdminFile = { fileId: string } | { url: string };
type CapturedFile = { fileId: string } | { url: string };
type CapturedToken = { tokenId: string } | { token: string | null };
type CapturedPage = { pageId: string } | { name: string; username: string };

type NativeAdminFile = v.InferInput<typeof selectorAdminDriveShowFileInput>;
type NativeFile = v.InferInput<typeof selectorDriveFilesShowInput>;
type NativeToken = v.InferInput<typeof selectorIRevokeTokenInput>;
type NativePage = v.InferInput<typeof selectorPagesShowInput>;

// Exact equality uses the actual unchanged RequestFields mapping and public SDK aliases.
export type SelectorTypeAssertions = [
	// Intentional correction: the old SDK generator represented this opaque object as an empty map.
	Assert<Equal<operations['admin___drive___show-file']['responses']['200']['content']['application/json']['requestHeaders'], Record<string, never> | null>>,
	Assert<Equal<v.InferOutput<typeof selectorAdminDriveShowFileOutput>['requestHeaders'], Record<string, unknown> | null>>,
	Assert<Equal<ContractEndpoints['admin/drive/show-file']['res']['requestHeaders'], Record<string, unknown> | null>>,
	Assert<Equal<AdminDriveShowFileResponse['requestHeaders'], Record<string, unknown> | null>>,
	Assert<Equal<operations['admin___drive___show-file']['requestBody']['content']['application/json'], CapturedAdminFile>>,
	Assert<Equal<operations['drive___files___show']['requestBody']['content']['application/json'], CapturedFile>>,
	Assert<Equal<operations['i___revoke-token']['requestBody']['content']['application/json'], CapturedToken>>,
	Assert<Equal<operations['pages___show']['requestBody']['content']['application/json'], CapturedPage>>,
	Assert<Equal<ContractEndpoints['admin/drive/show-file']['req'], CapturedAdminFile>>,
	Assert<Equal<ContractEndpoints['drive/files/show']['req'], CapturedFile>>,
	Assert<Equal<ContractEndpoints['i/revoke-token']['req'], CapturedToken>>,
	Assert<Equal<ContractEndpoints['pages/show']['req'], CapturedPage>>,
	Assert<Equal<AdminDriveShowFileRequest, CapturedAdminFile>>,
	Assert<Equal<DriveFilesShowRequest, CapturedFile>>,
	Assert<Equal<IRevokeTokenRequest, CapturedToken>>,
	Assert<Equal<PagesShowRequest, CapturedPage>>,
	Assert<Equal<NativeAdminFile, v.InferOutput<typeof selectorAdminDriveShowFileInput>>>,
	Assert<Equal<NativeFile, v.InferOutput<typeof selectorDriveFilesShowInput>>>,
	Assert<Equal<NativeToken, v.InferOutput<typeof selectorIRevokeTokenInput>>>,
	Assert<Equal<NativePage, v.InferOutput<typeof selectorPagesShowInput>>>,
	Assert<Equal<NativeAdminFile['fileId'], unknown>>, Assert<Equal<NativeFile['fileId'], unknown>>,
	Assert<Equal<NativeToken['tokenId'], unknown>>, Assert<Equal<NativePage['pageId'], unknown>>,
	Assert<Equal<string extends keyof NativeFile ? true : false, true>>,
	Assert<Equal<string extends keyof ContractEndpoints['drive/files/show']['req'] ? true : false, false>>,
];

declare function nativeAdminFile(value: v.InferInput<typeof selectorAdminDriveShowFileInput>): void;
declare function nativeFile(value: v.InferInput<typeof selectorDriveFilesShowInput>): void;
declare function nativeToken(value: v.InferInput<typeof selectorIRevokeTokenInput>): void;
declare function nativePage(value: v.InferInput<typeof selectorPagesShowInput>): void;

export function requestBranchFixtures(): void {
	nativeAdminFile({ fileId: 'abc' }); nativeAdminFile({ url: 'ok' });
	nativeFile({ fileId: 'abc' }); nativeFile({ url: 'ok' });
	nativeToken({ tokenId: 'abc' }); nativeToken({ token: 'opaque' }); nativeToken({ token: null });
	nativePage({ pageId: 'abc' }); nativePage({ name: 'page', username: 'alice' });
	// Inactive selector fields are unknown extras, including values invalid for the other branch.
	nativeAdminFile({ fileId: 42, url: 'ok' }); nativeFile({ fileId: 'abc', url: 42 });
	nativeToken({ tokenId: 42, token: null }); nativePage({ pageId: 42, name: 'page', username: 'alice' });
	// @ts-expect-error At least one required admin-file branch is necessary.
	nativeAdminFile({});
	// @ts-expect-error An invalid fileId alone satisfies neither branch.
	nativeFile({ fileId: 42 });
	// @ts-expect-error A null URL alone is not a selector.
	nativeFile({ url: null });
	// @ts-expect-error Neither token selector may be absent.
	nativeToken({});
	// @ts-expect-error The nullable token still must be present and non-undefined.
	nativeToken({ token: undefined });
	// @ts-expect-error Only the token value branch is nullable.
	nativeToken({ tokenId: null });
	// @ts-expect-error Named pages require username as well as name.
	nativePage({ name: 'page' });
	// @ts-expect-error Named pages require name as well as username.
	nativePage({ username: 'alice' });
	// @ts-expect-error Neither page selector branch accepts a null pageId alone.
	nativePage({ pageId: null });
}

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

declare function sdkAdminFile(value: AdminDriveShowFileRequest): void;
declare function sdkFile(value: DriveFilesShowRequest): void;
declare function sdkToken(value: IRevokeTokenRequest): void;
declare function sdkPage(value: PagesShowRequest): void;

export function sdkDeclaredBranchFixtures(): void {
	sdkAdminFile({ fileId: 'abc' }); sdkAdminFile({ url: 'ok' });
	sdkFile({ fileId: 'abc' }); sdkFile({ url: 'ok' });
	sdkToken({ tokenId: 'abc' }); sdkToken({ token: 'opaque' }); sdkToken({ token: null });
	sdkPage({ pageId: 'abc' }); sdkPage({ name: 'page', username: 'alice' });
	// @ts-expect-error At least one declared selector branch is necessary.
	sdkAdminFile({});
	// @ts-expect-error A URL alone cannot be null.
	sdkFile({ url: null });
	// @ts-expect-error Required nullable token is not optional and does not allow undefined.
	sdkToken({ token: undefined });
	// @ts-expect-error A named page still requires username.
	sdkPage({ name: 'page' });
}

export function opaqueHeaderTypeFixture(value: AdminDriveShowFileResponse): void {
	const headers: Record<string, unknown> | null = value.requestHeaders;
	if (headers !== null) {
		const extension: unknown = headers['x-extension'];
		// @ts-expect-error An arbitrary header extension has not been validated as a string.
		const assumedString: string = headers['x-extension'];
		void extension; void assumedString;
	}
}
