import { describe, test, expect } from 'vitest';
import * as acct from '../src/acct.js';

describe('acct.parse', () => {
	test('parses plain username', () => {
		const res = acct.parse('alice');
		expect(res).toEqual({ username: 'alice', host: null });
	});

	test('parses at-mark style without host', () => {
		const res = acct.parse('@alice');
		expect(res).toEqual({ username: 'alice', host: null });
	});

	test('parses at-mark style with host', () => {
		const res = acct.parse('@alice@example.com');
		expect(res).toEqual({ username: 'alice', host: 'example.com' });
	});

	test('parses acct: style', () => {
		const res = acct.parse('acct:alice@example.com');
		expect(res).toEqual({ username: 'alice', host: 'example.com' });
	});

	test.each<[string, acct.Acct]>([
		['acct:alice', { username: 'alice', host: null }],
		['@acct:alice@example.com', { username: 'acct:alice', host: 'example.com' }],
		['acct:acct:alice@example.com', { username: 'acct:alice', host: 'example.com' }],
		['ACCT:alice@example.com', { username: 'ACCT:alice', host: 'example.com' }],
	])('strips only one supported leading prefix: %s', (input, expected) => {
		expect(acct.parse(input)).toEqual(expected);
	});
});

describe('acct.toString', () => {
	test('returns username when host is null', () => {
		expect(acct.toString({ username: 'alice', host: null })).toBe('alice');
	});

	test('returns username@host when host exists', () => {
		expect(acct.toString({ username: 'alice', host: 'example.com' })).toBe('alice@example.com');
	});
});
