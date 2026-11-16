/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import core from '@kobalab/majiang-core';
import { rules } from '../shared/rules.js';
import { generateWall } from './random.js';

export interface Outcome { kind: 'win' | 'draw'; winner: number | null; name: string; points: number; yaku: string[]; deltas: number[] }
export interface Reply { dapai?: string; fulou?: string; gang?: string; hule?: boolean; daopai?: boolean }
export interface Action { id: string; kind: 'discard' | 'riichi' | 'chi' | 'pon' | 'kan' | 'win' | 'draw' | 'pass' | 'continue'; tiles: string; reply: Reply }
/** Private durable journal: never send walls, replies or core messages over a transport. */
export interface Journal { dealer: number; walls: string[][]; steps: { status: string; replies: Reply[] }[] }

/** Synchronous, timer-free core. Every hand uses our persisted crypto-generated wall. */
export class MahjongEngine extends core.Game {
	private wallIndex = 0;
	private suppliedWall: (() => string[]) | undefined;
	readonly journal: Journal;
	outcome: Outcome | null = null;
	constructor(journal: Journal, wall?: () => string[]) {
		super(Array.from({ length: 4 }, () => ({ action: () => {} })), () => {}, structuredClone(rules), 'Misskey Mahjong');
		this.journal = journal;
		this.suppliedWall = wall;
		this._sync = true;
		this.kaiju(journal.dealer);
		this.skipAutomatic();
		for (const step of journal.steps) {
			if (step.status !== this._status || step.replies.length !== 4) throw new Error('Invalid mahjong journal');
			this._reply = structuredClone(step.replies);
			this.next();
			this.skipAutomatic();
		}
	}

	override call_players(type: string, messages: unknown[], timeout?: number): void {
		const message = messages[0] as { hule?: { l: number; defen: number; hupai: { name: string }[]; fenpei: number[] }; pingju?: { name: string; fenpei: number[] } };
		this.outcome = message.hule ? { kind: 'win', winner: this.model.player_id[message.hule.l], name: '', points: message.hule.defen,
																																		yaku: message.hule.hupai.map(yaku => yaku.name), deltas: [...message.hule.fenpei] }
			: message.pingju ? { kind: 'draw', winner: null, name: message.pingju.name, points: 0, yaku: [], deltas: [...message.pingju.fenpei] } : null;
		super.call_players(type, messages, timeout);
	}

	override qipai(): void {
		const index = this.wallIndex++;
		const wall = this.journal.walls[index] ?? (this.journal.walls[index] = this.suppliedWall?.() ?? generateWall(rules['赤牌']));
		// Avoid Shan's constructor entirely: it shuffles using global Math.random.
		// These are all Shan 1.4.1 constructor fields; conformance tests exercise every method.
		const shan = Object.create(core.Shan.prototype) as InstanceType<typeof core.Shan>;
		Object.assign(shan, { _rule: structuredClone(rules), _pai: [...wall], _baopai: [wall[4]],
																								_fubaopai: [wall[9]], _weikaigang: false, _closed: false });
		super.qipai(shan);
	}

	menus(): Action[][] {
		return [0, 1, 2, 3].map(player => {
			const seat = this.model.player_id.indexOf(player);
			const acting = seat === this.model.lunban;
			const actions: Action[] = [];
			const add = (kind: Action['kind'], tiles: string, reply: Reply) => actions.push({ id: `${kind}:${tiles}`, kind, tiles, reply });
			if (this._status === 'jieju') return actions;
			if (this._status === 'hule' || this._status === 'pingju') {
				add('continue', '', {});
			} else if (acting && (['zimo', 'gangzimo'].includes(this._status) || (this._status === 'fulou' && !this._gang))) {
				for (const tile of this.get_dapai()) add('discard', tile, { dapai: tile });
				if (this._status !== 'fulou') {
					const riichi = this.allow_lizhi();
					if (Array.isArray(riichi)) for (const tile of riichi) add('riichi', tile, { dapai: `${tile}*` });
					for (const meld of this.get_gang_mianzi() ?? []) add('kan', meld, { gang: meld });
					if (this.allow_hule()) add('win', '', { hule: true });
					if (this.allow_pingju()) add('draw', '', { daopai: true });
				}
			} else {
				add('pass', '', {});
				if (!acting && this._status === 'dapai') {
					if (this.allow_hule(seat)) add('win', '', { hule: true });
					for (const meld of this.get_peng_mianzi(seat) ?? []) add('pon', meld, { fulou: meld });
					for (const meld of this.get_gang_mianzi(seat) ?? []) add('kan', meld, { fulou: meld });
					if (seat === (this.model.lunban + 1) % 4) for (const meld of this.get_chi_mianzi(seat) ?? []) add('chi', meld, { fulou: meld });
				}
				if (!acting && this._status === 'gang' && !/^[mpsz]\d{4}$/.test(this._gang ?? '') && this.allow_hule(seat)) add('win', '', { hule: true });
			}
			return actions;
		});
	}

	private skipAutomatic(): void {
		for (let guard = 0; guard < 32; guard++) {
			if (this._status === 'jieju' || ['hule', 'pingju'].includes(this._status)) return;
			if (!['kaiju', 'qipai'].includes(this._status) && this.menus().some(menu => menu.some(action => action.kind !== 'pass'))) return;
			this._reply = [{}, {}, {}, {}];
			this.next();
		}
		throw new Error('Mahjong automatic transition limit');
	}

	advance(replies: Reply[]): void {
		this.journal.steps.push({ status: this._status, replies: structuredClone(replies) });
		this._reply = replies;
		this.next();
		this.skipAutomatic();
	}
}
