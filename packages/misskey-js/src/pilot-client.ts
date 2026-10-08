import { createORPCClient, ORPCError } from '@orpc/client';
import { getContractRouter, isContractProcedure, validateORPCError } from '@orpc/contract';
import type { ContractRouterClient } from '@orpc/contract';
import { requestRoutes } from '#api-routing';
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

/** Shared Misskey envelope boundary. The generator rejects contracts with another error DTO. */
function isErrorData(value: unknown): boolean {
	return isRecord(value) && typeof value.id === 'string'
		&& (value.kind === 'client' || value.kind === 'permission' || value.kind === 'server')
		&& (value.info === undefined || isRecord(value.info));
}

const paths = new Map(requestRoutes(routing).map(route => [route.name, route.path]));

export function createPilotClient(options: {
	origin(): string;
	credential(): string | null | undefined;
	fetch(): FetchLike;
	nativeFetch(request: Request, init: { redirect?: RequestRedirect }): Promise<Response> | undefined;
}) {
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
				if (!isContractProcedure(procedure) || !Object.hasOwn(procedure['~orpc'].errorMap, error.code)
					|| !isErrorData(error.data)) throw normalized;
				throw await validateORPCError(procedure['~orpc'].errorMap, normalized);
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
