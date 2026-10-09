/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { timelinesContract } from './endpoints/timelines.contract.js';
import { createAntennasCreateProcedure } from './endpoints/antennas/create.js';
import type { AntennasCreateDependencies } from './endpoints/antennas/create.js';
import { createAntennasDeleteProcedure } from './endpoints/antennas/delete.js';
import type { AntennasDeleteDependencies } from './endpoints/antennas/delete.js';
import { createAntennasListProcedure } from './endpoints/antennas/list.js';
import type { AntennasListDependencies } from './endpoints/antennas/list.js';
import { createAntennasNotesProcedure } from './endpoints/antennas/notes.js';
import type { AntennasNotesDependencies } from './endpoints/antennas/notes.js';
import { createAntennasRemoveNoteProcedure } from './endpoints/antennas/remove-note.js';
import type { AntennasRemoveNoteDependencies } from './endpoints/antennas/remove-note.js';
import { createAntennasShowProcedure } from './endpoints/antennas/show.js';
import type { AntennasShowDependencies } from './endpoints/antennas/show.js';
import { createAntennasUpdateProcedure } from './endpoints/antennas/update.js';
import type { AntennasUpdateDependencies } from './endpoints/antennas/update.js';
import { createNotesGlobalTimelineProcedure } from './endpoints/notes/global-timeline.js';
import type { NotesGlobalTimelineDependencies } from './endpoints/notes/global-timeline.js';
import { createNotesHybridTimelineProcedure } from './endpoints/notes/hybrid-timeline.js';
import type { NotesHybridTimelineDependencies } from './endpoints/notes/hybrid-timeline.js';
import { createNotesLocalTimelineProcedure } from './endpoints/notes/local-timeline.js';
import type { NotesLocalTimelineDependencies } from './endpoints/notes/local-timeline.js';
import { createNotesMentionsProcedure } from './endpoints/notes/mentions.js';
import type { NotesMentionsDependencies } from './endpoints/notes/mentions.js';
import { createNotesTimelineProcedure } from './endpoints/notes/timeline.js';
import type { NotesTimelineDependencies } from './endpoints/notes/timeline.js';
import { createNotesUserListTimelineProcedure } from './endpoints/notes/user-list-timeline.js';
import type { NotesUserListTimelineDependencies } from './endpoints/notes/user-list-timeline.js';
import { createUsersNotesProcedure } from './endpoints/users/notes.js';
import type { UsersNotesDependencies } from './endpoints/users/notes.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { AntennaEntityService } from './serializers/AntennaEntityService.js';
import type { UserListsRepository, AntennasRepository, NotesRepository, MiMeta, FollowingsRepository, UserListMembershipsRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
import { FanoutTimelineService } from './services/FanoutTimelineService.js';
import { ActiveUsersChart } from '@features/statistics/backend/charts/active-users.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { UserFollowingService } from '@features/relationships/backend/services/UserFollowingService.js';
import { ChannelFollowingService } from '@features/channels/backend/services/ChannelFollowingService.js';
import { FanoutTimelineEndpointService } from './services/FanoutTimelineEndpointService.js';

export type TimelinesDependencies = AntennasCreateDependencies & AntennasDeleteDependencies & AntennasListDependencies & AntennasNotesDependencies & AntennasRemoveNoteDependencies & AntennasShowDependencies & AntennasUpdateDependencies & NotesGlobalTimelineDependencies & NotesHybridTimelineDependencies & NotesLocalTimelineDependencies & NotesMentionsDependencies & NotesTimelineDependencies & NotesUserListTimelineDependencies & UsersNotesDependencies;

export function createTimelinesRouter<Actor extends MiLocalUser>(deps: TimelinesDependencies) {
	return implement(timelinesContract).$context<ApiContext<Actor>>().router({
		antennasCreate: createAntennasCreateProcedure<Actor>(deps),
		antennasDelete: createAntennasDeleteProcedure<Actor>(deps),
		antennasList: createAntennasListProcedure<Actor>(deps),
		antennasNotes: createAntennasNotesProcedure<Actor>(deps),
		antennasRemoveNote: createAntennasRemoveNoteProcedure<Actor>(deps),
		antennasShow: createAntennasShowProcedure<Actor>(deps),
		antennasUpdate: createAntennasUpdateProcedure<Actor>(deps),
		notesGlobalTimeline: createNotesGlobalTimelineProcedure<Actor>(deps),
		notesHybridTimeline: createNotesHybridTimelineProcedure<Actor>(deps),
		notesLocalTimeline: createNotesLocalTimelineProcedure<Actor>(deps),
		notesMentions: createNotesMentionsProcedure<Actor>(deps),
		notesTimeline: createNotesTimelineProcedure<Actor>(deps),
		notesUserListTimeline: createNotesUserListTimelineProcedure<Actor>(deps),
		usersNotes: createUsersNotesProcedure<Actor>(deps),
	});
}

type TimelinesRouter = ReturnType<typeof createTimelinesRouter<MiLocalUser>>;

/** Composed once after Nest initialization; domain services keep their existing lifetime. */
@Injectable()
export class TimelinesApiProvider {
	private router: TimelinesRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): TimelinesRouter {
		if (this.router !== undefined) return this.router;
		this.router = createTimelinesRouter<MiLocalUser>({
			antennasRepository: this.moduleRef.get<AntennasRepository>(DI.antennasRepository, { strict: false }),
			userListsRepository: this.moduleRef.get<UserListsRepository>(DI.userListsRepository, { strict: false }),
			antennaEntityService: this.moduleRef.get(AntennaEntityService, { strict: false }),
			roleService: this.moduleRef.get(RoleService, { strict: false }),
			idService: this.moduleRef.get(IdService, { strict: false }),
			globalEventService: this.moduleRef.get(GlobalEventService, { strict: false }),
			notesRepository: this.moduleRef.get<NotesRepository>(DI.notesRepository, { strict: false }),
			noteEntityService: this.moduleRef.get(NoteEntityService, { strict: false }),
			queryService: this.moduleRef.get(QueryService, { strict: false }),
			fanoutTimelineService: this.moduleRef.get(FanoutTimelineService, { strict: false }),
			channelMutingService: this.moduleRef.get(ChannelMutingService, { strict: false }),
			activeUsersChart: this.moduleRef.get(ActiveUsersChart, { strict: false }),
			serverSettings: this.moduleRef.get<MiMeta>(DI.meta, { strict: false }),
			cacheService: this.moduleRef.get(CacheService, { strict: false }),
			userFollowingService: this.moduleRef.get(UserFollowingService, { strict: false }),
			channelFollowingService: this.moduleRef.get(ChannelFollowingService, { strict: false }),
			fanoutTimelineEndpointService: this.moduleRef.get(FanoutTimelineEndpointService, { strict: false }),
			followingsRepository: this.moduleRef.get<FollowingsRepository>(DI.followingsRepository, { strict: false }),
			userListMembershipsRepository: this.moduleRef.get<UserListMembershipsRepository>(DI.userListMembershipsRepository, { strict: false }),
		});
		return this.router;
	}
}
