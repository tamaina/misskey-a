import type { FetchLike } from './api.js';

/** Adapt the original JSON-only injected fetch surface to a real Response. */
export async function fetchPilotResponse(fetchLike: FetchLike, request: Request): Promise<Response> {
	request.signal.throwIfAborted();
	const headers: Record<string, string> = {};
	request.headers.forEach((value, name) => { headers[name] = value; });
	let body: FormData | string | undefined;
	if (request.method !== 'GET' && request.method !== 'HEAD') {
		if (headers['content-type']?.startsWith('multipart/form-data')) {
			body = await request.formData();
			// The injected fetch owns the boundary for this newly constructed FormData.
			delete headers['content-type'];
		} else {
			body = await request.text();
		}
	}
	const response = await fetchLike(request.url, {
		method: request.method, ...(body === undefined ? {} : { body }),
		headers, credentials: 'omit', cache: 'no-cache', signal: request.signal,
	});
	if (response instanceof Response) return jsonPilotResponse(response);
	// The pilot has only JSON/204 responses. Never pretend to support binary/SSE responses.
	return new Response(response.status === 204 ? null : JSON.stringify(await response.json()), {
		status: response.status, headers: { 'Content-Type': 'application/json' },
	});
}

/** Keep the legacy JSON response semantics without reading or buffering the body. */
export function jsonPilotResponse(response: Response): Response {
	if (response.status === 204 || response.headers.get('content-type')?.includes('application/json')) return response;
	// APIClient's JSON-only fetch surface historically calls json() regardless of headers.
	// Keep that behavior for injected Responses while the official codec owns decoding.
	const responseHeaders = new Headers(response.headers);
	responseHeaders.set('Content-Type', 'application/json');
	return new Response(response.body, { status: response.status, statusText: response.statusText, headers: responseHeaders });
}
