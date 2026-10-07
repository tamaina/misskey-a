import type { FeatureEndpoints } from '#feature-contracts/index';

/** Keep declared request fields usable with Pick/Omit while transport retains extra keys. */
type DeclaredFields<T> = {
	[K in keyof T as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: T[K];
};
type RequestFields<T> = T extends object
	? keyof DeclaredFields<T> extends never ? T : DeclaredFields<T>
	: T;

export type ContractEndpoints = {
	[K in keyof FeatureEndpoints]: {
		req: RequestFields<FeatureEndpoints[K]['req']>;
		res: FeatureEndpoints[K]['res'];
	};
};
