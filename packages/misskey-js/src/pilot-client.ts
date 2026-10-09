import { createORPCClient, ORPCError } from '@orpc/client';
import { getContractRouter, isContractProcedure, validateORPCError } from '@orpc/contract';
import type { ContractRouterClient, ErrorMap } from '@orpc/contract';
import { requestRoutes } from '#api-routing';
import { apiErrorData } from '#pilot-error-data';
import { OpenAPILink } from '@orpc/openapi-client/fetch';
import type { pilotContract } from '#pilot-contract';
import routing from './autogen/pilot-routing.js';
import { fetchPilotResponse, jsonPilotResponse } from './orpc-fetch.js';
import type { FetchLike } from './api.js';

export interface PilotClientContext { credential?: string | null | undefined }
export type PilotClient = ContractRouterClient<typeof pilotContract, PilotClientContext>;

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const paths = new Map(requestRoutes(routing).map(route => [route.name, route.path]));

export interface PilotTransport {
	client: PilotClient;
	path(name: string): readonly string[] | undefined;
	request(path: readonly string[], input: unknown, credential: string | null | undefined): Promise<unknown>;
}

export function createPilotClient(options: {
	origin(): string;
	credential(): string | null | undefined;
	fetch(): FetchLike;
	nativeFetch(request: Request, init: { redirect?: RequestRedirect }): Promise<Response> | undefined;
}): PilotTransport {
	const link = new OpenAPILink<PilotClientContext>(routing, {
		url: () => `${options.origin()}/api`,
		interceptors: [async ({ next, ...call }) => {
			try {
				return await next({
					...call,
					input: isRecord(call.input) || call.input === undefined ? {
						...call.input,
						i: call.context.credential === undefined ? options.credential() : call.context.credential,
					} : call.input,
				});
			} catch (error) {
				if (!(error instanceof ORPCError)) throw error;
				// Never trust a remote defined flag, even for standard oRPC proxy errors.
				const normalized = new ORPCError(error.code, { defined: false, status: error.status,
					message: error.message, data: error.data, cause: error });
				const procedure = getContractRouter(routing, call.path);
				if (!isContractProcedure(procedure) || !Object.hasOwn(procedure['~orpc'].errorMap, error.code)) throw normalized;
				// Generated route membership/status stays authoritative. Its shared data schema
				// is checked by the official validator, including defaults and unknown keys.
				const generatedErrors: ErrorMap = procedure['~orpc'].errorMap;
				const errorMap = Object.fromEntries(Object.entries(generatedErrors)
					.map(([code, definition]) => [code, { ...definition, data: apiErrorData }] satisfies [string, ErrorMap[string]]));
				throw await validateORPCError(errorMap, normalized);
			}
		}],
		fetch: async (request, init) => {
			request.signal.throwIfAborted();
			const native = options.nativeFetch(request, init);
			return native === undefined ? fetchPilotResponse(options.fetch(), request) : jsonPilotResponse(await native);
		},
		customErrorResponseBodyDecoder: (body, response) => {
			if (!isRecord(body) || !isRecord(body.error)) return null;
			const error = body.error;
			if (typeof error.code !== 'string' || typeof error.message !== 'string') return null;
			const { code, message, ...data } = error;
			return new ORPCError(code, { status: response.status, message, data });
		},
	});
	const client: PilotClient = createORPCClient(link);
	return {
		client,
		path: (name: string) => paths.get(name),
		/** oRPC's own unknown-value boundary implements the generic legacy overload without casts. */
		request: async (path: readonly string[], input: unknown, credential: string | null | undefined): Promise<unknown> => {
			try {
				return await link.call(path, input, { context: { credential } }) ?? null;
			} catch (error) {
				if (error instanceof ORPCError && isRecord(error.data)) {
					// Preserve the legacy plain APIError rejection value.
					// eslint-disable-next-line no-throw-literal
					throw { ...error.data, code: error.code, message: error.message };
				}
				throw error;
			}
		},
	};
}
