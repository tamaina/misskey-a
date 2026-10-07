import type { InferContractRouterInputs } from '@orpc/contract';
import type * as v from 'valibot';
import type { Endpoints } from '../src/api.types.js';
import type { ContractEndpoints } from '../src/contract.types.js';
import type { DriveFilesCreateRequest } from '../src/autogen/entities.js';
import { APIClient } from '../src/api.js';
import type { driveFileCreateContracts, driveFilesCreateInput, driveFilesCreateWireInput, NativeDriveFileCreateEndpoints } from '../built/contracts/drive/contract/create-endpoint-definition.js';
import type { Packed } from '../built/contracts/index/contract/packed.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends 1 & T ? true : false;
type DeclaredFields<T> = { [K in keyof T as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: T[K] };
type Native = NativeDriveFileCreateEndpoints['drive/files/create'];
type Router = InferContractRouterInputs<typeof driveFileCreateContracts>['drive/files/create'];
type A1 = Assert<Equal<Router['file'], Blob>>;
type A2 = Assert<Equal<v.InferInput<typeof driveFilesCreateWireInput>['file'], Blob>>;
type A3 = Assert<Equal<ContractEndpoints['drive/files/create']['req']['file'], Blob>>;
type A4 = Assert<Equal<Endpoints['drive/files/create']['req']['file'], Blob>>;
type A5 = Assert<Equal<DriveFilesCreateRequest, Endpoints['drive/files/create']['req']>>;
type A6 = Assert<Equal<Native['res'], Packed<'DriveFile'>>>;
type A7 = Assert<Equal<Endpoints['drive/files/create']['res'], Packed<'DriveFile'>>>;
type A8 = Assert<Equal<IsAny<Router['file']>, false>>;
type A9 = Assert<Equal<'file' extends keyof DeclaredFields<v.InferOutput<typeof driveFilesCreateInput>> ? true : false, false>>;
type A10 = Assert<Equal<v.InferOutput<typeof driveFilesCreateInput>['force'], boolean>>;
type A11 = Assert<Equal<v.InferOutput<typeof driveFilesCreateInput>['comment'], string | null>>;
const blob: Endpoints['drive/files/create']['req'] = { file: new Blob([]) };
const named: Endpoints['drive/files/create']['req'] = { file: new File([], 'named.txt'), folderId: null, name: null, comment: null, force: false, isSensitive: true };
// @ts-expect-error The native multipart request requires file.
const absent: Endpoints['drive/files/create']['req'] = {};
// @ts-expect-error The native multipart request requires binary contents.
const text: Endpoints['drive/files/create']['req'] = { file: 'contents' };
// @ts-expect-error The backend temp-file descriptor is not a native wire Blob.
const descriptor: Endpoints['drive/files/create']['req'] = { file: { name: 'named.txt', path: '/tmp/file' } };
// @ts-expect-error Null does not satisfy the required native binary field.
const nullable: Endpoints['drive/files/create']['req'] = { file: null };
// @ts-expect-error Undefined does not satisfy the required native binary field.
const undefinedFile: Endpoints['drive/files/create']['req'] = { file: undefined };
const client = new APIClient({ origin: 'https://multipart.test' });
const response: Promise<Packed<'DriveFile'>> = client.request('drive/files/create', blob);
client.request('drive/files/create', named);
// @ts-expect-error Explicit attrs-only requests remain invalid; no-argument behavior is outside scope.
client.request('drive/files/create', {});
