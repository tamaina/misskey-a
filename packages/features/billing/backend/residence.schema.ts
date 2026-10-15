/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';
import { residenceCountries, residenceSubdivisions } from '../shared/residence-codes.schema.js';
export const residenceCountry = v.picklist(residenceCountries);
export const residenceSubdivision = v.pipe(v.string(), v.minLength(1), v.maxLength(6));
const residenceFields = { country: residenceCountry, subdivision: v.nullable(residenceSubdivision) };
const belongsToCountry = (value: { country: string; subdivision: string | null }) => value.subdivision === null || (residenceSubdivisions[value.country]?.includes(value.subdivision) ?? false);
export const declaredResidenceInput = v.pipe(v.strictObject(residenceFields), v.check(value => belongsToCountry(value), 'Subdivision must belong to the selected country'));
export const declaredResidence = v.pipe(v.strictObject({ ...residenceFields, revision: v.pipe(v.number(), v.integer(), v.minValue(1)), declaredAt: v.pipe(v.number(), v.integer(), v.minValue(0)), kind: v.literal('self_declared') }), v.check(value => belongsToCountry(value), 'Subdivision must belong to the selected country'));
export type DeclaredResidence = v.InferOutput<typeof declaredResidence>;
export const residenceRegionRequirements = v.pipe(v.array(residenceCountry), v.maxLength(249), v.check(countries => new Set(countries).size === countries.length && countries.every(country => residenceSubdivisions[country]?.length), 'Configure unique countries with supported administrative subdivisions'));
