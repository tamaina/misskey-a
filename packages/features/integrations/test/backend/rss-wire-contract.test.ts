/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import Parser from 'rss-parser';
import { Response } from 'node-fetch';
import { mockDeep } from 'vitest-mock-extended';
import { fetchRssInput, fetchRssOutput as inlineFetchRssOutput } from '../../backend/endpoints/fetch-rss.contract.js';
import { FetchRssApplicationService as FetchRssEndpoint } from '../../backend/endpoints/fetch-rss.application.js';
import type { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';

const richRss = `<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>
<title>Fixture</title><link>https://example.com</link><language>ja</language><generator>fixture</generator><ttl>60</ttl>
<image><url>https://example.com/image</url><width>32</width><height>32</height></image>
<skipHours><hour>3</hour><hour>4</hour></skipHours><skipDays><day>Monday</day></skipDays>
<itunes:owner><itunes:name>Owner</itunes:name><itunes:email>owner@example.com</itunes:email></itunes:owner>
<itunes:category text="Technology"><itunes:category text="Software"/></itunes:category><itunes:keywords>rss,podcast</itunes:keywords>
<item><title>Entry</title><description>Body</description><content:encoded>Encoded</content:encoded><comments>https://example.com/comments</comments>
<enclosure url="https://example.com/audio" length="123" type="audio/mpeg" extension="retained"/>
<category domain="https://example.com/category">Software</category><itunes:duration>60</itunes:duration></item>
</channel></rss>`;

test('real RSS wire retains string XML attributes, known extra fields and explicit XML subtrees', async () => {
	const raw = await new Parser().parseString(richRss);
	const wire: unknown = JSON.parse(JSON.stringify(raw));
	expect(v.parse(inlineFetchRssOutput, wire)).toEqual(wire);
	expect(raw.items[0].enclosure).toMatchObject({ length: '123', extension: 'retained' });
	expect(raw).toHaveProperty('ttl', '60');
	expect(raw).toHaveProperty('image.width', '32');
	expect(v.safeParse(inlineFetchRssOutput, { ...raw, future: true }).success).toBe(false);
	expect(v.safeParse(inlineFetchRssOutput, { ...raw, items: [{ ...raw.items[0], future: true }] }).success).toBe(false);
	expect(v.safeParse(inlineFetchRssOutput, { ...raw, items: [{ ...raw.items[0], enclosure: { url: 'url', length: 123 } }] }).success).toBe(false);
	expect(v.safeParse(inlineFetchRssOutput, { ...raw, items: [{ ...raw.items[0], enclosure: { extension: {} } }] }).success).toBe(false);
	expect(v.safeParse(inlineFetchRssOutput, { items: [], skipHours: new Date() }).success).toBe(false);
	expect(v.safeParse(inlineFetchRssOutput, { items: [], title: new Date() }).success).toBe(false);
	expect(v.safeParse(inlineFetchRssOutput, { items: [], title: { callback: () => undefined } }).success).toBe(false);
});

test.each([
	'<rss version="2.0"><channel><title xml:lang="en"/><description><b>Markup</b></description><link>https://example.com</link><item><title lang="en"/></item></channel></rss>',
	'<feed xmlns="http://www.w3.org/2005/Atom"><title>Atom</title><updated>2026-10-08T00:00:00Z</updated><entry><title>Entry</title><id>id</id><author><name>Author</name></author><content>Body</content></entry></feed>',
	'<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><channel><title>RSS 1</title></channel><item rdf:about="https://example.com/item"><title>Entry</title></item></rdf:RDF>',
	'<rss version="0.91"><channel><title>RSS 0.9</title><item><title>Entry</title></item></channel></rss>',
])('real Atom/RSS 1/RSS 0.9 payloads fit the finite wire model', async xml => {
	const raw = await new Parser().parseString(xml);
	const wire: unknown = JSON.parse(JSON.stringify(raw));
	expect(v.parse(inlineFetchRssOutput, wire)).toEqual(wire);
});

test('actual RSS HTTP handler keeps XML output, URL normalization, limits and documented errors', async () => {
	const http = mockDeep<HttpRequestService>();
	// Real Response.url is empty outside fetch; supply the harmless final redirect URL fixture.
	const response = new Response(richRss);
	Object.defineProperty(response, 'url', { value: 'https://example.com/feed' });
	http.send.mockResolvedValue(response);
	const endpoint = new FetchRssEndpoint(http);
	const raw = await endpoint.execute(v.parse(fetchRssInput, { url: 'https://example.com/feed#fragment', future: true }), null);
	expect(raw.items[0].enclosure).toHaveProperty('length', '123');
	expect(v.parse(inlineFetchRssOutput, JSON.parse(JSON.stringify(raw)))).toEqual(raw);
	expect(http.send).toHaveBeenCalledWith('https://example.com/feed', { method: 'GET', headers: { Accept: 'application/rss+xml, */*' }, timeout: 5000, size: 1024 * 1024 });
	await expect(endpoint.execute({ url: 'file:///tmp/feed' }, null)).rejects.toMatchObject({ code: 'INVALID_URL' });
	expect(v.safeParse(fetchRssInput, {}).success).toBe(false);
	http.send.mockRejectedValue(new Error('network'));
	await expect(endpoint.execute({ url: 'https://example.com/failure' }, null)).rejects.toMatchObject({ code: 'FETCH_RSS_FAILED' });
	expect(v.parse(fetchRssInput, { url: 'https://example.com/feed', future: true })).toEqual({ url: 'https://example.com/feed' });
});
