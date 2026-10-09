import './autogen/apiClientJSDoc.js';

import type { SwitchCaseResponseType, Endpoints } from './api.types.js';
import { createPilotClient, ApiWireFailure } from './pilot-client.js';

export type {
	SwitchCaseResponseType,
} from './api.types.js';

const MK_API_ERROR = Symbol();

export type APIError = {
	id: string;
	code: string;
	message: string;
	kind: 'client' | 'server';
	info: Record<string, unknown>;
};

export function isAPIError(reason: Record<PropertyKey, unknown>): reason is APIError {
	return reason[MK_API_ERROR] === true;
}

export type FetchLike = (input: string, init?: {
	method?: string;
	body?: Blob | FormData | string;
	credentials?: RequestCredentials;
	cache?: RequestCache;
	signal?: AbortSignal;
	headers: { [key in string]: string }
}) => Promise<{
	status: number;
	json(): Promise<unknown>;
}>;

export class APIClient {
	public origin: string;
	public credential: string | null | undefined;
	public fetch: FetchLike;
	private readonly defaultFetch: FetchLike = (...args) => fetch(...args);
	private readonly pilot = createPilotClient({
		origin: () => this.origin,
		credential: () => this.credential,
		fetch: () => this.fetch,
		nativeFetch: (request, init) => this.fetch === this.defaultFetch
			? fetch(request, { ...init, credentials: 'omit', cache: 'no-cache' }) : undefined,
	});
	/** Native nested oRPC client; legacy request names remain available below. */
	public readonly orpc: import('./pilot-client.js').PilotClient = this.pilot.client;

	constructor(opts: {
		origin: APIClient['origin'];
		credential?: APIClient['credential'];
		fetch?: APIClient['fetch'] | null | undefined;
	}) {
		this.origin = opts.origin.replace(/\/$/, '');
		this.credential = opts.credential;
		// ネイティブ関数をそのまま変数に代入して使おうとするとChromiumではIllegal invocationエラーが発生するため、
		// 環境で実装されているfetchを使う場合は無名関数でラップして使用する
		this.fetch = opts.fetch ?? this.defaultFetch;
	}

	public request<E extends keyof Endpoints, P extends Endpoints[E]['req']>(
		endpoint: E,
		params?: P,
		credential?: string | null,
	): Promise<SwitchCaseResponseType<E, P>>;
	public request(endpoint: keyof Endpoints, params: unknown = {}, credential?: string | null): Promise<unknown> {
		const path = this.pilot.path(endpoint);
		// The legacy facade treated non-record params as an empty request object.
		// Direct oRPC calls retain the contract's finite JSON input domain.
		const requestParams = params !== null && typeof params === 'object' && !Array.isArray(params) ? params : {};
		if (path) return this.pilot.request(path, requestParams, credential).catch((error: unknown) => {
			if (error instanceof ApiWireFailure) {
				// Preserve the existing SDK's plain, symbol-tagged APIError rejection value.
				// eslint-disable-next-line no-throw-literal
				throw { [MK_API_ERROR]: true, ...error.payload };
			}
			throw error;
		});
		throw new Error(`Unknown API endpoint: ${endpoint}`);
	}
}
