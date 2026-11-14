/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** Always download untrusted attachments, never navigate to or embed them. */
export function downloadMailFile(file: { data: string; filename: string; mimeType: string }): void {
	const bytes = Uint8Array.from(atob(file.data), c => c.charCodeAt(0));
	const url = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
	const anchor = window.document.createElement('a');
	anchor.href = url;
	// eslint-disable-next-line no-control-regex
	anchor.download = file.filename.replace(/[\x00-\x1f\x7f/\\]/g, '_') || 'attachment';
	anchor.click();
	window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
