/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getSharedFilesGeneration, saveSharedFiles } from '@@/js/shared-files.js';

export async function respondToShare(request: Request): Promise<Response> {
	const responseUrl = new URL(request.url);
	const origin = request.headers.get('Origin');
	// Missing/opaque origins are not proof of a native share; storage remains bounded.
	if (origin && origin !== 'null' && origin !== responseUrl.origin) return new Response('Forbidden', { status: 403 });
	responseUrl.pathname = '/share';
	// Snapshot before body parsing so an account boundary invalidates this request.
	let generation: string | undefined;
	let generationError: unknown;
	try {
		generation = await getSharedFilesGeneration();
	} catch (error) {
		generationError = error;
	}
	const formData = await request.formData();
	const entries = formData.getAll('files');
	const files = entries.every(file => file instanceof Blob)
		? entries.filter(file => !(file instanceof File && file.name === '' && file.size === 0))
		: [];

	// Text-only shares still work when IndexedDB is unavailable.
	let shareId: string | null = null;
	if (files.length > 0) {
		if (generation == null) throw generationError;
		shareId = await saveSharedFiles(files, generation);
		if (shareId == null) return new Response('Share canceled', { status: 409 });
	}
	formData.delete('files');
	formData.delete('shareId');
	responseUrl.searchParams.delete('shareId');
	for (const [key, value] of formData.entries()) {
		responseUrl.searchParams.set(key, value.toString());
	}
	if (shareId) responseUrl.searchParams.set('shareId', shareId);

	return Response.redirect(responseUrl, 303);
}
