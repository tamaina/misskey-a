<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px;">
		<div class="ogwlenmc">
			<div v-if="tab === 'local'" class="local">
				<MkInput v-model="query" :debounce="true" type="search" autocapitalize="off">
					<template #prefix><i class="ti ti-search"></i></template>
					<template #label>{{ $locale.sfc.search }}</template>
				</MkInput>
				<MkSwitch v-model="selectMode" style="margin: 8px 0;">
					<template #label>Select mode</template>
				</MkSwitch>
				<div v-if="selectMode" class="_buttons">
					<MkButton inline @click="selectAll">Select all</MkButton>
					<MkButton inline @click="setCategoryBulk">Set category</MkButton>
					<MkButton inline @click="setTagBulk">Set tag</MkButton>
					<MkButton inline @click="addTagBulk">Add tag</MkButton>
					<MkButton inline @click="removeTagBulk">Remove tag</MkButton>
					<MkButton inline @click="setLicenseBulk">Set License</MkButton>
					<MkButton inline danger @click="delBulk">Delete</MkButton>
				</div>
				<MkPagination ref="emojisPaginationComponent" :paginator="paginator">
					<template #empty><span>{{ $locale.sfc.noCustomEmojis }}</span></template>
					<template #default="{items}">
						<div class="ldhfsamy">
							<button v-for="emoji in items" :key="emoji.id" class="emoji _panel _button" :class="{ selected: selectedEmojis.includes(emoji.id) }" @click="selectMode ? toggleSelect(emoji) : edit(emoji)">
								<img :src="emoji.url" class="img" :alt="emoji.name"/>
								<div class="body">
									<div class="name _monospace">{{ emoji.name }}</div>
									<div class="info">{{ emoji.category }}</div>
								</div>
							</button>
						</div>
					</template>
				</MkPagination>
			</div>

			<div v-else-if="tab === 'remote'" class="remote">
				<FormSplit>
					<MkInput v-model="queryRemote" :debounce="true" type="search" autocapitalize="off">
						<template #prefix><i class="ti ti-search"></i></template>
						<template #label>{{ $locale.sfc.search }}</template>
					</MkInput>
					<MkInput v-model="host" :debounce="true">
						<template #label>{{ $locale.sfc.host }}</template>
					</MkInput>
				</FormSplit>
				<MkPagination :paginator="remotePaginator">
					<template #empty><span>{{ $locale.sfc.noCustomEmojis }}</span></template>
					<template #default="{items}">
						<div class="ldhfsamy">
							<div v-for="emoji in items" :key="emoji.id" class="emoji _panel _button" @click="remoteMenu(emoji as RemoteEmoji, $event)">
								<img :src="getProxiedImageUrl(emoji.url, 'emoji')" class="img" :alt="emoji.name"/>
								<div class="body">
									<div class="name _monospace">{{ emoji.name }}</div>
									<div class="info">{{ emoji.host }}</div>
								</div>
							</div>
						</div>
					</template>
				</MkPagination>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { computed, markRaw, ref } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkRemoteEmojiEditDialog from '@features/emojis/frontend/components/MkRemoteEmojiEditDialog.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import FormSplit from '@features/ui/frontend/components/form/split.vue';
import { selectFile } from '@features/drive/frontend/utility/drive.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { getProxiedImageUrl } from '@features/media/frontend/utility/media-proxy.js';
import { iAmAdmin } from '@features/auth/frontend/i.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const tab = ref('local');
const query = ref<string | null>(null);
const queryRemote = ref<string | null>(null);
const host = ref<string | null>(null);
const selectMode = ref(false);
const selectedEmojis = ref<string[]>([]);

type RemoteEmoji = Misskey.entities.AdminEmojiListRemoteResponse[number] & { host: string };

const paginator = markRaw(new Paginator('admin/emoji/list', {
	limit: 30,
	computedParams: computed(() => ({
		query: (query.value && query.value !== '') ? query.value : null,
	})),
}));

const remotePaginator = markRaw(new Paginator('admin/emoji/list-remote', {
	limit: 30,
	computedParams: computed(() => ({
		query: (queryRemote.value && queryRemote.value !== '') ? queryRemote.value : null,
		host: (host.value && host.value !== '') ? host.value : null,
	})),
}));

const selectAll = () => {
	if (selectedEmojis.value.length > 0) {
		selectedEmojis.value = [];
	} else {
		selectedEmojis.value = paginator.items.value.map(item => item.id);
	}
};

const toggleSelect = (emoji: Misskey.entities.EmojiDetailed) => {
	if (selectedEmojis.value.includes(emoji.id)) {
		selectedEmojis.value = selectedEmojis.value.filter(x => x !== emoji.id);
	} else {
		selectedEmojis.value.push(emoji.id);
	}
};

const add = async () => {
	const { dispose } = await os.popupAsyncWithDialog(import('@features/emojis/frontend/pages/emoji-edit-dialog.vue').then(x => x.default), {
	}, {
		done: result => {
			if (result.created) {
				const nowIso = (new Date()).toISOString();
				paginator.prepend({
					...result.created,
					createdAt: nowIso,
				});
			}
		},
		closed: () => dispose(),
	});
};

const edit = async (emoji: Misskey.entities.EmojiDetailed) => {
	const { dispose } = await os.popupAsyncWithDialog(import('@features/emojis/frontend/pages/emoji-edit-dialog.vue').then(x => x.default), {
		emoji: emoji,
	}, {
		done: result => {
			if (result.updated) {
				paginator.updateItem(result.updated.id, (oldEmoji) => ({
					...oldEmoji,
					...result.updated,
				}));
			} else if (result.deleted) {
				paginator.removeItem(emoji.id);
			}
		},
		closed: () => dispose(),
	});
};

const detailRemoteEmoji = (emoji: {
	id: string,
	name: string,
	host: string,
	license: string | null,
	url: string
}) => {
	const { dispose } = os.popup(MkRemoteEmojiEditDialog, {
		emoji: emoji,
	}, {
		done: () => {
			dispose();
		},
		closed: () => {
			dispose();
		},
	});
};

const importEmoji = (emojiId: string) => {
	os.apiWithDialog('admin/emoji/copy', {
		emojiId: emojiId,
	});
};

const remoteMenu = (emoji: {
	id: string,
	name: string,
	host: string,
	license: string | null,
	url: string
}, ev: PointerEvent) => {
	os.popupMenu([{
		type: 'label',
		text: ':' + emoji.name + ':',
	}, {
		text: $locale.value.sfc.details,
		icon: 'ti ti-info-circle',
		action: () => { detailRemoteEmoji(emoji); },
	}, {
		text: $locale.value.sfc.import,
		icon: 'ti ti-plus',
		action: () => { importEmoji(emoji.id); },
	}], ev.currentTarget ?? ev.target);
};

const menu = (ev: PointerEvent) => {
	os.popupMenu([{
		icon: 'ti ti-download',
		text: $locale.value.sfc.export,
		action: async () => {
			misskeyApi('export-custom-emojis', {
			})
				.then(() => {
					os.alert({
						type: 'info',
						text: $locale.value.sfc.exportRequested,
					});
				}).catch((err) => {
					os.alert({
						type: 'error',
						text: err.message,
					});
				});
		},
	}, ...(iAmAdmin ? [{
		icon: 'ti ti-upload',
		text: $locale.value.sfc.import,
		action: async () => {
			const file = await selectFile({
				anchorElement: ev.currentTarget ?? ev.target,
				multiple: false,
			});
			misskeyApi('admin/emoji/import-zip', {
				fileId: file.id,
			})
				.then(() => {
					os.alert({
						type: 'info',
						text: $locale.value.sfc.importRequested,
					});
				}).catch((err) => {
					os.alert({
						type: 'error',
						text: err.message,
					});
				});
		},
	}] : [])], ev.currentTarget ?? ev.target);
};

const setCategoryBulk = async () => {
	const { canceled, result } = await os.inputText({
		title: 'Category',
	});
	if (canceled) return;
	await os.apiWithDialog('admin/emoji/set-category-bulk', {
		ids: selectedEmojis.value,
		category: result,
	});
	paginator.reload();
};

const setLicenseBulk = async () => {
	const { canceled, result } = await os.inputText({
		title: 'License',
	});
	if (canceled) return;
	await os.apiWithDialog('admin/emoji/set-license-bulk', {
		ids: selectedEmojis.value,
		license: result,
	});
	paginator.reload();
};

const addTagBulk = async () => {
	const { canceled, result } = await os.inputText({
		title: 'Tag',
	});
	if (canceled || result == null) return;
	await os.apiWithDialog('admin/emoji/add-aliases-bulk', {
		ids: selectedEmojis.value,
		aliases: result.split(' '),
	});
	paginator.reload();
};

const removeTagBulk = async () => {
	const { canceled, result } = await os.inputText({
		title: 'Tag',
	});
	if (canceled || result == null) return;
	await os.apiWithDialog('admin/emoji/remove-aliases-bulk', {
		ids: selectedEmojis.value,
		aliases: result.split(' '),
	});
	paginator.reload();
};

const setTagBulk = async () => {
	const { canceled, result } = await os.inputText({
		title: 'Tag',
	});
	if (canceled || result == null) return;
	await os.apiWithDialog('admin/emoji/set-aliases-bulk', {
		ids: selectedEmojis.value,
		aliases: result.split(' '),
	});
	paginator.reload();
};

const delBulk = async () => {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: $locale.value.sfc.deleteConfirm,
	});
	if (canceled) return;
	await os.apiWithDialog('admin/emoji/delete-bulk', {
		ids: selectedEmojis.value,
	});
	paginator.reload();
};

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: $locale.value.sfc.addEmoji,
	handler: add,
}, {
	icon: 'ti ti-dots',
	text: $locale.value.sfc.more,
	handler: menu,
}]);

const headerTabs = computed(() => [{
	key: 'local',
	title: $locale.value.sfc.local,
}, {
	key: 'remote',
	title: $locale.value.sfc.remote,
}]);

definePage(() => ({
	title: $locale.value.sfc.customEmojis,
	icon: 'ti ti-icons',
}));
</script>

<style lang="scss" scoped>
.ogwlenmc {
	> .local {
		.empty {
			margin: var(--MI-margin);
		}

		.ldhfsamy {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
			grid-gap: 12px;
			margin: var(--MI-margin) 0;

			> .emoji {
				display: flex;
				align-items: center;
				padding: 11px;
				text-align: left;
				border: solid 1px var(--MI_THEME-panel);

				&:hover {
					border-color: var(--MI_THEME-inputBorderHover);
				}

				&.selected {
					border-color: var(--MI_THEME-accent);
				}

				> .img {
					width: 42px;
					height: 42px;
					object-fit: contain;
				}

				> .body {
					padding: 0 0 0 8px;
					white-space: nowrap;
					overflow: hidden;

					> .name {
						text-overflow: ellipsis;
						overflow: hidden;
					}

					> .info {
						opacity: 0.5;
						text-overflow: ellipsis;
						overflow: hidden;
					}
				}
			}
		}
	}

	> .remote {
		.empty {
			margin: var(--MI-margin);
		}

		.ldhfsamy {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
			grid-gap: 12px;
			margin: var(--MI-margin) 0;

			> .emoji {
				display: flex;
				align-items: center;
				padding: 12px;
				text-align: left;

				&:hover {
					color: var(--MI_THEME-accent);
				}

				> .img {
					width: 32px;
					height: 32px;
					object-fit: contain;
				}

				> .body {
					padding: 0 0 0 8px;
					white-space: nowrap;
					overflow: hidden;

					> .name {
						text-overflow: ellipsis;
						overflow: hidden;
					}

					> .info {
						opacity: 0.5;
						font-size: 90%;
						text-overflow: ellipsis;
						overflow: hidden;
					}
				}
			}
		}
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"details": "التفاصيل",
	"import": "استيراد",
	"export": "تصدير",
	"exportRequested": "قد تستغرق عملية التصدير بعض الوقت. بمجرد الانتهاء سيضاف الملف الناتج إلى قرص التخزين.",
	"importRequested": "يستغرق الاستيراد بعض الوقت",
	"deleteConfirm": "أمتأكد من الحذف؟",
	"addEmoji": "إضافة إيموجي",
	"more": "المزيد!",
	"local": "المحلي",
	"remote": "بُعدي",
	"customEmojis": "إيموجي مخصص",
	"search": "البحث",
	"noCustomEmojis": "ليس هناك إيموجي",
	"host": "المضيف"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"details": "Detalls",
	"import": "Importar",
	"export": "Exporta",
	"exportRequested": "Has sol·licitat una exportació de dades. Això pot trigar una estona. S'afegirà a la teva unitat de disc un cop estigui completada.",
	"importRequested": "Has sol·licitat una importació de dades. Això pot trigar una estona.",
	"deleteConfirm": "Segur que vols esborrar?",
	"addEmoji": "Afegeix un emoji",
	"more": "Més",
	"local": "Local",
	"remote": "Remot",
	"customEmojis": "Emojis personalitzats",
	"search": "Cercar",
	"noCustomEmojis": "No hi ha emojis personalitzats",
	"host": "Amfitrió"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"details": "Detaily",
	"import": "Importovat",
	"export": "Exportovat",
	"exportRequested": "Požádali jste o export. To může chvíli trvat. Přidáme ho na váš Disk až bude dokončen.",
	"importRequested": "Požádali jste o export. To může chvilku trvat.",
	"deleteConfirm": "Opravdu smazat?",
	"addEmoji": "Přidat emoji",
	"more": "Více!",
	"local": "Lokální",
	"remote": "Vzdálené",
	"customEmojis": "Vlastní emoji",
	"search": "Vyhledávání",
	"noCustomEmojis": "Bez Emoji",
	"host": "Hostitel"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"details": "Details",
	"import": "Import",
	"export": "Export",
	"exportRequested": "You've requested an export. This may take a while. It will be added to your Drive once completed.",
	"importRequested": "You've requested an import. This may take a while.",
	"deleteConfirm": "Really delete?",
	"addEmoji": "Add an emoji",
	"more": "More!",
	"local": "Local",
	"remote": "Remote",
	"customEmojis": "Custom Emoji",
	"search": "Search",
	"noCustomEmojis": "There are no emoji",
	"host": "Host"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"details": "Details",
	"import": "Import",
	"export": "Export",
	"exportRequested": "Du hast einen Export angefragt. Dies kann etwas Zeit in Anspruch nehmen. Sobald der Export abgeschlossen ist, wird er deiner Drive hinzugefügt.",
	"importRequested": "Du hast einen Import angefragt. Dies kann etwas Zeit in Anspruch nehmen.",
	"deleteConfirm": "Wirklich löschen?",
	"addEmoji": "Emoji hinzufügen",
	"more": "Mehr!",
	"local": "Lokal",
	"remote": "Fremd",
	"customEmojis": "Benutzerdefinierte Emojis",
	"search": "Suchen",
	"noCustomEmojis": "Keine benutzerdefinierten Emojis gefunden",
	"host": "Hostname"
}
</locale>

<locale locale="en-US" lang="json">
{
	"details": "Details",
	"import": "Import",
	"export": "Export",
	"exportRequested": "You've requested an export. This may take a while. It will be added to your Drive once completed.",
	"importRequested": "You've requested an import. This may take a while.",
	"deleteConfirm": "Really delete?",
	"addEmoji": "Add an emoji",
	"more": "More!",
	"local": "Local",
	"remote": "Remote",
	"customEmojis": "Custom Emoji",
	"search": "Search",
	"noCustomEmojis": "There are no emoji",
	"host": "Host"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"details": "Detalles",
	"import": "Importar",
	"export": "Exportar",
	"exportRequested": "Has solicitado la exportación. Puede llevar un tiempo. Cuando termine la exportación, se añadirá al drive",
	"importRequested": "Has solicitado la importación. Puede llevar un tiempo.",
	"deleteConfirm": "¿Desea eliminarlo?",
	"addEmoji": "Añadir emoji",
	"more": "¡Más!",
	"local": "Local",
	"remote": "Remoto",
	"customEmojis": "Emojis personalizados",
	"search": "Buscar",
	"noCustomEmojis": "No hay emojis personalizados",
	"host": "Instancia"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"details": "Détails",
	"import": "Importer",
	"export": "Exporter",
	"exportRequested": "Vous avez demandé une exportation. L’opération pourrait prendre un peu de temps. Une fois terminée, le fichier sera ajouté au Drive.",
	"importRequested": "Vous avez initié un import. Cela pourrait prendre un peu de temps.",
	"deleteConfirm": "Confirmez-vous la suppression?",
	"addEmoji": "Ajouter un émoji",
	"more": "Plus !",
	"local": "Local",
	"remote": "Distant",
	"customEmojis": "Émojis personnalisés",
	"search": "Rechercher",
	"noCustomEmojis": "Il n'y a pas d’émoji",
	"host": "Serveur distant"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"details": "Selengkapnya",
	"import": "Impor",
	"export": "Ekspor",
	"exportRequested": "Kamu telah meminta ekspor. Ini akan memakan waktu sesaat. Setelah ekspor selesai, berkas yang dihasilkan akan ditambahkan ke Drive",
	"importRequested": "Kamu telah meminta impor. Ini akan memakan waktu sesaat.",
	"deleteConfirm": "Yakin hapus?",
	"addEmoji": "Tambahkan emoji",
	"more": "Lainnya",
	"local": "Lokal",
	"remote": "Remote",
	"customEmojis": "Emoji kustom",
	"search": "Cari",
	"noCustomEmojis": "Tidak ada emoji kustom",
	"host": "Host"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"details": "Dettagli",
	"import": "Importa",
	"export": "Esporta",
	"exportRequested": "Hai richiesto un'esportazione, e potrebbe volerci tempo. Quando sarà compiuta, il file verrà aggiunto direttamente al Drive.",
	"importRequested": "Hai richiesto un'importazione. Potrebbe richiedere un po' di tempo.",
	"deleteConfirm": "Rimuovere?",
	"addEmoji": "Aggiungi un emoji",
	"more": "Di più!",
	"local": "Locale",
	"remote": "Remota",
	"customEmojis": "Emoji personalizzate",
	"search": "Cerca",
	"noCustomEmojis": "Nessun emoji",
	"host": "Host"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"details": "詳細",
	"import": "インポート",
	"export": "エクスポート",
	"exportRequested": "エクスポートをリクエストしました。これには時間がかかる場合があります。エクスポートが終わると、「ドライブ」に追加されます。",
	"importRequested": "インポートをリクエストしました。これには時間がかかる場合があります。",
	"deleteConfirm": "削除しますか？",
	"addEmoji": "絵文字を追加",
	"more": "もっと！",
	"local": "ローカル",
	"remote": "リモート",
	"customEmojis": "カスタム絵文字",
	"search": "検索",
	"noCustomEmojis": "絵文字はありません",
	"host": "ホスト"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"details": "もっと",
	"import": "インポート",
	"export": "エクスポート",
	"exportRequested": "エクスポートしてな、って言うたけど、これ多分めっちゃ時間かかるで。エクスポート終わったら「ドライブ」に突っ込んどくで。",
	"importRequested": "インポートしてな、ってリクエストしたけど、これ多分めっちゃ時間かかるで。",
	"deleteConfirm": "ホンマにほかすで？",
	"addEmoji": "絵文字を追加",
	"more": "他のん",
	"local": "ローカル",
	"remote": "リモート",
	"customEmojis": "カスタム絵文字",
	"search": "探す",
	"noCustomEmojis": "絵文字はあらへん",
	"host": "ホスト"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"details": "Details",
	"import": "Kter",
	"export": "Sifeḍ",
	"exportRequested": "You've requested an export. This may take a while. It will be added to your Drive once completed.",
	"importRequested": "You've requested an import. This may take a while.",
	"deleteConfirm": "Really delete?",
	"addEmoji": "Add an emoji",
	"more": "More!",
	"local": "Local",
	"remote": "Remote",
	"customEmojis": "Custom Emoji",
	"search": "Nadi",
	"noCustomEmojis": "There are no emoji",
	"host": "Host"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"details": "Details",
	"import": "ಆಮದು",
	"export": "ರಫ್ತು",
	"exportRequested": "You've requested an export. This may take a while. It will be added to your Drive once completed.",
	"importRequested": "You've requested an import. This may take a while.",
	"deleteConfirm": "Really delete?",
	"addEmoji": "Add an emoji",
	"more": "More!",
	"local": "Local",
	"remote": "Remote",
	"customEmojis": "Custom Emoji",
	"search": "ಹುಡುಕು",
	"noCustomEmojis": "There are no emoji",
	"host": "Host"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"details": "자세히",
	"import": "가져오기",
	"export": "내보내기",
	"exportRequested": "내보내기를 요청하였습니다. 이 작업은 시간이 걸릴 수 있습니다. 내보내기가 완료되면 \"드라이브\"에 추가됩니다.",
	"importRequested": "가져오기를 요청하였습니다. 이 작업에는 시간이 걸릴 수 있습니다.",
	"deleteConfirm": "삭제하시겠습니까?",
	"addEmoji": "이모지 추가",
	"more": "더 보기!",
	"local": "로컬",
	"remote": "리모트",
	"customEmojis": "커스텀 이모지",
	"search": "검색",
	"noCustomEmojis": "이모지가 없습니다",
	"host": "호스트"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"details": "Details",
	"import": "Import",
	"export": "Export",
	"exportRequested": "Je hebt een export aangevraagd. Dit kan een tijdje duren. Het wordt toegevoegd aan je Drive zodra het is voltooid.",
	"importRequested": "Je hebt een import aangevraagd. Dit kan even duren.",
	"deleteConfirm": "Echt verwijderen?",
	"addEmoji": "Toevoegen emoji",
	"more": "Meer!",
	"local": "Lokaal",
	"remote": "Remote",
	"customEmojis": "Eigen emoji",
	"search": "Zoeken",
	"noCustomEmojis": "Er zijn geen emojis",
	"host": "Server"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"details": "Details",
	"import": "Importer",
	"export": "Eksporter",
	"exportRequested": "You've requested an export. This may take a while. It will be added to your Drive once completed.",
	"importRequested": "Du har bedt om import. Dette kan ta en stund.",
	"deleteConfirm": "Vil du slette?",
	"addEmoji": "Legg til emoji",
	"more": "Mer!",
	"local": "Local",
	"remote": "Remote",
	"customEmojis": "Custom Emoji",
	"search": "Søk",
	"noCustomEmojis": "Det er ingen emoji",
	"host": "Vert"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"details": "Szczegóły",
	"import": "Importuj",
	"export": "Eksportuj",
	"exportRequested": "Zażądałeś eksportu. Może to zająć trochę czasu. Po zakończeniu eksportu zostanie on dodany do Twoich \"dysków\".",
	"importRequested": "Zażądano importu. Może to zająć\u00a0chwilę.",
	"deleteConfirm": "Na pewno usunąć?",
	"addEmoji": "Dodaj emoji",
	"more": "Więcej!",
	"local": "Lokalne",
	"remote": "Zdalny",
	"customEmojis": "Niestandardowe emoji",
	"search": "Szukaj",
	"noCustomEmojis": "Brak emoji",
	"host": "Host"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"details": "Detalhes",
	"import": "Importar",
	"export": "Exportar",
	"exportRequested": "A sua solicitação de exportação foi enviada. Isso pode levar algum tempo. Assim que a exportação estiver concluída, ela será adicionada ao seu drive.",
	"importRequested": "A sua solicitação de importação foi enviada. Isso pode levar algum tempo.",
	"deleteConfirm": "Confirma a exclusão?",
	"addEmoji": "Adicionar um Emoji",
	"more": "Mais!",
	"local": "Local",
	"remote": "Remoto",
	"customEmojis": "Emoji personalizado",
	"search": "Pesquisar",
	"noCustomEmojis": "Não há emojis",
	"host": "Host"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"details": "Подробнее",
	"import": "Импорт",
	"export": "Экспорт",
	"exportRequested": "Вы запросили экспорт. Это может занять некоторое время. Результат будет добавлен на «Диск».",
	"importRequested": "Вы запросили импорт. Это может занять некоторое время.",
	"deleteConfirm": "Удалить?",
	"addEmoji": "Добавить эмодзи",
	"more": "Ещё!",
	"local": "С этого сайта",
	"remote": "С других сайтов",
	"customEmojis": "Собственные эмодзи",
	"search": "Поиск",
	"noCustomEmojis": "Собственные эмодзи отсутствуют",
	"host": "Хост"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"details": "Detaily",
	"import": "Importovať",
	"export": "Exportovať",
	"exportRequested": "Vyžiadali ste export. Môže to chvíľu trvať. Po skončení pribudne na vašom disku.",
	"importRequested": "Požiadali ste o export. Môže to chvíľu trvať.",
	"deleteConfirm": "Naozaj odstrániť?",
	"addEmoji": "Pridať emoji",
	"more": "Viac!",
	"local": "Lokálne",
	"remote": "Vzdialené",
	"customEmojis": "Vlastné emoji",
	"search": "Hľadať",
	"noCustomEmojis": "Žiadne emoji",
	"host": "Host"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"details": "รายละเอียด",
	"import": "นำเข้า",
	"export": "ส่งออก",
	"exportRequested": "คุณได้ร้องขอการส่งออก อาจใช้เวลาสักครู่ และจะถูกเพิ่มในไดรฟ์ของคุณเมื่อเสร็จสิ้นแล้ว",
	"importRequested": "คุณได้ร้องขอการนำเข้า การดำเนินการนี้อาจใช้เวลาสักครู่",
	"deleteConfirm": "ต้องการลบใช่ไหม?",
	"addEmoji": "แทรกเอโมจิ",
	"more": "เพิ่มเติม!",
	"local": "ท้องถิ่น",
	"remote": "ระยะไกล",
	"customEmojis": "เอโมจิที่กำหนดเอง",
	"search": "ค้นหา",
	"noCustomEmojis": "ไม่มีเอโมจิ",
	"host": "โฮสต์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"details": "Ayrıntılar",
	"import": "İçeri aktar",
	"export": "Dışa aktar",
	"exportRequested": "Dışa aktarma işlemi talep ettin. Bu işlem biraz zaman alabilir. İşlem tamamlandığında Drive'ına eklenecek.",
	"importRequested": "İçe aktarma talebinde bulundun. Bu işlem biraz zaman alabilir.",
	"deleteConfirm": "Cidden silmek istiyor musunuz?",
	"addEmoji": "Emoji ekle",
	"more": "Daha fazlası!",
	"local": "Yerel",
	"remote": "Uzak",
	"customEmojis": "Özel Emoji",
	"search": "Ara",
	"noCustomEmojis": "Emoji yok",
	"host": "Host"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"details": "Details",
	"import": "Import",
	"export": "Export",
	"exportRequested": "You've requested an export. This may take a while. It will be added to your Drive once completed.",
	"importRequested": "You've requested an import. This may take a while.",
	"deleteConfirm": "Really delete?",
	"addEmoji": "Add an emoji",
	"more": "More!",
	"local": "Local",
	"remote": "Remote",
	"customEmojis": "Custom Emoji",
	"search": "ئىزدەش",
	"noCustomEmojis": "There are no emoji",
	"host": "Host"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"details": "Детальніше",
	"import": "Імпорт",
	"export": "Експорт",
	"exportRequested": "Експортування розпочато. Це може зайняти деякий час. Після завершення експорту отриманий файл буде додано на диск.",
	"importRequested": "Імпортування розпочато. Це може зайняти деякий час.",
	"deleteConfirm": "Ви дійсно бажаєте це видалити?",
	"addEmoji": "Додати емодзі",
	"more": "Бiльше!",
	"local": "Локальні",
	"remote": "Віддалені",
	"customEmojis": "Кастомні емоджі",
	"search": "Пошук",
	"noCustomEmojis": "Немає нетипових емоджі",
	"host": "Хост"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"details": "Chi tiết",
	"import": "Nhập dữ liệu",
	"export": "Xuất dữ liệu",
	"exportRequested": "Đang chuẩn bị xuất tập tin. Quá trình này có thể mất ít phút. Nó sẽ được tự động thêm vào Drive sau khi hoàn thành.",
	"importRequested": "Bạn vừa yêu cầu nhập dữ liệu. Quá trình này có thể mất ít phút.",
	"deleteConfirm": "Bạn có muốn xóa không?",
	"addEmoji": "Thêm emoji",
	"more": "Thêm nữa!",
	"local": "Máy chủ này",
	"remote": "Máy chủ khác",
	"customEmojis": "Tùy chỉnh emoji",
	"search": "Tìm kiếm",
	"noCustomEmojis": "Không có emoji",
	"host": "Host"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"details": "详情",
	"import": "导入",
	"export": "导出",
	"exportRequested": "已请求导出，这可能需要一段时间，导出的文件将保存至网盘中。",
	"importRequested": "导入请求已提交，这可能需要花一点时间。",
	"deleteConfirm": "确定删除?",
	"addEmoji": "添加表情符号",
	"more": "更多！",
	"local": "本地",
	"remote": "远程",
	"customEmojis": "自定义表情符号",
	"search": "搜索",
	"noCustomEmojis": "没有自定义表情符号",
	"host": "主机名"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"details": "詳細資訊",
	"import": "匯入",
	"export": "匯出",
	"exportRequested": "已請求匯出。這可能會花一點時間。匯出的檔案將會被放到雲端硬碟裡。",
	"importRequested": "已請求匯入。這可能會花一點時間。",
	"deleteConfirm": "你確定要刪除嗎？",
	"addEmoji": "新增表情符號",
	"more": "更多！",
	"local": "本地",
	"remote": "遠端",
	"customEmojis": "自訂表情符號",
	"search": "搜尋",
	"noCustomEmojis": "沒有自訂的表情符號",
	"host": "主機"
}
</locale>
