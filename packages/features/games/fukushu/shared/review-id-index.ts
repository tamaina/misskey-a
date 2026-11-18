/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { sha256 } from '@noble/hashes/sha2.js';

/** Each slot keeps a hash prefix and a frame offset. The immutable file holds the exact ID. */
export class ReviewIdIndex {
	private hashes = new Uint32Array(1024);
	private offsets = new Uint32Array(1024);
	private count = 0;
	private readonly encoder = new TextEncoder();

	constructor(private readonly file: Blob) {}

	async add(id: string, frameOffset: number): Promise<boolean> {
		// JSON distinguishes escaped lone surrogates from a literal replacement character.
		const digest = sha256(this.encoder.encode(JSON.stringify(id)));
		const hash = new DataView(digest.buffer, digest.byteOffset).getUint32(0);
		if (this.count * 4 >= this.offsets.length * 3) this.grow();
		let slot = hash & (this.offsets.length - 1);
		while (this.offsets[slot] !== 0) {
			if (this.hashes[slot] === hash && await this.idAt(this.offsets[slot]) === id) return false;
			slot = (slot + 1) & (this.offsets.length - 1);
		}
		this.hashes[slot] = hash;
		this.offsets[slot] = frameOffset;
		this.count++;
		return true;
	}

	private async idAt(offset: number): Promise<string> {
		const prefix = await this.file.slice(offset, offset + 4).arrayBuffer();
		const length = new DataView(prefix).getUint32(0, true);
		const frame = JSON.parse(await this.file.slice(offset + 4, offset + 4 + length).text());
		return frame.value.id;
	}

	private grow() {
		const hashes = new Uint32Array(this.offsets.length * 2);
		const offsets = new Uint32Array(hashes.length);
		for (let i = 0; i < this.offsets.length; i++) {
			if (!this.offsets[i]) continue;
			const hash = this.hashes[i];
			let slot = hash & (offsets.length - 1);
			while (offsets[slot]) slot = (slot + 1) & (offsets.length - 1);
			hashes[slot] = hash;
			offsets[slot] = this.offsets[i];
		}
		this.hashes = hashes;
		this.offsets = offsets;
	}
}
