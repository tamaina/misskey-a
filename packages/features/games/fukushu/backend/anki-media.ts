/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { HTMLElement, parse } from 'node-html-parser';
import sharp from 'sharp';
import * as v from 'valibot';
import { ankiMediaAssetsSchema, ankiMediaUriPattern, MAX_ANKI_MEDIA_BYTES } from '../shared/anki-media.schema.js';
import type { AnkiMediaAsset } from '../shared/anki-media.schema.js';
import type { FukushuMaterial } from '../shared/material.schema.js';

const sha256 = (data: Uint8Array) => createHash('sha256').update(data).digest('hex');
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const maxImagePixels = 4_000_000;
const canonicalPngChunks = new Set(['IHDR', 'IDAT', 'IEND', 'pHYs']);
const animationChunks = new Set(['acTL', 'fcTL', 'fdAT']);
const discardedAncestors = new Set('script style iframe object embed svg math form template noscript video link meta base'.split(' '));

function pngChunks(bytes: Buffer, canonical: boolean): boolean {
	if (!bytes.subarray(0, 8).equals(pngSignature)) return false;
	let seenImage = false;
	for (let offset = 8; offset + 12 <= bytes.length;) {
		const size = bytes.readUInt32BE(offset);
		const name = bytes.toString('latin1', offset + 4, offset + 8);
		const end = offset + size + 12;
		if (end > bytes.length || (name === 'IHDR') !== (offset === 8) || animationChunks.has(name)
			|| (canonical && !canonicalPngChunks.has(name))) return false;
		if (name === 'IHDR') {
			if (size !== 13) return false;
			const width = bytes.readUInt32BE(offset + 8);
			const height = bytes.readUInt32BE(offset + 12);
			if (!width || !height || width > 4096 || height > 4096 || width * height > maxImagePixels) return false;
			// Our normalization emits 8-bit RGBA, never indexed or interlaced
			// images or arbitrary metadata from the original file.
			if (canonical && (bytes[offset + 16] !== 8 || bytes[offset + 17] !== 6 || bytes[offset + 20] !== 0)) return false;
		}
		if (name === 'IDAT') seenImage = true;
		if (name === 'IEND') return size === 0 && seenImage && end === bytes.length;
		offset = end;
	}
	return false;
}

/** The initial audio format is canonical RIFF WAVE, 16-bit PCM, bare fmt/data only. */
function canonicalWave(bytes: Buffer): Buffer | null {
	if (bytes.length < 46 || bytes.toString('latin1', 0, 4) !== 'RIFF'
		|| bytes.readUInt32LE(4) !== bytes.length - 8 || bytes.toString('latin1', 8, 12) !== 'WAVE'
		|| bytes.toString('latin1', 12, 16) !== 'fmt ' || bytes.readUInt32LE(16) !== 16
		|| bytes.readUInt16LE(20) !== 1 || bytes.readUInt16LE(34) !== 16
		|| bytes.toString('latin1', 36, 40) !== 'data') return null;
	const channels = bytes.readUInt16LE(22);
	const rate = bytes.readUInt32LE(24);
	const dataLength = bytes.readUInt32LE(40);
	const align = channels * 2;
	if ((channels !== 1 && channels !== 2) || rate < 8_000 || rate > 48_000
		|| bytes.readUInt32LE(28) !== rate * align || bytes.readUInt16LE(32) !== align
		|| dataLength !== bytes.length - 44 || dataLength % align !== 0) return null;
	// Every byte has known meaning; no unparsed chunks or metadata.
	return bytes;
}

async function normalizeAsset(data: Uint8Array, mimeType: AnkiMediaAsset['mimeType']): Promise<Buffer | null> {
	if (!data.byteLength || data.byteLength > MAX_ANKI_MEDIA_BYTES) return null;
	const bytes = Buffer.from(data);
	if (mimeType === 'audio/wav') return canonicalWave(bytes);
	if (!pngChunks(bytes, false)) return null;
	try {
		const result = await sharp(bytes, { failOn: 'warning', limitInputPixels: maxImagePixels })
			.toColourspace('srgb').ensureAlpha().png({ palette: false, progressive: false }).toBuffer();
		return result.byteLength <= MAX_ANKI_MEDIA_BYTES && pngChunks(result, true) ? result : null;
	} catch {
		return null;
	}
}

/** Verify what the reader reports, then produce our own content identity. */
export async function normalizeAnkiAsset(media: { id: string; mimeType: string; size: number; data: Uint8Array }): Promise<AnkiMediaAsset | null> {
	if ((media.mimeType !== 'image/png' && media.mimeType !== 'audio/wav') || media.size !== media.data.byteLength
		|| media.size > MAX_ANKI_MEDIA_BYTES || sha256(media.data) !== media.id) return null;
	const bytes = await normalizeAsset(media.data, media.mimeType);
	return bytes ? { id: sha256(bytes), mimeType: media.mimeType, data: bytes.toString('base64') } : null;
}

export function ankiMediaReference(node: HTMLElement) {
	const tag = node.rawTagName.toLowerCase();
	if (tag !== 'img' && tag !== 'audio') return undefined;
	const id = ankiMediaUriPattern.exec(node.getAttribute('src') ?? '')?.[1];
	const present = Object.keys(node.attributes).every(name => tag === 'img'
		? name === 'src' || name === 'alt'
		: name === 'src' || name === 'controls' || (name === 'preload' && node.getAttribute(name) === 'none'));
	if (!id || !present || node.childNodes.length || (node.getAttribute('alt')?.length ?? 0) > 256) return null;
	return { id, mimeType: tag === 'img' ? 'image/png' as const : 'audio/wav' as const };
}

export function validateAnkiMediaReferences(assets: readonly AnkiMediaAsset[], questions: readonly FukushuMaterial['questions'][number][]): boolean {
	if (!v.safeParse(ankiMediaAssetsSchema, assets).success) return false;
	const byId = new Map(assets.map(media => [media.id, media.mimeType]));
	const referenced = new Set<string>();
	for (const { payload: { ankiTemplate } } of questions) {
		if (!ankiTemplate) continue;
		for (const html of [ankiTemplate.frontHtml, ankiTemplate.backHtml]) {
			const document = parse(html);
			const seenMime = new Set<string>();
			const pending = document.childNodes.map(node => ({ node, depth: 0, discarded: false }));
			while (pending.length) {
				const { node, depth, discarded } = pending.pop()!;
				if (!(node instanceof HTMLElement)) continue;
				if (depth > 128) return false;
				const tag = node.rawTagName.toLowerCase();
				if (tag === 'img' || tag === 'audio' || tag === 'video' || tag === 'source') {
					const ref = ankiMediaReference(node);
					if (discarded || !ref || byId.get(ref.id) !== ref.mimeType || seenMime.has(ref.mimeType)) return false;
					seenMime.add(ref.mimeType);
					referenced.add(ref.id);
				}
				for (const child of node.childNodes) pending.push({ node: child, depth: depth + 1, discarded: discarded || discardedAncestors.has(tag) });
			}
		}
	}
	return referenced.size === byId.size;
}

export async function validateAnkiMedia(assets: readonly AnkiMediaAsset[], questions: readonly FukushuMaterial['questions'][number][]): Promise<boolean> {
	if (!validateAnkiMediaReferences(assets, questions)) return false;
	for (const asset of assets) {
		const bytes = Buffer.from(asset.data, 'base64');
		if (bytes.length > MAX_ANKI_MEDIA_BYTES || bytes.toString('base64') !== asset.data || sha256(bytes) !== asset.id) return false;
		if (asset.mimeType === 'audio/wav') {
			if (!canonicalWave(bytes)) return false;
		} else {
			if (!pngChunks(bytes, true)) return false;
			try {
				// Full decode checks stream integrity, not just the PNG magic.
				await sharp(bytes, { failOn: 'warning', limitInputPixels: maxImagePixels }).raw().toBuffer();
			} catch {
				return false;
			}
		}
	}
	return true;
}
