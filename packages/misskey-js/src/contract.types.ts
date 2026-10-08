import type { FeatureEndpoints } from '#feature-contracts/index';
import type { PilotEndpoints } from './pilot.types.js';

/** Keep declared request fields usable with Pick/Omit while transport retains extra keys. */
type DeclaredFields<T> = {
	[K in keyof T as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: T[K];
};
type RequestFields<T> = T extends object
	? keyof DeclaredFields<T> extends never ? T & object : DeclaredFields<T>
	: T;

type LegacyContractEndpoints = {
	[K in keyof FeatureEndpoints]: {
		req: RequestFields<FeatureEndpoints[K]['req']>;
		res: FeatureEndpoints[K]['res'];
	};
};

export type ContractEndpoints = Omit<LegacyContractEndpoints, keyof PilotEndpoints> & PilotEndpoints;
