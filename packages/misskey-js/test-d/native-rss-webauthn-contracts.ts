/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: MIT
 */
import type * as v from 'valibot';
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/browser';
import type { FeatureEndpoints } from '../built/contracts/index/contract/index.js';
import type { ContractEndpoints } from '../built/contract.types.js';
import type { Endpoints } from '../built/api.types.js';
import type { I2faRegisterKeyResponse, FetchRssResponse } from '../built/entities.js';
import type { webAuthnRegistrationOptionsSchema } from '../built/contracts/auth/contract/webauthn-registration-options.js';
import type { rssFeedSchema } from '../built/contracts/integrations/contract/rss-feed.js';
import type { JsonObject } from '../built/contracts/api/contract/json-value.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Routes = 'i/2fa/register-key' | 'fetch-rss';
type Outputs = {
	'i/2fa/register-key': v.InferOutput<typeof webAuthnRegistrationOptionsSchema>;
	'fetch-rss': v.InferOutput<typeof rssFeedSchema>;
};
export type NativeParity = Assert<Equal<{ [K in Routes]: Equal<FeatureEndpoints[K]['res'], Outputs[K]> }[Routes], true>>;
export type PublishedParity = Assert<Equal<{ [K in Routes]: Equal<ContractEndpoints[K]['res'], Outputs[K]> }[Routes], true>>;
export type SdkParity = Assert<Equal<{ [K in Routes]: Equal<Endpoints[K]['res'], Outputs[K]> }[Routes], true>>;
export type RegistrationAlias = Assert<Equal<I2faRegisterKeyResponse, Outputs['i/2fa/register-key']>>;
export type BrowserCompatible = Assert<I2faRegisterKeyResponse extends PublicKeyCredentialCreationOptionsJSON ? true : false>;
export type RssAlias = Assert<Equal<FetchRssResponse, Outputs['fetch-rss']>>;
export type EnclosureLengthIsXmlString = Assert<Equal<NonNullable<FetchRssResponse['items'][number]['enclosure']>['length'], string | undefined>>;
// Object-with-rest inference retains an empty object intersection; verify the exact domain both ways.
type CopiedXml = FetchRssResponse['title'];
type IsAny<T> = 0 extends (1 & T) ? true : false;
export type CopiedXmlIsNotAny = Assert<Equal<IsAny<CopiedXml>, false>>;
export type CopiedXmlIsExplicit = Assert<CopiedXml extends string | JsonObject | undefined ? true : false>;
export type CopiedXmlAcceptsFullDomain = Assert<(string | JsonObject | undefined) extends CopiedXml ? true : false>;
export type FeedKeysAreFinite = Assert<string extends keyof FetchRssResponse ? false : true>;
export type ItemKeysAreFinite = Assert<string extends keyof FetchRssResponse['items'][number] ? false : true>;
export type RegistrationKeysAreFinite = Assert<string extends keyof I2faRegisterKeyResponse ? false : true>;
