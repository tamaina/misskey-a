/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { commonErrors, apiErrorData } from '../../../api/backend/transport/errors.schema.js';
import { packedJsonValueSchema as jsonValueSchema, businessJsonObjectWithRest as jsonObjectWithRest } from '../../../users/backend/json-value.schema.js';

// copyFromXML unwraps textual ._ values, but retains attribute-only or nested XML objects.
const copiedXmlEntries = {} as const;
export type RssCopiedXmlObjectSchema = ReturnType<typeof jsonObjectWithRest<typeof copiedXmlEntries, typeof jsonValueSchema>>;
export type RssCopiedXmlValueSchema = v.UnionSchema<[v.StringSchema<undefined>, RssCopiedXmlObjectSchema], undefined>;
export const rssCopiedXmlValueSchema: RssCopiedXmlValueSchema = v.union([v.string(), jsonObjectWithRest(copiedXmlEntries, jsonValueSchema)]);
// Explicit OptionalSchema defaults and aliases expand recursive JSON in strict declaration checks.
// Name the exact factory interface and expose its concrete wrapped schema without widening it.
export interface RssOptionalXmlSchema extends ReturnType<typeof v.optional<RssCopiedXmlValueSchema>> {
	readonly wrapped: RssCopiedXmlValueSchema;
}
const xml: RssOptionalXmlSchema = v.optional(rssCopiedXmlValueSchema);
const text = v.optional(v.string());
// XML enclosure attributes are genuinely extensible strings. rss-parser copies them verbatim:
// length is a string, despite the installed library declaration claiming number.
const enclosureEntries = { url: text, length: text, type: text } as const;

function enclosureAttributes() {
	const shape = jsonObjectWithRest(enclosureEntries, v.string());
	// Validate original reserved attributes too, before objectWithRest can omit them.
	return v.lazy(input => {
		if (input === undefined) return shape;
		if (input === null || typeof input !== 'object' || Array.isArray(input)) return v.never();
		for (const key of Object.keys(input)) {
			if (typeof Object.getOwnPropertyDescriptor(input, key)?.value !== 'string') return v.never();
		}
		return shape;
	});
}

export type RssEnclosureAttributesSchema = ReturnType<typeof enclosureAttributes>;
export const rssEnclosureAttributesSchema: RssEnclosureAttributesSchema = enclosureAttributes();
const enclosure: v.OptionalSchema<RssEnclosureAttributesSchema, undefined> = v.optional(rssEnclosureAttributesSchema);
export type RssCategoriesSchema = v.ArraySchema<typeof jsonValueSchema, undefined>;
export interface RssOptionalCategoriesSchema extends ReturnType<typeof v.optional<RssCategoriesSchema>> {
	readonly wrapped: RssCategoriesSchema;
}
const categories: RssOptionalCategoriesSchema = v.optional(v.array(jsonValueSchema));
export interface RssSchedulingSchema extends ReturnType<typeof v.optional<typeof jsonValueSchema>> {
	readonly wrapped: typeof jsonValueSchema;
}
const scheduling: RssSchedulingSchema = v.optional(jsonValueSchema);
const podcastCategory = v.strictObject({ name: text });
const podcastFeed = v.strictObject({
	image: text,
	owner: v.optional(v.strictObject({ name: xml, email: xml })),
	author: xml, subtitle: xml, summary: xml, explicit: xml,
	categories: v.optional(v.array(v.nullable(v.string()))),
	keywords: v.optional(v.array(v.nullable(v.string()))),
	categoriesWithSubs: v.optional(v.array(v.strictObject({
		name: text, subs: v.nullable(v.array(podcastCategory)),
	}))),
});
const podcastItem = v.strictObject({
	author: xml, subtitle: xml, summary: xml, explicit: xml,
	duration: xml, image: xml, episode: xml, season: xml, keywords: xml, episodeType: xml,
});
const rssItemEntries = {
	link: xml, guid: xml, title: xml, pubDate: xml, creator: xml,
	summary: xml, content: text, isoDate: text, contentSnippet: text,
	author: xml, id: xml, date: xml, language: xml, rights: xml, source: xml,
	'dc:creator': xml, 'dc:date': xml, comments: xml, 'rdf:about': text,
	'content:encoded': xml, 'content:encodedSnippet': text,
	// rss-parser retains XML category nodes and their arbitrary attributes/children.
	categories,
	enclosure,
	itunes: v.optional(podcastItem),
} as const;
export type RssItemSchema = v.StrictObjectSchema<typeof rssItemEntries, undefined>;
export const rssItemSchema: RssItemSchema = v.strictObject(rssItemEntries);

export const fetchRssErrors = {
		invalidUrl: {
			message: 'Invalid URL.',
			code: 'INVALID_URL',
			id: '89b7ee05-ccfc-4bdd-9b13-61172fd1e06c',
			status: 400,
		},
		fetchRssFailed: {
			message: 'Failed to fetch RSS.',
			code: 'FETCH_RSS_FAILED',
			id: '8db5d3d8-31d7-452f-b0cc-ca3b8925de12',
			kind: 'server',
			status: 422,
		},
		fetchRssUnavailable: {
			message: 'RSS fetching is temporarily unavailable.',
			code: 'FETCH_RSS_UNAVAILABLE',
			id: '91e6ff44-c63f-4725-9ad0-b7a40d7f7655',
			kind: 'server',
			status: 503,
		},
	} as const;

const requestName = 'fetch-rss';
export const fetchRssContract = oc.$meta({
	requestName: requestName,
	allowGet: true,
	cacheSec: 180,
	limit: {
		duration: 60 * 1000,
		max: 300,
	},
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['meta'] })
	.errors({ ...commonErrors, INVALID_URL: { status: 400, data: apiErrorData }, FETCH_RSS_FAILED: { status: 422, data: apiErrorData }, FETCH_RSS_UNAVAILABLE: { status: 503, data: apiErrorData } })
	.input(objectInput({
	"url": v.string(),
})).output(v.strictObject({
	items: v.array(rssItemSchema),
	image: v.optional(v.strictObject({ url: rssCopiedXmlValueSchema, link: xml, title: xml, width: xml, height: xml })),
	paginationLinks: v.optional(v.strictObject({ self: text, first: text, next: text, last: text, prev: text })),
	link: xml, title: xml, feedUrl: text, description: xml,
	author: xml, creator: xml, publisher: xml, source: xml, type: xml,
	pubDate: xml, webMaster: xml, managingEditor: xml, generator: xml,
	language: xml, copyright: xml, lastBuildDate: xml, docs: xml, ttl: xml, rating: xml,
	skipHours: scheduling, skipDays: scheduling,
	itunes: v.optional(podcastFeed),
} as const));
