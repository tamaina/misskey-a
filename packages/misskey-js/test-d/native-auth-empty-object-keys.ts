import type { Endpoints } from '../src/api.types.js';
import type { ContractEndpoints } from '../src/contract.types.js';
import type { EmptyResponse, I2faRemoveKeyRequest, I2faUpdateKeyRequest } from '../src/autogen/entities.js';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import type { authContract } from '../built/contracts/auth/backend/api.contract.js';
type AuthInputs = InferContractRouterInputs<typeof authContract>;
type AuthOutputs = InferContractRouterOutputs<typeof authContract>;
type EmptyObjectKeyEndpoints = { [Name in keyof AuthInputs]: { req: AuthInputs[Name]; res: AuthOutputs[Name] } };

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends 1 & T ? true : false;

type R1 = Assert<Equal<{ [Key in keyof Endpoints['i/2fa/remove-key']['req']]: Endpoints['i/2fa/remove-key']['req'][Key] }, { password: string; token?: string | null | undefined; credentialId: string }>>;
type R2 = Assert<Equal<{ [Key in keyof Endpoints['i/2fa/update-key']['req']]: Endpoints['i/2fa/update-key']['req'][Key] }, { name: string; credentialId: string }>>;
type R3 = Assert<Equal<I2faRemoveKeyRequest, Endpoints['i/2fa/remove-key']['req']>>;
type R4 = Assert<Equal<I2faUpdateKeyRequest, Endpoints['i/2fa/update-key']['req']>>;
type O1 = Assert<Endpoints['i/2fa/remove-key']['res'] extends object ? true : false>;
type O2 = Assert<object extends Endpoints['i/2fa/update-key']['res'] ? true : false>;
type O3 = Assert<Equal<ContractEndpoints['i/2fa/remove-key']['res'], EmptyObjectKeyEndpoints['i/2fa/remove-key']['res']>>;
type O4 = Assert<Equal<ContractEndpoints['i/2fa/update-key']['res'], EmptyObjectKeyEndpoints['i/2fa/update-key']['res']>>;
type O5 = Assert<Equal<IsAny<EmptyObjectKeyEndpoints['i/2fa/remove-key']['res']>, false>>;
type O6 = Assert<Equal<EmptyResponse, Record<string, unknown> | undefined>>;
type O7 = Assert<Equal<undefined extends Endpoints['i/2fa/remove-key']['res'] ? true : false, false>>;
type O9 = Assert<object extends Endpoints['i/2fa/remove-key']['res'] ? true : false>;
type O10 = Assert<Endpoints['i/2fa/update-key']['res'] extends object ? true : false>;
type O8 = Assert<Equal<string extends keyof Endpoints['i/2fa/update-key']['res'] ? true : false, false>>;

const remove: I2faRemoveKeyRequest = { password: 'p', token: undefined, credentialId: 'base64url-_' };
const update: I2faUpdateKeyRequest = { name: 'Name', credentialId: 'base64url-_' };
const removeResult: Endpoints['i/2fa/remove-key']['res'] = {};
const updateResult: Endpoints['i/2fa/update-key']['res'] = {};
// @ts-expect-error No undefined response is promised by these actual object-returning handlers.
const undefinedResult: Endpoints['i/2fa/remove-key']['res'] = undefined;
// Empty finite outputs have no public fields. Primitive rejection belongs to the runtime
// validator: TypeScript's empty structural type cannot encode that JSON object check.
type EmptyResultKeys = Assert<Equal<keyof Endpoints['i/2fa/update-key']['res'], never>>;
// @ts-expect-error Required credentialId stays required.
const missingRemove: I2faRemoveKeyRequest = { password: 'p' };
// @ts-expect-error The SDK strips only the opaque request index.
const opaqueUpdate: I2faUpdateKeyRequest = { name: 'Name', credentialId: 'id', future: true };
