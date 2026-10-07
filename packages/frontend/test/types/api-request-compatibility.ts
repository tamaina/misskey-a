/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as Misskey from 'misskey-js';
import type { apiWithDialog } from '@features/ui/frontend/os.js';
import type { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import type { Paginator, PaginatorCompatibleEndpointPaths } from '@features/ui/frontend/utility/paginator.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type DialogData<E extends keyof Misskey.Endpoints> = Parameters<typeof apiWithDialog<E>>[1];
type ApiData<E extends keyof Misskey.Endpoints> = Exclude<Parameters<typeof misskeyApi<void, E>>[1], undefined>;

export type DialogMatchesApiForUnknown = Assert<Equal<DialogData<'admin/captcha/current'>, ApiData<'admin/captcha/current'>>>;
export type DialogMatchesApiForObject = Assert<Equal<DialogData<'notes/delete'>, ApiData<'notes/delete'>>>;
export type UnknownDialogAllowsEmptyObject = Assert<Record<string, never> extends DialogData<'admin/captcha/current'> ? true : false>;
export type UnknownDialogAllowsCredential = Assert<{ i: string | null } extends DialogData<'admin/captcha/current'> ? true : false>;
export type UnknownDialogRejectsScalar = Assert<string extends DialogData<'admin/captcha/current'> ? false : true>;
export type UnknownDialogRejectsNull = Assert<null extends DialogData<'admin/captcha/current'> ? false : true>;
export type UnknownDialogRejectsInvalidCredential = Assert<{ i: number } extends DialogData<'admin/captcha/current'> ? false : true>;
export type ObjectDialogKeepsRequiredFields = Assert<Record<string, never> extends DialogData<'notes/delete'> ? false : true>;
export type ObjectDialogAllowsCredential = Assert<{ noteId: string; i: string } extends DialogData<'notes/delete'> ? true : false>;
export type PaginatorAllowsTimeline = Assert<'notes/timeline' extends PaginatorCompatibleEndpointPaths ? true : false>;
export type PaginatorAllowsReversiGames = Assert<'reversi/games' extends PaginatorCompatibleEndpointPaths ? true : false>;
export type PaginatorRejectsUnknownRequest = Assert<'reversi/invitations' extends PaginatorCompatibleEndpointPaths ? false : true>;
export type PaginatorRejectsNonArrayResponse = Assert<'notes/delete' extends PaginatorCompatibleEndpointPaths ? false : true>;
export type PaginatorRequestsRemainObjects = Assert<Misskey.Endpoints[PaginatorCompatibleEndpointPaths]['req'] extends object ? true : false>;
export type ReversiInvitationsRequestStaysUnknown = Assert<Equal<Misskey.Endpoints['reversi/invitations']['req'], unknown>>;

// @ts-expect-error Unknown request schemas cannot be spread into pagination params.
export type UnknownRequestPaginator = Paginator<'reversi/invitations'>;
// @ts-expect-error Non-array responses cannot be paginated.
export type NonArrayPaginator = Paginator<'notes/delete'>;
