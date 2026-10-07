<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/profile" :label="$locale.sfc.profile" :keywords="['profile']" icon="ti ti-user">
	<div class="_gaps_m">
		<div class="_panel">
			<div :class="$style.banner" :style="{ backgroundImage: $i.bannerUrl ? `url(${ $i.bannerUrl })` : '' }">
				<div :class="$style.bannerEdit">
					<SearchMarker :keywords="['banner', 'change']">
						<MkButton primary rounded @click="changeBanner"><SearchLabel>{{ $locale.sfc.changeBanner }}</SearchLabel></MkButton>
					</SearchMarker>
				</div>
			</div>
			<div :class="$style.avatarContainer">
				<MkAvatar :class="$style.avatar" :user="$i" forceShowDecoration @click="changeAvatar"/>
				<div class="_buttonsCenter">
					<SearchMarker :keywords="['avatar', 'icon', 'change']">
						<MkButton primary rounded @click="changeAvatar"><SearchLabel>{{ $locale.sfc.changeAvatar }}</SearchLabel></MkButton>
					</SearchMarker>
					<MkButton primary rounded type="routerLink" to="/settings/avatar-decoration">{{ $locale.sfc.decorate }} <i class="ti ti-sparkles"></i></MkButton>
				</div>
			</div>
		</div>

		<SearchMarker :keywords="['name']">
			<MkInput v-model="profile.name" :max="30" manualSave :mfmAutocomplete="['emoji']">
				<template #label><SearchLabel>{{ $locale.sfc.name }}</SearchLabel></template>
			</MkInput>
		</SearchMarker>

		<SearchMarker :keywords="['description', 'bio']">
			<MkTextarea v-model="profile.description" :max="500" tall manualSave mfmAutocomplete :mfmPreview="true">
				<template #label><SearchLabel>{{ $locale.sfc.description }}</SearchLabel></template>
				<template #caption>{{ $locale.sfc.youCanIncludeHashtags }}</template>
			</MkTextarea>
		</SearchMarker>

		<SearchMarker :keywords="['location', 'locale']">
			<MkInput v-model="profile.location" manualSave>
				<template #label><SearchLabel>{{ $locale.sfc.location }}</SearchLabel></template>
				<template #prefix><i class="ti ti-map-pin"></i></template>
			</MkInput>
		</SearchMarker>

		<SearchMarker :keywords="['birthday', 'birthdate', 'age']">
			<MkInput v-model="profile.birthday" type="date" manualSave>
				<template #label><SearchLabel>{{ $locale.sfc.birthday }}</SearchLabel></template>
				<template #prefix><i class="ti ti-cake"></i></template>
			</MkInput>
		</SearchMarker>

		<SearchMarker :keywords="['language', 'locale']">
			<MkSelect v-model="profile.lang" :items="Object.entries(langmap).map(([code, def]) => ({ label: def.nativeName, value: code }))">
				<template #label><SearchLabel>{{ $locale.sfc.language }}</SearchLabel></template>
			</MkSelect>
		</SearchMarker>

		<SearchMarker :keywords="['metadata']">
			<FormSlot>
				<MkFolder>
					<template #icon><i class="ti ti-list"></i></template>
					<template #label><SearchLabel>{{ $locale.sfc.metadataEdit }}</SearchLabel></template>
					<template #footer>
						<div class="_buttons">
							<MkButton primary @click="saveFields"><i class="ti ti-check"></i> {{ $locale.sfc.save }}</MkButton>
							<MkButton :disabled="fields.length >= 16" @click="addField"><i class="ti ti-plus"></i> {{ $locale.sfc.add }}</MkButton>
							<MkButton v-if="!fieldEditMode" :disabled="fields.length <= 1" danger @click="fieldEditMode = !fieldEditMode"><i class="ti ti-trash"></i> {{ $locale.sfc.delete }}</MkButton>
							<MkButton v-else @click="fieldEditMode = !fieldEditMode"><i class="ti ti-arrows-sort"></i> {{ $locale.sfc.rearrange }}</MkButton>
						</div>
					</template>

					<div :class="$style.metadataRoot" class="_gaps_s">
						<MkInfo>{{ $locale.sfc.verifiedLinkDescription }}</MkInfo>

						<MkDraggable
							v-model="fields"
							direction="vertical"
							withGaps
							manualDragStart
						>
							<template #default="{ item, dragStart }">
								<div v-panel :class="$style.fieldDragItem">
									<button v-if="!fieldEditMode" class="_button" :class="$style.dragItemHandle" tabindex="-1" :draggable="true" @dragstart.stop="dragStart"><i class="ti ti-menu"></i></button>
									<button v-if="fieldEditMode" :disabled="fields.length <= 1" class="_button" :class="$style.dragItemRemove" @click="deleteField(item.id)"><i class="ti ti-x"></i></button>
									<div :class="$style.dragItemForm">
										<FormSplit :minWidth="200">
											<MkInput v-model="item.name" small :placeholder="$locale.sfc.metadataLabel">
											</MkInput>
											<MkInput v-model="item.value" small :placeholder="$locale.sfc.metadataContent">
											</MkInput>
										</FormSplit>
									</div>
								</div>
							</template>
						</MkDraggable>
					</div>
				</MkFolder>
				<template #caption>{{ $locale.sfc.metadataDescription }}</template>
			</FormSlot>
		</SearchMarker>

		<SearchMarker :keywords="['follow', 'message']">
			<MkInput v-model="profile.followedMessage" :max="200" manualSave :mfmPreview="false">
				<template #label><SearchLabel>{{ $locale.sfc.followedMessage }}</SearchLabel></template>
				<template #caption>
					<div><SearchText>{{ $locale.sfc.followedMessageDescription }}</SearchText></div>
					<div>{{ $locale.sfc.followedMessageDescriptionForLockedAccount }}</div>
				</template>
			</MkInput>
		</SearchMarker>

		<SearchMarker :keywords="['reaction']">
			<MkSelect
				v-model="reactionAcceptance"
				:items="[
					{ label: $locale.sfc.all, value: null },
					{ label: $locale.sfc.likeOnlyForRemote, value: 'likeOnlyForRemote' },
					{ label: $locale.sfc.nonSensitiveOnly, value: 'nonSensitiveOnly' },
					{ label: $locale.sfc.nonSensitiveOnlyForLocalLikeOnlyForRemote, value: 'nonSensitiveOnlyForLocalLikeOnlyForRemote' },
					{ label: $locale.sfc.likeOnly, value: 'likeOnly' },
				]"
			>
				<template #label><SearchLabel>{{ $locale.sfc.reactionAcceptance }}</SearchLabel></template>
			</MkSelect>
		</SearchMarker>

		<SearchMarker>
			<MkFolder>
				<template #label><SearchLabel>{{ $locale.sfc.advancedSettings }}</SearchLabel></template>

				<div class="_gaps_m">
					<SearchMarker :keywords="['cat']">
						<MkSwitch v-model="profile.isCat">
							<template #label><SearchLabel>{{ $locale.sfc.flagAsCat }}</SearchLabel></template>
							<template #caption>{{ $locale.sfc.flagAsCatDescription }}</template>
						</MkSwitch>
					</SearchMarker>

					<SearchMarker :keywords="['bot']">
						<MkSwitch v-model="profile.isBot">
							<template #label><SearchLabel>{{ $locale.sfc.flagAsBot }}</SearchLabel></template>
							<template #caption>{{ $locale.sfc.flagAsBotDescription }}</template>
						</MkSwitch>
					</SearchMarker>
				</div>
			</MkFolder>
		</SearchMarker>

		<hr>

		<SearchMarker :keywords="['qrcode']">
			<FormLink to="/qr">
				<template #icon><i class="ti ti-qrcode"></i></template>
				<SearchLabel>{{ $locale.sfc.qr }}</SearchLabel>
			</FormLink>
		</SearchMarker>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import FormSplit from '@features/ui/frontend/components/form/split.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import FormSlot from '@features/ui/frontend/components/form/slot.vue';
import FormLink from '@features/ui/frontend/components/form/link.vue';
import MkDraggable from '@features/ui/frontend/components/MkDraggable.vue';
import { chooseDriveFile } from '@features/drive/frontend/utility/drive.js';
import * as os from '@features/ui/frontend/os.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import { langmap } from '@features/web/frontend/utility/langmap.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { claimAchievement } from '@features/users/frontend/utility/achievements.js';
import { store } from '@features/preferences/frontend/store.js';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import { genId } from '@features/runtime/frontend/utility/id.js';

const $i = ensureSignin();

const reactionAcceptance = store.model('reactionAcceptance');

function assertVaildLang(lang: string | null): lang is keyof typeof langmap {
	return lang != null && lang in langmap;
}

const profile = reactive({
	name: $i.name,
	description: $i.description,
	followedMessage: $i.followedMessage,
	location: $i.location,
	birthday: $i.birthday,
	lang: assertVaildLang($i.lang) ? $i.lang : null,
	isBot: $i.isBot ?? false,
	isCat: $i.isCat ?? false,
});

watch(() => profile, () => {
	save();
}, {
	deep: true,
});

const fields = ref($i.fields.map(field => ({ id: genId(), name: field.name, value: field.value })) ?? []);
const fieldEditMode = ref(false);

function addField() {
	fields.value.push({
		id: genId(),
		name: '',
		value: '',
	});
}

while (fields.value.length < 4) {
	addField();
}

function deleteField(itemId: string) {
	fields.value = fields.value.filter(f => f.id !== itemId);
}

function saveFields() {
	os.apiWithDialog('i/update', {
		fields: fields.value.filter(field => field.name !== '' && field.value !== '').map(field => ({ name: field.name, value: field.value })),
	});
}

function save() {
	os.apiWithDialog('i/update', {
		// 空文字列をnullにしたいので??は使うな
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		name: profile.name || null,
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		description: profile.description || null,
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		followedMessage: profile.followedMessage || null,
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		location: profile.location || null,
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		birthday: profile.birthday || null,
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		lang: profile.lang || null,
		isBot: !!profile.isBot,
		isCat: !!profile.isCat,
	}, undefined, {
		'0b3f9f6a-2f4d-4b1f-9fb4-49d3a2fd7191': {
			title: $locale.value.sfc.yourNameContainsProhibitedWords,
			text: $locale.value.sfc.yourNameContainsProhibitedWordsDescription,
		},
	});
	claimAchievement('profileFilled');
	if (profile.name === 'syuilo' || profile.name === 'しゅいろ') {
		claimAchievement('setNameToSyuilo');
	}
	if (profile.isCat) {
		claimAchievement('markedAsCat');
	}
}

function changeAvatar(ev: PointerEvent) {
	async function done(driveFile: Misskey.entities.DriveFile) {
		const i = await os.apiWithDialog('i/update', {
			avatarId: driveFile.id,
		});
		$i.avatarId = i.avatarId;
		$i.avatarUrl = i.avatarUrl;
		claimAchievement('profileFilled');
	}

	os.popupMenu([{
		text: $locale.value.sfc.avatar,
		type: 'label',
	}, {
		text: $locale.value.sfc.upload,
		icon: 'ti ti-upload',
		action: async () => {
			const files = await os.chooseFileFromPc({ multiple: false });
			const file = files[0];

			let originalOrCropped = file;

			const { canceled } = await os.confirm({
				type: 'question',
				text: $locale.value.sfc.cropImageAsk,
				okText: $locale.value.sfc.cropYes,
				cancelText: $locale.value.sfc.cropNo,
			});

			if (!canceled) {
				originalOrCropped = await os.cropImageFile(file, {
					aspectRatio: 1,
				});
			}

			const driveFile = (await os.launchUploader([originalOrCropped], { multiple: false }))[0];
			done(driveFile);
		},
	}, {
		text: $locale.value.sfc.fromDrive,
		icon: 'ti ti-cloud',
		action: () => {
			chooseDriveFile({ multiple: false }).then(files => {
				done(files[0]);
			});
		},
	}], ev.currentTarget ?? ev.target);
}

function changeBanner(ev: PointerEvent) {
	async function done(driveFile: Misskey.entities.DriveFile) {
		const i = await os.apiWithDialog('i/update', {
			bannerId: driveFile.id,
		});
		$i.bannerId = i.bannerId;
		$i.bannerUrl = i.bannerUrl;
	}

	os.popupMenu([{
		text: $locale.value.sfc.banner,
		type: 'label',
	}, {
		text: $locale.value.sfc.upload,
		icon: 'ti ti-upload',
		action: async () => {
			const files = await os.chooseFileFromPc({ multiple: false });
			const file = files[0];

			let originalOrCropped = file;

			const { canceled } = await os.confirm({
				type: 'question',
				text: $locale.value.sfc.cropImageAsk,
				okText: $locale.value.sfc.cropYes,
				cancelText: $locale.value.sfc.cropNo,
			});

			if (!canceled) {
				originalOrCropped = await os.cropImageFile(file, {
					aspectRatio: 2,
				});
			}

			const driveFile = (await os.launchUploader([originalOrCropped], { multiple: false }))[0];
			done(driveFile);
		},
	}, {
		text: $locale.value.sfc.fromDrive,
		icon: 'ti ti-cloud',
		action: () => {
			chooseDriveFile({ multiple: false }).then(files => {
				done(files[0]);
			});
		},
	}], ev.currentTarget ?? ev.target);
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.profile,
	icon: 'ti ti-user',
}));
</script>

<style lang="scss" module>
.banner {
	position: relative;
	height: 130px;
	background-size: cover;
	background-position: center;
	border-bottom: solid 1px var(--MI_THEME-divider);
	overflow: clip;
}

.avatarContainer {
	margin-top: -50px;
	padding-bottom: 16px;
	text-align: center;
}

.avatar {
	display: inline-block;
	width: 72px;
	height: 72px;
	margin: 0 auto 16px auto;
}

.bannerEdit {
	position: absolute;
	top: 16px;
	right: 16px;
}

.metadataRoot {
	container-type: inline-size;
}

.fieldDragItem {
	display: flex;
	padding: 10px;
	align-items: flex-end;
	border-radius: 6px;

	/* (drag button) 32px + (drag button margin) 8px + (input width) 200px * 2 + (input gap) 12px = 452px */
	@container (max-width: 452px) {
		align-items: center;
	}
}

.dragItemHandle {
	cursor: grab;
	width: 32px;
	height: 32px;
	margin: 0 8px 0 0;
	opacity: 0.5;
	flex-shrink: 0;

	&:active {
		cursor: grabbing;
	}
}

.dragItemRemove {
	@extend .dragItemHandle;

	color: #ff2a2a;
	opacity: 1;
	cursor: pointer;

	&:hover, &:focus {
		opacity: .7;
	}

	&:active {
		cursor: pointer;
	}
}

.dragItemForm {
	flex-grow: 1;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"avatar": "الصورة الرمزية",
	"upload": "ارفع",
	"cropImageAsk": "أتريد اقتصاص هذه الصورة",
	"cropYes": "اقتص",
	"cropNo": "استخدمها كما هي",
	"fromDrive": "من المخزن",
	"banner": "الصورة الرأسية",
	"profile": "الملف التعريفي",
	"changeBanner": "غيّر اللافتة",
	"changeAvatar": "غيّر الصورة الرمزية",
	"decorate": "Decorate",
	"name": "الإسم",
	"description": "السيرة",
	"youCanIncludeHashtags": "يمكنك أيضًا إضافة وسوم إلى سيرتك التعريفية.",
	"location": "الموقع الجغرافي",
	"birthday": "تاريخ الميلاد",
	"language": "اللغة",
	"metadataEdit": "عدّل المعلومات الإضافية",
	"save": "حفظ",
	"add": "إضافة",
	"delete": "حذف",
	"rearrange": "أعد الترتيب",
	"verifiedLinkDescription": "By entering an URL that contains a link to your profile here, an ownership verification icon can be displayed next to the field.",
	"metadataLabel": "التسمية",
	"metadataContent": "المحتوى",
	"metadataDescription": "يُمكنك عرض 4 حقول معلومات في ملفك الشخصي",
	"followedMessage": "Message when you are followed",
	"followedMessageDescription": "You can set a short message to be displayed to the recipient when they follow you.",
	"followedMessageDescriptionForLockedAccount": "If you have set up that follow requests require approval, this will be displayed when you grant a follow request.",
	"all": "الكل",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Only likes",
	"reactionAcceptance": "قبول التفاعلات",
	"advancedSettings": "إعدادات متقدمة",
	"flagAsCat": "علّم هذا الحساب كحساب قط",
	"flagAsCatDescription": "فعّل هذا الخيار لوضع علامة على الحساب لتوضيح أنه حساب قط.",
	"flagAsBot": "علّمه كحساب آلي",
	"flagAsBotDescription": "فعّل هذا الخيار إذا كان هذا الحساب يُدار عبر برمجية. إذا فُعل فسيكون بمثابة علامة للمطورين الآخرين لتجنب سلاسل لا متناهية من التفاعل بين حسابات الآلية وضبط أنظمة ميسكي للتعامل مع هذا الحساب كآلي.",
	"qr": "QR Code"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"yourNameContainsProhibitedWords": "El nom conté paraules prohibides ",
	"yourNameContainsProhibitedWordsDescription": "Si de veritat vols fer servir aquest nom posat en contacte amb l'administrador.",
	"avatar": "Icona",
	"upload": "Puja",
	"cropImageAsk": "Vols retallar la imatge?",
	"cropYes": "Retallar",
	"cropNo": "Fer servir tal qual",
	"fromDrive": "Des del Disc",
	"banner": "Bàner",
	"profile": "Perfil",
	"changeBanner": "Canviar el bàner ",
	"changeAvatar": "Canviar l'avatar ",
	"decorate": "Decorar",
	"name": "Nom",
	"description": "Biografia ",
	"youCanIncludeHashtags": "Pots posar etiquetes a la teva biografia ",
	"location": "Ubicació",
	"birthday": "Aniversari",
	"language": "Idioma",
	"metadataEdit": "Editar la informació adicional ",
	"save": "Desa",
	"add": "Afegir",
	"delete": "Elimina",
	"rearrange": "Torna a ordenar",
	"verifiedLinkDescription": "Escrivint una adreça URL que enllaci a aquest perfil, una icona de propietat verificada es mostrarà al costat del camp.",
	"metadataLabel": "Etiqueta ",
	"metadataContent": "Contingut",
	"metadataDescription": "Amb això podràs mostrar camps d'informació adicional al teu perfil.",
	"followedMessage": "Missatge als nous seguidors",
	"followedMessageDescription": "Es pot configurar un missatge curt que es mostra a l'altra persona quan comença a seguir-te.",
	"followedMessageDescriptionForLockedAccount": "Si comencen a seguir-te es mostra un missatge de quan es permet aquesta sol·licitud. ",
	"all": "Tot",
	"likeOnlyForRemote": "Tot (només m'agraden d'instàncies remotes)",
	"nonSensitiveOnly": "Només sense contingut sensible",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Només contingut no sensible (Només m'agraden d'instàncies remotes)",
	"likeOnly": "Només m'agraden ",
	"reactionAcceptance": "Acceptació de reaccions ",
	"advancedSettings": "Configuració avançada",
	"flagAsCat": "Marca aquest compte com a gat",
	"flagAsCatDescription": "Activeu aquesta opció per marcar aquest compte com a gat.",
	"flagAsBot": "Marca aquest compte com a bot",
	"flagAsBotDescription": "Activa aquesta opció si el compte el controla un programa. Si s'activa, actuarà com un senyal per altres desenvolupadors per prevenir cadenes d'interacció sense fi i ajustar els paràmetres interns de Misskey pe tractar el compte com un bot.",
	"qr": "Codi QR"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"avatar": "Avatar",
	"upload": "Nahrát soubory",
	"cropImageAsk": "Chcete oříznout tenhle obrázek?",
	"cropYes": "Uříznout",
	"cropNo": "Použít tak jak je",
	"fromDrive": "Z disku",
	"banner": "Baner",
	"profile": "Váš profil",
	"changeBanner": "Změnit banner",
	"changeAvatar": "Změnit avatara",
	"decorate": "Decorate",
	"name": "Jméno",
	"description": "O mně",
	"youCanIncludeHashtags": "V popisku o Vás můžete použít i hastagy.",
	"location": "Lokace",
	"birthday": "Datum narození",
	"language": "Jazyk",
	"metadataEdit": "Upravit doplňující informace",
	"save": "Uložit",
	"add": "Přidat",
	"delete": "Smazat",
	"rearrange": "Přeřadit",
	"verifiedLinkDescription": "By entering an URL that contains a link to your profile here, an ownership verification icon can be displayed next to the field.",
	"metadataLabel": "Popisek",
	"metadataContent": "Obsah",
	"metadataDescription": "Pomocí nich můžete ve svém profilu zobrazit doplňující informační pole.",
	"followedMessage": "Message when you are followed",
	"followedMessageDescription": "You can set a short message to be displayed to the recipient when they follow you.",
	"followedMessageDescriptionForLockedAccount": "If you have set up that follow requests require approval, this will be displayed when you grant a follow request.",
	"all": "Vše",
	"likeOnlyForRemote": "Všechny (Pouze \"oblíbené\" pro vzdálenou instanci)",
	"nonSensitiveOnly": "Pouze bez citlivých medií",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Pouze bez citlivých medií (Pouze vzdálený \"oblíbený\")",
	"likeOnly": "Jenom \"oblíbené\"",
	"reactionAcceptance": "Přijímání reakcí",
	"advancedSettings": "Pokročilá nastavení",
	"flagAsCat": "Tenhle účet je kočka",
	"flagAsCatDescription": "Vyberte tuto možnost aby tento účet byl označen jako kočka.",
	"flagAsBot": "Tento účet je bot",
	"flagAsBotDescription": "Pokud je tento účet kontrolován programem zaškrtněte tuto možnost. To označí tento účet jako bot pro ostatní vývojáře a zabrání tak nekonečným interakcím s ostatními boty a upraví Misskey systém aby se choval k tomuhle účtu jako bot.",
	"qr": "QR Code"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"avatar": "Avatar",
	"upload": "Upload",
	"cropImageAsk": "Do you want to crop this image?",
	"cropYes": "Crop",
	"cropNo": "Use as-is",
	"fromDrive": "From Drive",
	"banner": "Banner",
	"profile": "Profile",
	"changeBanner": "Change banner",
	"changeAvatar": "Change avatar",
	"decorate": "Decorate",
	"name": "Name",
	"description": "Bio",
	"youCanIncludeHashtags": "You can also include hashtags in your bio.",
	"location": "Location",
	"birthday": "Birthday",
	"language": "Language",
	"metadataEdit": "Edit additional Information",
	"save": "Save",
	"add": "Add",
	"delete": "Delete",
	"rearrange": "Rearrange",
	"verifiedLinkDescription": "By entering an URL that contains a link to your profile here, an ownership verification icon can be displayed next to the field.",
	"metadataLabel": "Label",
	"metadataContent": "Content",
	"metadataDescription": "Using these, you can display additional information fields in your profile.",
	"followedMessage": "Message when you are followed",
	"followedMessageDescription": "You can set a short message to be displayed to the recipient when they follow you.",
	"followedMessageDescriptionForLockedAccount": "If you have set up that follow requests require approval, this will be displayed when you grant a follow request.",
	"all": "All",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Only likes",
	"reactionAcceptance": "Reaction Acceptance",
	"advancedSettings": "Advanced settings",
	"flagAsCat": "Mark this account as a cat",
	"flagAsCatDescription": "Enable this option to mark this account as a cat.",
	"flagAsBot": "Mark this account as a bot",
	"flagAsBotDescription": "Enable this option if this account is controlled by a program. If enabled, it will act as a flag for other developers to prevent endless interaction chains with other bots and adjust Misskey's internal systems to treat this account as a bot.",
	"qr": "QR Code"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"yourNameContainsProhibitedWords": "Dein Name enthält einen verbotenen Begriff",
	"yourNameContainsProhibitedWordsDescription": "Der Name enthält eine verbotene Zeichenfolge. Wende dich an deinen Serveradministrator, wenn du diesen Namen verwenden möchtest.",
	"avatar": "Profilbild",
	"upload": "Hochladen",
	"cropImageAsk": "Möchtest du das Bild zuschneiden?",
	"cropYes": "Zuschneiden",
	"cropNo": "Unbearbeitet verwenden",
	"fromDrive": "Aus Drive",
	"banner": "Banner",
	"profile": "Profil",
	"changeBanner": "Banner ändern",
	"changeAvatar": "Profilbild ändern",
	"decorate": "Dekorieren",
	"name": "Name",
	"description": "Profilbeschreibung",
	"youCanIncludeHashtags": "Du kannst auch Hashtags in deiner Profilbeschreibung verwenden.",
	"location": "Ort",
	"birthday": "Geburtstag",
	"language": "Sprache",
	"metadataEdit": "Zusätzliche Informationen bearbeiten",
	"save": "Speichern",
	"add": "Hinzufügen",
	"delete": "Löschen",
	"rearrange": "Sortieren",
	"verifiedLinkDescription": "Gibst du hier eine URL ein, die einen Link zu deinem Profile enthält, wird neben diesem Feld ein Icon zur Besitzbestätigung angezeigt.",
	"metadataLabel": "Beschriftung",
	"metadataContent": "Inhalt",
	"metadataDescription": "Hierdurch kannst du auf deinem Profil zusätzliche Informationsblöcke anzeigen lassen.",
	"followedMessage": "Nachricht, wenn dir jemand folgt",
	"followedMessageDescription": "Du kannst eine kurze Nachricht festlegen, die dem Empfänger angezeigt wird, wenn er dir folgt.",
	"followedMessageDescriptionForLockedAccount": "Wenn Folgeanfragen deine Genehmigung brauchen, wird dies beim Genehmigen einer Anfrage angezeigt.",
	"all": "Alle",
	"likeOnlyForRemote": "Alle (Nur \"Gefällt mir\" für fremde Instanzen)",
	"nonSensitiveOnly": "Keine Sensitiven",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Keine Sensitiven (Nur \"Gefällt mir\" von fremden Instanzen)",
	"likeOnly": "Nur \"Gefällt mir\"",
	"reactionAcceptance": "Reaktionsannahme",
	"advancedSettings": "Erweiterte Einstellungen",
	"flagAsCat": "Als Katze markieren",
	"flagAsCatDescription": "Aktiviere diese Option, um dieses Benutzerkonto als Katze zu markieren.",
	"flagAsBot": "Als Bot markieren",
	"flagAsBotDescription": "Aktiviere diese Option, falls dieses Benutzerkonto durch ein Programm gesteuert wird. Falls aktiviert, agiert es als Flag für andere Entwickler zur Verhinderung von endlosen Kettenreaktionen mit anderen Bots und lässt Misskeys interne Systeme dieses Benutzerkonto als Bot behandeln.",
	"qr": "QR-Code"
}
</locale>

<locale locale="en-US" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"avatar": "Avatar",
	"upload": "Upload",
	"cropImageAsk": "Do you want to crop this image?",
	"cropYes": "Crop",
	"cropNo": "Use as-is",
	"fromDrive": "From Drive",
	"banner": "Banner",
	"profile": "Profile",
	"changeBanner": "Change banner",
	"changeAvatar": "Change avatar",
	"decorate": "Decorate",
	"name": "Name",
	"description": "Bio",
	"youCanIncludeHashtags": "You can also include hashtags in your bio.",
	"location": "Location",
	"birthday": "Birthday",
	"language": "Language",
	"metadataEdit": "Edit additional Information",
	"save": "Save",
	"add": "Add",
	"delete": "Delete",
	"rearrange": "Rearrange",
	"verifiedLinkDescription": "By entering an URL that contains a link to your profile here, an ownership verification icon can be displayed next to the field.",
	"metadataLabel": "Label",
	"metadataContent": "Content",
	"metadataDescription": "Using these, you can display additional information fields in your profile.",
	"followedMessage": "Message when you are followed",
	"followedMessageDescription": "You can set a short message to be displayed to the recipient when they follow you.",
	"followedMessageDescriptionForLockedAccount": "If you have set up that follow requests require approval, this will be displayed when you grant a follow request.",
	"all": "All",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Only likes",
	"reactionAcceptance": "Reaction Acceptance",
	"advancedSettings": "Advanced settings",
	"flagAsCat": "Mark this account as a cat",
	"flagAsCatDescription": "Enable this option to mark this account as a cat.",
	"flagAsBot": "Mark this account as a bot",
	"flagAsBotDescription": "Enable this option if this account is controlled by a program. If enabled, it will act as a flag for other developers to prevent endless interaction chains with other bots and adjust Misskey's internal systems to treat this account as a bot.",
	"qr": "QR Code"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"yourNameContainsProhibitedWords": "Tu nombre contiene palabras prohibidas",
	"yourNameContainsProhibitedWordsDescription": "Si deseas usar este nombre, por favor contacta con tu administrador/a de tu servidor",
	"avatar": "Avatar",
	"upload": "Subir",
	"cropImageAsk": "¿Desea recortar la imagen?",
	"cropYes": "Recortar",
	"cropNo": "Usar como está",
	"fromDrive": "Desde el drive",
	"banner": "Banner",
	"profile": "Perfil",
	"changeBanner": "Cambiar banner",
	"changeAvatar": "Cambiar avatar",
	"decorate": "Decorar",
	"name": "Nombre",
	"description": "Descripción",
	"youCanIncludeHashtags": "También puedes incluir hashtags en tu biografía",
	"location": "Ubicación",
	"birthday": "Cumpleaños",
	"language": "Idioma",
	"metadataEdit": "Editar información adicional",
	"save": "Guardar",
	"add": "Agregar",
	"delete": "Borrar",
	"rearrange": "Ordenar",
	"verifiedLinkDescription": "Introduciendo una URL que contiene un enlace a tu perfil, se puede mostrar un icono de verificación de propiedad al lado del campo.",
	"metadataLabel": "Etiqueta",
	"metadataContent": "Contenido",
	"metadataDescription": "Usando esto puedes mostrar campos de información adicionales en tu perfil.",
	"followedMessage": "Mensaje cuando te han seguido",
	"followedMessageDescription": "Puedes establecer un mensaje de bienvenida para nuevos seguidores.",
	"followedMessageDescriptionForLockedAccount": "Si apruebas manualmente seguidores, el mensaje se mostrará al seguidor en el momento de la aprobación.",
	"all": "Todo",
	"likeOnlyForRemote": "Sólo reacciones de instancias remotas",
	"nonSensitiveOnly": "Solo no sensible",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Sólo no contenido sensible (sólo me gusta en remoto)",
	"likeOnly": "Sólo 'me gusta'",
	"reactionAcceptance": "Aceptación de reacciones",
	"advancedSettings": "Configuración avanzada",
	"flagAsCat": "Marcar esta cuenta como gato",
	"flagAsCatDescription": "Activa esta opción para marcar esta cuenta como un gato.",
	"flagAsBot": "Esta cuenta es un bot",
	"flagAsBotDescription": "Activa esta opción si la cuenta es utilizada por un programa. Si se activa, actuará como una etiqueta para otros desarrolladores para prevenir cadenas eternas de interacción con otros bots, y ajustará los sistemas internos de Misskey para tratar esta cuenta de manera acorde.",
	"qr": "Código QR"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"avatar": "Avatar",
	"upload": "Téléverser",
	"cropImageAsk": "Voulez-vous recadrer cette image ?",
	"cropYes": "Rogner",
	"cropNo": "Utiliser en l'état",
	"fromDrive": "Depuis le Disque",
	"banner": "Bannière",
	"profile": "Profil",
	"changeBanner": "Changer de bannière",
	"changeAvatar": "Changer l'avatar",
	"decorate": "Décorer",
	"name": "Nom",
	"description": "À propos de moi",
	"youCanIncludeHashtags": "Vous pouvez également inclure des hashtags.",
	"location": "Localisation",
	"birthday": "Date de naissance",
	"language": "Langue",
	"metadataEdit": "Éditer les informations supplémentaires",
	"save": "Enregistrer",
	"add": "Ajouter",
	"delete": "Supprimer",
	"rearrange": "Trier par",
	"verifiedLinkDescription": "By entering an URL that contains a link to your profile here, an ownership verification icon can be displayed next to the field.",
	"metadataLabel": "Étiquette",
	"metadataContent": "Contenu",
	"metadataDescription": "Vous pouvez afficher jusqu'à quatre informations supplémentaires dans votre profil.",
	"followedMessage": "Message when you are followed",
	"followedMessageDescription": "You can set a short message to be displayed to the recipient when they follow you.",
	"followedMessageDescriptionForLockedAccount": "If you have set up that follow requests require approval, this will be displayed when you grant a follow request.",
	"all": "Tous",
	"likeOnlyForRemote": "Toutes (mentions j'aime seulement pour les instances distantes)",
	"nonSensitiveOnly": "Non sensibles seulement",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non sensibles seulement (mentions j'aime seulement pour les instances distantes)",
	"likeOnly": "Les favoris uniquement",
	"reactionAcceptance": "Acceptation des réactions",
	"advancedSettings": "Paramètres avancés",
	"flagAsCat": "Ce compte est un chat",
	"flagAsCatDescription": "Miaou miaou miaou ?",
	"flagAsBot": "Ce compte est un robot",
	"flagAsBotDescription": "Si ce compte est géré de manière automatisée, choisissez cette option. Si elle est activée, elle agira comme un marqueur pour les autres développeurs afin d'éviter des chaînes d'interaction sans fin avec d'autres robots et d'ajuster les systèmes internes de Misskey pour traiter ce compte comme un robot.",
	"qr": "QR Code"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"yourNameContainsProhibitedWords": "Nama yang ingin dipakai memuat kata terlarang",
	"yourNameContainsProhibitedWordsDescription": "Jika anda ingin menggunakan nama ini, mohon hubungi admin peladen.",
	"avatar": "Avatar",
	"upload": "Unggah",
	"cropImageAsk": "Ingin memotong gambar?",
	"cropYes": "Potong",
	"cropNo": "Gunakan apa adanya",
	"fromDrive": "Dari Drive",
	"banner": "Banner",
	"profile": "Profil",
	"changeBanner": "Ubah header",
	"changeAvatar": "Ubah avatar",
	"decorate": "Dekor",
	"name": "Nama",
	"description": "Bio",
	"youCanIncludeHashtags": "Kamu juga dapat menambahkan tagar ke dalam bio.",
	"location": "Lokasi",
	"birthday": "Tanggal lahir",
	"language": "Bahasa",
	"metadataEdit": "Sunting informasi tambahan",
	"save": "Simpan",
	"add": "Tambahkan",
	"delete": "Hapus",
	"rearrange": "Tata ulang",
	"verifiedLinkDescription": "Dengan memasukkan URL yang mengandung tautan ke profil kamu di sini, ikon verifikasi kepemilikan dapat ditampilkan di sebelah kolom ini.",
	"metadataLabel": "Label",
	"metadataContent": "Isi",
	"metadataDescription": "Kamu dapat menampilkan hingga 4 bagian informasi tambahan ke dalam profilmu.",
	"followedMessage": "Message when you are followed",
	"followedMessageDescription": "You can set a short message to be displayed to the recipient when they follow you.",
	"followedMessageDescriptionForLockedAccount": "If you have set up that follow requests require approval, this will be displayed when you grant a follow request.",
	"all": "Semua",
	"likeOnlyForRemote": "Semua (Hanya suka dari instansi luar)",
	"nonSensitiveOnly": "Hanya non-sensitif",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Hanya non-sensitif (Hanya suka dari instansi luar)",
	"likeOnly": "Hanya suka",
	"reactionAcceptance": "Penerimaan reaksi",
	"advancedSettings": "Pengaturan Lanjut",
	"flagAsCat": "Atur akun ini sebagai kucing",
	"flagAsCatDescription": "Nyalakan tanda ini untuk menandai akun ini sebagai kucing.",
	"flagAsBot": "Atur akun ini sebagai Bot",
	"flagAsBotDescription": "Jika akun ini dikendalikan oleh program, tetapkanlah opsi ini. Jika diaktifkan, ini akan berfungsi sebagai tanda bagi pengembang lain untuk mencegah interaksi berantai dengan bot lain dan menyesuaikan sistem internal Misskey untuk memperlakukan akun ini sebagai bot.",
	"qr": "QR Code"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"yourNameContainsProhibitedWords": "Il nome che hai scelto contiene una o più parole vietate",
	"yourNameContainsProhibitedWordsDescription": "Se desideri comunque utilizzare questo nome, contatta l''amministrazione.",
	"avatar": "Foto del profilo",
	"upload": "Carica",
	"cropImageAsk": "Vuoi ritagliare l'immagine?",
	"cropYes": "Ritaglia",
	"cropNo": "Non ritagliare",
	"fromDrive": "Dal Drive",
	"banner": "Intestazione",
	"profile": "Profilo",
	"changeBanner": "Cambia intestazione",
	"changeAvatar": "Modifica immagine profilo",
	"decorate": "Decora",
	"name": "Nome",
	"description": "Biografia",
	"youCanIncludeHashtags": "Puoi anche includere hashtag.",
	"location": "Posizione",
	"birthday": "Compleanno",
	"language": "Lingua",
	"metadataEdit": "Modifica informazioni aggiuntive",
	"save": "Salva",
	"add": "Aggiungi",
	"delete": "Elimina",
	"rearrange": "Riordina",
	"verifiedLinkDescription": "Come avere i collegamenti verificati: inserisci la URL ad una pagina che contiene un collegamento al tuo profilo.\nVedrai una spunta di conferma se, in quella pagina, il collegamento al tuo profilo Misskey ha attributo rel='me'.",
	"metadataLabel": "Etichetta",
	"metadataContent": "Contenuto",
	"metadataDescription": "Puoi pubblicare fino a quattro informazioni aggiuntive sul profilo.",
	"followedMessage": "Messaggio, quando qualcuno ti segue",
	"followedMessageDescription": "Puoi impostare un breve messaggio da mostrare agli altri profili quando ti seguono.",
	"followedMessageDescriptionForLockedAccount": "Quando approvi una richiesta di follow, verrà visualizzato questo testo.",
	"all": "Tutte",
	"likeOnlyForRemote": "Solo Like remoti",
	"nonSensitiveOnly": "Soltanto non espliciti",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Soltanto non espliciti (reazioni remote)",
	"likeOnly": "Solo i Like",
	"reactionAcceptance": "Reazioni consentite",
	"advancedSettings": "Impostazioni avanzate",
	"flagAsCat": "MIIaaaoo!!! (Io sono un gatto è un romanzo del 1905, il primo dello scrittore giapponese Natsume Sōseki)",
	"flagAsCatDescription": "Miaoo mia miao mi miao?",
	"flagAsBot": "Io sono un robot",
	"flagAsBotDescription": "Attiva questo campo se il profilo esegue principalmente operazioni automatiche. L'attivazione segnala agli altri sviluppatori come comportarsi per evitare catene d’interazione infinite con altri bot. I sistemi interni di Misskey si adegueranno al fine di trattare questo profilo come bot.",
	"qr": "QR Code"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"yourNameContainsProhibitedWords": "変更しようとした名前に禁止された文字列が含まれています",
	"yourNameContainsProhibitedWordsDescription": "名前に禁止されている文字列が含まれています。この名前を使用したい場合は、サーバー管理者にお問い合わせください。",
	"avatar": "アイコン",
	"upload": "アップロード",
	"cropImageAsk": "画像をクロップしますか？",
	"cropYes": "クロップする",
	"cropNo": "そのまま使う",
	"fromDrive": "ドライブから",
	"banner": "バナー",
	"profile": "プロフィール",
	"changeBanner": "バナー画像を変更",
	"changeAvatar": "アイコン画像を変更",
	"decorate": "デコる",
	"name": "名前",
	"description": "自己紹介",
	"youCanIncludeHashtags": "ハッシュタグを含めることができます。",
	"location": "場所",
	"birthday": "誕生日",
	"language": "言語",
	"metadataEdit": "追加情報を編集",
	"save": "保存",
	"add": "追加",
	"delete": "削除",
	"rearrange": "並び替え",
	"verifiedLinkDescription": "内容にURLを設定すると、リンク先のWebサイトに自分のプロフィールへのリンクが含まれている場合に所有者確認済みアイコンを表示させることができます。",
	"metadataLabel": "ラベル",
	"metadataContent": "内容",
	"metadataDescription": "プロフィールに表として追加情報を表示することができます。",
	"followedMessage": "フォローされた時のメッセージ",
	"followedMessageDescription": "フォローされた時に相手に表示する短いメッセージを設定できます。",
	"followedMessageDescriptionForLockedAccount": "フォローを承認制にしている場合、フォローリクエストを許可した時に表示されます。",
	"all": "全て",
	"likeOnlyForRemote": "全て (リモートはいいねのみ)",
	"nonSensitiveOnly": "非センシティブのみ",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "非センシティブのみ (リモートはいいねのみ)",
	"likeOnly": "いいねのみ",
	"reactionAcceptance": "リアクションの受け入れ",
	"advancedSettings": "高度な設定",
	"flagAsCat": "にゃああああああああああああああ！！！！！！！！！！！！",
	"flagAsCatDescription": "にゃにゃにゃ？？",
	"flagAsBot": "Botとして設定",
	"flagAsBotDescription": "このアカウントがプログラムによって運用される場合は、このフラグをオンにします。オンにすると、反応の連鎖を防ぐためのフラグとして他の開発者に役立ったり、Misskeyのシステム上での扱いがBotに合ったものになります。",
	"qr": "二次元コード"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"yourNameContainsProhibitedWords": "その名前は禁止した文字列が含まれとるで",
	"yourNameContainsProhibitedWordsDescription": "その名前は禁止した文字列が含まれとるわ。どうしてもって言うなら、サーバー管理者に言うしかないで。",
	"avatar": "アイコン",
	"upload": "アップロード",
	"cropImageAsk": "画像を切り取ってもええか？",
	"cropYes": "切り抜いたる",
	"cropNo": "切り抜かへん",
	"fromDrive": "ドライブから",
	"banner": "バナー",
	"profile": "プロフィール",
	"changeBanner": "バナー画像を変更するで",
	"changeAvatar": "アバター画像を変更するで",
	"decorate": "デコる",
	"name": "名前",
	"description": "自己紹介",
	"youCanIncludeHashtags": "ハッシュタグを含めることができるで。",
	"location": "場所",
	"birthday": "生まれた日",
	"language": "言語",
	"metadataEdit": "追加情報を編集するで",
	"save": "とっとく",
	"add": "増やす",
	"delete": "ほかす",
	"rearrange": "並び替え",
	"verifiedLinkDescription": "内容をURLに設定すると、リンク先のwebサイトに自分のプロフのリンクが含まれてる場合に所有者確認済みアイコンを表示させることができるで。",
	"metadataLabel": "ラベル",
	"metadataContent": "内容",
	"metadataDescription": "プロフィールに表として追加情報を表示することができるで",
	"followedMessage": "フォローされたら返すメッセージ",
	"followedMessageDescription": "フォローされたときに相手に返す短めのメッセージを決めれるで。",
	"followedMessageDescriptionForLockedAccount": "フォローが承認制なら、フォローリクエストをOKしたときに見せるで。",
	"all": "みんな",
	"likeOnlyForRemote": "リモートからはいいねだけな",
	"nonSensitiveOnly": "いつ見ても大丈夫なやつだけ",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "いつ見ても大丈夫なやつだけ (リモートはいいねだけ)",
	"likeOnly": "いいねだけ",
	"reactionAcceptance": "ツッコミの受け入れ",
	"advancedSettings": "高度な設定",
	"flagAsCat": "猫や。かわええな。",
	"flagAsCatDescription": "猫になりたいんならこれつけとき。",
	"flagAsBot": "Botにするで",
	"flagAsBotDescription": "もしこのアカウントをプログラム使うて運用するんやったら、このフラグをオンにしてや。オンにすれば、反応がバーッて連鎖せんように開発者が使うたり、Misskeyのシステム上での扱いがBotに合ったもんになるからな。",
	"qr": "二次元コード"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"avatar": "Avatar",
	"upload": "Upload",
	"cropImageAsk": "Do you want to crop this image?",
	"cropYes": "Crop",
	"cropNo": "Use as-is",
	"fromDrive": "From Drive",
	"banner": "Banner",
	"profile": "Amaɣnu",
	"changeBanner": "Change banner",
	"changeAvatar": "Change avatar",
	"decorate": "Decorate",
	"name": "Name",
	"description": "Bio",
	"youCanIncludeHashtags": "You can also include hashtags in your bio.",
	"location": "Location",
	"birthday": "Birthday",
	"language": "Language",
	"metadataEdit": "Edit additional Information",
	"save": "Sekles",
	"add": "Add",
	"delete": "Kkes",
	"rearrange": "Rearrange",
	"verifiedLinkDescription": "By entering an URL that contains a link to your profile here, an ownership verification icon can be displayed next to the field.",
	"metadataLabel": "Label",
	"metadataContent": "Content",
	"metadataDescription": "Using these, you can display additional information fields in your profile.",
	"followedMessage": "Message when you are followed",
	"followedMessageDescription": "You can set a short message to be displayed to the recipient when they follow you.",
	"followedMessageDescriptionForLockedAccount": "If you have set up that follow requests require approval, this will be displayed when you grant a follow request.",
	"all": "All",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Only likes",
	"reactionAcceptance": "Reaction Acceptance",
	"advancedSettings": "Advanced settings",
	"flagAsCat": "Mark this account as a cat",
	"flagAsCatDescription": "Enable this option to mark this account as a cat.",
	"flagAsBot": "Mark this account as a bot",
	"flagAsBotDescription": "Enable this option if this account is controlled by a program. If enabled, it will act as a flag for other developers to prevent endless interaction chains with other bots and adjust Misskey's internal systems to treat this account as a bot.",
	"qr": "QR Code"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"avatar": "Avatar",
	"upload": "Upload",
	"cropImageAsk": "Do you want to crop this image?",
	"cropYes": "Crop",
	"cropNo": "Use as-is",
	"fromDrive": "From Drive",
	"banner": "Banner",
	"profile": "ಪ್ರೊಫೈಲು",
	"changeBanner": "Change banner",
	"changeAvatar": "Change avatar",
	"decorate": "Decorate",
	"name": "Name",
	"description": "Bio",
	"youCanIncludeHashtags": "You can also include hashtags in your bio.",
	"location": "Location",
	"birthday": "Birthday",
	"language": "Language",
	"metadataEdit": "Edit additional Information",
	"save": "ಉಳಿಸಿ",
	"add": "Add",
	"delete": "ಅಳಿಸು",
	"rearrange": "Rearrange",
	"verifiedLinkDescription": "By entering an URL that contains a link to your profile here, an ownership verification icon can be displayed next to the field.",
	"metadataLabel": "Label",
	"metadataContent": "Content",
	"metadataDescription": "Using these, you can display additional information fields in your profile.",
	"followedMessage": "Message when you are followed",
	"followedMessageDescription": "You can set a short message to be displayed to the recipient when they follow you.",
	"followedMessageDescriptionForLockedAccount": "If you have set up that follow requests require approval, this will be displayed when you grant a follow request.",
	"all": "All",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Only likes",
	"reactionAcceptance": "Reaction Acceptance",
	"advancedSettings": "Advanced settings",
	"flagAsCat": "Mark this account as a cat",
	"flagAsCatDescription": "Enable this option to mark this account as a cat.",
	"flagAsBot": "Mark this account as a bot",
	"flagAsBotDescription": "Enable this option if this account is controlled by a program. If enabled, it will act as a flag for other developers to prevent endless interaction chains with other bots and adjust Misskey's internal systems to treat this account as a bot.",
	"qr": "QR Code"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"yourNameContainsProhibitedWords": "바꾸려는 이름에 금지된 키워드가 포함되어 있습니다.",
	"yourNameContainsProhibitedWordsDescription": "이름에 금지된 키워드가 있습니다. 이름을 사용해야 하는 경우, 서버 관리자에 문의하세요.",
	"avatar": "아바타",
	"upload": "업로드",
	"cropImageAsk": "이미지를 자르시겠습니까?",
	"cropYes": "잘라내기",
	"cropNo": "그대로 사용",
	"fromDrive": "드라이브에서",
	"banner": "배너",
	"profile": "프로필",
	"changeBanner": "배너 이미지 변경",
	"changeAvatar": "아바타 이미지 변경",
	"decorate": "장식하기",
	"name": "이름",
	"description": "자기소개",
	"youCanIncludeHashtags": "해시 태그를 포함할 수 있습니다.",
	"location": "장소",
	"birthday": "생일",
	"language": "언어",
	"metadataEdit": "추가 정보 편집",
	"save": "저장",
	"add": "추가",
	"delete": "삭제",
	"rearrange": "정렬",
	"verifiedLinkDescription": "내용에 자신의 프로필로 향하는 링크가 포함된 페이지의 URL을 삽입하면 소유자 인증 마크가 표시됩니다.",
	"metadataLabel": "라벨",
	"metadataContent": "내용",
	"metadataDescription": "프로필에 추가 정보를 표시할 수 있어요",
	"followedMessage": "팔로우 받았을 때 메시지",
	"followedMessageDescription": "팔로우 받았을 때 상대방에게 보여줄 단문 메시지를 설정할 수 있습니다.",
	"followedMessageDescriptionForLockedAccount": "팔로우를 승인제로 한 경우, 팔로우 요청을 수락했을 때 보여줍니다.",
	"all": "전체",
	"likeOnlyForRemote": "리모트에서는 좋아요만 받기",
	"nonSensitiveOnly": "민감한 이모지를 제외하고 받기",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "민감한 이모지를 제외하고 받기(리모트에서는 좋아요만 받기)",
	"likeOnly": "좋아요만 받기",
	"reactionAcceptance": "리액션 수신",
	"advancedSettings": "고급 설정",
	"flagAsCat": "미야아아아오오오오오오오오오옹!!!!!!!",
	"flagAsCatDescription": "야옹?(이 계정이 고양이라면 눌러 주세요.)",
	"flagAsBot": "나는 봇입니다",
	"flagAsBotDescription": "이 계정을 자동화된 수단으로 운용할 경우에 활성화해 주세요. 이 플래그를 활성화하면, 다른 봇이 이를 참고하여 봇 끼리의 무한 연쇄 반응을 회피하거나, 이 계정의 시스템 상에서의 취급이 Bot 운영에 최적화되는 등의 변화가 생깁니다.",
	"qr": "QR 코드"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"avatar": "Avatar",
	"upload": "Uploaden",
	"cropImageAsk": "Bijsnijdengevraagd",
	"cropYes": "Crop",
	"cropNo": "Use as-is",
	"fromDrive": "Van schijf",
	"banner": "Banner",
	"profile": "Profiel",
	"changeBanner": "Change banner",
	"changeAvatar": "Change avatar",
	"decorate": "Decorate",
	"name": "Naam",
	"description": "Bio",
	"youCanIncludeHashtags": "You can also include hashtags in your bio.",
	"location": "Locatie",
	"birthday": "Geboortedatum",
	"language": "Taal",
	"metadataEdit": "Edit additional Information",
	"save": "Opslaan",
	"add": "Toevoegen",
	"delete": "Verwijderen",
	"rearrange": "Sorteren",
	"verifiedLinkDescription": "By entering an URL that contains a link to your profile here, an ownership verification icon can be displayed next to the field.",
	"metadataLabel": "Label",
	"metadataContent": "Content",
	"metadataDescription": "Using these, you can display additional information fields in your profile.",
	"followedMessage": "Message when you are followed",
	"followedMessageDescription": "You can set a short message to be displayed to the recipient when they follow you.",
	"followedMessageDescriptionForLockedAccount": "If you have set up that follow requests require approval, this will be displayed when you grant a follow request.",
	"all": "Alle",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Only likes",
	"reactionAcceptance": "Reaction Acceptance",
	"advancedSettings": "Geavanceerde instellingen",
	"flagAsCat": "Markeer dit account als een kat.",
	"flagAsCatDescription": "Zet deze vlag aan als je wilt aangeven dat dit account een kat is.",
	"flagAsBot": "Markeer dit account als een robot.",
	"flagAsBotDescription": "Als dit account van een programma wordt beheerd, zet deze vlag aan. Het aanzetten helpt andere ontwikkelaars om bijvoorbeeld onbedoelde feedback loops te doorbreken of om Misskey meer geschikt te maken.",
	"qr": "QR Code"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"avatar": "Avatar",
	"upload": "Laste opp",
	"cropImageAsk": "Do you want to crop this image?",
	"cropYes": "Crop",
	"cropNo": "Use as-is",
	"fromDrive": "From Drive",
	"banner": "Banner",
	"profile": "Profil",
	"changeBanner": "Change banner",
	"changeAvatar": "Change avatar",
	"decorate": "Decorate",
	"name": "Navn",
	"description": "Biografi",
	"youCanIncludeHashtags": "You can also include hashtags in your bio.",
	"location": "Location",
	"birthday": "Bursdag",
	"language": "Språk",
	"metadataEdit": "Edit additional Information",
	"save": "Lagre",
	"add": "Legg til",
	"delete": "Slett",
	"rearrange": "Rearrange",
	"verifiedLinkDescription": "By entering an URL that contains a link to your profile here, an ownership verification icon can be displayed next to the field.",
	"metadataLabel": "Label",
	"metadataContent": "Innhold",
	"metadataDescription": "Using these, you can display additional information fields in your profile.",
	"followedMessage": "Message when you are followed",
	"followedMessageDescription": "You can set a short message to be displayed to the recipient when they follow you.",
	"followedMessageDescriptionForLockedAccount": "If you have set up that follow requests require approval, this will be displayed when you grant a follow request.",
	"all": "Alle",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Bare liker",
	"reactionAcceptance": "Reaction Acceptance",
	"advancedSettings": "Advanced settings",
	"flagAsCat": "Merk denne kontoen som en katt",
	"flagAsCatDescription": "Aktiver dette alternativet for å merke denne kontoen som en katt.",
	"flagAsBot": "Merk denne kontoen som en bot",
	"flagAsBotDescription": "Aktiver dette alternativet hvis denne kontoen styres av et program. Hvis det er aktivert, vil det fungere som et flagg for andre utviklere for å forhindre endeløse interaksjonskjeder med andre roboter og justere Misskeys interne systemer til å behandle denne kontoen som en bot.",
	"qr": "QR Code"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"avatar": "Awatar",
	"upload": "Wyślij",
	"cropImageAsk": "Czy chcesz przyciąć obrazek?",
	"cropYes": "Tak, przytnij",
	"cropNo": "Nie chce przycinać",
	"fromDrive": "Z dysku",
	"banner": "Baner",
	"profile": "Profil",
	"changeBanner": "Zmień baner",
	"changeAvatar": "Zmień awatar",
	"decorate": "Decorate",
	"name": "Nazwa",
	"description": "Opis",
	"youCanIncludeHashtags": "Możesz umieścić hashtagi w swoim opisie.",
	"location": "Lokalizacja",
	"birthday": "Data urodzenia",
	"language": "Język",
	"metadataEdit": "Edytuj dodatkowe informacje",
	"save": "Zapisz",
	"add": "Dodaj",
	"delete": "Usuń",
	"rearrange": "Posortuj",
	"verifiedLinkDescription": "By entering an URL that contains a link to your profile here, an ownership verification icon can be displayed next to the field.",
	"metadataLabel": "Etykieta",
	"metadataContent": "Treść",
	"metadataDescription": "Możesz wyświetlać do czterech sekcji dodatkowych informacji na swoim profilu.",
	"followedMessage": "Message when you are followed",
	"followedMessageDescription": "You can set a short message to be displayed to the recipient when they follow you.",
	"followedMessageDescriptionForLockedAccount": "If you have set up that follow requests require approval, this will be displayed when you grant a follow request.",
	"all": "Wszystkie",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Only likes",
	"reactionAcceptance": "Reaction Acceptance",
	"advancedSettings": "Zaawansowane ustawienia",
	"flagAsCat": "To konto jest kotem",
	"flagAsCatDescription": "Przełącz tę opcję, aby konto było oznaczone jako kot.",
	"flagAsBot": "To konto jest botem",
	"flagAsBotDescription": "Jeżeli ten kanał jest kontrolowany przez jakiś program, ustaw tę opcję. Jeżeli włączona, będzie działać jako flaga informująca innych programistów, aby zapobiegać nieskończonej interakcji z różnymi botami i dostosowywać wewnętrzne systemy Misskey, traktując konto jako bota.",
	"qr": "QR Code"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"yourNameContainsProhibitedWords": "O seu nome possui palavras proibidas",
	"yourNameContainsProhibitedWordsDescription": "Se você deseja utilizar esse nome, entre em contato com o administrador do servidor.",
	"avatar": "Avatar",
	"upload": "Fazer upload",
	"cropImageAsk": "Deseja recortar esta imagem?",
	"cropYes": "Recortar",
	"cropNo": "Manter deste jeito",
	"fromDrive": "Do drive",
	"banner": "Capa",
	"profile": "Perfil",
	"changeBanner": "Mudar banner",
	"changeAvatar": "Mudar avatar",
	"decorate": "Decorar",
	"name": "Nome",
	"description": "Bio",
	"youCanIncludeHashtags": "Você pode incluir hashtags em sua bio.",
	"location": "Localização",
	"birthday": "Aniversário",
	"language": "Idioma",
	"metadataEdit": "Editar informações adicionais",
	"save": "Salvar",
	"add": "Adicionar",
	"delete": "Excluir",
	"rearrange": "Reordernar",
	"verifiedLinkDescription": "Ao inserir um URL que contém um link para essa conta, um ícone de verificação será exibido ao lado do campo",
	"metadataLabel": "Rótulo",
	"metadataContent": "Conteúdo",
	"metadataDescription": "Aqui, você pode exibir campos adicionais de informação no seu perfil.",
	"followedMessage": "Mensagem exibida quando alguém segue você",
	"followedMessageDescription": "Você pode definir uma curta mensagem que será exibida aos usuários que seguirem você.",
	"followedMessageDescriptionForLockedAccount": "Se você aceita pedidos de seguidor manualmente, isso será exibido quando você aceitá-los.",
	"all": "Todos",
	"likeOnlyForRemote": "Tudo (somente curtidas remotas)",
	"nonSensitiveOnly": "Apenas não-sensível",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Apenas não sensíveis (somente curtidas remotas)",
	"likeOnly": "Apenas curtidas",
	"reactionAcceptance": "Aceitação de Reações",
	"advancedSettings": "Configurações avançadas",
	"flagAsCat": "Marcar conta como gato",
	"flagAsCatDescription": "Ative esta opção para marcar essa conta como gato",
	"flagAsBot": "Marcar conta como robô",
	"flagAsBotDescription": "Se esta conta for operada por uma aplicação, ative esta opção. Ao ativá-la, ela servirá como um sinalizador para evitar reações em cadeia e ajudar outros desenvolvedores. Além disso, ajustará o tratamento da conta no sistema do Misskey para que se adeque a um Bot.",
	"qr": "Código QR"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"yourNameContainsProhibitedWords": "Имя, которое вы пытаетесь изменить, содержит запрещенную строку символов",
	"yourNameContainsProhibitedWordsDescription": "Имя содержит запрещённую строку символов. Если вы хотите использовать это имя, обратитесь к администратору сервера",
	"avatar": "Аватар",
	"upload": "Загрузить",
	"cropImageAsk": "Обрезать изображение?",
	"cropYes": "Обрезать",
	"cropNo": "Не обрезать",
	"fromDrive": "С Диска",
	"banner": "Шапка",
	"profile": "Профиль",
	"changeBanner": "Поменять изображение в шапке",
	"changeAvatar": "Поменять аватар",
	"decorate": "Украсить",
	"name": "Имя",
	"description": "О себе",
	"youCanIncludeHashtags": "Можете использовать здесь хештеги.",
	"location": "Местоположение",
	"birthday": "День рождения",
	"language": "Язык",
	"metadataEdit": "Редактировать дополнительные сведения",
	"save": "Сохранить",
	"add": "Добавить",
	"delete": "Удалить",
	"rearrange": "Сортировать по",
	"verifiedLinkDescription": "Указывая здесь URL, содержащий ссылку на профиль, иконка владения ресурсом может быть отображена рядом с полем",
	"metadataLabel": "Метка",
	"metadataContent": "Содержимое",
	"metadataDescription": "Можно добавить до четырёх дополнительных граф в профиль.",
	"followedMessage": "Message when you are followed",
	"followedMessageDescription": "You can set a short message to be displayed to the recipient when they follow you.",
	"followedMessageDescriptionForLockedAccount": "If you have set up that follow requests require approval, this will be displayed when you grant a follow request.",
	"all": "Все",
	"likeOnlyForRemote": "Всё (с других серверов только «нравится!»)",
	"nonSensitiveOnly": "Только безопасные",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Только безопасные (с других серверов только «нравится!»)",
	"likeOnly": "Только «нравится!»",
	"reactionAcceptance": "Допустимые реакции",
	"advancedSettings": "Расширенные настройки ",
	"flagAsCat": "Аккаунт кота",
	"flagAsCatDescription": "Включите, и этот аккаунт будет помечен как кошачий.",
	"flagAsBot": "Аккаунт бота",
	"flagAsBotDescription": "Включите, если этот аккаунт управляется программой. Это позволит системе Misskey учитывать это, а также поможет разработчикам других ботов предотвратить бесконечные циклы взаимодействия.",
	"qr": "QR Code"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"avatar": "Avatar",
	"upload": "Nahrať súbor",
	"cropImageAsk": "Chcete orezať obrázok?",
	"cropYes": "Crop",
	"cropNo": "Use as-is",
	"fromDrive": "Z disku",
	"banner": "BAnner",
	"profile": "Profil",
	"changeBanner": "Zmeniť banner",
	"changeAvatar": "Zmeniť avatara",
	"decorate": "Decorate",
	"name": "Názov",
	"description": "Bio",
	"youCanIncludeHashtags": "Vo svojom bio môžete mať aj hashtagy.",
	"location": "Lokalita",
	"birthday": "Dátum narodenia",
	"language": "Jazyk",
	"metadataEdit": "Upraviť dodatočné informácie",
	"save": "Uložiť",
	"add": "Pridať",
	"delete": "Odstrániť",
	"rearrange": "Rearrange",
	"verifiedLinkDescription": "By entering an URL that contains a link to your profile here, an ownership verification icon can be displayed next to the field.",
	"metadataLabel": "Popisok",
	"metadataContent": "Obsah",
	"metadataDescription": "Vo svojom profile môžete uviesť až štyri dodatočné informačné polia.",
	"followedMessage": "Message when you are followed",
	"followedMessageDescription": "You can set a short message to be displayed to the recipient when they follow you.",
	"followedMessageDescriptionForLockedAccount": "If you have set up that follow requests require approval, this will be displayed when you grant a follow request.",
	"all": "Všetko",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Only likes",
	"reactionAcceptance": "Reaction Acceptance",
	"advancedSettings": "Rozšírené nastavenia",
	"flagAsCat": "Tento účet je mačka",
	"flagAsCatDescription": "Zvoľte túto voľbu, aby bol tento účet označený ako mačka.",
	"flagAsBot": "Tento účet je bot",
	"flagAsBotDescription": "Ak je tento účet ovládaný programom, zaškrtnite túto voľbu. Ostatní uvidia, že je to bot a zabráni nekonečným interakciám s ďalšími botmi a upraví interné systémy Misskey, aby ho považoval za bota.",
	"qr": "QR Code"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"yourNameContainsProhibitedWords": "ชื่อของคุณนั้นมีคำที่ต้องห้าม",
	"yourNameContainsProhibitedWordsDescription": "ถ้าหากคุณต้องการใช้ชื่อนี้ กรุณาติดต่อผู้ดูแลระบบของเซิร์ฟเวอร์นะค่ะ",
	"avatar": "ไอคอน",
	"upload": "อัปโหลด",
	"cropImageAsk": "คุณต้องการครอบตัดรูปภาพนี้อย่างงั้นหรือ?",
	"cropYes": "ครอบตัด",
	"cropNo": "ใช้ตามที่เป็นอยู่",
	"fromDrive": "จากไดรฟ์",
	"banner": "แบนเนอร์",
	"profile": "โปรไฟล์",
	"changeBanner": "เปลี่ยนแบนเนอร์",
	"changeAvatar": "เปลี่ยนไอคอนประจำตัว",
	"decorate": "ตกแต่ง",
	"name": "ชื่อ",
	"description": "แนะนำตัว",
	"youCanIncludeHashtags": "คุณสามารถใส่แฮชแท็กในส่วนแนะนำตัวของคุณได้",
	"location": "ตำแหน่งที่ตั้ง",
	"birthday": "วันเกิด",
	"language": "ภาษา",
	"metadataEdit": "แก้ไขข้อมูลเพิ่มเติม",
	"save": "บันทึก",
	"add": "เพิ่ม",
	"delete": "ลบ",
	"rearrange": "จัดใหม่",
	"verifiedLinkDescription": "หากป้อน URL ที่มีลิงก์ไปยังโปรไฟล์ของคุณ ไอคอนการยืนยันความเป็นเจ้าของจะแสดงถัดจากฟิลด์นั้น ๆ",
	"metadataLabel": "ป้าย",
	"metadataContent": "เนื้อหา",
	"metadataDescription": "ใช้สิ่งเหล่านี้ คุณสามารถแสดงฟิลด์ข้อมูลเพิ่มเติมในโปรไฟล์ของคุณ",
	"followedMessage": "ส่งข้อความเมื่อมีคนกดติดตาม",
	"followedMessageDescription": "ส่งข้อความเมื่อมีคนกดติดตามแล้ว",
	"followedMessageDescriptionForLockedAccount": "ถ้าหากคุณตั้งค่าให้คนอื่นต้องขออนุญาตก่อนที่จะติดตามคุณ ระบบจะขึ้นข้อความนี้ในตอนที่คุณอนุมัติให้เขาติดตาม",
	"all": "ทั้งหมด",
	"likeOnlyForRemote": "ทั้งหมด (เฉพาะการถูกใจจากเซิร์ฟเวอร์ระยะไกล)",
	"nonSensitiveOnly": "เฉพาะไม่มีเนื้อหาละเอียดอ่อน",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "เฉพาะไม่มีเนื้อหาละเอียดอ่อน (เฉพาะการถูกใจจากระยะไกลเท่านั้น)",
	"likeOnly": "ที่ถูกใจเท่านั้น",
	"reactionAcceptance": "การยอมรับรีแอคชั่น",
	"advancedSettings": "การตั้งค่าขั้นสูง",
	"flagAsCat": "เมี้ยววววววววววววววว!!!!!!!!!!!",
	"flagAsCatDescription": "เหมียวเหมียวเมี้ยว??",
	"flagAsBot": "ทำเครื่องหมายบอกว่าบัญชีนี้เป็นบอต",
	"flagAsBotDescription": "เปิดใช้งานตัวเลือกนี้หากบัญชีนี้ถูกควบคุมโดยโปรแกรม เมื่อเปิดใช้งาน มันจะทำหน้าที่เป็นแฟล็กสำหรับนักพัฒนารายอื่นในการป้องกันการสร้างห่วงโซ่การโต้ตอบแบบอนันต์กับบอตตัวอื่น และปรับระบบภายในของ Misskey เพื่อจัดการบัญชีนี้ในฐานะบอต",
	"qr": "QR โค้ด"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"yourNameContainsProhibitedWords": "Adınız yasaklanmış kelimeler içeriyor",
	"yourNameContainsProhibitedWordsDescription": "Bu adı kullanmak istiyorsan, lütfen sunucu yöneticinizle iletişime geç.",
	"avatar": "Avatar",
	"upload": "Yükle",
	"cropImageAsk": "Bu görüntüyü kırpmak ister misin?",
	"cropYes": "Kırp",
	"cropNo": "Olduğu gibi kullanın",
	"fromDrive": "Drive'den",
	"banner": "Banner",
	"profile": "Profil",
	"changeBanner": "Banner değiştir",
	"changeAvatar": "Avatar değiştir",
	"decorate": "Süsle",
	"name": "Ad",
	"description": "Biyografi",
	"youCanIncludeHashtags": "Biyografinize hashtag'ler de ekleyebilirsiniz.",
	"location": "Konum",
	"birthday": "Doğum günü",
	"language": "Dil",
	"metadataEdit": "Ek bilgileri düzenle",
	"save": "Kaydet",
	"add": "Ekle",
	"delete": "Sil",
	"rearrange": "Yeniden düzenle",
	"verifiedLinkDescription": "Buraya profiline bağlantı içeren bir URL girerek, alanın yanında bir sahiplik doğrulama simgesi görüntülenebilir.",
	"metadataLabel": "Etiket",
	"metadataContent": "İçerik",
	"metadataDescription": "Bunları kullanarak profilinde ek bilgi alanları görüntüleyebilirsin.",
	"followedMessage": "Takip edildiğinizde gönderilen mesaj",
	"followedMessageDescription": "Abonelerin seni takip ettiklerinde görüntülenmesini istediğin kısa bir mesaj ayarlayabilirsin.",
	"followedMessageDescriptionForLockedAccount": "Takip isteklerinin onay gerektirmesini ayarladıysan, bir takip isteğini kabul ettiğinde bu mesaj görüntülenir.",
	"all": "Tümü",
	"likeOnlyForRemote": "Tüm (Yalnızca uzak sunucu için beğeniler)",
	"nonSensitiveOnly": "Hassas olmayanlar için",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Yalnızca hassas olmayanlar (Yalnızca uzaktan beğeniler)",
	"likeOnly": "Sadece beğeniler",
	"reactionAcceptance": "Tepki Kabulü",
	"advancedSettings": "Gelişmiş ayarlar",
	"flagAsCat": "Kedi hesabı",
	"flagAsCatDescription": "Kedi hesabı",
	"flagAsBot": "Bot olarak işaretle",
	"flagAsBotDescription": "Bu hesap bir program tarafından kontrol ediliyorsa bu seçeneği etkinleştir. Etkinleştirildiğinde, diğer geliştiriciler için bir işaret görevi görerek diğer botlarla sonsuz etkileşim zincirlerini önleyecek ve Misskey'in iç sistemlerini bu hesabı bir bot olarak ele alacak şekilde ayarlayacak.",
	"qr": "2 boyutlu kod"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"avatar": "Avatar",
	"upload": "Upload",
	"cropImageAsk": "Do you want to crop this image?",
	"cropYes": "Crop",
	"cropNo": "Use as-is",
	"fromDrive": "From Drive",
	"banner": "Banner",
	"profile": "profile",
	"changeBanner": "Change banner",
	"changeAvatar": "Change avatar",
	"decorate": "Decorate",
	"name": "Name",
	"description": "Bio",
	"youCanIncludeHashtags": "You can also include hashtags in your bio.",
	"location": "Location",
	"birthday": "Birthday",
	"language": "Language",
	"metadataEdit": "Edit additional Information",
	"save": "Save",
	"add": "Add",
	"delete": "ئۆچۈرۈش",
	"rearrange": "Rearrange",
	"verifiedLinkDescription": "By entering an URL that contains a link to your profile here, an ownership verification icon can be displayed next to the field.",
	"metadataLabel": "Label",
	"metadataContent": "Content",
	"metadataDescription": "Using these, you can display additional information fields in your profile.",
	"followedMessage": "Message when you are followed",
	"followedMessageDescription": "You can set a short message to be displayed to the recipient when they follow you.",
	"followedMessageDescriptionForLockedAccount": "If you have set up that follow requests require approval, this will be displayed when you grant a follow request.",
	"all": "All",
	"likeOnlyForRemote": "All (Only likes for remote instances)",
	"nonSensitiveOnly": "Non-sensitive only",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Non-sensitive only (Only likes from remote)",
	"likeOnly": "Only likes",
	"reactionAcceptance": "Reaction Acceptance",
	"advancedSettings": "Advanced settings",
	"flagAsCat": "Mark this account as a cat",
	"flagAsCatDescription": "Enable this option to mark this account as a cat.",
	"flagAsBot": "Mark this account as a bot",
	"flagAsBotDescription": "Enable this option if this account is controlled by a program. If enabled, it will act as a flag for other developers to prevent endless interaction chains with other bots and adjust Misskey's internal systems to treat this account as a bot.",
	"qr": "QR Code"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"yourNameContainsProhibitedWords": "Ваше ім'я має заборонені слова",
	"yourNameContainsProhibitedWordsDescription": "Якщо ви бажаєте використовувати це ім'я, зв'яжіться з адміністратором вашого сервера.",
	"avatar": "Аватар",
	"upload": "Завантажити",
	"cropImageAsk": "Бажаєте кадрувати це зображення?",
	"cropYes": "Crop",
	"cropNo": "Використати як є",
	"fromDrive": "З диска",
	"banner": "Банер",
	"profile": "Профіль",
	"changeBanner": "Змінити банер",
	"changeAvatar": "Змінити аватар",
	"decorate": "Прикрасити",
	"name": "Ім'я",
	"description": "Про себе",
	"youCanIncludeHashtags": "Ви також можете включити хештеги у свій опис.",
	"location": "Локація",
	"birthday": "День народження",
	"language": "Мова",
	"metadataEdit": "Редагувати додаткову інформацію",
	"save": "Зберегти",
	"add": "Додати",
	"delete": "Видалити",
	"rearrange": "Сортувати за",
	"verifiedLinkDescription": "By entering an URL that contains a link to your profile here, an ownership verification icon can be displayed next to the field.",
	"metadataLabel": "Назва",
	"metadataContent": "Вміст",
	"metadataDescription": "Ви можете вказати до чотирьох пунктів додаткової інформації у своєму профілі.",
	"followedMessage": "Message when you are followed",
	"followedMessageDescription": "You can set a short message to be displayed to the recipient when they follow you.",
	"followedMessageDescriptionForLockedAccount": "If you have set up that follow requests require approval, this will be displayed when you grant a follow request.",
	"all": "Всі",
	"likeOnlyForRemote": "Усі — лише вподобання для віддалених інстансів",
	"nonSensitiveOnly": "Тільки нечутливий контент",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Тільки нечутливий контент (тільки віддалені вподобання)",
	"likeOnly": "Лише вподобання",
	"reactionAcceptance": "Прийняття реакцій",
	"advancedSettings": "Розширені налаштування",
	"flagAsCat": "Акаунт кота",
	"flagAsCatDescription": "Ввімкніть, щоб позначити, що обліковий запис є котиком.",
	"flagAsBot": "Акаунт бота",
	"flagAsBotDescription": "Ввімкніть якщо цей обліковий запис використовується ботом. Ця опція позначить обліковий запис як бота. Це потрібно щоб виключити безкінечну інтеракцію між ботами а також відповідного підлаштування Misskey.",
	"qr": "QR-код"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"yourNameContainsProhibitedWords": "Tên bạn đang cố gắng đổi có chứa chuỗi ký tự bị cấm.",
	"yourNameContainsProhibitedWordsDescription": "Tên có chứa chuỗi ký tự bị cấm. Nếu bạn muốn sử dụng tên này, hãy liên hệ với quản trị viên máy chủ của bạn.",
	"avatar": "Ảnh đại diện",
	"upload": "Tải lên",
	"cropImageAsk": "Bạn có muốn cắt ảnh này?",
	"cropYes": "Cắt",
	"cropNo": "Để nguyên",
	"fromDrive": "Từ ổ đĩa",
	"banner": "Ảnh bìa",
	"profile": "Trang cá nhân",
	"changeBanner": "Đổi ảnh bìa",
	"changeAvatar": "Đổi ảnh đại diện",
	"decorate": "Trang trí",
	"name": "Tên",
	"description": "Tiểu sử",
	"youCanIncludeHashtags": "Bạn có thể dùng hashtag trong tiểu sử.",
	"location": "Đến từ",
	"birthday": "Sinh nhật",
	"language": "Ngôn ngữ",
	"metadataEdit": "Sửa thông tin bổ sung",
	"save": "Lưu",
	"add": "Thêm",
	"delete": "Xóa",
	"rearrange": "Sắp xếp lại",
	"verifiedLinkDescription": "By entering an URL that contains a link to your profile here, an ownership verification icon can be displayed next to the field.",
	"metadataLabel": "Nhãn",
	"metadataContent": "Nội dung",
	"metadataDescription": "Sử dụng phần này, bạn có thể hiển thị các mục thông tin bổ sung trong hồ sơ của mình.",
	"followedMessage": "Message when you are followed",
	"followedMessageDescription": "You can set a short message to be displayed to the recipient when they follow you.",
	"followedMessageDescriptionForLockedAccount": "If you have set up that follow requests require approval, this will be displayed when you grant a follow request.",
	"all": "Tất cả",
	"likeOnlyForRemote": "Tất cả (chỉ bao gồm lượt thích trên các máy chủ khác)",
	"nonSensitiveOnly": "Chỉ nội dung không nhạy cảm",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "Chỉ nội dung không nhạy cảm (chỉ bao gồm lượt thích từ máy chủ khác)",
	"likeOnly": "Chỉ lượt thích",
	"reactionAcceptance": "Phản ứng chấp nhận",
	"advancedSettings": "Cài đặt nâng cao",
	"flagAsCat": "Chế độ Mèeeeeeeeeeo!!",
	"flagAsCatDescription": "Nếu mà em là một con mèo thì cứ bật nó kiu mèo mèo mèeeeeeeo!! ",
	"flagAsBot": "Đánh dấu đây là tài khoản bot",
	"flagAsBotDescription": "Bật tùy chọn này nếu tài khoản này được kiểm soát bởi một chương trình. Nếu được bật, nó sẽ được đánh dấu để các nhà phát triển khác ngăn chặn chuỗi tương tác vô tận với các bot khác và điều chỉnh hệ thống nội bộ của Misskey để coi tài khoản này như một bot.",
	"qr": "QR Code"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"yourNameContainsProhibitedWords": "目标用户名包含违禁词",
	"yourNameContainsProhibitedWordsDescription": "用户名内含有违禁词。若想使用此用户名，请联系服务器管理员。",
	"avatar": "头像",
	"upload": "本地上传",
	"cropImageAsk": "是否要裁剪图像？",
	"cropYes": "去裁剪",
	"cropNo": "就这样吧！",
	"fromDrive": "从网盘中",
	"banner": "横幅",
	"profile": "个人资料",
	"changeBanner": "更换横幅",
	"changeAvatar": "更换头像",
	"decorate": "装饰",
	"name": "昵称",
	"description": "个人简介",
	"youCanIncludeHashtags": "可以在个人简介中包含 #标签。",
	"location": "位置",
	"birthday": "生日",
	"language": "语言",
	"metadataEdit": "附加信息编辑",
	"save": "保存",
	"add": "添加",
	"delete": "删除",
	"rearrange": "排序方式",
	"verifiedLinkDescription": "如果将内容设置为 URL，当链接所指向的网页内包含自己的个人资料链接时，可以显示一个已验证图标。",
	"metadataLabel": "标签",
	"metadataContent": "内容",
	"metadataDescription": "最多可以在个人资料中以表格形式显示四条其他信息。",
	"followedMessage": "被关注时的信息",
	"followedMessageDescription": "被关注时，可设置向关注者显示的信息。",
	"followedMessageDescriptionForLockedAccount": "需要批准才能关注的情况下，消息会在请求被批准后显示。",
	"all": "全部",
	"likeOnlyForRemote": "全部（远程仅点赞）",
	"nonSensitiveOnly": "仅限非敏感内容",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "仅限非敏感内容（远程仅点赞）",
	"likeOnly": "仅点赞",
	"reactionAcceptance": "接受表情回应",
	"advancedSettings": "高级设置",
	"flagAsCat": "喵！！！！！！！！！！！！",
	"flagAsCatDescription": "喵喵喵？？",
	"flagAsBot": "这是一个机器人账号",
	"flagAsBotDescription": "如果此账户由程序控制，请启用此项。启用后，此标志可以帮助其他开发人员防止机器人之间产生无限互动的行为，并让 Misskey 的内部系统将此账户识别为机器人。",
	"qr": "二维码"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"yourNameContainsProhibitedWords": "您嘗試更改的名稱包含禁止的字串",
	"yourNameContainsProhibitedWordsDescription": "名稱中包含禁止使用的字串。 如果您想使用此名稱，請聯絡您的伺服器管理員。",
	"avatar": "大頭貼",
	"upload": "上傳",
	"cropImageAsk": "要剪裁圖片嗎？",
	"cropYes": "裁剪",
	"cropNo": "使用原圖",
	"fromDrive": "從雲端空間中選擇",
	"banner": "橫幅",
	"profile": "個人檔案",
	"changeBanner": "變更橫幅圖像",
	"changeAvatar": "更換大頭貼",
	"decorate": "裝飾",
	"name": "名字",
	"description": "關於我",
	"youCanIncludeHashtags": "你也可以在「關於我」中加上 #tag",
	"location": "位置",
	"birthday": "生日",
	"language": "語言",
	"metadataEdit": "編輯附加資訊",
	"save": "儲存",
	"add": "新增",
	"delete": "刪除",
	"rearrange": "排序方式",
	"verifiedLinkDescription": "如果輸入包含您個人資料的網站 URL，欄位旁邊將出現驗證圖示。",
	"metadataLabel": "標籤",
	"metadataContent": "內容",
	"metadataDescription": "可以在個人資料中以表格形式顯示其他資訊。",
	"followedMessage": "被追隨時的訊息",
	"followedMessageDescription": "可以設定被追隨時顯示給對方的訊息。",
	"followedMessageDescriptionForLockedAccount": "如果追隨需要核准的話，將在通過追隨請求之後顯示。",
	"all": "全部",
	"likeOnlyForRemote": "全部（遠端僅限讚）",
	"nonSensitiveOnly": "僅限非敏感",
	"nonSensitiveOnlyForLocalLikeOnlyForRemote": "僅限非敏感（遠端僅限讚）",
	"likeOnly": "僅限讚",
	"reactionAcceptance": "接受表情反應",
	"advancedSettings": "進階設定",
	"flagAsCat": "此帳戶是一隻貓，喵～～～！！！",
	"flagAsCatDescription": "喵喵喵？？",
	"flagAsBot": "此使用者是機器人",
	"flagAsBotDescription": "如果本帳戶是由程式控制，請啟用此選項。啟用後，會作為標示幫助其他開發者防止機器人之間產生無限互動的行為，並會調整 Misskey 內部系統將本帳戶識別為機器人。",
	"qr": "二維條碼"
}
</locale>
