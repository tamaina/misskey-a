<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/sounds" :label="$locale.sfc.sounds" :keywords="['sounds']" icon="ti ti-music">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/fluent-emoji/1f50a.png" color="#ff006f">
			<SearchText>{{ $locale.sfc.settingsSoundsBanner }}</SearchText>
		</MkFeatureBanner>

		<SearchMarker :keywords="['mute']">
			<MkPreferenceContainer k="sound.notUseSound">
				<MkSwitch v-model="notUseSound">
					<template #label><SearchLabel>{{ $locale.sfc.notUseSound }}</SearchLabel></template>
				</MkSwitch>
			</MkPreferenceContainer>
		</SearchMarker>

		<SearchMarker :keywords="['active', 'mute']">
			<MkPreferenceContainer k="sound.useSoundOnlyWhenActive">
				<MkSwitch v-model="useSoundOnlyWhenActive">
					<template #label><SearchLabel>{{ $locale.sfc.useSoundOnlyWhenActive }}</SearchLabel></template>
				</MkSwitch>
			</MkPreferenceContainer>
		</SearchMarker>

		<SearchMarker :keywords="['volume', 'master']">
			<MkPreferenceContainer k="sound.masterVolume">
				<MkRange v-model="masterVolume" :min="0" :max="1" :step="0.05" :textConverter="(v) => `${Math.floor(v * 100)}%`">
					<template #label><SearchLabel>{{ $locale.sfc.masterVolume }}</SearchLabel></template>
				</MkRange>
			</MkPreferenceContainer>
		</SearchMarker>

		<FormSection>
			<template #label>{{ $locale.sfc.sounds }}</template>
			<div class="_gaps_s">
				<MkFolder v-for="type in operationTypes" :key="type">
					<template #label>{{ copyLocaleDictionary($locale.sfc.sfxLabels)[type] }}</template>
					<template #suffix>{{ getSoundTypeName(sounds[type].type) }}</template>
					<Suspense>
						<template #default>
							<XSound :def="sounds[type]" @update="(res) => updated(type, res)"/>
						</template>
						<template #fallback>
							<MkLoading/>
						</template>
					</Suspense>
				</MkFolder>
			</div>
		</FormSection>

		<MkButton danger @click="reset()"><i class="ti ti-reload"></i> {{ $locale.sfc.default }}</MkButton>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import XSound from '@features/preferences/frontend/pages/settings/sounds.sound.vue';
import type { Ref } from 'vue';
import type { SoundType, OperationType } from '@features/preferences/frontend/utility/sound.js';
import type { SoundStore } from '@features/preferences/frontend/state/def.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import MkRange from '@features/ui/frontend/components/MkRange.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { operationTypes } from '@features/preferences/frontend/utility/sound.js';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkPreferenceContainer from '@features/preferences/frontend/components/MkPreferenceContainer.vue';
import { PREF_DEF } from '@features/preferences/frontend/state/def.js';
import MkFeatureBanner from '@features/web/frontend/components/MkFeatureBanner.vue';
import { getInitialPrefValue } from '@features/preferences/frontend/state/manager.js';

const notUseSound = prefer.model('sound.notUseSound');
const useSoundOnlyWhenActive = prefer.model('sound.useSoundOnlyWhenActive');
const masterVolume = prefer.model('sound.masterVolume');

const sounds = ref<Record<OperationType, Ref<SoundStore>>>({
	note: prefer.r['sound.on.note'],
	noteMy: prefer.r['sound.on.noteMy'],
	notification: prefer.r['sound.on.notification'],
	reaction: prefer.r['sound.on.reaction'],
	chatMessage: prefer.r['sound.on.chatMessage'],
});

function getSoundTypeName(f: SoundType): string {
	switch (f) {
		case null:
			return $locale.value.sfc.none;
		case '_driveFile_':
			return $locale.value.sfc.soundSettingsDriveFile;
		default:
			return f;
	}
}

async function updated(type: keyof typeof sounds.value, sound: { type: SoundType; fileId?: string; fileUrl?: string; volume: number; }) {
	const v: SoundStore = sound.type === '_driveFile_' ? {
		type: sound.type,
		fileId: sound.fileId!,
		fileUrl: sound.fileUrl!,
		volume: sound.volume,
	} : {
		type: sound.type,
		volume: sound.volume,
	};

	prefer.commit(`sound.on.${type}`, v);
	sounds.value[type] = v;
}

function reset() {
	for (const sound of Object.keys(sounds.value) as Array<keyof typeof sounds.value>) {
		const v = getInitialPrefValue(`sound.on.${sound}`);
		prefer.commit(`sound.on.${sound}`, v);
		sounds.value[sound] = v;
	}
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.sounds,
	icon: 'ti ti-music',
}));
</script>

<locale lang="json" locale="ar-SA">
{
	"sounds": "الرنات",
	"settingsSoundsBanner": "You can configure the sound settings for playback in the client.",
	"notUseSound": "Disable sound",
	"useSoundOnlyWhenActive": "Output sounds only if Misskey is active",
	"masterVolume": "حجم الصوت الرئيس",
	"sfxLabels": {
		"note": "الملاحظات",
		"noteMy": "ملاحظتي",
		"notification": "الإشعارات",
		"reaction": "On choosing a reaction",
		"chatMessage": "Chat Messages"
	},
	"default": "افتراضي",
	"none": "لا شيء",
	"soundSettingsDriveFile": "Use an audio file in Drive."
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"sounds": "Sons",
	"settingsSoundsBanner": "Configuració dels sons que reproduirà el client.",
	"notUseSound": "Sense so",
	"useSoundOnlyWhenActive": "Reproduir sons només quan Misskey estigui actiu",
	"masterVolume": "Volum principal",
	"sfxLabels": {
		"note": "Notes",
		"noteMy": "Nota (per mi)",
		"notification": "Notificacions",
		"reaction": "Quan se selecciona una reacció ",
		"chatMessage": "Missatges del xat"
	},
	"default": "Per defecte",
	"none": "Res",
	"soundSettingsDriveFile": "Fer servir un fitxer d'àudio del disc"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"sounds": "Zvuky",
	"settingsSoundsBanner": "You can configure the sound settings for playback in the client.",
	"notUseSound": "Zakázat zvuk",
	"useSoundOnlyWhenActive": "Output sounds only if Misskey is active",
	"masterVolume": "Celková hlasitost",
	"sfxLabels": {
		"note": "Poznámky",
		"noteMy": "Moje poznámka",
		"notification": "Oznámení",
		"reaction": "On choosing a reaction",
		"chatMessage": "Chat Messages"
	},
	"default": "Výchozí",
	"none": "Žádný",
	"soundSettingsDriveFile": "Use an audio file in Drive."
}
</locale>

<locale lang="json" locale="da-DK">
{
	"sounds": "Sounds",
	"settingsSoundsBanner": "You can configure the sound settings for playback in the client.",
	"notUseSound": "Disable sound",
	"useSoundOnlyWhenActive": "Output sounds only if Misskey is active",
	"masterVolume": "Master volume",
	"sfxLabels": {
		"note": "New note",
		"noteMy": "Own note",
		"notification": "Notifications",
		"reaction": "On choosing a reaction",
		"chatMessage": "Chat Messages"
	},
	"default": "Default",
	"none": "None",
	"soundSettingsDriveFile": "Use an audio file in Drive."
}
</locale>

<locale lang="json" locale="de-DE">
{
	"sounds": "Töne",
	"settingsSoundsBanner": "Du kannst die Einstellungen für die Wiedergabe von Klängen im Client konfigurieren.",
	"notUseSound": "Gebe kein Ton aus",
	"useSoundOnlyWhenActive": "Gebe nur Ton aus, wenn Misskey aktiv ist",
	"masterVolume": "Gesamtlautstärke",
	"sfxLabels": {
		"note": "Notizen",
		"noteMy": "Meine Notizen",
		"notification": "Benachrichtigungen",
		"reaction": "Auswählen einer Reaktion",
		"chatMessage": "Chat-Nachrichten"
	},
	"default": "Standard",
	"none": "Nichts",
	"soundSettingsDriveFile": "Audiodatei aus dem Drive verwenden"
}
</locale>

<locale lang="json" locale="en-US">
{
	"sounds": "Sounds",
	"settingsSoundsBanner": "You can configure the sound settings for playback in the client.",
	"notUseSound": "Disable sound",
	"useSoundOnlyWhenActive": "Output sounds only if Misskey is active",
	"masterVolume": "Master volume",
	"sfxLabels": {
		"note": "New note",
		"noteMy": "Own note",
		"notification": "Notifications",
		"reaction": "On choosing a reaction",
		"chatMessage": "Chat Messages"
	},
	"default": "Default",
	"none": "None",
	"soundSettingsDriveFile": "Use an audio file in Drive."
}
</locale>

<locale lang="json" locale="es-ES">
{
	"sounds": "Sonidos",
	"settingsSoundsBanner": "Puedes configurar los ajustes de sonido para la reproducción en el cliente.",
	"notUseSound": "Sin sonido",
	"useSoundOnlyWhenActive": "Sonar solo cuando Misskey esté activo",
	"masterVolume": "Volumen principal",
	"sfxLabels": {
		"note": "Notas",
		"noteMy": "Nota (a mí mismo)",
		"notification": "Notificaciones",
		"reaction": "Al seleccionar una reacción",
		"chatMessage": "Mensajes del Chat"
	},
	"default": "Predeterminado",
	"none": "Ninguna",
	"soundSettingsDriveFile": "Usar un archivo de audio en Drive"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"sounds": "Sons",
	"settingsSoundsBanner": "You can configure the sound settings for playback in the client.",
	"notUseSound": "Ne pas émettre de son",
	"useSoundOnlyWhenActive": "Émettre des sons uniquement quand Misskey est active",
	"masterVolume": "Volume principal",
	"sfxLabels": {
		"note": "Nouvelle note",
		"noteMy": "Ma note",
		"notification": "Notifications",
		"reaction": "Lors de la sélection de la réaction",
		"chatMessage": "Chat Messages"
	},
	"default": "Par défaut",
	"none": "Rien",
	"soundSettingsDriveFile": "Utiliser un effet sonore sur le Disque"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"sounds": "Bunyi",
	"settingsSoundsBanner": "You can configure the sound settings for playback in the client.",
	"notUseSound": "Tidak ada keluaran suara",
	"useSoundOnlyWhenActive": "Hanya keluarkan suara jika Misskey sedang aktif",
	"masterVolume": "Master volume",
	"sfxLabels": {
		"note": "Catatan",
		"noteMy": "Catatan (Saya)",
		"notification": "Notifikasi",
		"reaction": "Ketika memilih reaksi",
		"chatMessage": "Obrolan pengguna"
	},
	"default": "Bawaan",
	"none": "Tidak ada",
	"soundSettingsDriveFile": "Menggunakan berkas audio dalam Drive"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"sounds": "Impostazioni suoni",
	"settingsSoundsBanner": "Puoi personalizzare i suoni emessi dagli eventi sul tuo dispositivo.",
	"notUseSound": "Non emettere suoni",
	"useSoundOnlyWhenActive": "Emetti suoni solo quando Misskey è in attività",
	"masterVolume": "Volume principale",
	"sfxLabels": {
		"note": "Nota",
		"noteMy": "Mia nota",
		"notification": "Notifiche",
		"reaction": "Quando seleziono una reazione",
		"chatMessage": "Messaggio di chat"
	},
	"default": "Predefinito",
	"none": "Nessuna",
	"soundSettingsDriveFile": "Suoni del Drive"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"sounds": "サウンド",
	"settingsSoundsBanner": "クライアントで再生するサウンドの設定が行えます。",
	"notUseSound": "サウンドを出力しない",
	"useSoundOnlyWhenActive": "Misskeyがアクティブな時のみサウンドを出力する",
	"masterVolume": "マスター音量",
	"sfxLabels": {
		"note": "ノート",
		"noteMy": "ノート(自分)",
		"notification": "通知",
		"reaction": "リアクション選択時",
		"chatMessage": "ダイレクトメッセージ"
	},
	"default": "デフォルト",
	"none": "なし",
	"soundSettingsDriveFile": "ドライブの音声を使用"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"sounds": "音",
	"settingsSoundsBanner": "クライアントで流すサウンドの設定ができるで。",
	"notUseSound": "音出さへん",
	"useSoundOnlyWhenActive": "Misskeyがアクティブなときだけ音出す",
	"masterVolume": "全体のやかましさ",
	"sfxLabels": {
		"note": "ノート",
		"noteMy": "ノート(自分)",
		"notification": "通知",
		"reaction": "ツッコミ選んどるとき",
		"chatMessage": "チャットしよか"
	},
	"default": "デフォルト",
	"none": "なし",
	"soundSettingsDriveFile": "ドライブん中の音使う"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"sounds": "Sounds",
	"settingsSoundsBanner": "You can configure the sound settings for playback in the client.",
	"notUseSound": "Disable sound",
	"useSoundOnlyWhenActive": "Output sounds only if Misskey is active",
	"masterVolume": "Master volume",
	"sfxLabels": {
		"note": "New note",
		"noteMy": "Own note",
		"notification": "Ilɣuyen",
		"reaction": "On choosing a reaction",
		"chatMessage": "Chat Messages"
	},
	"default": "Default",
	"none": "None",
	"soundSettingsDriveFile": "Use an audio file in Drive."
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"sounds": "Sounds",
	"settingsSoundsBanner": "You can configure the sound settings for playback in the client.",
	"notUseSound": "Disable sound",
	"useSoundOnlyWhenActive": "Output sounds only if Misskey is active",
	"masterVolume": "Master volume",
	"sfxLabels": {
		"note": "New note",
		"noteMy": "Own note",
		"notification": "ಅಧಿಸೂಚನೆಗಳು",
		"reaction": "On choosing a reaction",
		"chatMessage": "Chat Messages"
	},
	"default": "Default",
	"none": "None",
	"soundSettingsDriveFile": "Use an audio file in Drive."
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"sounds": "소리",
	"settingsSoundsBanner": "클라이언트에서 재생할 소리에 대한 설정을 합니다.",
	"notUseSound": "음소거 하기",
	"useSoundOnlyWhenActive": "Misskey를 활성화한 때에만 소리를 출력하기",
	"masterVolume": "마스터 볼륨",
	"sfxLabels": {
		"note": "새 노트",
		"noteMy": "내 노트",
		"notification": "알림",
		"reaction": "리액션 선택",
		"chatMessage": "채팅 메시지"
	},
	"default": "기본값",
	"none": "없음",
	"soundSettingsDriveFile": "드라이브에 있는 오디오를 사용"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"sounds": "Geluiden",
	"settingsSoundsBanner": "You can configure the sound settings for playback in the client.",
	"notUseSound": "Geluid uitschakelen",
	"useSoundOnlyWhenActive": "Geluid alleen inschakelen wanneer Misskey actief is",
	"masterVolume": "Hoofdvolume",
	"sfxLabels": {
		"note": "Notities",
		"noteMy": "Own note",
		"notification": "Meldingen",
		"reaction": "On choosing a reaction",
		"chatMessage": "Chat Messages"
	},
	"default": "Standaard",
	"none": "Niets",
	"soundSettingsDriveFile": "Use an audio file in Drive."
}
</locale>

<locale lang="json" locale="no-NO">
{
	"sounds": "Sounds",
	"settingsSoundsBanner": "You can configure the sound settings for playback in the client.",
	"notUseSound": "Disable sound",
	"useSoundOnlyWhenActive": "Output sounds only if Misskey is active",
	"masterVolume": "Master volume",
	"sfxLabels": {
		"note": "Notes",
		"noteMy": "Own note",
		"notification": "Varsler",
		"reaction": "On choosing a reaction",
		"chatMessage": "Chat Messages"
	},
	"default": "Standard",
	"none": "Ingen",
	"soundSettingsDriveFile": "Use an audio file in Drive."
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"sounds": "Dźwięk",
	"settingsSoundsBanner": "You can configure the sound settings for playback in the client.",
	"notUseSound": "Wyłącz dźwięk",
	"useSoundOnlyWhenActive": "Puszczaj dźwięki tylko, gdy Misskey jest aktywne.",
	"masterVolume": "Głośność główna",
	"sfxLabels": {
		"note": "Wpisy",
		"noteMy": "Mój wpis",
		"notification": "Powiadomienia",
		"reaction": "On choosing a reaction",
		"chatMessage": "Chat Messages"
	},
	"default": "Domyślne",
	"none": "Brak",
	"soundSettingsDriveFile": "Use an audio file in Drive."
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"sounds": "Sons",
	"settingsSoundsBanner": "Você pode configurar a reprodução de sons no cliente.",
	"notUseSound": "Desabilitar som",
	"useSoundOnlyWhenActive": "Apenas reproduzir sons quando Misskey estiver aberto.",
	"masterVolume": "volume principal",
	"sfxLabels": {
		"note": "Posts",
		"noteMy": "Própria nota",
		"notification": "Notificações",
		"reaction": "Ao selecionar uma reação",
		"chatMessage": "Mensagens em Conversas"
	},
	"default": "Predefinição",
	"none": "Nenhum",
	"soundSettingsDriveFile": "Usar um arquivo de áudio do Drive."
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"sounds": "Звуки",
	"settingsSoundsBanner": "You can configure the sound settings for playback in the client.",
	"notUseSound": "Выключить звук",
	"useSoundOnlyWhenActive": "Воспроизводить звук только когда Misskey активен.",
	"masterVolume": "Основная регулировка громкости",
	"sfxLabels": {
		"note": "Заметки",
		"noteMy": "Собственные заметки",
		"notification": "Уведомления",
		"reaction": "При выборе реакции",
		"chatMessage": "Открыть личные сообщения"
	},
	"default": "По умолчанию",
	"none": "Ничего",
	"soundSettingsDriveFile": "Использовать аудиофайл с Диска."
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"sounds": "Zvuky",
	"settingsSoundsBanner": "You can configure the sound settings for playback in the client.",
	"notUseSound": "Disable sound",
	"useSoundOnlyWhenActive": "Output sounds only if Misskey is active",
	"masterVolume": "Celková hlasitosť",
	"sfxLabels": {
		"note": "Poznámky",
		"noteMy": "Vlastná poznámka",
		"notification": "Oznámenia",
		"reaction": "On choosing a reaction",
		"chatMessage": "Chat Messages"
	},
	"default": "Predvolené",
	"none": "Žiadne",
	"soundSettingsDriveFile": "Use an audio file in Drive."
}
</locale>

<locale lang="json" locale="th-TH">
{
	"sounds": "เสียง",
	"settingsSoundsBanner": "สามารถตั้งค่าเสียงที่จะเล่นบนไคลเอนต์ได้",
	"notUseSound": "ไม่ใช้เสียง",
	"useSoundOnlyWhenActive": "มีเสียงออกเฉพาะตอนกำลังใช้ Misskey อยู่เท่านั้น",
	"masterVolume": "ระดับเสียงหลัก",
	"sfxLabels": {
		"note": "โน้ต",
		"noteMy": "โน้ตของตัวเอง",
		"notification": "การเเจ้งเตือน",
		"reaction": "เมื่อเลือกรีแอคชั่น",
		"chatMessage": "ข้อความของแชต"
	},
	"default": "ค่าเริ่มต้น",
	"none": "ไม่มี",
	"soundSettingsDriveFile": "ใช้เสียงจากไดรฟ์"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"sounds": "Sesler",
	"settingsSoundsBanner": "İstemcide oynatma için ses ayarlarını yapılandırabilirsin.",
	"notUseSound": "Sesi kapat",
	"useSoundOnlyWhenActive": "Misskey etkin olduğunda ses çıkarılır.",
	"masterVolume": "Ana ses seviyesi",
	"sfxLabels": {
		"note": "Yeni not",
		"noteMy": "Kendi notu",
		"notification": "Bildirimler",
		"reaction": "Reaksiyon seçimi hakkında",
		"chatMessage": "Sohbet Mesajları"
	},
	"default": "Varsayılan",
	"none": "Hiçbiri",
	"soundSettingsDriveFile": "Drive'da bir ses dosyası kullanın."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"sounds": "Sounds",
	"settingsSoundsBanner": "You can configure the sound settings for playback in the client.",
	"notUseSound": "Disable sound",
	"useSoundOnlyWhenActive": "Output sounds only if Misskey is active",
	"masterVolume": "Master volume",
	"sfxLabels": {
		"note": "New note",
		"noteMy": "Own note",
		"notification": "Notifications",
		"reaction": "On choosing a reaction",
		"chatMessage": "Chat Messages"
	},
	"default": "Default",
	"none": "None",
	"soundSettingsDriveFile": "Use an audio file in Drive."
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"sounds": "Звуки",
	"settingsSoundsBanner": "Ви можете змінювати налаштування звукових ефектів для відтворення у клієнті.",
	"notUseSound": "Вимкнути звук",
	"useSoundOnlyWhenActive": "Відтворювати звуки лише коли Misskey активний",
	"masterVolume": "Загальна гучність",
	"sfxLabels": {
		"note": "Нотатки",
		"noteMy": "Мої нотатки",
		"notification": "Сповіщення",
		"reaction": "On choosing a reaction",
		"chatMessage": "Написати цьому користувачу"
	},
	"default": "За умовчанням",
	"none": "Відсутній",
	"soundSettingsDriveFile": "Use an audio file in Drive."
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"sounds": "Âm thanh",
	"settingsSoundsBanner": "You can configure the sound settings for playback in the client.",
	"notUseSound": "Tắt tiếng",
	"useSoundOnlyWhenActive": "Chỉ phát âm thanh khi Misskey đang được hiển thị",
	"masterVolume": "Âm thanh chung",
	"sfxLabels": {
		"note": "Tút",
		"noteMy": "Tút của tôi",
		"notification": "Thông báo",
		"reaction": "On choosing a reaction",
		"chatMessage": "Chat Messages"
	},
	"default": "Mặc định",
	"none": "Không",
	"soundSettingsDriveFile": "Use an audio file in Drive."
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"sounds": "提示音",
	"settingsSoundsBanner": "可在此设置客户端播放的声音。",
	"notUseSound": "静音",
	"useSoundOnlyWhenActive": "仅在使用 Misskey 时发出音效",
	"masterVolume": "主音量",
	"sfxLabels": {
		"note": "帖子",
		"noteMy": "发帖",
		"notification": "通知",
		"reaction": "添加回应",
		"chatMessage": "私信"
	},
	"default": "默认",
	"none": "无",
	"soundSettingsDriveFile": "使用网盘内的音频"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"sounds": "音效",
	"settingsSoundsBanner": "您可以調整用戶端播放的聲音設定。",
	"notUseSound": "關閉音效",
	"useSoundOnlyWhenActive": "僅在 Misskey 於前景運作時發出音效",
	"masterVolume": "主音量",
	"sfxLabels": {
		"note": "貼文",
		"noteMy": "我的貼文",
		"notification": "通知",
		"reaction": "選擇反應時",
		"chatMessage": "聊天訊息"
	},
	"default": "預設",
	"none": "無",
	"soundSettingsDriveFile": "使用雲端硬碟的音效檔案"
}
</locale>
