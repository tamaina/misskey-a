/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { jsonValueSchema } from '../../api/contract/json-value.js';
import { jsonObjectWithRest } from '../../api/contract/json-object.js';

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
export type RssEnclosureAttributesSchema = ReturnType<typeof jsonObjectWithRest<typeof enclosureEntries, v.StringSchema<undefined>>>;
export const rssEnclosureAttributesSchema: RssEnclosureAttributesSchema = jsonObjectWithRest(enclosureEntries, v.string());
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

// No customFields are configured: the installed parser emits this finite root/key set.
// Copied XML values/category/scheduling nodes and enclosure attributes retain their documented dynamic values.
const rssFeedEntries = {
	items: v.array(rssItemSchema),
	image: v.optional(v.strictObject({ url: rssCopiedXmlValueSchema, link: xml, title: xml, width: xml, height: xml })),
	paginationLinks: v.optional(v.strictObject({ self: text, first: text, next: text, last: text, prev: text })),
	link: xml, title: xml, feedUrl: text, description: xml,
	author: xml, creator: xml, publisher: xml, source: xml, type: xml,
	pubDate: xml, webMaster: xml, managingEditor: xml, generator: xml,
	language: xml, copyright: xml, lastBuildDate: xml, docs: xml, ttl: xml, rating: xml,
	skipHours: scheduling, skipDays: scheduling,
	itunes: v.optional(podcastFeed),
} as const;
export type RssFeedSchema = v.StrictObjectSchema<typeof rssFeedEntries, undefined>;
export const rssFeedSchema: RssFeedSchema = v.strictObject(rssFeedEntries);
