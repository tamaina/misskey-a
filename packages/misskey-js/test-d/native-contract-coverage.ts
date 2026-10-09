import type { ContractEndpoints } from '../src/contract.types.js';
import type { Endpoints as GeneratedEndpoints } from '../src/autogen/endpoint.js';

type AssertNever<T extends never> = T;

// Every registered HTTP route must have a feature-owned native contract.
// Keep both directions: a new route cannot silently fall back to generated types,
// and a removed route cannot linger in the portable contract registry.
type MissingNativeRoutes = AssertNever<Exclude<keyof GeneratedEndpoints, keyof ContractEndpoints>>;
type UnregisteredNativeRoutes = AssertNever<Exclude<keyof ContractEndpoints, keyof GeneratedEndpoints>>;
