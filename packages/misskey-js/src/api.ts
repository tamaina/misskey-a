import './autogen/apiClientJSDoc.js';

import { endpointReqTypes } from './autogen/endpoint.js';
import type { SwitchCaseResponseType, Endpoints } from './api.types.js';
import { createPilotClient } from './pilot-client.js';

export type {
	SwitchCaseResponseType,
} from './api.types.js';

const MK_API_ERROR = Symbol();

export type APIError = {
	id: string;
	code: string;
	message: string;
	kind: 'client' | 'server';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	info: Record<string, any>;
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	json(): Promise<any>;
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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private assertIsRecord<T>(obj: T): obj is T & Record<string, any> {
		return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
	}

	private assertSpecialEpReqType(ep: keyof Endpoints): ep is keyof typeof endpointReqTypes {
		return ep in endpointReqTypes;
	}

	public request<E extends keyof Endpoints, P extends Endpoints[E]['req']>(
		endpoint: E,
		params?: P,
		credential?: string | null,
	): Promise<SwitchCaseResponseType<E, P>>;
	public request(endpoint: keyof Endpoints, params: unknown = {}, credential?: string | null): Promise<unknown> {
		const path = this.pilot.path(endpoint);
		if (path) return this.pilot.request(path, params, credential).catch((error: unknown) => {
			if (error !== null && typeof error === 'object' && 'id' in error && 'code' in error && 'message' in error) {
				// Preserve the existing SDK's plain, symbol-tagged APIError rejection value.
				// eslint-disable-next-line no-throw-literal
				throw { [MK_API_ERROR]: true, ...error };
			}
			throw error;
		});
		return new Promise((resolve, reject) => {
			let mediaType = 'application/json';
			// （autogenがバグったときのため、念の為nullチェックも行う）
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (this.assertSpecialEpReqType(endpoint) && endpointReqTypes[endpoint] != null) {
				mediaType = endpointReqTypes[endpoint];
			}

			let payload: FormData | string = '{}';

			if (mediaType === 'application/json') {
				payload = JSON.stringify({
					...(this.assertIsRecord(params) ? params : {}),
					i: credential !== undefined ? credential : this.credential,
				});
			} else if (mediaType === 'multipart/form-data') {
				payload = new FormData();
				const i = credential !== undefined ? credential : this.credential;
				if (i != null) {
					payload.append('i', i);
				}
				if (this.assertIsRecord(params)) {
					for (const key in params) {
						const value = params[key];

						if (value == null) continue;

						if (value instanceof File || value instanceof Blob) {
							payload.append(key, value);
						} else if (typeof value === 'object') {
							payload.append(key, JSON.stringify(value));
						} else {
							payload.append(key, value);
						}
					}
				}
			}

			this.fetch(`${this.origin}/api/${endpoint}`, {
				method: 'POST',
				body: payload,
				headers: mediaType === 'multipart/form-data' ? {} : {
					'Content-Type': mediaType,
				},
				credentials: 'omit',
				cache: 'no-cache',
			}).then(async (res) => {
				const body = res.status === 204 ? null : await res.json();

				if (res.status === 200 || res.status === 204) {
					resolve(body);
				} else {
					reject({
						[MK_API_ERROR]: true,
						...body.error,
					});
				}
			}).catch(reject);
		});
	}
}
