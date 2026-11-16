/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** Immutable product profile. Changes require a new version; running games retain v1. */
export const ruleVersion = '9k-invite-v1';
export const rules = {
	'配給原点': 25000, '順位点': ['20.0', '10.0', '-10.0', '-20.0'], '連風牌は2符': false,
	'赤牌': { m: 1, p: 1, s: 1 }, 'クイタンあり': true, '喰い替え許可レベル': 0,
	'場数': 2, '途中流局あり': true, '流し満貫あり': true, 'ノーテン宣言あり': false,
	'ノーテン罰あり': true, '最大同時和了数': 2, '連荘方式': 2, 'トビ終了あり': true,
	'オーラス止めあり': true, '延長戦方式': 1, '一発あり': true, '裏ドラあり': true,
	'カンドラあり': true, 'カン裏あり': true, 'カンドラ後乗せ': true, 'ツモ番なしリーチあり': false,
	'リーチ後暗槓許可レベル': 2, '役満の複合あり': true, 'ダブル役満あり': true,
	'数え役満あり': true, '役満パオあり': true, '切り上げ満貫あり': false,
};
export const timeouts = { discard: 30_000, reaction: 8_000, result: 10_000 } as const;
