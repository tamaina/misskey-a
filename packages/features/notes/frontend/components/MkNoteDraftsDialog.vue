<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialogEl"
	:width="600"
	:height="650"
	:withOkButton="false"
	@click="cancel()"
	@close="cancel()"
	@closed="emit('closed')"
	@esc="cancel()"
>
	<template #header>
		{{ $locale.sfc.draftsAndScheduledNotes }} ({{ currentDraftsCount }}/{{ $i?.policies.noteDraftLimit }})
	</template>

	<MkStickyContainer>
		<template #header>
			<MkTabs
				v-model:tab="tab"
				centered
				:class="$style.tabs"
				:tabs="[
					{
						key: 'drafts',
						title: $locale.sfc.drafts,
						icon: 'ti ti-pencil-question',
					},
					{
						key: 'scheduled',
						title: $locale.sfc.scheduled,
						icon: 'ti ti-calendar-clock',
					},
				]"
			/>
		</template>

		<div class="_spacer">
			<MkPagination :key="tab" :paginator="tab === 'scheduled' ? scheduledPaginator : draftsPaginator" withControl>
				<template #empty>
					<MkResult type="empty" :text="$locale.sfc.draftsNoDrafts"/>
				</template>

				<template #default="{ items }">
					<div class="_gaps_s">
						<div
							v-for="draft in (items as unknown as Misskey.entities.NoteDraft[])"
							:key="draft.id"
							v-panel
							:class="[$style.draft]"
						>
							<div :class="$style.draftBody" class="_gaps_s">
								<MkInfo v-if="draft.scheduledAt != null && draft.isActuallyScheduled">
									<I18n :src="$locale.sfc.scheduledToPostOnX" tag="span">
										<template #x>
											<MkTime :time="draft.scheduledAt" :mode="'detail'" style="font-weight: bold;"/>
										</template>
									</I18n>
								</MkInfo>
								<div :class="$style.draftInfo">
									<div :class="$style.draftMeta">
										<div v-if="draft.reply" class="_nowrap">
											<i class="ti ti-arrow-back-up"></i> <I18n :src="$locale.sfc.draftsReplyTo" tag="span">
												<template #user>
													<Mfm v-if="draft.reply.user.name != null" :text="draft.reply.user.name" :plain="true" :nowrap="true"/>
													<MkAcct v-else :user="draft.reply.user"/>
												</template>
											</I18n>
										</div>
										<div v-else-if="draft.replyId" class="_nowrap">
											<i class="ti ti-arrow-back-up"></i> <I18n :src="$locale.sfc.draftsReplyTo" tag="span">
												<template #user>
													{{ $locale.sfc.deletedNote }}
												</template>
											</I18n>
										</div>
										<div v-if="draft.renote && draft.text != null" class="_nowrap">
											<i class="ti ti-quote"></i> <I18n :src="$locale.sfc.draftsQuoteOf" tag="span">
												<template #user>
													<Mfm v-if="draft.renote.user.name != null" :text="draft.renote.user.name" :plain="true" :nowrap="true"/>
													<MkAcct v-else :user="draft.renote.user"/>
												</template>
											</I18n>
										</div>
										<div v-else-if="draft.renoteId" class="_nowrap">
											<i class="ti ti-quote"></i> <I18n :src="$locale.sfc.draftsQuoteOf" tag="span">
												<template #user>
													{{ $locale.sfc.deletedNote }}
												</template>
											</I18n>
										</div>
										<div v-if="draft.channel" class="_nowrap">
											<i class="ti ti-device-tv"></i> {{ interpolateLocaleParameters($locale.sfc.draftsPostTo, { channel: draft.channel.name }) }}
										</div>
									</div>
								</div>
								<div :class="$style.draftContent">
									<Mfm :text="getNoteSummary(draft, { showRenote: false, showReply: false })" :plain="true" :author="draft.user"/>
								</div>
								<div :class="$style.draftFooter">
									<div :class="$style.draftVisibility">
										<span :title="copyLocaleDictionary($locale.sfc.visibilityLabels)[draft.visibility]">
											<i v-if="draft.visibility === 'public'" class="ti ti-world"></i>
											<i v-else-if="draft.visibility === 'home'" class="ti ti-home"></i>
											<i v-else-if="draft.visibility === 'followers'" class="ti ti-lock"></i>
											<i v-else-if="draft.visibility === 'specified'" class="ti ti-mail"></i>
										</span>
										<span v-if="draft.localOnly" :title="copyLocaleDictionary($locale.sfc.visibilityLabels)['disableFederation']"><i class="ti ti-rocket-off"></i></span>
									</div>
									<MkTime :time="draft.createdAt" :class="$style.draftCreatedAt" mode="detail" colored/>
								</div>
							</div>

							<div :class="$style.draftActions" class="_buttons">
								<template v-if="draft.scheduledAt != null && draft.isActuallyScheduled">
									<MkButton
										small
										@click="cancelSchedule(draft)"
									>
										<i class="ti ti-calendar-x"></i> {{ $locale.sfc.draftsCancelSchedule }}
									</MkButton>
									<!-- TODO
									<MkButton
										small
										@click="reSchedule(draft)"
									>
										<i class="ti ti-calendar-time"></i> {{ i18n.ts._drafts.reSchedule }}
									</MkButton>
									-->
								</template>
								<MkButton
									v-else
									small
									@click="restoreDraft(draft)"
								>
									<i class="ti ti-corner-up-left"></i> {{ $locale.sfc.draftsRestore }}
								</MkButton>
								<MkButton
									v-tooltip="$locale.sfc.draftsDelete"
									danger
									small
									:iconOnly="true"
									style="margin-left: auto;"
									@click="deleteDraft(draft)"
								>
									<i class="ti ti-trash"></i>
								</MkButton>
							</div>
						</div>
					</div>
				</template>
			</MkPagination>
		</div>
	</MkStickyContainer>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, shallowRef, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import { getNoteSummary } from '@features/notes/frontend/utility/get-note-summary.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import * as os from '@features/ui/frontend/os.js';
import { $i } from '@features/auth/frontend/i.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import MkTabs from '@features/ui/frontend/components/MkTabs.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';

const props = defineProps<{
	scheduled?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'restore', draft: Misskey.entities.NoteDraft): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const tab = ref<'drafts' | 'scheduled'>(props.scheduled ? 'scheduled' : 'drafts');

const draftsPaginator = markRaw(new Paginator('notes/drafts/list', {
	limit: 10,
	params: {
		scheduled: false,
	},
}));

const scheduledPaginator = markRaw(new Paginator('notes/drafts/list', {
	limit: 10,
	params: {
		scheduled: true,
	},
}));

const currentDraftsCount = ref(0);
misskeyApi('notes/drafts/count').then((count) => {
	currentDraftsCount.value = count;
});

const dialogEl = shallowRef<InstanceType<typeof MkModalWindow>>();

function cancel() {
	emit('cancel');
	dialogEl.value?.close();
}

function restoreDraft(draft: Misskey.entities.NoteDraft) {
	emit('restore', draft);
	dialogEl.value?.close();
}

async function deleteDraft(draft: Misskey.entities.NoteDraft) {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: $locale.value.sfc.draftsDeleteAreYouSure,
	});

	if (canceled) return;

	os.apiWithDialog('notes/drafts/delete', { draftId: draft.id }).then(() => {
		draftsPaginator.reload();
	});
}

async function cancelSchedule(draft: Misskey.entities.NoteDraft) {
	os.apiWithDialog('notes/drafts/update', {
		draftId: draft.id,
		isActuallyScheduled: false,
		scheduledAt: null,
	}).then(() => {
		scheduledPaginator.reload();
	});
}
</script>

<style lang="scss" module>
.draft {
	padding: 16px;
	gap: 16px;
	border-radius: 10px;
}

.draftBody {
	width: 100%;
	min-width: 0;
}

.draftInfo {
	display: flex;
	width: 100%;
	font-size: 0.85em;
	opacity: 0.7;
}

.draftMeta {
	flex-grow: 1;
	min-width: 0;
}

.draftContent {
	display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
	line-clamp: 2;
  overflow: hidden;
	font-size: 0.9em;
}

.draftFooter {
	display: flex;
	align-items: center;
	gap: 8px;
}

.draftVisibility {
	flex-shrink: 0;
}

.draftCreatedAt {
	font-size: 85%;
	opacity: 0.7;
}

.draftActions {
	margin-top: 16px;
	padding-top: 16px;
	border-top: solid 1px var(--MI_THEME-divider);
}

.tabs {
	background: color(from var(--MI_THEME-bg) srgb r g b / 0.75);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	border-bottom: solid 0.5px var(--MI_THEME-divider);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"draftsAndScheduledNotes": "Drafts and scheduled notes",
	"drafts": "Drafts",
	"scheduled": "Scheduled",
	"draftsNoDrafts": "No drafts",
	"scheduledToPostOnX": "Note is scheduled for {x}",
	"draftsReplyTo": "Reply to {user}",
	"deletedNote": "ملاحظة محذوفة",
	"draftsQuoteOf": "Citation to {user}'s note",
	"draftsPostTo": "Posting to {channel}",
	"visibilityLabels": {
		"public": "علني",
		"publicDescription": "ستكون ملاحظتك مرئية لكل المستخدمين",
		"home": "الرئيسي",
		"homeDescription": "انشر في الخيط الزمني الرئيسي فقط",
		"followers": "المتابِعون",
		"followersDescription": "اجعلها مرئية لمتابِعيك فقط",
		"specified": "مباشرة",
		"specifiedDescription": "اجعلها مرئية لمستخدمين محددين",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"draftsCancelSchedule": "Cancel schedule",
	"draftsRestore": "Restore",
	"draftsDelete": "Delete Draft",
	"draftsDeleteAreYouSure": "Delete draft?"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"draftsAndScheduledNotes": "Esborranys i publicacions programades",
	"drafts": "Esborrany ",
	"scheduled": "Programat",
	"draftsNoDrafts": "No hi ha esborranys",
	"scheduledToPostOnX": "S'ha programat la nota per {x}",
	"draftsReplyTo": "Respondre a {user}",
	"deletedNote": "Publicacions eliminades",
	"draftsQuoteOf": "Citar les notes de {user}",
	"draftsPostTo": "Destinat a {channel}",
	"visibilityLabels": {
		"public": "Públic ",
		"publicDescription": "La teva nota la podrà veure tothom ",
		"home": "Inici",
		"homeDescription": "Publicar només a la línia de temps d'Inici ",
		"followers": "Seguidors",
		"followersDescription": "Fes només visible per als teus seguidors",
		"specified": "Directe",
		"specifiedDescription": "Fer visible només per alguns usuaris",
		"disableFederation": "Sense federar",
		"disableFederationDescription": "No enviar a altres servidors"
	},
	"draftsCancelSchedule": "Cancel·lar la programació",
	"draftsRestore": "Restaurar esborrany",
	"draftsDelete": "Esborrar esborranys",
	"draftsDeleteAreYouSure": "Vols esborrar els esborranys?"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"draftsAndScheduledNotes": "Drafts and scheduled notes",
	"drafts": "Drafts",
	"scheduled": "Scheduled",
	"draftsNoDrafts": "No drafts",
	"scheduledToPostOnX": "Note is scheduled for {x}",
	"draftsReplyTo": "Reply to {user}",
	"deletedNote": "Odstraněné příspěvky",
	"draftsQuoteOf": "Citation to {user}'s note",
	"draftsPostTo": "Posting to {channel}",
	"visibilityLabels": {
		"public": "Veřejný",
		"publicDescription": "Vaše poznámka bude viditelná pro všechny uživatele",
		"home": "Domů",
		"homeDescription": "Zveřejnit příspěvek pouze na domovskou časovou osu",
		"followers": "Sledující",
		"followersDescription": "Zviditelnit pouze pro své sledující",
		"specified": "Přímý",
		"specifiedDescription": "Zviditelnit pouze pro určité uživatele",
		"disableFederation": "Defederace",
		"disableFederationDescription": "Nepřenášet do jiných instancí"
	},
	"draftsCancelSchedule": "Cancel schedule",
	"draftsRestore": "Restore",
	"draftsDelete": "Delete Draft",
	"draftsDeleteAreYouSure": "Delete draft?"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"draftsAndScheduledNotes": "Drafts and scheduled notes",
	"drafts": "Drafts",
	"scheduled": "Scheduled",
	"draftsNoDrafts": "No drafts",
	"scheduledToPostOnX": "Note is scheduled for {x}",
	"draftsReplyTo": "Reply to {user}",
	"deletedNote": "Deleted note",
	"draftsQuoteOf": "Citation to {user}'s note",
	"draftsPostTo": "Posting to {channel}",
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Home",
		"homeDescription": "Post to home timeline only",
		"followers": "Followers",
		"followersDescription": "Make visible to your followers only",
		"specified": "Direct",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"draftsCancelSchedule": "Cancel schedule",
	"draftsRestore": "Restore",
	"draftsDelete": "Delete Draft",
	"draftsDeleteAreYouSure": "Delete draft?"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"draftsAndScheduledNotes": "Entwürfe und geplante Beiträge",
	"drafts": "Entwurf",
	"scheduled": "Geplant",
	"draftsNoDrafts": "Keine Entwürfe",
	"scheduledToPostOnX": "Der Beitrag ist für {x} geplant.",
	"draftsReplyTo": "Antwort an {user}",
	"deletedNote": "Gelöschte Notiz",
	"draftsQuoteOf": "Zitat von {user}s Notiz",
	"draftsPostTo": "Beitrag im {channel}",
	"visibilityLabels": {
		"public": "Öffentlich",
		"publicDescription": "Deine Notiz wird global für alle Benutzer sichtbar sein",
		"home": "Startseite",
		"homeDescription": "Notiz nur in die Startseiten-Chronik schicken",
		"followers": "Follower",
		"followersDescription": "Nur für Follower sichtbar",
		"specified": "Direkt",
		"specifiedDescription": "Nur für bestimmte Benutzer sichtbar",
		"disableFederation": "Deföderieren",
		"disableFederationDescription": "Nicht an andere Instanzen übertragen"
	},
	"draftsCancelSchedule": "Reservierung stornieren",
	"draftsRestore": "Wiederherstellen",
	"draftsDelete": "Entwurf löschen",
	"draftsDeleteAreYouSure": "Entwurf löschen?"
}
</locale>

<locale lang="json" locale="en-US">
{
	"draftsAndScheduledNotes": "Drafts and scheduled notes",
	"drafts": "Drafts",
	"scheduled": "Scheduled",
	"draftsNoDrafts": "No drafts",
	"scheduledToPostOnX": "Note is scheduled for {x}",
	"draftsReplyTo": "Reply to {user}",
	"deletedNote": "Deleted note",
	"draftsQuoteOf": "Citation to {user}'s note",
	"draftsPostTo": "Posting to {channel}",
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Home",
		"homeDescription": "Post to home timeline only",
		"followers": "Followers",
		"followersDescription": "Make visible to your followers only",
		"specified": "Direct",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"draftsCancelSchedule": "Cancel schedule",
	"draftsRestore": "Restore",
	"draftsDelete": "Delete Draft",
	"draftsDeleteAreYouSure": "Delete draft?"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"draftsAndScheduledNotes": "Borradores y notas programadas",
	"drafts": "Borrador",
	"scheduled": "Programado",
	"draftsNoDrafts": "No hay borradores disponibles.",
	"scheduledToPostOnX": "La nota está programada para el {x}.",
	"draftsReplyTo": "Responder a {user}",
	"deletedNote": "Nota eliminada",
	"draftsQuoteOf": "Citar las notas de {user}",
	"draftsPostTo": "Destino a {channel}",
	"visibilityLabels": {
		"public": "Público",
		"publicDescription": "Visible para todos los usuarios",
		"home": "Inicio",
		"homeDescription": "Visible sólo en la linea de tiempo de inicio",
		"followers": "Seguidores",
		"followersDescription": "Visible sólo para tus seguidores",
		"specified": "Nota directa",
		"specifiedDescription": "Visible sólo para los usuarios elegidos",
		"disableFederation": "No federado",
		"disableFederationDescription": "No enviar a otras instancias"
	},
	"draftsCancelSchedule": "Cancelar programación",
	"draftsRestore": "Restaurar",
	"draftsDelete": "Eliminar borrador",
	"draftsDeleteAreYouSure": "¿Quieres borrar el borrador?"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"draftsAndScheduledNotes": "Drafts and scheduled notes",
	"drafts": "Drafts",
	"scheduled": "Scheduled",
	"draftsNoDrafts": "No drafts",
	"scheduledToPostOnX": "Note is scheduled for {x}",
	"draftsReplyTo": "Reply to {user}",
	"deletedNote": "Note supprimée",
	"draftsQuoteOf": "Citation to {user}'s note",
	"draftsPostTo": "Posting to {channel}",
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Publier à tou·te·s les utilisateur·rice·s",
		"home": "Principal",
		"homeDescription": "Publier sur le fil principal uniquement",
		"followers": "Abonné·e·s",
		"followersDescription": "Publier à vos abonné·e·s uniquement",
		"specified": "Direct",
		"specifiedDescription": "Publier uniquement aux utilisateur·rice·s mentionné·e·s",
		"disableFederation": "Défédérer",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"draftsCancelSchedule": "Cancel schedule",
	"draftsRestore": "Restore",
	"draftsDelete": "Delete Draft",
	"draftsDeleteAreYouSure": "Delete draft?"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"draftsAndScheduledNotes": "Draf dan note terjadwal",
	"drafts": "Draf",
	"scheduled": "Scheduled",
	"draftsNoDrafts": "Tidak ada draf",
	"scheduledToPostOnX": "Note is scheduled for {x}",
	"draftsReplyTo": "Balas ke {user}",
	"deletedNote": "Catatan yang dihapus",
	"draftsQuoteOf": "Mengutip note dari {user}",
	"draftsPostTo": "Mengunggah ke {channel}",
	"visibilityLabels": {
		"public": "Publik",
		"publicDescription": "Catat ke lini masa global",
		"home": "Beranda",
		"homeDescription": "Catat ke lini masa beranda saja",
		"followers": "Pengikut",
		"followersDescription": "Catat ke pengikut saja",
		"specified": "Langsung",
		"specifiedDescription": "Catat ke pengguna yang ditentukan saja",
		"disableFederation": "Matikan federasi",
		"disableFederationDescription": "Jangan kirimkan ke instansi lain"
	},
	"draftsCancelSchedule": "Batalkan penjadwalan",
	"draftsRestore": "Kembalikan",
	"draftsDelete": "Hapus Draf",
	"draftsDeleteAreYouSure": "Hapus Draf?"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"draftsAndScheduledNotes": "Bozze e Note pianificate",
	"drafts": "Bozze",
	"scheduled": "Pianificata",
	"draftsNoDrafts": "Non c'è nessuna bozza.",
	"scheduledToPostOnX": "Pubblicazione pianificata {x}",
	"draftsReplyTo": "Rispondere a {user}",
	"deletedNote": "Nota eliminata",
	"draftsQuoteOf": "Citare la nota di {user}",
	"draftsPostTo": "Inserire in {channel}",
	"visibilityLabels": {
		"public": "Pubblica",
		"publicDescription": "Visibilità pubblica",
		"home": "Home",
		"homeDescription": "Visibile solo nella Home",
		"followers": "Follower",
		"followersDescription": "Visibile solo ai tuoi follower",
		"specified": "Nota diretta",
		"specifiedDescription": "Visibile solo ai profili menzionati",
		"disableFederation": "Gestisci la federazione",
		"disableFederationDescription": "Non spedire attività alle altre istanze remote"
	},
	"draftsCancelSchedule": "Annulla pianificazione",
	"draftsRestore": "Ripristina",
	"draftsDelete": "Elimina bozza",
	"draftsDeleteAreYouSure": "Vuoi davvero eliminare la bozza?"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"draftsAndScheduledNotes": "下書きと予約投稿",
	"drafts": "下書き",
	"scheduled": "予約",
	"draftsNoDrafts": "下書きはありません",
	"scheduledToPostOnX": "{x}に投稿が予約されています",
	"draftsReplyTo": "{user}への返信",
	"deletedNote": "削除されたノート",
	"draftsQuoteOf": "{user}のノートへの引用",
	"draftsPostTo": "{channel}への投稿",
	"visibilityLabels": {
		"public": "パブリック",
		"publicDescription": "全てのユーザーに公開",
		"home": "ホーム",
		"homeDescription": "ホームタイムラインのみに公開",
		"followers": "フォロワー",
		"followersDescription": "自分のフォロワーのみに公開",
		"specified": "指名",
		"specifiedDescription": "指定したユーザーのみに公開",
		"disableFederation": "連合なし",
		"disableFederationDescription": "他サーバーへの配信を行いません"
	},
	"draftsCancelSchedule": "予約解除",
	"draftsRestore": "復元",
	"draftsDelete": "下書きを削除",
	"draftsDeleteAreYouSure": "下書きを削除しますか？"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"draftsAndScheduledNotes": "下書きと予約投稿",
	"drafts": "下書き",
	"scheduled": "予約",
	"draftsNoDrafts": "下書きはあらへん",
	"scheduledToPostOnX": "{x}に投稿が予約されています",
	"draftsReplyTo": "{user}への返信",
	"deletedNote": "消された投稿",
	"draftsQuoteOf": "{user}のノートへの引用",
	"draftsPostTo": "{channel}への投稿",
	"visibilityLabels": {
		"public": "パブリック",
		"publicDescription": "みんなに公開",
		"home": "ホーム",
		"homeDescription": "ホームタイムラインのみに公開するで",
		"followers": "フォロワー",
		"followersDescription": "自分のフォロワーのみに公開するで",
		"specified": "ダイレクト",
		"specifiedDescription": "選んだユーザーのみに公開するで",
		"disableFederation": "連合なし",
		"disableFederationDescription": "他サーバーへは送らんとくわ"
	},
	"draftsCancelSchedule": "予約解除",
	"draftsRestore": "復元",
	"draftsDelete": "下書きをほかす",
	"draftsDeleteAreYouSure": "下書きをほかしてもええか？"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"draftsAndScheduledNotes": "Drafts and scheduled notes",
	"drafts": "Drafts",
	"scheduled": "Scheduled",
	"draftsNoDrafts": "No drafts",
	"scheduledToPostOnX": "Note is scheduled for {x}",
	"draftsReplyTo": "Reply to {user}",
	"deletedNote": "Deleted note",
	"draftsQuoteOf": "Citation to {user}'s note",
	"draftsPostTo": "Posting to {channel}",
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Home",
		"homeDescription": "Post to home timeline only",
		"followers": "Imeḍfaṛen",
		"followersDescription": "Make visible to your followers only",
		"specified": "Direct",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"draftsCancelSchedule": "Cancel schedule",
	"draftsRestore": "Restore",
	"draftsDelete": "Delete Draft",
	"draftsDeleteAreYouSure": "Delete draft?"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"draftsAndScheduledNotes": "Drafts and scheduled notes",
	"drafts": "Drafts",
	"scheduled": "Scheduled",
	"draftsNoDrafts": "No drafts",
	"scheduledToPostOnX": "Note is scheduled for {x}",
	"draftsReplyTo": "Reply to {user}",
	"deletedNote": "Deleted note",
	"draftsQuoteOf": "Citation to {user}'s note",
	"draftsPostTo": "Posting to {channel}",
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Home",
		"homeDescription": "Post to home timeline only",
		"followers": "Followers",
		"followersDescription": "Make visible to your followers only",
		"specified": "ನೇರ ಟಿಪ್ಪಣಿಗಳು",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"draftsCancelSchedule": "Cancel schedule",
	"draftsRestore": "Restore",
	"draftsDelete": "Delete Draft",
	"draftsDeleteAreYouSure": "Delete draft?"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"draftsAndScheduledNotes": "초안과 예약 게시물",
	"drafts": "초안",
	"scheduled": "예약",
	"draftsNoDrafts": "초안 없음\n",
	"scheduledToPostOnX": "{x}에 게시가 예약돼있습니다.",
	"draftsReplyTo": "{user}에 회신",
	"deletedNote": "삭제된 노트",
	"draftsQuoteOf": "{user} 노트에 인용",
	"draftsPostTo": "{channel}에 게시",
	"visibilityLabels": {
		"public": "공개",
		"publicDescription": "모든 유저에게 공개",
		"home": "홈",
		"homeDescription": "홈 타임라인에만 공개",
		"followers": "팔로워",
		"followersDescription": "팔로워에게만 공개",
		"specified": "다이렉트",
		"specifiedDescription": "지정한 유저에게만 공개",
		"disableFederation": "연합에 보내지 않기",
		"disableFederationDescription": "다른 서버로 보내지 않습니다"
	},
	"draftsCancelSchedule": "예약 해제",
	"draftsRestore": "복원",
	"draftsDelete": "초안 삭제\n",
	"draftsDeleteAreYouSure": "초안을 삭제하시겠습니까?"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"draftsAndScheduledNotes": "Drafts and scheduled notes",
	"drafts": "Drafts",
	"scheduled": "Scheduled",
	"draftsNoDrafts": "No drafts",
	"scheduledToPostOnX": "Note is scheduled for {x}",
	"draftsReplyTo": "Reply to {user}",
	"deletedNote": "Verwijderde notitie",
	"draftsQuoteOf": "Citation to {user}'s note",
	"draftsPostTo": "Posting to {channel}",
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Startpagina",
		"homeDescription": "Post to home timeline only",
		"followers": "Volgers",
		"followersDescription": "Make visible to your followers only",
		"specified": "Directe notities",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"draftsCancelSchedule": "Cancel schedule",
	"draftsRestore": "Restore",
	"draftsDelete": "Delete Draft",
	"draftsDeleteAreYouSure": "Delete draft?"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"draftsAndScheduledNotes": "Drafts and scheduled notes",
	"drafts": "Drafts",
	"scheduled": "Scheduled",
	"draftsNoDrafts": "No drafts",
	"scheduledToPostOnX": "Note is scheduled for {x}",
	"draftsReplyTo": "Reply to {user}",
	"deletedNote": "Deleted note",
	"draftsQuoteOf": "Citation to {user}'s note",
	"draftsPostTo": "Posting to {channel}",
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Hjem",
		"homeDescription": "Post to home timeline only",
		"followers": "Følgere",
		"followersDescription": "Make visible to your followers only",
		"specified": "Direct",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"draftsCancelSchedule": "Cancel schedule",
	"draftsRestore": "Restore",
	"draftsDelete": "Delete Draft",
	"draftsDeleteAreYouSure": "Delete draft?"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"draftsAndScheduledNotes": "Drafts and scheduled notes",
	"drafts": "Drafts",
	"scheduled": "Scheduled",
	"draftsNoDrafts": "No drafts",
	"scheduledToPostOnX": "Note is scheduled for {x}",
	"draftsReplyTo": "Reply to {user}",
	"deletedNote": "Usunięty wpis",
	"draftsQuoteOf": "Citation to {user}'s note",
	"draftsPostTo": "Posting to {channel}",
	"visibilityLabels": {
		"public": "Publiczny",
		"publicDescription": "Twój wpis pojawi się w publicznych osiach czasu",
		"home": "Strona główna",
		"homeDescription": "Publikuj tylko na głównej osi czasu",
		"followers": "Obserwujący",
		"followersDescription": "Widoczne tylko dla obserwujących",
		"specified": "Bezpośredni",
		"specifiedDescription": "Napisz tylko określonym użytkownikom",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Nie przesyłaj do innych instancji"
	},
	"draftsCancelSchedule": "Cancel schedule",
	"draftsRestore": "Restore",
	"draftsDelete": "Delete Draft",
	"draftsDeleteAreYouSure": "Delete draft?"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"draftsAndScheduledNotes": "Rascunhos e notas agendadas.",
	"drafts": "Rascunhos",
	"scheduled": "Agendado",
	"draftsNoDrafts": "Sem rascunhos",
	"scheduledToPostOnX": "A nota está agendada para {x}",
	"draftsReplyTo": "Resposta a {user}",
	"deletedNote": "Postagem excluída",
	"draftsQuoteOf": "Citação à nota de {user}",
	"draftsPostTo": "Publicando em {channel}",
	"visibilityLabels": {
		"public": "Público",
		"publicDescription": "Sua nota será visível para todos os usuários",
		"home": "Início",
		"homeDescription": "Publicar apenas na linha do tempo Início",
		"followers": "Seguidores",
		"followersDescription": "Tornar visível apenas para os meus seguidores",
		"specified": "Mensagem Direta",
		"specifiedDescription": "Tornar visível apenas para usuários específicos",
		"disableFederation": "Defederar",
		"disableFederationDescription": "Não transmitir às outras instâncias"
	},
	"draftsCancelSchedule": "Cancelar agendamento",
	"draftsRestore": "Redefinir",
	"draftsDelete": "Excluir Rascunho",
	"draftsDeleteAreYouSure": "Excluir rascunho?"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"draftsAndScheduledNotes": "Черновики и отложенные публикации",
	"drafts": "Черновик",
	"scheduled": "Отложено",
	"draftsNoDrafts": "No drafts",
	"scheduledToPostOnX": "Заметка запланирована на {x}",
	"draftsReplyTo": "Reply to {user}",
	"deletedNote": "Удалённая заметка",
	"draftsQuoteOf": "Citation to {user}'s note",
	"draftsPostTo": "Posting to {channel}",
	"visibilityLabels": {
		"public": "Общедоступно",
		"publicDescription": "Открыто для всех",
		"home": "Домашняя",
		"homeDescription": "Не для общих лент",
		"followers": "Для подписчиков",
		"followersDescription": "Только вашим подписчикам",
		"specified": "Личное",
		"specifiedDescription": "Тем, кого укажете",
		"disableFederation": "Отключить федерацию",
		"disableFederationDescription": "Не доставляет в другие экземпляры"
	},
	"draftsCancelSchedule": "Cancel schedule",
	"draftsRestore": "Восстановить",
	"draftsDelete": "Delete Draft",
	"draftsDeleteAreYouSure": "Delete draft?"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"draftsAndScheduledNotes": "Drafts and scheduled notes",
	"drafts": "Drafts",
	"scheduled": "Scheduled",
	"draftsNoDrafts": "No drafts",
	"scheduledToPostOnX": "Note is scheduled for {x}",
	"draftsReplyTo": "Reply to {user}",
	"deletedNote": "Odstránené príspevky",
	"draftsQuoteOf": "Citation to {user}'s note",
	"draftsPostTo": "Posting to {channel}",
	"visibilityLabels": {
		"public": "Verejné",
		"publicDescription": "Vaša poznámku bude viditeľná všetkým používateľom",
		"home": "Domov",
		"homeDescription": "Pridať iba na domácu časovú os",
		"followers": "Sledujúci",
		"followersDescription": "Viditeľné iba tým, ktorí vás sledujú",
		"specified": "Priame",
		"specifiedDescription": "Viditeľné iba pre konkrétnych používateľov",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"draftsCancelSchedule": "Cancel schedule",
	"draftsRestore": "Restore",
	"draftsDelete": "Delete Draft",
	"draftsDeleteAreYouSure": "Delete draft?"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"draftsAndScheduledNotes": "ร่างและกำหนดเวลาโพสต์",
	"drafts": "ร่าง",
	"scheduled": "กำหนดเวลา",
	"draftsNoDrafts": "ไม่มีฉบับร่าง",
	"scheduledToPostOnX": "มีการกำหนดเวลาให้โพสต์ไว้ที่ {x}",
	"draftsReplyTo": "ตอบกลับ {user}",
	"deletedNote": "โน้ตที่ถูกลบ",
	"draftsQuoteOf": "อ้างอิงถึงโน้ตของ {user}",
	"draftsPostTo": "โพสต์ไปยัง {channel}",
	"visibilityLabels": {
		"public": "สาธารณะ",
		"publicDescription": "โน้ตของคุณจะปรากฏแก่ผู้ใช้ทุกคน",
		"home": "หน้าหลัก",
		"homeDescription": "โพสต์ลงไทม์ไลน์หลักเท่านั้น",
		"followers": "ผู้ติดตาม",
		"followersDescription": "เฉพาะผู้ติดตามเท่านั้นที่มองเห็นได้",
		"specified": "ไดเร็ค",
		"specifiedDescription": "ทำให้มองเห็นได้เฉพาะผู้ใช้ที่ระบุเท่านั้น",
		"disableFederation": "การปิดใช้งานสหพันธ์",
		"disableFederationDescription": "อย่าส่งข้อมูลไปยังเซิร์ฟเวอร์อื่น"
	},
	"draftsCancelSchedule": "ยกเลิกกำหนดเวลา",
	"draftsRestore": "กู้คืน",
	"draftsDelete": "ลบฉบับร่าง",
	"draftsDeleteAreYouSure": "ต้องการลบฉบับร่างหรือไม่?"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"draftsAndScheduledNotes": "Taslaklar ve planlanmış gönderiler",
	"drafts": "Taslaklar",
	"scheduled": "rezervasyon",
	"draftsNoDrafts": "Taslak yok",
	"scheduledToPostOnX": "{x} için bir gönderi planlandı.",
	"draftsReplyTo": "{user} notunu yanıtla",
	"deletedNote": "Silinen not",
	"draftsQuoteOf": "{user} notuna alıntı",
	"draftsPostTo": "{channel}'a gönder",
	"visibilityLabels": {
		"public": "Halka açık",
		"publicDescription": "Notunuz tüm kullanıcılar tarafından görülebilir olacaktır.",
		"home": "Pano",
		"homeDescription": "Yalnızca ana panoya gönder",
		"followers": "Takipçiler",
		"followersDescription": "Sadece takipçilerine görünür hale getir",
		"specified": "Doğrudan",
		"specifiedDescription": "Yalnızca belirli kullanıcılar için görünür hale getir",
		"disableFederation": "Federasyon olmadan",
		"disableFederationDescription": "Diğer sunuculara aktarma"
	},
	"draftsCancelSchedule": "Rezervasyonu iptal et",
	"draftsRestore": "Geri yükle",
	"draftsDelete": "Taslak Sil",
	"draftsDeleteAreYouSure": "Taslağı silmek ister misin?"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"draftsAndScheduledNotes": "Drafts and scheduled notes",
	"drafts": "Drafts",
	"scheduled": "Scheduled",
	"draftsNoDrafts": "No drafts",
	"scheduledToPostOnX": "Note is scheduled for {x}",
	"draftsReplyTo": "Reply to {user}",
	"deletedNote": "Deleted note",
	"draftsQuoteOf": "Citation to {user}'s note",
	"draftsPostTo": "Posting to {channel}",
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Home",
		"homeDescription": "Post to home timeline only",
		"followers": "Followers",
		"followersDescription": "Make visible to your followers only",
		"specified": "Direct",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"draftsCancelSchedule": "Cancel schedule",
	"draftsRestore": "Restore",
	"draftsDelete": "Delete Draft",
	"draftsDeleteAreYouSure": "Delete draft?"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"draftsAndScheduledNotes": "Чернетки й відкладені нотатки",
	"drafts": "Чернетка",
	"scheduled": "Заплановано",
	"draftsNoDrafts": "No drafts",
	"scheduledToPostOnX": "Нотатку заплановано на {x}",
	"draftsReplyTo": "Reply to {user}",
	"deletedNote": "Видалена нотатка",
	"draftsQuoteOf": "Citation to {user}'s note",
	"draftsPostTo": "Posting to {channel}",
	"visibilityLabels": {
		"public": "Публічний",
		"publicDescription": "Для всіх користувачів",
		"home": "Домівка",
		"homeDescription": "Лише на домашній стрічці",
		"followers": "Підписники",
		"followersDescription": "Тільки для підписників",
		"specified": "Особисто",
		"specifiedDescription": "Лише для певних користувачів",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	},
	"draftsCancelSchedule": "Cancel schedule",
	"draftsRestore": "Відновити",
	"draftsDelete": "Delete Draft",
	"draftsDeleteAreYouSure": "Delete draft?"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"draftsAndScheduledNotes": "Drafts and scheduled notes",
	"drafts": "Drafts",
	"scheduled": "Scheduled",
	"draftsNoDrafts": "No drafts",
	"scheduledToPostOnX": "Note is scheduled for {x}",
	"draftsReplyTo": "Reply to {user}",
	"deletedNote": "Tút đã bị xóa",
	"draftsQuoteOf": "Citation to {user}'s note",
	"draftsPostTo": "Posting to {channel}",
	"visibilityLabels": {
		"public": "Công khai",
		"publicDescription": "Mọi người đều có thể đọc tút của bạn",
		"home": "Trang chính",
		"homeDescription": "Chỉ đăng lên bảng tin nhà",
		"followers": "Người theo dõi",
		"followersDescription": "Dành riêng cho người theo dõi",
		"specified": "Nhắn riêng",
		"specifiedDescription": "Chỉ người được nhắc đến mới thấy",
		"disableFederation": "Không liên hợp",
		"disableFederationDescription": "Không đưa tin cho chủ máy khác"
	},
	"draftsCancelSchedule": "Cancel schedule",
	"draftsRestore": "Restore",
	"draftsDelete": "Delete Draft",
	"draftsDeleteAreYouSure": "Delete draft?"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"draftsAndScheduledNotes": "草稿和定时发送",
	"drafts": "草稿",
	"scheduled": "定时",
	"draftsNoDrafts": "没有草稿",
	"scheduledToPostOnX": "已预定在 {x} 发出",
	"draftsReplyTo": "回复给 {user}",
	"deletedNote": "已删除的帖子",
	"draftsQuoteOf": "引用自 {user} 的帖子",
	"draftsPostTo": "向 {channel} 的投稿",
	"visibilityLabels": {
		"public": "公开",
		"publicDescription": "所有用户均可见",
		"home": "首页",
		"homeDescription": "仅发布至首页",
		"followers": "仅关注者",
		"followersDescription": "仅关注者可见",
		"specified": "指定用户",
		"specifiedDescription": "仅发送至指定用户",
		"disableFederation": "仅限本地",
		"disableFederationDescription": "不发送到其他服务器"
	},
	"draftsCancelSchedule": "取消定时",
	"draftsRestore": "恢复",
	"draftsDelete": "删除草稿",
	"draftsDeleteAreYouSure": "确认删除草稿吗？"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"draftsAndScheduledNotes": "草稿與排定發布",
	"drafts": "草稿\n",
	"scheduled": "排定",
	"draftsNoDrafts": "沒有草稿。\n",
	"scheduledToPostOnX": "已排定在 {x} 發布貼文",
	"draftsReplyTo": "回覆給 {user}\n",
	"deletedNote": "已刪除的貼文",
	"draftsQuoteOf": "引用自 {user} 的貼文\n",
	"draftsPostTo": "發佈到 {channel}\n",
	"visibilityLabels": {
		"public": "公開",
		"publicDescription": "發佈給所有使用者",
		"home": "首頁",
		"homeDescription": "僅發布至首頁的時間軸",
		"followers": "追隨者",
		"followersDescription": "僅發布至關注者",
		"specified": "指定使用者",
		"specifiedDescription": "僅發布至指定使用者",
		"disableFederation": "停用聯邦",
		"disableFederationDescription": "不發送到其他伺服器"
	},
	"draftsCancelSchedule": "解除排定",
	"draftsRestore": "還原",
	"draftsDelete": "刪除草稿",
	"draftsDeleteAreYouSure": "確定要刪除草稿嗎？\n"
}
</locale>
