/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: MIT
 */
import type * as v from 'valibot';
import { expectAssignable, expectNotAssignable } from 'tsd';
import type { adminDriveShowFileInput, adminDriveShowFileContract } from '../built/contracts/drive/backend/endpoints/admin/drive/show-file.contract.js';
import type { driveFilesShowInput } from '../built/contracts/drive/backend/endpoints/drive/files/show.contract.js';
import type { selectorIRevokeTokenInput } from '../built/contracts/auth/backend/auth.schema.js';
import type { pagesShowInput } from '../built/contracts/pages/backend/endpoints/pages/show.contract.js';
import type { InferContractRouterOutputs } from '@orpc/contract';
import type { PackedJsonValue } from '../built/contracts/users/backend/json-value.schema.js';
import type { ContractEndpoints } from '../built/contract.types.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Admin = v.InferInput<typeof adminDriveShowFileInput>;
type File = v.InferInput<typeof driveFilesShowInput>;
type Token = v.InferInput<typeof selectorIRevokeTokenInput>;
type Page = v.InferInput<typeof pagesShowInput>;
export type Cases = [
 Assert<Equal<ContractEndpoints['admin/drive/show-file']['req'], Admin>>,
 Assert<Equal<ContractEndpoints['drive/files/show']['req'], File>>,
 Assert<Equal<ContractEndpoints['i/revoke-token']['req'], Token>>,
 Assert<Equal<ContractEndpoints['pages/show']['req'], Page>>,
 Assert<Equal<InferContractRouterOutputs<typeof adminDriveShowFileContract>['requestHeaders'], Record<string, PackedJsonValue> | null>>,
];
// At least one selector must validate; an inactive known selector is preserved as finite JSON.
expectAssignable<Admin>({fileId:'abc'});
expectAssignable<Admin>({url:'https://example.test/file',fileId:42});
expectAssignable<File>({fileId:'abc',url:42});
expectNotAssignable<File>({fileId:42});
expectNotAssignable<File>({url:null});
expectNotAssignable<Admin>({});
expectAssignable<Token>({tokenId:'abc'});
expectAssignable<Token>({token:null});
expectAssignable<Token>({token:'opaque',tokenId:{legacy:true}});
expectNotAssignable<Token>({token:undefined});
expectNotAssignable<Token>({tokenId:null});
expectAssignable<Page>({pageId:'abc'});
expectAssignable<Page>({name:'page',username:'alice',pageId:null});
expectNotAssignable<Page>({name:'page'});
expectNotAssignable<Page>({pageId:null});
expectNotAssignable<Page>({name:'page',username:'alice',pageId:new Date()});
