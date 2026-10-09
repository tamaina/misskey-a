<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<Transition :name="prefer.s.animation ? 'fade' : ''" mode="out-in">
			<div v-if="flash" :key="flash.id">
				<Transition :name="prefer.s.animation ? 'zoom' : ''" mode="out-in">
					<div v-if="started" :class="$style.started">
						<div class="main _panel">
							<MkAsUi v-if="root" :component="root" :components="components"/>
						</div>
						<div class="actions _panel">
							<div class="items">
								<MkButton v-tooltip="$locale.sfc.reload" class="button" rounded @click="reset"><i class="ti ti-reload"></i></MkButton>
							</div>
							<div class="items">
								<MkButton v-if="flash.isLiked" v-tooltip="$locale.sfc.unlike" asLike class="button" rounded primary @click="unlike()"><i class="ti ti-heart"></i><span v-if="flash?.likedCount && flash.likedCount > 0" style="margin-left: 6px;">{{ flash.likedCount }}</span></MkButton>
								<MkButton v-else v-tooltip="$locale.sfc.like" asLike class="button" rounded @click="like()"><i class="ti ti-heart"></i><span v-if="flash?.likedCount && flash.likedCount > 0" style="margin-left: 6px;">{{ flash.likedCount }}</span></MkButton>
								<MkButton v-tooltip="$locale.sfc.copyLink" class="button" rounded @click="copyLink"><i class="ti ti-link ti-fw"></i></MkButton>
								<MkButton v-tooltip="$locale.sfc.share" class="button" rounded @click="share"><i class="ti ti-share ti-fw"></i></MkButton>
								<MkButton v-if="$i && $i.id !== flash.user.id" class="button" rounded @mousedown="showMenu"><i class="ti ti-dots ti-fw"></i></MkButton>
							</div>
						</div>
					</div>
					<div v-else :class="$style.ready">
						<div class="_panel main">
							<div class="title">{{ flash.title }}</div>
							<div class="summary"><Mfm :text="flash.summary"/></div>
							<MkButton class="start" gradate rounded large @click="start">Play</MkButton>
							<div class="info">
								<span v-tooltip="$locale.sfc.numberOfLikes"><i class="ti ti-heart"></i> {{ flash.likedCount }}</span>
							</div>
						</div>
					</div>
				</Transition>
				<MkFolder :defaultOpen="false" :max-height="280" class="_margin">
					<template #icon><i class="ti ti-code"></i></template>
					<template #label>{{ $locale.sfc.viewSource }}</template>

					<MkCode :code="flash.script" lang="is" class="_monospace"/>
				</MkFolder>
				<div :class="$style.footer">
					<Mfm :text="`By @${flash.user.username}`"/>
					<div class="date">
						<div v-if="flash.createdAt != flash.updatedAt"><i class="ti ti-clock"></i> {{ $locale.sfc.updatedAt }}: <MkTime :time="flash.updatedAt" mode="detail"/></div>
						<div><i class="ti ti-clock"></i> {{ $locale.sfc.createdAt }}: <MkTime :time="flash.createdAt" mode="detail"/></div>
					</div>
				</div>
				<MkA v-if="$i && $i.id === flash.userId" :to="`/play/${flash.id}/edit`" style="color: var(--MI_THEME-accent);">{{ $locale.sfc.editThisPage }}</MkA>
				<MkAd :preferForms="['horizontal', 'horizontal-big']"/>
			</div>
			<MkError v-else-if="error" @retry="fetchFlash()"/>
			<MkLoading v-else/>
		</Transition>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, onDeactivated, onUnmounted, ref, watch, shallowRef, defineAsyncComponent } from 'vue';
import * as Misskey from 'misskey-js';
import { utils } from '@syuilo/aiscript';
import { compareVersions } from 'compare-versions';
import { url } from '@features/boot/frontend/shared/config.js';
import type { Ref } from 'vue';
import type { AsUiComponent, AsUiRoot } from '@features/play/frontend/services/aiscript/ui.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import type { Interpreter } from '@syuilo/aiscript';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkAsUi from '@features/play/frontend/components/MkAsUi.vue';
import { registerAsUiLib } from '@features/play/frontend/services/aiscript/ui.js';
import { aiScriptReadline, createAiScriptEnv } from '@features/play/frontend/services/aiscript/api.js';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkCode from '@features/markup/frontend/components/MkCode.vue';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { $i } from '@features/auth/frontend/i.js';
import { isSupportShare } from '@features/navigation/frontend/utility/navigator.js';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import { pleaseLogin } from '@features/auth/frontend/utility/please-login.js';

const props = defineProps<{
	id: string;
}>();

const flash = ref<Misskey.entities.Flash | null>(null);
const error = ref<any>(null);

function fetchFlash() {
	flash.value = null;
	misskeyApi('flash/show', {
		flashId: props.id,
	}).then(_flash => {
		flash.value = _flash;
	}).catch(err => {
		error.value = err;
	});
}

function share(ev: PointerEvent) {
	if (!flash.value) return;

	const menuItems: MenuItem[] = [];

	menuItems.push({
		text: $locale.value.sfc.shareWithNote,
		icon: 'ti ti-pencil',
		action: shareWithNote,
	});

	if (isSupportShare()) {
		menuItems.push({
			text: $locale.value.sfc.share,
			icon: 'ti ti-share',
			action: shareWithNavigator,
		});
	}

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
}

function copyLink() {
	if (!flash.value) return;

	copyToClipboard(`${url}/play/${flash.value.id}`);
}

function shareWithNavigator() {
	if (!flash.value) return;

	navigator.share({
		title: flash.value.title,
		text: flash.value.summary,
		url: `${url}/play/${flash.value.id}`,
	});
}

function shareWithNote() {
	if (!flash.value) return;

	os.post({
		initialText: `${flash.value.title}\n${url}/play/${flash.value.id}`,
		instant: true,
	});
}

async function like() {
	if (!flash.value) return;

	const isLoggedIn = await pleaseLogin();
	if (!isLoggedIn) return;

	os.apiWithDialog('flash/like', {
		flashId: flash.value.id,
	}).then(() => {
		flash.value!.isLiked = true;
		flash.value!.likedCount++;
	});
}

async function unlike() {
	if (!flash.value) return;

	const isLoggedIn = await pleaseLogin();
	if (!isLoggedIn) return;

	const confirm = await os.confirm({
		type: 'warning',
		text: $locale.value.sfc.unlikeConfirm,
	});
	if (confirm.canceled) return;
	os.apiWithDialog('flash/unlike', {
		flashId: flash.value.id,
	}).then(() => {
		flash.value!.isLiked = false;
		flash.value!.likedCount--;
	});
}

watch(() => props.id, fetchFlash, { immediate: true });

const started = ref(false);
const aiscript = shallowRef<Interpreter | null>(null);
const root = ref<AsUiRoot>();
const components = ref<Ref<AsUiComponent>[]>([]);

function start() {
	started.value = true;
	run();
}

function getIsLegacy(version: string | null): boolean {
	if (version == null) return true;
	try {
		return compareVersions(version, '1.0.0') < 0;
	} catch {
		return false;
	}
}

async function run() {
	if (aiscript.value) aiscript.value.abort();
	if (!flash.value) return;

	const version = utils.getLangVersion(flash.value.script);
	const isLegacy = getIsLegacy(version);

	const { Interpreter, Parser, values } = (isLegacy ? (await import('@syuilo/aiscript-0-19-0')) : await import('@syuilo/aiscript')) as typeof import('@syuilo/aiscript');

	const parser = new Parser();

	components.value = [];

	const interpreter = new Interpreter({
		...createAiScriptEnv({
			storageKey: 'flash:' + flash.value.id,
		}),
		...registerAsUiLib(components.value, (_root) => {
			root.value = _root.value;
		}),
		THIS_ID: values.STR(flash.value.id),
		THIS_URL: values.STR(`${url}/play/${flash.value.id}`),
	}, {
		in: aiScriptReadline,
		out: () => {
			// nop
		},
		err: (err) => {
			os.alert({
				type: 'error',
				title: 'AiScript Error',
				text: String(err),
			});
		},
		log: () => {
			// nop
		},
	});

	aiscript.value = interpreter;

	let ast;
	try {
		ast = parser.parse(flash.value.script);
	} catch (err) {
		os.alert({
			type: 'error',
			title: 'Syntax Error',
			text: String(err),
		});
		return;
	}
	try {
		await interpreter.exec(ast);
	} catch (err: any) {
		os.alert({
			type: 'error',
			title: 'AiScript Internal Error',
			text: String(err),
		});
	}
}

async function reportAbuse() {
	if (!flash.value) return;

	const pageUrl = `${url}/play/${flash.value.id}`;

	const { dispose } = await os.popupAsyncWithDialog(import('@features/moderation/frontend/components/MkAbuseReportWindow.vue').then(x => x.default), {
		user: flash.value.user,
		initialComment: `Play: ${pageUrl}\n-----\n`,
	}, {
		closed: () => dispose(),
	});
}

function showMenu(ev: PointerEvent) {
	if (!flash.value) return;

	const menu: MenuItem[] = [
		...($i && $i.id !== flash.value.userId ? [
			{
				icon: 'ti ti-exclamation-circle',
				text: $locale.value.sfc.reportAbuse,
				action: reportAbuse,
			},
			...($i.isModerator || $i.isAdmin ? [
				{
					type: 'divider' as const,
				},
				{
					icon: 'ti ti-trash',
					text: $locale.value.sfc.delete,
					danger: true,
					action: () => os.confirm({
						type: 'warning',
						text: $locale.value.sfc.deleteConfirm,
					}).then(({ canceled }) => {
						if (canceled || !flash.value) return;

						os.apiWithDialog('flash/delete', { flashId: flash.value.id });
					}),
				},
			] : []),
		] : []),
	];

	os.popupMenu(menu, ev.currentTarget ?? ev.target);
}

function reset() {
	if (aiscript.value) aiscript.value.abort();
	started.value = false;
}

onDeactivated(() => {
	reset();
});

onUnmounted(() => {
	reset();
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: flash.value ? flash.value.title : 'Play',
	...flash.value ? {
		avatar: flash.value.user,
		path: `/play/${flash.value.id}`,
		share: {
			title: flash.value.title,
			text: flash.value.summary,
		},
	} : {},
}));
</script>

<style lang="scss" module>
.ready {
	&:global {
		> .main {
			padding: 32px;

			> .title {
				font-size: 1.4em;
				font-weight: bold;
				margin-bottom: 1rem;
				text-align: center;
			}

			> .summary {
				font-size: 1.1em;
				text-align: center;
			}

			> .start {
				margin: 1em auto 1em auto;
			}

			> .info {
				text-align: center;
			}
		}
	}
}

.footer {
	margin-top: 16px;

	&:global {
		> .date {
			margin: 8px 0;
			opacity: 0.6;
		}
	}
}

.started {
	&:global {
		> .main {
			padding: 32px;
		}

		> .actions {
			margin-top: 16px;

			> .items {
				display: flex;
				flex-wrap: wrap;
				justify-content: center;
				gap: 12px;
				padding: 16px;
				border-bottom: 1px solid var(--MI_THEME-divider);

				&:last-child {
					border-bottom: none;
				}
			}
		}
	}
}
</style>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.zoom-enter-active,
.zoom-leave-active {
	transition: opacity 0.3s cubic-bezier(0,0,.35,1), transform 0.3s cubic-bezier(0,0,.35,1);
}
.zoom-enter-from {
	opacity: 0;
	transform: scale(0.7);
}
.zoom-leave-to {
	opacity: 0;
	transform: scale(1.3);
}
</style>

<locale locale="ar-SA" lang="json">
{
	"shareWithNote": "شاركه في ملاحظة",
	"share": "شارِك",
	"unlikeConfirm": "أتريد إلغاء إعجابك؟",
	"reportAbuse": "أبلغ",
	"delete": "حذف",
	"deleteConfirm": "أمتأكد من الحذف؟",
	"reload": "انعش",
	"unlike": "ألغِ الإعجاب",
	"like": "أعجبني",
	"copyLink": "انسخ الرابط",
	"numberOfLikes": "الإعجابات",
	"viewSource": "اظهر المصدر",
	"updatedAt": "حُدّث في",
	"createdAt": "أُنشئ في",
	"editThisPage": "Edit this Play"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"shareWithNote": "Comparteix amb una nota",
	"share": "Comparteix",
	"unlikeConfirm": "Vols esborrar el teu m'agrada?",
	"reportAbuse": "Denuncia un abús ",
	"delete": "Elimina",
	"deleteConfirm": "Segur que vols esborrar?",
	"reload": "Actualitzar",
	"unlike": "Treure m'agrada ",
	"like": "M'agrada ",
	"copyLink": "Copia l'enllaç",
	"numberOfLikes": "M'agraden ",
	"viewSource": "Veure l'origen ",
	"updatedAt": "Actualitzat el",
	"createdAt": "Creat el",
	"editThisPage": "Edita aquest guió"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"shareWithNote": "Sdílet s poznámkou",
	"share": "Sdílet",
	"unlikeConfirm": "Opravdu chcete odstranit like?",
	"reportAbuse": "Nahlášení",
	"delete": "Smazat",
	"deleteConfirm": "Opravdu smazat?",
	"reload": "Aktualizovat",
	"unlike": "Už se mi to nelíbí",
	"like": "To se mi líbí",
	"copyLink": "Kopírovat odkaz",
	"numberOfLikes": "Počet \"To se mi líbí\"",
	"viewSource": "Zobrazit zdroj",
	"updatedAt": "Upraveno",
	"createdAt": "Vytvořeno",
	"editThisPage": "Upravit tenhle Play"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"shareWithNote": "Share with note",
	"share": "Share",
	"unlikeConfirm": "Really remove your like?",
	"reportAbuse": "Report",
	"delete": "Delete",
	"deleteConfirm": "Really delete?",
	"reload": "Refresh",
	"unlike": "Unlike",
	"like": "Like",
	"copyLink": "Copy link",
	"numberOfLikes": "Likes",
	"viewSource": "View source",
	"updatedAt": "Updated at",
	"createdAt": "Created at",
	"editThisPage": "Edit this Play"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"shareWithNote": "Mit Notiz teilen",
	"share": "Teilen",
	"unlikeConfirm": "\"Gefällt mir\" wirklich entfernen?",
	"reportAbuse": "Melden",
	"delete": "Löschen",
	"deleteConfirm": "Wirklich löschen?",
	"reload": "Aktualisieren",
	"unlike": "\"Gefällt mir\" entfernen",
	"like": "Gefällt mir",
	"copyLink": "Link kopieren",
	"numberOfLikes": "\"Gefällt mir\"-Anzahl",
	"viewSource": "Quelltext anzeigen",
	"updatedAt": "Zuletzt geändert am",
	"createdAt": "Erstellt am",
	"editThisPage": "Dieses Play bearbeiten"
}
</locale>

<locale locale="en-US" lang="json">
{
	"shareWithNote": "Share with note",
	"share": "Share",
	"unlikeConfirm": "Really remove your like?",
	"reportAbuse": "Report",
	"delete": "Delete",
	"deleteConfirm": "Really delete?",
	"reload": "Refresh",
	"unlike": "Unlike",
	"like": "Like",
	"copyLink": "Copy link",
	"numberOfLikes": "Likes",
	"viewSource": "View source",
	"updatedAt": "Updated at",
	"createdAt": "Created at",
	"editThisPage": "Edit this Play"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"shareWithNote": "Compartir con una nota",
	"share": "Compartir",
	"unlikeConfirm": "¿Quitar como favorito?",
	"reportAbuse": "Reportar",
	"delete": "Borrar",
	"deleteConfirm": "¿Desea eliminarlo?",
	"reload": "Recargar",
	"unlike": "Quitar 'me gusta'",
	"like": "¡Muy bien!",
	"copyLink": "Copiar enlace",
	"numberOfLikes": "Cantidad de 'Me gusta'",
	"viewSource": "Ver la fuente",
	"updatedAt": "Actualizado",
	"createdAt": "Fecha de creación",
	"editThisPage": "Editar este guión"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"shareWithNote": "Partager dans une note",
	"share": "Partager",
	"unlikeConfirm": "Êtes-vous sûr·e de ne plus vouloir aimer cette publication ?",
	"reportAbuse": "Signaler",
	"delete": "Supprimer",
	"deleteConfirm": "Confirmez-vous la suppression?",
	"reload": "Rafraîchir",
	"unlike": "Ne plus aimer",
	"like": "J'aime",
	"copyLink": "Copier le lien",
	"numberOfLikes": "Favoris",
	"viewSource": "Afficher la source",
	"updatedAt": "Mis à jour le",
	"createdAt": "Date de création",
	"editThisPage": "Modifier ce Play"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"shareWithNote": "Bagikan dengan catatan",
	"share": "Bagikan",
	"unlikeConfirm": "Yakin ingin hapus sukamu?",
	"reportAbuse": "Laporkan",
	"delete": "Hapus",
	"deleteConfirm": "Yakin hapus?",
	"reload": "Muat ulang",
	"unlike": "Tidak Suka",
	"like": "Suka",
	"copyLink": "Salin tautan",
	"numberOfLikes": "Jumlah yang disukai",
	"viewSource": "Lihat sumber",
	"updatedAt": "Diperbarui pada",
	"createdAt": "Dibuat pada",
	"editThisPage": "Sunting Permainan ini"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"shareWithNote": "Condividere in nota",
	"share": "Condividi",
	"unlikeConfirm": "Non ti piace più?",
	"reportAbuse": "Segnalare",
	"delete": "Elimina",
	"deleteConfirm": "Rimuovere?",
	"reload": "Ricarica",
	"unlike": "Non mi piace",
	"like": "Mi piace!",
	"copyLink": "Copia il link",
	"numberOfLikes": "Quantità di Like",
	"viewSource": "Visualizza sorgente",
	"updatedAt": "Aggiornato il",
	"createdAt": "Data di creazione",
	"editThisPage": "Modifica il Play"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"shareWithNote": "ノートで共有",
	"share": "共有",
	"unlikeConfirm": "いいね解除しますか？",
	"reportAbuse": "通報",
	"delete": "削除",
	"deleteConfirm": "削除しますか？",
	"reload": "リロード",
	"unlike": "いいねを解除",
	"like": "いいね！",
	"copyLink": "リンクをコピー",
	"numberOfLikes": "いいね数",
	"viewSource": "ソースを表示",
	"updatedAt": "更新日時",
	"createdAt": "作成日時",
	"editThisPage": "このPlayを編集"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"shareWithNote": "ノートで共有",
	"share": "わけわけ",
	"unlikeConfirm": "いいね解除するんか？",
	"reportAbuse": "通報",
	"delete": "ほかす",
	"deleteConfirm": "ホンマにほかすで？",
	"reload": "リロード",
	"unlike": "いいねやめる",
	"like": "ええやん！",
	"copyLink": "リンクをコピー",
	"numberOfLikes": "いいね数",
	"viewSource": "ソースを表示",
	"updatedAt": "更新日時",
	"createdAt": "作成した日",
	"editThisPage": "このPlayを編集"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"shareWithNote": "Share with note",
	"share": "Share",
	"unlikeConfirm": "Really remove your like?",
	"reportAbuse": "Report",
	"delete": "Kkes",
	"deleteConfirm": "Really delete?",
	"reload": "Refresh",
	"unlike": "Unlike",
	"like": "Like",
	"copyLink": "Copy link",
	"numberOfLikes": "Likes",
	"viewSource": "View source",
	"updatedAt": "Updated at",
	"createdAt": "Created at",
	"editThisPage": "Edit this Play"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"shareWithNote": "Share with note",
	"share": "Share",
	"unlikeConfirm": "Really remove your like?",
	"reportAbuse": "Report",
	"delete": "ಅಳಿಸು",
	"deleteConfirm": "Really delete?",
	"reload": "Refresh",
	"unlike": "Unlike",
	"like": "Like",
	"copyLink": "ಲಿಂಕನ್ನು ನಕಲಿಸು",
	"numberOfLikes": "Likes",
	"viewSource": "View source",
	"updatedAt": "Updated at",
	"createdAt": "Created at",
	"editThisPage": "Edit this Play"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"shareWithNote": "노트로 공유",
	"share": "공유",
	"unlikeConfirm": "좋아요를 취소할까요?",
	"reportAbuse": "신고",
	"delete": "삭제",
	"deleteConfirm": "삭제하시겠습니까?",
	"reload": "새로고침",
	"unlike": "좋아요 취소",
	"like": "좋아요!",
	"copyLink": "링크 복사",
	"numberOfLikes": "좋아요 수",
	"viewSource": "소스 보기",
	"updatedAt": "수정한 날짜",
	"createdAt": "생성된 날짜",
	"editThisPage": "이 Play를 수정"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"shareWithNote": "Delen met notitie",
	"share": "Delen",
	"unlikeConfirm": "Wil je echt je like verwijderen?",
	"reportAbuse": "Meld",
	"delete": "Verwijderen",
	"deleteConfirm": "Echt verwijderen?",
	"reload": "Verversen",
	"unlike": "Unlike",
	"like": "Like",
	"copyLink": "Kopiëren link",
	"numberOfLikes": "Likes",
	"viewSource": "View source",
	"updatedAt": "Laatst gewijzigd at",
	"createdAt": "Aangemaakt at",
	"editThisPage": "Edit this Play"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"shareWithNote": "Share with note",
	"share": "Del",
	"unlikeConfirm": "Really remove your like?",
	"reportAbuse": "Rappoter",
	"delete": "Slett",
	"deleteConfirm": "Vil du slette?",
	"reload": "Refresh",
	"unlike": "Liker ikke",
	"like": "Liker!",
	"copyLink": "Kopier lenke",
	"numberOfLikes": "Likerklikk",
	"viewSource": "View source",
	"updatedAt": "Updated at",
	"createdAt": "Created at",
	"editThisPage": "Edit this Play"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"shareWithNote": "Udostępnij z wpisem",
	"share": "Udostępnij",
	"unlikeConfirm": "Na pewno chcesz usunąć\u00a0polubienie?",
	"reportAbuse": "Zgłoś",
	"delete": "Usuń",
	"deleteConfirm": "Na pewno usunąć?",
	"reload": "Odśwież",
	"unlike": "Usuń polubienie",
	"like": "Polub",
	"copyLink": "Skopiuj odnośnik",
	"numberOfLikes": "Liczba polubień",
	"viewSource": "Zobacz źródło",
	"updatedAt": "Zaktualizowano",
	"createdAt": "Utworzono",
	"editThisPage": "Edit this Play"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"shareWithNote": "Compartilhar em Notas",
	"share": "Compartilhar",
	"unlikeConfirm": "Deseja realmente deixar de curtir?",
	"reportAbuse": "Denunciar",
	"delete": "Excluir",
	"deleteConfirm": "Confirma a exclusão?",
	"reload": "Recarregar",
	"unlike": "Remover curtida",
	"like": "Curtir",
	"copyLink": "Copiar link",
	"numberOfLikes": "Número de curtidas",
	"viewSource": "Ver fonte",
	"updatedAt": "Última atualização",
	"createdAt": "Data de criação",
	"editThisPage": "Editar este Play"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"shareWithNote": "Поделиться заметкой",
	"share": "Поделиться",
	"unlikeConfirm": "В самом деле убрать «нравится»?",
	"reportAbuse": "Жалоба",
	"delete": "Удалить",
	"deleteConfirm": "Удалить?",
	"reload": "Перезагрузить",
	"unlike": "Отменить «нравится»",
	"like": "Нравится!",
	"copyLink": "Скопировать ссылку",
	"numberOfLikes": "Количество лайков",
	"viewSource": "Просмотр исходника",
	"updatedAt": "Обновлено",
	"createdAt": "Создано",
	"editThisPage": "Отредактировать страницу"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"shareWithNote": "Zdieľať s poznámkou",
	"share": "Zdieľať",
	"unlikeConfirm": "Naozaj odstrániť váš like?",
	"reportAbuse": "Nahlásiť",
	"delete": "Odstrániť",
	"deleteConfirm": "Naozaj odstrániť?",
	"reload": "Obnoviť",
	"unlike": "Unlike",
	"like": "Páči sa mi",
	"copyLink": "Kopírovať odkaz",
	"numberOfLikes": "Likes",
	"viewSource": "Ukázať zdroj",
	"updatedAt": "Upravené",
	"createdAt": "Vytvorené",
	"editThisPage": "Edit this Play"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"shareWithNote": "แบ่งปันด้วยโน้ต",
	"share": "แบ่งปัน",
	"unlikeConfirm": "ต้องการเลิกถูกใจใช่ไหม?",
	"reportAbuse": "รายงาน",
	"delete": "ลบ",
	"deleteConfirm": "ต้องการลบใช่ไหม?",
	"reload": "รีโหลด",
	"unlike": "เลิกถูกใจ",
	"like": "ถูกใจ!",
	"copyLink": "คัดลอกลิงก์",
	"numberOfLikes": "จำนวนยอดถูกใจ",
	"viewSource": "ดูต้นฉบับ",
	"updatedAt": "อัปเดตล่าสุด",
	"createdAt": "สร้างเมื่อ",
	"editThisPage": "แก้ไข Play นี้"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"shareWithNote": "Notla paylaş",
	"share": "Paylaş",
	"unlikeConfirm": "Cidden beğenini kaldırmak mı istiyorsun?",
	"reportAbuse": "Rapor",
	"delete": "Sil",
	"deleteConfirm": "Cidden silmek istiyor musunuz?",
	"reload": "Yenile",
	"unlike": "Beğenme",
	"like": "Beğen",
	"copyLink": "Link kopyala",
	"numberOfLikes": "Beğeniler",
	"viewSource": "Kaynak görüntüle",
	"updatedAt": "Güncellendi",
	"createdAt": "Oluşturuldu",
	"editThisPage": "Bu Oyunu Düzenle"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"shareWithNote": "Share with note",
	"share": "Share",
	"unlikeConfirm": "Really remove your like?",
	"reportAbuse": "Report",
	"delete": "ئۆچۈرۈش",
	"deleteConfirm": "Really delete?",
	"reload": "Refresh",
	"unlike": "Unlike",
	"like": "Like",
	"copyLink": "Copy link",
	"numberOfLikes": "Likes",
	"viewSource": "View source",
	"updatedAt": "Updated at",
	"createdAt": "Created at",
	"editThisPage": "Edit this Play"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"shareWithNote": "Поділитися нотаткою",
	"share": "Поділитись",
	"unlikeConfirm": "Бажаєте відписатися від подібних?",
	"reportAbuse": "Поскаржитись",
	"delete": "Видалити",
	"deleteConfirm": "Ви дійсно бажаєте це видалити?",
	"reload": "Оновити",
	"unlike": "Не вподобати",
	"like": "Вподобати",
	"copyLink": "Скопіювати посилання",
	"numberOfLikes": "Вподобання",
	"viewSource": "Переглянути вихідний код",
	"updatedAt": "Останнє оновлення",
	"createdAt": "Створено",
	"editThisPage": "Edit this Play"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"shareWithNote": "Chia sẻ kèm với tút",
	"share": "Chia sẻ",
	"unlikeConfirm": "Bạn có chắc muốn bỏ thích ?",
	"reportAbuse": "Báo cáo",
	"delete": "Xóa",
	"deleteConfirm": "Bạn có muốn xóa không?",
	"reload": "Tải lại",
	"unlike": "Bỏ lượt thích",
	"like": "Thích",
	"copyLink": "Chép liên kết",
	"numberOfLikes": "Lượt thích",
	"viewSource": "Xem mã nguồn",
	"updatedAt": "Cập nhật lúc",
	"createdAt": "Ngày tạo",
	"editThisPage": "Edit play này"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"shareWithNote": "分享到帖文",
	"share": "分享",
	"unlikeConfirm": "取消赞？",
	"reportAbuse": "举报",
	"delete": "删除",
	"deleteConfirm": "确定删除?",
	"reload": "刷新",
	"unlike": "取消喜欢",
	"like": "点赞！",
	"copyLink": "复制链接",
	"numberOfLikes": "点赞数",
	"viewSource": "查看源代码",
	"updatedAt": "更新日期",
	"createdAt": "创建日期",
	"editThisPage": "编辑此 Play"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"shareWithNote": "在貼文中分享",
	"share": "分享",
	"unlikeConfirm": "要取消按讚嗎？",
	"reportAbuse": "檢舉",
	"delete": "刪除",
	"deleteConfirm": "你確定要刪除嗎？",
	"reload": "重新整理",
	"unlike": "收回讚",
	"like": "讚",
	"copyLink": "複製連結",
	"numberOfLikes": "讚數",
	"viewSource": "檢視原始碼",
	"updatedAt": "最後更新",
	"createdAt": "建立於",
	"editThisPage": "編輯此 Play"
}
</locale>
