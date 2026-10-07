/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { NotesRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { RepositorySet } from '@features/persistence/backend/repositories/factory.js';

declare const repositories: RepositorySet;
const users: UsersRepository = repositories.usersRepository;
const notes: NotesRepository = repositories.notesRepository;
void [users, notes];
