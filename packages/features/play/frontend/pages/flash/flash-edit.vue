<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div class="_gaps">
			<MkInput v-model="title">
				<template #label>{{ $locale.sfc.title }}</template>
			</MkInput>
			<MkSelect v-model="visibility" :items="visibilityDef">
				<template #label>{{ $locale.sfc.visibility }}</template>
				<template #caption>{{ $locale.sfc.visibilityDescription }}</template>
			</MkSelect>
			<MkTextarea v-model="summary" :mfmAutocomplete="true" :mfmPreview="true">
				<template #label>{{ $locale.sfc.summary }}</template>
			</MkTextarea>
			<MkButton primary @click="selectPreset">{{ $locale.sfc.selectFromPresets }}<i class="ti ti-chevron-down"></i></MkButton>
			<MkCodeEditor v-model="script" lang="is">
				<template #label>{{ $locale.sfc.script }}</template>
			</MkCodeEditor>
		</div>
	</div>
	<template #footer>
		<div :class="$style.footer">
			<div class="_spacer">
				<div class="_buttons">
					<MkButton primary @click="save"><i class="ti ti-check"></i> {{ $locale.sfc.save }}</MkButton>
					<MkButton @click="show"><i class="ti ti-eye"></i> {{ $locale.sfc.show }}</MkButton>
					<MkButton v-if="flash" danger @click="del"><i class="ti ti-trash"></i> {{ $locale.sfc.delete }}</MkButton>
				</div>
			</div>
		</div>
	</template>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { AISCRIPT_VERSION } from '@syuilo/aiscript';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkCodeEditor from '@features/markup/frontend/components/MkCodeEditor.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import { useRouter } from '@features/navigation/frontend/router.js';

const PRESET_DEFAULT = `/// @ ${AISCRIPT_VERSION}

var name = ""

Ui:render([
	Ui:C:textInput({
		label: "Your name"
		onInput: @(v) { name = v }
	})
	Ui:C:button({
		text: "Hello"
		onClick: @() {
			Mk:dialog(null, \`Hello, {name}!\`)
		}
	})
])
`;

const PRESET_OMIKUJI = `/// @ ${AISCRIPT_VERSION}
// ユーザーごとに日替わりのおみくじのプリセット

// 選択肢
let choices = [
	"ｷﾞｶﾞ吉"
	"大吉"
	"吉"
	"中吉"
	"小吉"
	"末吉"
	"凶"
	"大凶"
]

// シードが「PlayID+ユーザーID+今日の日付」である乱数生成器を用意
let random = Math:gen_rng(\`{THIS_ID}{USER_ID}{Date:year()}{Date:month()}{Date:day()}\`)

// ランダムに選択肢を選ぶ
let chosen = choices[random(0, (choices.len - 1))]

// 結果のテキスト
let result = \`今日のあなたの運勢は **{chosen}** です。\`

// UIを表示
Ui:render([
	Ui:C:container({
		align: 'center'
		children: [
			Ui:C:mfm({ text: result })
			Ui:C:postFormButton({
				text: "投稿する"
				rounded: true
				primary: true
				form: {
					text: \`{result}{Str:lf}{THIS_URL}\`
				}
			})
		]
	})
])
`;

const PRESET_SHUFFLE = `/// @ ${AISCRIPT_VERSION}
// 巻き戻し可能な文字シャッフルのプリセット

let string = "ペペロンチーノ"
let length = string.len

// 過去の結果を保存しておくやつ
var results = []

// どれだけ巻き戻しているか
var cursor = 0

@main() {
	if (cursor != 0) {
		results = results.slice(0, (cursor + 1))
		cursor = 0
	}

	let chars = []
	for (let i, length) {
		let r = Math:rnd(0, (length - 1))
		chars.push(string.pick(r))
	}
	let result = chars.join("")

	results.push(result)

	// UIを表示
	render(result)
}

@back() {
	cursor = cursor + 1
	let result = results[results.len - (cursor + 1)]
	render(result)
}

@forward() {
	cursor = cursor - 1
	let result = results[results.len - (cursor + 1)]
	render(result)
}

@render(result) {
	Ui:render([
		Ui:C:container({
			align: 'center'
			children: [
				Ui:C:mfm({ text: result })
				Ui:C:buttons({
					buttons: [{
						text: "←"
						disabled: !(results.len > 1 && (results.len - cursor) > 1)
						onClick: back
					}, {
						text: "→"
						disabled: !(results.len > 1 && cursor > 0)
						onClick: forward
					}, {
						text: "引き直す"
						onClick: main
					}]
				})
				Ui:C:postFormButton({
					text: "投稿する"
					rounded: true
					primary: true
					form: {
						text: \`{result}{Str:lf}{THIS_URL}\`
					}
				})
			]
		})
	])
}

main()
`;

const PRESET_QUIZ = `/// @ ${AISCRIPT_VERSION}
let title = '地理クイズ'

let qas = [{
	q: 'オーストラリアの首都は？'
	choices: ['シドニー', 'キャンベラ', 'メルボルン']
	a: 'キャンベラ'
	aDescription: '最大の都市はシドニーですが首都はキャンベラです。'
}, {
	q: '国土面積2番目の国は？'
	choices: ['カナダ', 'アメリカ', '中国']
	a: 'カナダ'
	aDescription: '大きい順にロシア、カナダ、アメリカ、中国です。'
}, {
	q: '二重内陸国ではないのは？'
	choices: ['リヒテンシュタイン', 'ウズベキスタン', 'レソト']
	a: 'レソト'
	aDescription: 'レソトは(一重)内陸国です。'
}, {
	q: '閘門がない運河は？'
	choices: ['キール運河', 'スエズ運河', 'パナマ運河']
	a: 'スエズ運河'
	aDescription: 'スエズ運河は高低差がないので閘門はありません。'
}]

let qaEls = [Ui:C:container({
	align: 'center'
	children: [
		Ui:C:text({
			size: 1.5
			bold: true
			text: title
		})
	]
})]

var qn = 0
each (let qa, qas) {
	qn += 1
	qa.id = Util:uuid()
	qaEls.push(Ui:C:container({
		align: 'center'
		bgColor: '#000'
		fgColor: '#fff'
		padding: 16
		rounded: true
		children: [
			Ui:C:text({
				text: \`Q{qn} {qa.q}\`
			})
			Ui:C:select({
				items: qa.choices.map(@(c) {{ text: c, value: c }})
				onChange: @(v) { qa.userAnswer = v }
			})
			Ui:C:container({
				children: []
			}, \`{qa.id}:a\`)
		]
	}, qa.id))
}

@finish() {
	var score = 0

	each (let qa, qas) {
		let correct = qa.userAnswer == qa.a
		if (correct) score += 1
		let el = Ui:get(\`{qa.id}:a\`)
		el.update({
			children: [
				Ui:C:text({
					size: 1.2
					bold: true
					color: if (correct) '#f00' else '#00f'
					text: if (correct) '🎉正解' else '不正解'
				})
				Ui:C:text({
					text: qa.aDescription
				})
			]
		})
	}

	let result = \`{title}の結果は{qas.len}問中{score}問正解でした。\`
	Ui:get('footer').update({
		children: [
			Ui:C:postFormButton({
				text: '結果を共有'
				rounded: true
				primary: true
				form: {
					text: \`{result}{Str:lf}{THIS_URL}\`
				}
			})
		]
	})
}

qaEls.push(Ui:C:container({
	align: 'center'
	children: [
		Ui:C:button({
			text: '答え合わせ'
			primary: true
			rounded: true
			onClick: finish
		})
	]
}, 'footer'))

Ui:render(qaEls)
`;

const PRESET_TIMELINE = `/// @ ${AISCRIPT_VERSION}
// APIリクエストを行いローカルタイムラインを表示するプリセット

@fetch() {
	Ui:render([
		Ui:C:container({
			align: 'center'
			children: [
				Ui:C:text({ text: "読み込み中..." })
			]
		})
	])

	// タイムライン取得
	let notes = Mk:api("notes/local-timeline", {})

	// それぞれのノートごとにUI要素作成
	let noteEls = []
	each (let note, notes) {
		// 表示名を設定していないアカウントはidを表示
		let userName = if Core:type(note.user.name) == "str" note.user.name else note.user.username
		// リノートもしくはメディア・投票のみで本文が無いノートに代替表示文を設定
		let noteText = if Core:type(note.text) == "str" note.text else "（リノートもしくはメディア・投票のみのノート）"

		let el = Ui:C:container({
			bgColor: "#444"
			fgColor: "#fff"
			padding: 10
			rounded: true
			children: [
				Ui:C:mfm({
					text: userName
					bold: true
				})
				Ui:C:mfm({
					text: noteText
				})
			]
		})
		noteEls.push(el)
	}

	// UIを表示
	Ui:render([
		Ui:C:text({ text: "ローカル タイムライン" })
		Ui:C:button({
			text: "更新"
			onClick: @() {
				fetch()
			}
		})
		Ui:C:container({
			children: noteEls
		})
	])
}

fetch()
`;

const router = useRouter();

const props = defineProps<{
	id?: string;
}>();

const flash = ref<Misskey.entities.Flash | null>(null);

if (props.id) {
	flash.value = await misskeyApi('flash/show', {
		flashId: props.id,
	});
}

const title = ref(flash.value?.title ?? 'New Play');
const summary = ref(flash.value?.summary ?? '');
const permissions = ref([]); // not implemented yet
const {
	model: visibility,
	def: visibilityDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.public, value: 'public' },
		{ label: $locale.value.sfc.private, value: 'private' },
	],
	initialValue: flash.value?.visibility ?? 'public',
});
const script = ref(flash.value?.script ?? PRESET_DEFAULT);

function selectPreset(ev: PointerEvent) {
	os.popupMenu([{
		text: 'Omikuji',
		action: () => {
			script.value = PRESET_OMIKUJI;
		},
	}, {
		text: 'Shuffle',
		action: () => {
			script.value = PRESET_SHUFFLE;
		},
	}, {
		text: 'Quiz',
		action: () => {
			script.value = PRESET_QUIZ;
		},
	}, {
		text: 'Timeline viewer',
		action: () => {
			script.value = PRESET_TIMELINE;
		},
	}], ev.currentTarget ?? ev.target);
}

async function save() {
	if (flash.value != null) {
		os.apiWithDialog('flash/update', {
			flashId: flash.value.id,
			title: title.value,
			summary: summary.value,
			permissions: permissions.value,
			script: script.value,
			visibility: visibility.value,
		});
	} else {
		const created = await os.apiWithDialog('flash/create', {
			title: title.value,
			summary: summary.value,
			permissions: permissions.value,
			script: script.value,
			visibility: visibility.value,
		});
		router.push('/play/:id/edit', {
			params: {
				id: created.id,
			},
		});
	}
}

function show() {
	if (flash.value == null) {
		os.alert({
			text: 'Please save',
		});
	} else {
		os.pageWindow(`/play/${flash.value.id}`);
	}
}

async function del() {
	if (flash.value == null) return;

	const { canceled } = await os.confirm({
		type: 'warning',
		text: interpolateLocaleParameters($locale.value.sfc.deleteAreYouSure, { x: flash.value.title }),
	});
	if (canceled) return;

	await os.apiWithDialog('flash/delete', {
		flashId: flash.value.id,
	});
	router.push('/play');
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: flash.value ? `${$locale.value.sfc.edit}: ${flash.value.title}` : $locale.value.sfc.new,
}));
</script>

<style lang="scss" module>
.footer {
	backdrop-filter: var(--MI-blur, blur(15px));
	background: color(from var(--MI_THEME-bg) srgb r g b / 0.5);
	border-top: solid .5px var(--MI_THEME-divider);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"public": "علني",
	"private": "خاص",
	"deleteAreYouSure": "متأكد من أنك تريد حذف {x}؟",
	"edit": "Edit Play",
	"new": "Create Play",
	"title": "العنوان",
	"visibility": "الظهور",
	"visibilityDescription": "Putting it private means it won't be visible on your profile, but anyone that has the URL can still access it.",
	"summary": "الوصف",
	"selectFromPresets": "اختر من الإعدادات المسبقة",
	"script": "Script",
	"save": "حفظ",
	"show": "المظهر",
	"delete": "حذف"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"public": "Públic ",
	"private": "Privat",
	"deleteAreYouSure": "Segur que vols esborrar «{x}»?",
	"edit": "Editar guió",
	"new": "Crear un guió",
	"title": "Títol ",
	"visibility": "Visibilitat",
	"visibilityDescription": "Putting it private means it won't be visible on your profile, but anyone that has the URL can still access it.",
	"summary": "Descripció",
	"selectFromPresets": "Escull des dels predefinits",
	"script": "Script",
	"save": "Desa",
	"show": "Veure",
	"delete": "Elimina"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"public": "Veřejný",
	"private": "Soukromý",
	"deleteAreYouSure": "Jste si jistí že chcete smazat \"{x}\"?",
	"edit": "Upravit Play",
	"new": "Vytvořit Play",
	"title": "Titulek",
	"visibility": "Viditelnost",
	"visibilityDescription": "Putting it private means it won't be visible on your profile, but anyone that has the URL can still access it.",
	"summary": "Popis",
	"selectFromPresets": "Vybrat z předvoleb",
	"script": "Skript",
	"save": "Uložit",
	"show": "Zobrazit",
	"delete": "Smazat"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"public": "Public",
	"private": "Private",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"edit": "Edit Play",
	"new": "Create Play",
	"title": "Title",
	"visibility": "Visibility",
	"visibilityDescription": "Putting it private means it won't be visible on your profile, but anyone that has the URL can still access it.",
	"summary": "Description",
	"selectFromPresets": "Choose from presets",
	"script": "Script",
	"save": "Save",
	"show": "Show",
	"delete": "Delete"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"public": "Öffentlich",
	"private": "Privat",
	"deleteAreYouSure": "Möchtest du „{x}“ wirklich löschen?",
	"edit": "Play bearbeiten",
	"new": "Play erstellen",
	"title": "Titel",
	"visibility": "Sichtbarkeit",
	"visibilityDescription": "Wenn du die Sichtbarkeit auf Privat stellst, wird der Play nicht auf deinem Profil sichtbar sein, aber jeder, der die URL hat, kann ihn trotzdem aufrufen.",
	"summary": "Beschreibung",
	"selectFromPresets": "Aus Vorlagen wählen",
	"script": "Skript",
	"save": "Speichern",
	"show": "Anzeigen",
	"delete": "Löschen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"public": "Public",
	"private": "Private",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"edit": "Edit Play",
	"new": "Create Play",
	"title": "Title",
	"visibility": "Visibility",
	"visibilityDescription": "Putting it private means it won't be visible on your profile, but anyone that has the URL can still access it.",
	"summary": "Description",
	"selectFromPresets": "Choose from presets",
	"script": "Script",
	"save": "Save",
	"show": "Show",
	"delete": "Delete"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"public": "Público",
	"private": "Privado",
	"deleteAreYouSure": "¿Desea borrar \"{x}\"?",
	"edit": "Editar guión",
	"new": "Crear guión",
	"title": "Título",
	"visibility": "Visibilidad",
	"visibilityDescription": "Poniéndola como privada significa que no será visible en tu perfil, pero cualquiera que tenga la URL aún podrá acceder a ella.",
	"summary": "Descripción",
	"selectFromPresets": "Escoger desde predefinidos",
	"script": "Script",
	"save": "Guardar",
	"show": "Apariencia",
	"delete": "Borrar"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"public": "Public",
	"private": "Privé",
	"deleteAreYouSure": "Êtes-vous sûr·e de vouloir supprimer « {x} » ?",
	"edit": "Modifier un Play",
	"new": "Créer un Play",
	"title": "Titre",
	"visibility": "Visibilité",
	"visibilityDescription": "Putting it private means it won't be visible on your profile, but anyone that has the URL can still access it.",
	"summary": "Description",
	"selectFromPresets": "Sélectionner à partir des préréglages",
	"script": "Script",
	"save": "Enregistrer",
	"show": "Affichage",
	"delete": "Supprimer"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"public": "Publik",
	"private": "Tersembunyi",
	"deleteAreYouSure": "Apakah kamu yakin ingin menghapus \"{x}\"?",
	"edit": "Menyunting Permainan",
	"new": "Membuat Permainan",
	"title": "Judul",
	"visibility": "Visibilitas",
	"visibilityDescription": "Membuat catatan ini privat berarti tidak akan terlihat pada profil kamu, namun siapapun yang memiliki URL dari catatan ini akan dapat mengaksesnya.",
	"summary": "Deskripsi",
	"selectFromPresets": "Pilih dari prasetel",
	"script": "Script",
	"save": "Simpan",
	"show": "Tampilkan",
	"delete": "Hapus"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"public": "Pubblica",
	"private": "Privato",
	"deleteAreYouSure": "Vuoi davvero eliminare \"{x}\"?",
	"edit": "Modifica i Play",
	"new": "Crea un Play",
	"title": "Titolo",
	"visibility": "Visibilità",
	"visibilityDescription": "Impostarlo su privato significa che non verrà visualizzato sul tuo profilo, ma chiunque ha l'URL potrà comunque accedervi.",
	"summary": "Descrizione",
	"selectFromPresets": "Seleziona preimpostato",
	"script": "Script",
	"save": "Salva",
	"show": "Visualizza",
	"delete": "Elimina"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"public": "パブリック",
	"private": "非公開",
	"deleteAreYouSure": "「{x}」を削除しますか？",
	"edit": "Playの編集",
	"new": "Playの作成",
	"title": "タイトル",
	"visibility": "公開範囲",
	"visibilityDescription": "非公開に設定するとプロフィールに表示されなくなりますが、URLを知っている人は引き続きアクセスできます。",
	"summary": "説明",
	"selectFromPresets": "プリセットから選択",
	"script": "スクリプト",
	"save": "保存",
	"show": "表示",
	"delete": "削除"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"public": "パブリック",
	"private": "非公開",
	"deleteAreYouSure": "「{x}」はほかしてええか？",
	"edit": "Playの編集",
	"new": "Playの作成",
	"title": "タイトル",
	"visibility": "公開範囲",
	"visibilityDescription": "非公開に設定するとプロフィールに表示されへんくなるけど、URLを知っとる人は引き続きアクセスできるで。",
	"summary": "説明",
	"selectFromPresets": "プリセットから選ぶ",
	"script": "スクリプト",
	"save": "とっとく",
	"show": "表示",
	"delete": "ほかす"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"public": "Public",
	"private": "Private",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"edit": "Edit Play",
	"new": "Create Play",
	"title": "Title",
	"visibility": "Visibility",
	"visibilityDescription": "Putting it private means it won't be visible on your profile, but anyone that has the URL can still access it.",
	"summary": "Description",
	"selectFromPresets": "Choose from presets",
	"script": "Script",
	"save": "Sekles",
	"show": "Show",
	"delete": "Kkes"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"public": "Public",
	"private": "Private",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"edit": "Edit Play",
	"new": "Create Play",
	"title": "Title",
	"visibility": "Visibility",
	"visibilityDescription": "Putting it private means it won't be visible on your profile, but anyone that has the URL can still access it.",
	"summary": "Description",
	"selectFromPresets": "Choose from presets",
	"script": "Script",
	"save": "ಉಳಿಸಿ",
	"show": "Show",
	"delete": "ಅಳಿಸು"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"public": "공개",
	"private": "비공개",
	"deleteAreYouSure": "\"{x}\" 을(를) 삭제하시겠습니까?",
	"edit": "Play 수정하기",
	"new": "Play 만들기",
	"title": "제목",
	"visibility": "공개 범위",
	"visibilityDescription": "비공개로 설정하면 프로필에 표시하지 않지만 URL을 아는 사람은 계속해서 접속할 수 있습니다.",
	"summary": "설명",
	"selectFromPresets": "프리셋에서 선택",
	"script": "스크립트",
	"save": "저장",
	"show": "표시",
	"delete": "삭제"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"public": "Openbare",
	"private": "Privé",
	"deleteAreYouSure": "Weet je zeker dat je \"{x}\" wil verwijderen?",
	"edit": "Edit Play",
	"new": "Create Play",
	"title": "Title",
	"visibility": "Zichtbaarheid",
	"visibilityDescription": "Putting it private means it won't be visible on your profile, but anyone that has the URL can still access it.",
	"summary": "Beschrijving",
	"selectFromPresets": "Choose from presets",
	"script": "Script",
	"save": "Opslaan",
	"show": "Weergave",
	"delete": "Verwijderen"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"public": "Public",
	"private": "Private",
	"deleteAreYouSure": "Er du sikker på at du vil slette \"{x}\"?",
	"edit": "Rediger Play",
	"new": "Opprett Play",
	"title": "Tittel",
	"visibility": "Visibility",
	"visibilityDescription": "Putting it private means it won't be visible on your profile, but anyone that has the URL can still access it.",
	"summary": "Beskrivelse",
	"selectFromPresets": "Choose from presets",
	"script": "Script",
	"save": "Lagre",
	"show": "Vis",
	"delete": "Slett"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"public": "Publiczny",
	"private": "Prywatne",
	"deleteAreYouSure": "Czy na pewno chcesz usunąć „{x}”?",
	"edit": "Edit Play",
	"new": "Create Play",
	"title": "Tytuł",
	"visibility": "Widoczność",
	"visibilityDescription": "Putting it private means it won't be visible on your profile, but anyone that has the URL can still access it.",
	"summary": "Opis",
	"selectFromPresets": "Wybierz konfiguracje",
	"script": "Skrypt",
	"save": "Zapisz",
	"show": "Wyświetlanie",
	"delete": "Usuń"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"public": "Público",
	"private": "Privado",
	"deleteAreYouSure": "Deseja excluir \"{x}\"?",
	"edit": "Editar Play",
	"new": "Criar  Play",
	"title": "Título",
	"visibility": "Visibilidade",
	"visibilityDescription": "Pôr em privado significa que ele não será visível no perfil, mas qualquer um com o URL poderá acessar",
	"summary": "Descrição",
	"selectFromPresets": "Escolher de predefinições",
	"script": "Script",
	"save": "Salvar",
	"show": "Visualizar",
	"delete": "Excluir"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"public": "Общедоступно",
	"private": "Личное",
	"deleteAreYouSure": "Хотите удалить «{x}»?",
	"edit": "Редактировать приложение",
	"new": "Создать приложение ",
	"title": "Заголовок",
	"visibility": "Видимость",
	"visibilityDescription": "Putting it private means it won't be visible on your profile, but anyone that has the URL can still access it.",
	"summary": "Описание",
	"selectFromPresets": "Выбрать из шаблонов",
	"script": "Скрипт",
	"save": "Сохранить",
	"show": "Показать",
	"delete": "Удалить"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"public": "Verejné",
	"private": "Súkromné",
	"deleteAreYouSure": "Naozaj chcete odstrániť \"{x}\"?",
	"edit": "Edit Play",
	"new": "Create Play",
	"title": "Nadpis",
	"visibility": "Viditeľnosť",
	"visibilityDescription": "Putting it private means it won't be visible on your profile, but anyone that has the URL can still access it.",
	"summary": "Popis",
	"selectFromPresets": "Choose from presets",
	"script": "Skript",
	"save": "Uložiť",
	"show": "Zobraziť",
	"delete": "Odstrániť"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"public": "สาธารณะ",
	"private": "ส่วนตัว",
	"deleteAreYouSure": "ต้องการลบ “{x}” ใช่ไหม?",
	"edit": "แก้ไข Play",
	"new": "สร้าง Play",
	"title": "หัวข้อ",
	"visibility": "การมองเห็น",
	"visibilityDescription": "หากตั้งค่าเป็นส่วนตัว มันจะไม่ปรากฏในโปรไฟล์อีกต่อไป แต่ผู้ที่ทราบ URL ของมันจะยังสามารถเข้าถึงได้",
	"summary": "คำอธิบาย",
	"selectFromPresets": "เลือกจากการพรีเซ็ต",
	"script": "สคริปต์",
	"save": "บันทึก",
	"show": "แสดงผล",
	"delete": "ลบ"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"public": "Herkese açık",
	"private": "Özel",
	"deleteAreYouSure": "“{x}” öğesini silmek istediğinizden emin misin?",
	"edit": "Düzenle Oynat",
	"new": "Oyun Oluştur",
	"title": "Başlık",
	"visibility": "Görünürlük",
	"visibilityDescription": "Özel olarak ayarlamak, profilinde görünmeyeceği anlamına gelir, ancak URL'ye sahip olan herkes yine de erişebilir.",
	"summary": "Açıklama",
	"selectFromPresets": "Ön ayarlardan seçim yapın",
	"script": "Senaryo",
	"save": "Kaydet",
	"show": "Göster",
	"delete": "Sil"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"public": "Public",
	"private": "Private",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"edit": "Edit Play",
	"new": "Create Play",
	"title": "Title",
	"visibility": "Visibility",
	"visibilityDescription": "Putting it private means it won't be visible on your profile, but anyone that has the URL can still access it.",
	"summary": "Description",
	"selectFromPresets": "Choose from presets",
	"script": "Script",
	"save": "Save",
	"show": "Show",
	"delete": "ئۆچۈرۈش"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"public": "Публічний",
	"private": "Приватне",
	"deleteAreYouSure": "Ви впевнені, що хочете видалити \"{x}\"?",
	"edit": "Edit Play",
	"new": "Create Play",
	"title": "Заголовок",
	"visibility": "Видимість",
	"visibilityDescription": "Putting it private means it won't be visible on your profile, but anyone that has the URL can still access it.",
	"summary": "Опис",
	"selectFromPresets": "Вибрати з пресетів",
	"script": "Скрипт",
	"save": "Зберегти",
	"show": "Відображення",
	"delete": "Видалити"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"public": "Công khai",
	"private": "Riêng tư",
	"deleteAreYouSure": "Bạn có chắc muốn xóa \"{x}\"?",
	"edit": "Edit play",
	"new": "Tạo Play mới",
	"title": "Tựa đề",
	"visibility": "Hiển thị",
	"visibilityDescription": "Putting it private means it won't be visible on your profile, but anyone that has the URL can still access it.",
	"summary": "Mô tả",
	"selectFromPresets": "Chọn từ mẫu",
	"script": "Kịch bản",
	"save": "Lưu",
	"show": "Hiển thị",
	"delete": "Xóa"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"public": "公开",
	"private": "私密",
	"deleteAreYouSure": "要删掉「{x}」吗？",
	"edit": "编辑 Play",
	"new": "创建 Play",
	"title": "标题",
	"visibility": "可见性",
	"visibilityDescription": "设置为不公开后资料将不再显示，但知道 URL 的人仍可继续访问。",
	"summary": "描述",
	"selectFromPresets": "从预设值中选择",
	"script": "脚本",
	"save": "保存",
	"show": "显示",
	"delete": "删除"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"public": "公開",
	"private": "私密",
	"deleteAreYouSure": "確定要刪掉「{x}」嗎？",
	"edit": "編輯 Play",
	"new": "新增 Play",
	"title": "標題",
	"visibility": "可見性",
	"visibilityDescription": "如果您將其設為私密，它將不再顯示在您的個人資料中，但知道該 URL 的人仍然可以存取它。",
	"summary": "描述",
	"selectFromPresets": "從預設值中選擇",
	"script": "腳本",
	"save": "儲存",
	"show": "檢視",
	"delete": "刪除"
}
</locale>
