<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkFolder :defaultOpen="true">
		<template #icon><i class="ti ti-plane-arrival"></i></template>
		<template #label>{{ $locale.sfc.accountMigrationMoveFrom }}</template>
		<template #caption>{{ $locale.sfc.accountMigrationMoveFromSub }}</template>

		<div class="_gaps_m">
			<FormInfo>
				{{ $locale.sfc.accountMigrationMoveFromDescription }}
			</FormInfo>
			<div>
				<MkButton :disabled="accountAliases.length >= 10" inline style="margin-right: 8px;" @click="add"><i class="ti ti-plus"></i> {{ $locale.sfc.add }}</MkButton>
				<MkButton inline primary @click="save"><i class="ti ti-check"></i> {{ $locale.sfc.save }}</MkButton>
			</div>
			<div class="_gaps">
				<MkInput v-for="(_, i) in accountAliases" v-model="accountAliases[i]">
					<template #prefix><i class="ti ti-plane-arrival"></i></template>
					<template #label>{{ interpolateLocaleParameters($locale.sfc.accountMigrationMoveFromLabel, { n: i + 1 }) }}</template>
				</MkInput>
			</div>
		</div>
	</MkFolder>

	<MkFolder :defaultOpen="!!$i.movedTo">
		<template #icon><i class="ti ti-plane-departure"></i></template>
		<template #label>{{ $locale.sfc.accountMigrationMoveTo }}</template>

		<div class="_gaps_m">
			<FormInfo>{{ $locale.sfc.accountMigrationMoveAccountDescription }}</FormInfo>

			<template v-if="$i && !$i.movedTo">
				<FormInfo>{{ $locale.sfc.accountMigrationMoveAccountHowTo }}</FormInfo>
				<FormInfo warn>{{ $locale.sfc.accountMigrationMoveCannotBeUndone }}</FormInfo>

				<MkInput v-model="moveToAccount">
					<template #prefix><i class="ti ti-plane-departure"></i></template>
					<template #label>{{ $locale.sfc.accountMigrationMoveToLabel }}</template>
				</MkInput>
				<MkButton inline danger :disabled="!moveToAccount" @click="move">
					<i class="ti ti-check"></i> {{ $locale.sfc.accountMigrationStartMigration }}
				</MkButton>
			</template>
			<template v-else-if="$i">
				<FormInfo>{{ $locale.sfc.accountMigrationPostMigrationNote }}</FormInfo>
				<FormInfo warn>{{ $locale.sfc.accountMigrationMovedAndCannotBeUndone }}</FormInfo>
				<div>{{ $locale.sfc.accountMigrationMovedTo }}</div>
				<MkUserInfo v-if="movedTo" :user="movedTo" class="_panel _shadow"/>
			</template>
		</div>
	</MkFolder>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import FormInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkUserInfo from '@features/users/frontend/components/MkUserInfo.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import { unisonReload } from '@features/runtime/frontend/utility/unison-reload.js';

const $i = ensureSignin();

const moveToAccount = ref('');
const movedTo = ref<Misskey.entities.UserDetailed>();
const accountAliases = ref(['']);

async function init() {
	if ($i.movedTo) {
		movedTo.value = await misskeyApi('users/show', { userId: $i.movedTo });
	} else {
		moveToAccount.value = '';
	}

	if ($i.alsoKnownAs && $i.alsoKnownAs.length > 0) {
		const alsoKnownAs = await misskeyApi('users/show', { userIds: $i.alsoKnownAs });
		accountAliases.value = (alsoKnownAs && alsoKnownAs.length > 0) ? alsoKnownAs.map(user => `@${Misskey.acct.toString(user)}`) : [''];
	} else {
		accountAliases.value = [''];
	}
}

async function move(): Promise<void> {
	const account = moveToAccount.value;
	const confirm = await os.confirm({
		type: 'warning',
		text: interpolateLocaleParameters($locale.value.sfc.accountMigrationMigrationConfirm, { account }),
	});
	if (confirm.canceled) return;
	await os.apiWithDialog('i/move', {
		moveToAccount: account,
	});
	unisonReload();
}

function add(): void {
	accountAliases.value.push('');
}

async function save(): Promise<void> {
	const alsoKnownAs = accountAliases.value.map(alias => alias.trim()).filter(alias => alias !== '');
	const i = await os.apiWithDialog('i/update', {
		alsoKnownAs,
	});
	$i.alsoKnownAs = i.alsoKnownAs;
	init();
}

init();
</script>

<style lang="scss">
.description {
	font-size: .85em;
	padding: 1rem;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"accountMigrationMoveFrom": "انقل حسابًا آخر لهذا الحساب",
	"accountMigrationMoveFromSub": "Create alias to another account",
	"accountMigrationMoveFromDescription": "You must create an alias for the account to move from on this account.\nEnter the account to migrate from in the following format: @username@server.example.com\nTo delete the alias, leave the field empty (not recommended).",
	"add": "إضافة",
	"save": "حفظ",
	"accountMigrationMoveFromLabel": "الحساب الأصلي #{n}",
	"accountMigrationMoveTo": "انقل هذا الحساب لحساب آخر",
	"accountMigrationMoveAccountDescription": "This will migrate your account to a different one.\n\u3000・Followers from this account will automatically be migrated to the new account\n\u3000・This account will unfollow all users it is currently following\n\u3000・You will be unable to create new notes etc. on this account\n\nWhile migration of followers is automatic, you must manually prepare some steps to migrate the list of users you are following. To do so, carry out a follows export that you will later import on the new account in the settings menu. The same procedure applies to your lists as well as your muted and blocked users.\n\n(This explanation applies to Misskey v13.12.0 and later. Other ActivityPub software, such as Mastodon, might function differently.)",
	"accountMigrationMoveAccountHowTo": "To migrate, first create an alias for this account on the account to move to.\nAfter you have created the alias, enter the account to move to in the following format: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "لا يمكن التراجع عن نقل الحساب.",
	"accountMigrationMoveToLabel": "الحساب الوجهة:",
	"accountMigrationStartMigration": "Migrate",
	"accountMigrationPostMigrationNote": "This account will unfollow all accounts it is currently following 24 hours after migration finishes.\nBoth the number of follows and followers will then become zero. To avoid your followers from being unable to see followers only posts of this account, they will however continue following this account.",
	"accountMigrationMovedAndCannotBeUndone": "\nThis account has been migrated.\nMigration cannot be reversed.",
	"accountMigrationMovedTo": "الحساب الوجهة:",
	"accountMigrationMigrationConfirm": "Really migrate this account to {account}? Once started, this process cannot be stopped or taken back, and you will not be able to use this account in its original state anymore."
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"accountMigrationMoveFrom": "Migrar un altre compte a aquest",
	"accountMigrationMoveFromSub": "Crear un àlies per un altre compte",
	"accountMigrationMoveFromDescription": "Has de crear un àlies del compte que vols migrar en aquest compte.\nFes servir aquest format per posar el compte que vols migrar: @nomusuari@servidor.exemple.com\nPer esborrar l'àlies deixa el camp en blanc (no és recomanable de fer)",
	"add": "Afegir",
	"save": "Desa",
	"accountMigrationMoveFromLabel": "Compte original #{n}",
	"accountMigrationMoveTo": "Migrar aquest compte a un altre",
	"accountMigrationMoveAccountDescription": "Això migrarà el teu compte a un altre diferent.\n\u3000・Els seguidors d'aquest compte és passaran al compte nou de forma automàtica\n\u3000・Es deixaran de seguir a tots els usuaris que es segueixen actualment en aquest compte\n\u3000・No es poden crear notes noves, etc. en aquest compte\n\nSi bé la migració de seguidors es automàtica, has de preparar alguns pasos manualment per migrar la llista d'usuaris que segueixes. Per fer això has d'exportar els seguidors que després importaraes al compte nou mitjançant el menú de configuració. El mateix procediment s'ha de seguir per less teves llistes i els teus usuaris silenciats i bloquejats.\n\n(Aquesta explicació s'aplica a Misskey v13.12.0 i posteriors. Altres aplicacions, com Mastodon, poden funcionar diferent.)",
	"accountMigrationMoveAccountHowTo": "Per fer la migració, primer has de crear un àlies per aquest compte al compte al qual vols migrar.\nDesprés de crear l'àlies, introdueix el compte al qual vols migrar amb el format següent: @nomusuari@servidor.exemple.com",
	"accountMigrationMoveCannotBeUndone": "Les migracions dels comptes no es poden desfer.",
	"accountMigrationMoveToLabel": "Compte al qual es vol migrar:",
	"accountMigrationStartMigration": "Migrar",
	"accountMigrationPostMigrationNote": "Aquest compte deixarà de seguir tots els comptes que segueix 24 hores després de terminar la migració.\nEl nombre de seguidors i seguits passarà a ser de zero. Per evitar que els teus seguidors no puguin veure les publicacions marcades com a només seguidors continuaren seguint aquest compte.",
	"accountMigrationMovedAndCannotBeUndone": "Aquest compte ha migrat.\nLes migracions no es poden desfer.",
	"accountMigrationMovedTo": "Nou compte:",
	"accountMigrationMigrationConfirm": "Vols migrar aquest compte a {account}? Una vegada comenci la migració no es podrà parar O fer marxa enrere i no podràs tornar a fer servir aquest compte mai més."
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"accountMigrationMoveFrom": "Migrace jiného účtu na tento účet",
	"accountMigrationMoveFromSub": "Vytvořit alias na jiný účet",
	"accountMigrationMoveFromDescription": "Pro účet, ze kterého se chcete přesunout, musíte vytvořit alias na tomto účtu.\nZadejte účet, ze kterého chcete přejít, v následujícím formátu: @username@server.example.com\nChcete-li alias odstranit, ponechte pole prázdné (nedoporučuje se).",
	"add": "Přidat",
	"save": "Uložit",
	"accountMigrationMoveFromLabel": "Původní účet #{n}",
	"accountMigrationMoveTo": "Přesunout tenhle účet do jiného",
	"accountMigrationMoveAccountDescription": "Tím dojde k migraci vašeho účtu na jiný účet.\n\u3000・Sledovatelé z tohoto účtu budou automaticky převedeni na nový účet.\n\u3000・Tento účet zruší sledování všech uživatelů, které aktuálně sleduje.\n\u3000・Na tomto účtu nebude možné vytvářet nové poznámky atd.\n\nZatímco migrace sledovaných uživatelů probíhá automaticky, pro migraci seznamu sledovaných uživatelů je nutné připravit některé kroky ručně. Za tímto účelem proveďte export sledovaných, který později naimportujete na nový účet v nabídce nastavení. Stejný postup platí pro seznamy i pro ztlumené a zablokované uživatele.\n\n(Tento výklad platí pro Misskey v13.12.0 a novější. Jiný software ActivityPub, například Mastodon, může fungovat jinak.)",
	"accountMigrationMoveAccountHowTo": "Chcete-li migrovat, vytvořte nejprve alias tohoto účtu na účtu, na který chcete přejít.\nPo vytvoření aliasu zadejte účet, na který chcete přejít, v následujícím formátu: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "Migrace účtu nemůže být vrácena.",
	"accountMigrationMoveToLabel": "Cílový účet pro přesunutí:",
	"accountMigrationStartMigration": "Migrovat",
	"accountMigrationPostMigrationNote": "Tento účet zruší sledování všech účtů, které aktuálně sleduje, 24 hodin po dokončení migrace.\nPočet sledujících i následovníků se poté vynuluje. Aby se zabránilo tomu, že vaši sledující nebudou moci vidět příspěvky tohoto účtu určené pouze pro sledující, budou však tento účet sledovat i nadále.",
	"accountMigrationMovedAndCannotBeUndone": "\nTento účet byl převeden.\nMigraci nelze vrátit zpět.",
	"accountMigrationMovedTo": "Cílový účet pro přesunutí:",
	"accountMigrationMigrationConfirm": "Opravdu chcete migrovat tento účet na {account}? Jednou zahájený proces nelze zastavit ani vrátit zpět a tento účet již nebudete moci používat v původním stavu."
}
</locale>

<locale lang="json" locale="da-DK">
{
	"accountMigrationMoveFrom": "Migrate another account to this one",
	"accountMigrationMoveFromSub": "Create alias to another account",
	"accountMigrationMoveFromDescription": "You must create an alias for the account to move from on this account.\nEnter the account to migrate from in the following format: @username@server.example.com\nTo delete the alias, leave the field empty (not recommended).",
	"add": "Add",
	"save": "Save",
	"accountMigrationMoveFromLabel": "Original Account #{n}",
	"accountMigrationMoveTo": "Migrate this account to a different one",
	"accountMigrationMoveAccountDescription": "This will migrate your account to a different one.\n\u3000・Followers from this account will automatically be migrated to the new account\n\u3000・This account will unfollow all users it is currently following\n\u3000・You will be unable to create new notes etc. on this account\n\nWhile migration of followers is automatic, you must manually prepare some steps to migrate the list of users you are following. To do so, carry out a follows export that you will later import on the new account in the settings menu. The same procedure applies to your lists as well as your muted and blocked users.\n\n(This explanation applies to Misskey v13.12.0 and later. Other ActivityPub software, such as Mastodon, might function differently.)",
	"accountMigrationMoveAccountHowTo": "To migrate, first create an alias for this account on the account to move to.\nAfter you have created the alias, enter the account to move to in the following format: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "Account migration cannot be undone.",
	"accountMigrationMoveToLabel": "Account to move to:",
	"accountMigrationStartMigration": "Migrate",
	"accountMigrationPostMigrationNote": "This account will unfollow all accounts it is currently following 24 hours after migration finishes.\nBoth the number of follows and followers will then become zero. To avoid your followers from being unable to see followers only posts of this account, they will however continue following this account.",
	"accountMigrationMovedAndCannotBeUndone": "\nThis account has been migrated.\nMigration cannot be reversed.",
	"accountMigrationMovedTo": "New account:",
	"accountMigrationMigrationConfirm": "Really migrate this account to {account}? Once started, this process cannot be stopped or taken back, and you will not be able to use this account in its original state anymore."
}
</locale>

<locale lang="json" locale="de-DE">
{
	"accountMigrationMoveFrom": "Von einem anderen Konto zu diesem migrieren",
	"accountMigrationMoveFromSub": "Alias für ein anderes Konto erstellen",
	"accountMigrationMoveFromDescription": "Um von einem anderen Konto zu diesem zu migrieren, muss zuvor hier ein Alias eingerichtet werden.\nGib das Konto, von dem migriert werden soll, in folgendem Format ein: @username@server.example.com\n\nZum Löschen des Alias kann das Feld leergelassen werden (nicht empfohlen).",
	"add": "Hinzufügen",
	"save": "Speichern",
	"accountMigrationMoveFromLabel": "Migrationsursprung #{n}",
	"accountMigrationMoveTo": "Dieses Konto zu einem neuen migrieren",
	"accountMigrationMoveAccountDescription": "Hierdurch wird dein Konto zu einem anderen migriert.\n\u3000・Follower von diesem Konto werden automatisch auf das neue Konto migriert\n\u3000・Dieses Konto wird allen Nutzern, denen es derzeit folgt, nicht mehr folgen\n\u3000・Mit diesem Konto können keine neuen Notizen usw. erstellt werden\n\nWährend die Migration der Follower automatisch erfolgt, muss die Migration der Konten, denen du folgst, manuell vorbereitet werden. Exportiere hierzu die Liste der gefolgten Nutzer über das Einstellungsmenu, und importiere diese Liste im neuen Konto. Das gleiche Verfahren gilt für erstellte Listen und stummgeschaltete oder blockierte Nutzer.\n\n(Diese Erklärung gilt für Misskey v13.12.0 oder später. Die Funktionsweise andere ActivityPub-Software, beispielsweise Mastodon,  kann hiervon abweichen.)",
	"accountMigrationMoveAccountHowTo": "Um ein Konto zu migrieren, erstelle zuerst auf dem Umzugsziel einen Alias für dieses Konto.\nGib dann das Umzugsziel in folgendem Format ein: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "Die Migration eines Benutzerkontos ist unwiderruflich.",
	"accountMigrationMoveToLabel": "Umzugsziel:",
	"accountMigrationStartMigration": "Migrieren",
	"accountMigrationPostMigrationNote": "Dieses Konto wird 24 Stunden nach Abschluss der Migration allen Konten, denen es derzeit folgt, nicht mehr folgen.\n\nSowohl die Anzahl der Follower als auch die der Konten, denen dieses Konto folgt, wird dann auf Null gesetzt. Um zu vermeiden, dass Follower dieses Kontos dessen Beiträge, welche nur für Follower bestimmt sind, nicht mehr sehen können, werden sie diesem Konto jedoch weiterhin folgen.",
	"accountMigrationMovedAndCannotBeUndone": "\nDieses Konto wurde migriert.\nDiese Aktion ist unwiderruflich.",
	"accountMigrationMovedTo": "Neues Konto:",
	"accountMigrationMigrationConfirm": "Dieses Konto wirklich zu {account} umziehen? Sobald der Umzug beginnt, kann er nicht rückgängig gemacht werden, und dieses Konto nicht wieder im ursprünglichen Zustand verwendet werden."
}
</locale>

<locale lang="json" locale="en-US">
{
	"accountMigrationMoveFrom": "Migrate another account to this one",
	"accountMigrationMoveFromSub": "Create alias to another account",
	"accountMigrationMoveFromDescription": "You must create an alias for the account to move from on this account.\nEnter the account to migrate from in the following format: @username@server.example.com\nTo delete the alias, leave the field empty (not recommended).",
	"add": "Add",
	"save": "Save",
	"accountMigrationMoveFromLabel": "Original Account #{n}",
	"accountMigrationMoveTo": "Migrate this account to a different one",
	"accountMigrationMoveAccountDescription": "This will migrate your account to a different one.\n\u3000・Followers from this account will automatically be migrated to the new account\n\u3000・This account will unfollow all users it is currently following\n\u3000・You will be unable to create new notes etc. on this account\n\nWhile migration of followers is automatic, you must manually prepare some steps to migrate the list of users you are following. To do so, carry out a follows export that you will later import on the new account in the settings menu. The same procedure applies to your lists as well as your muted and blocked users.\n\n(This explanation applies to Misskey v13.12.0 and later. Other ActivityPub software, such as Mastodon, might function differently.)",
	"accountMigrationMoveAccountHowTo": "To migrate, first create an alias for this account on the account to move to.\nAfter you have created the alias, enter the account to move to in the following format: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "Account migration cannot be undone.",
	"accountMigrationMoveToLabel": "Account to move to:",
	"accountMigrationStartMigration": "Migrate",
	"accountMigrationPostMigrationNote": "This account will unfollow all accounts it is currently following 24 hours after migration finishes.\nBoth the number of follows and followers will then become zero. To avoid your followers from being unable to see followers only posts of this account, they will however continue following this account.",
	"accountMigrationMovedAndCannotBeUndone": "\nThis account has been migrated.\nMigration cannot be reversed.",
	"accountMigrationMovedTo": "New account:",
	"accountMigrationMigrationConfirm": "Really migrate this account to {account}? Once started, this process cannot be stopped or taken back, and you will not be able to use this account in its original state anymore."
}
</locale>

<locale lang="json" locale="es-ES">
{
	"accountMigrationMoveFrom": "Trasladar de otra cuenta a ésta",
	"accountMigrationMoveFromSub": "Crear un alias para otra cuenta.",
	"accountMigrationMoveFromDescription": "Si quieres transferir seguidores de otra cuenta a esta cuenta y trasladarlos, tendrás que crear un alias aquí. Asegúrate de crearlo antes de realizar el traslado. Introduce la cuenta desde la que estás moviendo los seguidores así: @person@instance.com",
	"add": "Agregar",
	"save": "Guardar",
	"accountMigrationMoveFromLabel": "Cuenta desde la que se realiza el traslado #{n}",
	"accountMigrationMoveTo": "Mover esta cuenta a una nueva",
	"accountMigrationMoveAccountDescription": "Esta operación no puede deshacerse. En primer lugar, asegúrese de haber creado un alias para esta cuenta en la cuenta a la que se va a trasladar. Después de crear el alias, introduzca la cuenta a la que se está trasladando de la siguiente manera: @person@instance.com",
	"accountMigrationMoveAccountHowTo": "Para migrar, primero crea un alias para ésta cuenta en la cuenta a donde te moverás.\nDespués de crear el alias, ingresa la cuenta a mover de la siguiente forma:\n@usuario@servidor.ejempo.com",
	"accountMigrationMoveCannotBeUndone": "La migración de la cuenta no puede ser revertida.",
	"accountMigrationMoveToLabel": "Cuenta destino:",
	"accountMigrationStartMigration": "Migrar",
	"accountMigrationPostMigrationNote": "Ésta cuenta dejará de seguir a todas las cuentas en las siguientes 24 horas después de que finalice la migración.\nEl número de seguidos y seguidores serán 0. Para evitar que Para evitar que tus seguidores dejen de ver las publicaciones, todas serán marcadas como \"sólo seguidores\".",
	"accountMigrationMovedAndCannotBeUndone": "\nLa migración decuenta ha sido completada.\nNo se puede revertir éste proceso.",
	"accountMigrationMovedTo": "Cuenta destino:",
	"accountMigrationMigrationConfirm": "¿Estás seguro de que quieres mover esta cuenta a {account}? Una vez trasladada, no podrás deshacer el traslado y no podrás volver a utilizar la cuenta original.\n\nAdemás, compruebe que ha configurado un alias en el destino del traslado."
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"accountMigrationMoveFrom": "Migrer un autre compte vers le présent compte",
	"accountMigrationMoveFromSub": "Créer un alias vers un autre compte",
	"accountMigrationMoveFromDescription": "You must create an alias for the account to move from on this account.\nEnter the account to migrate from in the following format: @username@server.example.com\nTo delete the alias, leave the field empty (not recommended).",
	"add": "Ajouter",
	"save": "Enregistrer",
	"accountMigrationMoveFromLabel": "Original Account #{n}",
	"accountMigrationMoveTo": "Migrate this account to a different one",
	"accountMigrationMoveAccountDescription": "This will migrate your account to a different one.\n\u3000・Followers from this account will automatically be migrated to the new account\n\u3000・This account will unfollow all users it is currently following\n\u3000・You will be unable to create new notes etc. on this account\n\nWhile migration of followers is automatic, you must manually prepare some steps to migrate the list of users you are following. To do so, carry out a follows export that you will later import on the new account in the settings menu. The same procedure applies to your lists as well as your muted and blocked users.\n\n(This explanation applies to Misskey v13.12.0 and later. Other ActivityPub software, such as Mastodon, might function differently.)",
	"accountMigrationMoveAccountHowTo": "To migrate, first create an alias for this account on the account to move to.\nAfter you have created the alias, enter the account to move to in the following format: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "Account migration cannot be undone.",
	"accountMigrationMoveToLabel": "Compte vers lequel vous migrez :",
	"accountMigrationStartMigration": "Migrer",
	"accountMigrationPostMigrationNote": "This account will unfollow all accounts it is currently following 24 hours after migration finishes.\nBoth the number of follows and followers will then become zero. To avoid your followers from being unable to see followers only posts of this account, they will however continue following this account.",
	"accountMigrationMovedAndCannotBeUndone": "\nThis account has been migrated.\nMigration cannot be reversed.",
	"accountMigrationMovedTo": "Compte vers lequel vous migrez :",
	"accountMigrationMigrationConfirm": "Really migrate this account to {account}? Once started, this process cannot be stopped or taken back, and you will not be able to use this account in its original state anymore."
}
</locale>

<locale lang="json" locale="id-ID">
{
	"accountMigrationMoveFrom": "Pindahkan akun lain ke akun ini",
	"accountMigrationMoveFromSub": "Buat alias ke akun lain",
	"accountMigrationMoveFromDescription": "Kamu harus membuat alias untuk akun asal kamu berpindah ke akun ini\nMasukkan alias akun asal kamu berpindah ke dalam format berikut: @namapengguna@nama.server.com\nUntuk menghapus alias, kosongkan kolom ini (tidak direkomendasikan).",
	"add": "Tambahkan",
	"save": "Simpan",
	"accountMigrationMoveFromLabel": "Akun asli #{n}",
	"accountMigrationMoveTo": "Pindahkan akun ini ke akun lain",
	"accountMigrationMoveAccountDescription": "Hal ini akan memindahkan akun kamu ke akun lain.\n\u3000・Pengikut dari akun ini akan secara otomatis dipindahkan ke akun baru\n\u3000・Akun ini akan berhenti mengikuti dari semua pengguna yang sedang kamu ikuti\n\u3000・Kamu akan tidak dapat membuat catatan baru dan lain-lain pada akun ini\n\nMeskipun pemindahan pengikut dilakukan secara otomatis, kamu harus mempersiapkan beberapa langkah secara manual untuk memindahkan daftar pengguna yang sedang kamu ikuti. Untuk melakukan tersebut, lakukan ekspor daftar ikuti yang nantinya dapat kamu impor pada menu pengaturan di akun baru kamu. Prosedur yang sama juga dapat diterapkan pada daftar seperti pengguna yang kamu bisukan atau blokir.\n\n(Penjelasan ini hanya berlaku pada Misskey versi 13.12.0 dan setelahnya. Perangkat lunak ActivityPub lainnya seperti Mastodon berkemungkinan befungsi berbeda.)",
	"accountMigrationMoveAccountHowTo": "Untuk pindah, pertama buat alias untuk akun ini pada akun tujuan kamu berpindah.\nSetelah kamu membuat alias, masukkan akun tujuan kamu berpindah ke dalam format berikut:\n@namapengguna@nama.server.com",
	"accountMigrationMoveCannotBeUndone": "Pemindahan akun tidak dapat diurungkan.",
	"accountMigrationMoveToLabel": "Akun tujuan pindah:",
	"accountMigrationStartMigration": "Pindahkan",
	"accountMigrationPostMigrationNote": "24 jam setelah pemindahan akun selesai, akun ini akan berhenti mengikuti semua akun yang sedang diikuti. Angka mengikut dan pengikut akan menjadi nol. Untuk menghindari pengikut kamu tidak dapat melihat postingan hanya pengikut saja dalam postingan ini, mereka akan tetap mengikuti akun ini.",
	"accountMigrationMovedAndCannotBeUndone": "\nAkun ini telah dipindahkan.\nPemindahan tidak dapat diurungkan.",
	"accountMigrationMovedTo": "Akun baru tujuan pindah:",
	"accountMigrationMigrationConfirm": "Yakin untuk memindahkan akun ini ke {account}? Sekali dimulai, proses ini tidak dapat dihentikan atau ditarik kembali, dan kamu tidak dapat menggunakan akun ini lagi dalam keadaan asli semula."
}
</locale>

<locale lang="json" locale="it-IT">
{
	"accountMigrationMoveFrom": "Migra un altro profilo dentro a questo",
	"accountMigrationMoveFromSub": "Crea un alias verso un altro profilo remoto",
	"accountMigrationMoveFromDescription": "Se desideri spostare i Follower da un altro profilo a questo, devi prima creare un alias qui. Assicurati averlo creato PRIMA di eseguire l'attività! Inserisci l'indirizzo del profilo mittente in questo modo: @persona@vecchia.istanza.it",
	"add": "Aggiungi",
	"save": "Salva",
	"accountMigrationMoveFromLabel": "Profilo da cui migrare n. {n}",
	"accountMigrationMoveTo": "Migrare questo profilo verso un un altro",
	"accountMigrationMoveAccountDescription": "Questa attività è irreversibile! Innanzitutto, assicurati di aver creato, nella istanza di destinazione, un alias con l'indirizzo di questo profilo. Successivamente, indica qui il profilo di destinazione in questo modo: @persona@istanza.it",
	"accountMigrationMoveAccountHowTo": "Per migrare su un profilo remoto, crea prima un alias di questo profilo, sulla istanza di destinazione.\nDopo aver creato l'alias, inserisci l'indirizzo di destinazione, indicando ad esempio: @profilo@altra.istanza",
	"accountMigrationMoveCannotBeUndone": "La migrazione è irreversibile, non può essere interrotta o annullata.",
	"accountMigrationMoveToLabel": "Profilo verso cui migrare",
	"accountMigrationStartMigration": "Avvia la migrazione",
	"accountMigrationPostMigrationNote": "Questo profilo smetterà di seguire gli altri profili remoti a 24 ore dal termine della migrazione.\nSia i Following che i Follower scenderanno a zero. I tuoi Follower saranno comunque in grado di vedere le Note per soli Follower, poiché non smetteranno di seguirti.",
	"accountMigrationMovedAndCannotBeUndone": "Il tuo profilo è stato migrato.\nLa migrazione non può essere annullata.",
	"accountMigrationMovedTo": "Profilo verso cui migrare",
	"accountMigrationMigrationConfirm": "Vuoi davvero migrare questo profilo su {account}? L'azione è irreversibile e non potrai più utilizzare questo profilo nel suo stato originale.\nInoltre, assicurati di aver già creato un alias sull'account a cui ti stai trasferendo."
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"accountMigrationMoveFrom": "別のアカウントからこのアカウントに移行",
	"accountMigrationMoveFromSub": "別のアカウントへエイリアスを作成",
	"accountMigrationMoveFromDescription": "別のアカウントからこのアカウントに移行したい場合、ここでエイリアスを作成しておく必要があります。\n移行元のアカウントをこのように入力してください: @username@server.example.com\n削除するには、入力欄を空にして保存します（非推奨）。",
	"add": "追加",
	"save": "保存",
	"accountMigrationMoveFromLabel": "移行元のアカウント #{n}",
	"accountMigrationMoveTo": "このアカウントを新しいアカウントへ移行",
	"accountMigrationMoveAccountDescription": "新しいアカウントへ移行します。\n\u3000・フォロワーが新しいアカウントを自動でフォローします\n\u3000・このアカウントからのフォローは全て解除されます\n\u3000・このアカウントではノートの作成などができなくなります\n\nフォロワーの移行は自動ですが、フォローの移行は手動で行う必要があります。移行前にこのアカウントでフォローエクスポートし、移行後すぐに移行先アカウントでインポートを行なってください。\nリスト・ミュート・ブロックについても同様ですので、手動で移行する必要があります。\n\n（この説明はこのサーバー（Misskey v13.12.0以降）の仕様です。Mastodonなどの他のActivityPubソフトウェアでは挙動が異なる場合があります。）",
	"accountMigrationMoveAccountHowTo": "アカウントの移行には、まずは移行先のアカウントでこのアカウントに対しエイリアスを作成します。\nエイリアス作成後、移行先のアカウントを次のように入力してください: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "アカウントを移行すると、取り消すことはできません。",
	"accountMigrationMoveToLabel": "移行先のアカウント:",
	"accountMigrationStartMigration": "移行する",
	"accountMigrationPostMigrationNote": "このアカウントからのフォロー解除は移行操作から24時間後に実行されます。\nこのアカウントのフォロー・フォロワー数は0になっています。フォロワーの解除はされないため、あなたのフォロワーはこのアカウントのフォロワー向け投稿を引き続き閲覧できます。",
	"accountMigrationMovedAndCannotBeUndone": "\nアカウントは移行されています。\n移行を取り消すことはできません。",
	"accountMigrationMovedTo": "移行先のアカウント:",
	"accountMigrationMigrationConfirm": "本当にこのアカウントを {account} に移行しますか？一度移行すると取り消せず、二度とこのアカウントを元の状態で使用できなくなります。"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"accountMigrationMoveFrom": "別のアカウントからこのアカウントに引っ越す",
	"accountMigrationMoveFromSub": "別のアカウントへエイリアスを作る",
	"accountMigrationMoveFromDescription": "別のアカウントからこのアカウントにフォロワーを引っ越ししたいんなら、ここでエイリアスを作っとかなアカンで。\n引っ越す前のアカウントをこんな感じに入力してや: @username@server.example.com\n入力欄空っぽやったら消しとくで（おすすめはせえへん）。",
	"add": "増やす",
	"save": "とっとく",
	"accountMigrationMoveFromLabel": "引っ越しする前のアカウント #{n}",
	"accountMigrationMoveTo": "このアカウントをさらのアカウントに引っ越すで",
	"accountMigrationMoveAccountDescription": "おニューのアカウントに移行すんで。\n\u3000・フォロワーがおニューの方を勝手にフォローすんで。\n\u3000・このアカウントからのフォローはまるまる全部解除されんで。\n\u3000・このアカウントでノート作れへんようになるで。\n\nフォロワーの移行は勝手にこっちでやっとくけど、フォローの移行は自分でしてや。移行前にこのアカウントでフォローエクスポートして、移行したあとすぐにおニューのところでインポートしてくれな。\nリストとかミュート、あとブロックもおんなじや。自分で移行してな。\n\n（この説明はこのサーバー、つまりMisskey v13.12.0から後の仕様や。Mastodonとか他のActivityPubソフトやとちょっと挙動が違うこともあんで。）",
	"accountMigrationMoveAccountHowTo": "アカウントの引っ越しには、まず引っ越し先のアカウントで自分のアカウントに対しエイリアスを作ってな。\nエイリアス作ったら、引っ越し先のアカウントをこんな感じに入れてや: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "アカウント引っ越したらもう戻せへん。",
	"accountMigrationMoveToLabel": "引っ越し先のアカウント:",
	"accountMigrationStartMigration": "引っ越す",
	"accountMigrationPostMigrationNote": "このアカウントからのフォロー解除は移行操作から丸一日経ったら実行されんで。\nこのアカウントのフォロー・フォロワー数はどっちも0や。フォローの解除はされへんから、あんたのフォロワーはこのアカウントのフォロワー向けの投稿をこの後も見れるで。",
	"accountMigrationMovedAndCannotBeUndone": "\nアカウントはもう引っ越し済みや。\nこれはもう戻せへん。",
	"accountMigrationMovedTo": "引っ越し先のアカウント:",
	"accountMigrationMigrationConfirm": "ほんまにこのアカウントを {account} に引っ越すんか？一回引っ越してもうたら取り消されへんし、二度とこのアカウントを元に戻されへんくなるで。\nそれと、引っ越し先のアカウントでエイリアスが作れたかちゃ～んと確認しーや？"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"accountMigrationMoveFrom": "Migrate another account to this one",
	"accountMigrationMoveFromSub": "Create alias to another account",
	"accountMigrationMoveFromDescription": "You must create an alias for the account to move from on this account.\nEnter the account to migrate from in the following format: @username@server.example.com\nTo delete the alias, leave the field empty (not recommended).",
	"add": "Add",
	"save": "Sekles",
	"accountMigrationMoveFromLabel": "Original Account #{n}",
	"accountMigrationMoveTo": "Migrate this account to a different one",
	"accountMigrationMoveAccountDescription": "This will migrate your account to a different one.\n\u3000・Followers from this account will automatically be migrated to the new account\n\u3000・This account will unfollow all users it is currently following\n\u3000・You will be unable to create new notes etc. on this account\n\nWhile migration of followers is automatic, you must manually prepare some steps to migrate the list of users you are following. To do so, carry out a follows export that you will later import on the new account in the settings menu. The same procedure applies to your lists as well as your muted and blocked users.\n\n(This explanation applies to Misskey v13.12.0 and later. Other ActivityPub software, such as Mastodon, might function differently.)",
	"accountMigrationMoveAccountHowTo": "To migrate, first create an alias for this account on the account to move to.\nAfter you have created the alias, enter the account to move to in the following format: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "Account migration cannot be undone.",
	"accountMigrationMoveToLabel": "Account to move to:",
	"accountMigrationStartMigration": "Migrate",
	"accountMigrationPostMigrationNote": "This account will unfollow all accounts it is currently following 24 hours after migration finishes.\nBoth the number of follows and followers will then become zero. To avoid your followers from being unable to see followers only posts of this account, they will however continue following this account.",
	"accountMigrationMovedAndCannotBeUndone": "\nThis account has been migrated.\nMigration cannot be reversed.",
	"accountMigrationMovedTo": "New account:",
	"accountMigrationMigrationConfirm": "Really migrate this account to {account}? Once started, this process cannot be stopped or taken back, and you will not be able to use this account in its original state anymore."
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"accountMigrationMoveFrom": "Migrate another account to this one",
	"accountMigrationMoveFromSub": "Create alias to another account",
	"accountMigrationMoveFromDescription": "You must create an alias for the account to move from on this account.\nEnter the account to migrate from in the following format: @username@server.example.com\nTo delete the alias, leave the field empty (not recommended).",
	"add": "Add",
	"save": "ಉಳಿಸಿ",
	"accountMigrationMoveFromLabel": "Original Account #{n}",
	"accountMigrationMoveTo": "Migrate this account to a different one",
	"accountMigrationMoveAccountDescription": "This will migrate your account to a different one.\n\u3000・Followers from this account will automatically be migrated to the new account\n\u3000・This account will unfollow all users it is currently following\n\u3000・You will be unable to create new notes etc. on this account\n\nWhile migration of followers is automatic, you must manually prepare some steps to migrate the list of users you are following. To do so, carry out a follows export that you will later import on the new account in the settings menu. The same procedure applies to your lists as well as your muted and blocked users.\n\n(This explanation applies to Misskey v13.12.0 and later. Other ActivityPub software, such as Mastodon, might function differently.)",
	"accountMigrationMoveAccountHowTo": "To migrate, first create an alias for this account on the account to move to.\nAfter you have created the alias, enter the account to move to in the following format: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "Account migration cannot be undone.",
	"accountMigrationMoveToLabel": "Account to move to:",
	"accountMigrationStartMigration": "Migrate",
	"accountMigrationPostMigrationNote": "This account will unfollow all accounts it is currently following 24 hours after migration finishes.\nBoth the number of follows and followers will then become zero. To avoid your followers from being unable to see followers only posts of this account, they will however continue following this account.",
	"accountMigrationMovedAndCannotBeUndone": "\nThis account has been migrated.\nMigration cannot be reversed.",
	"accountMigrationMovedTo": "New account:",
	"accountMigrationMigrationConfirm": "Really migrate this account to {account}? Once started, this process cannot be stopped or taken back, and you will not be able to use this account in its original state anymore."
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"accountMigrationMoveFrom": "다른 계정에서 이 계정으로 이사",
	"accountMigrationMoveFromSub": "다른 계정에 대한 별칭을 생성",
	"accountMigrationMoveFromDescription": "다른 계정에서 이 계정으로 팔로워를 가져오려면, 우선 여기에서 별칭을 지정해야 합니다. 반드시 이사하기 전에 지정해야 합니다! 기존 계정을 다음과 같은 형식으로 입력해 주십시오: @person@instance.com",
	"add": "추가",
	"save": "저장",
	"accountMigrationMoveFromLabel": "기존 계정 #{n}",
	"accountMigrationMoveTo": "이 계정에서 다른 계정으로 이사",
	"accountMigrationMoveAccountDescription": "새 계정으로 이전합니다.\n\u3000・팔로워가 새 계정을 자동으로 팔로우 합니다\n\u3000・이 계정에서 팔로우는 모두 해제됩니다\n\u3000・이 계정으로는 노트 작성 등을 할 수 없게 됩니다\n\n팔로워는 자동으로 이전되지만, 팔로우는 수동으로 진행해야 합니다. 이전하기 전에 이 계정에서 팔로우를 내보내고, 이전 후에는 즉시 이전한 계정에서 가져오기를 진행하십시오.\n리스트・뮤트・차단에 대해서도 마찬가지이므로 수동으로 이전해야 합니다.\n\n(이 설명은 이 서버(Misskey v13.12.0 이후)의 사양입니다. Mastodon 등의 다른 ActivityPub 소프트웨어에서는 작동이 다를 수 있습니다.)",
	"accountMigrationMoveAccountHowTo": "계정을 이사하려면 우선 이사갈 계정에서 이 계정에 대한 별칭을 지정해야 합니다.\n별칭을 작성한 다음, 이사갈 계정을 다음과 같이 입력하십시오:\n@username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "한 번 이사하면, 두 번 다시 되돌릴 수 없습니다.",
	"accountMigrationMoveToLabel": "이사할 계정:",
	"accountMigrationStartMigration": "이사하기",
	"accountMigrationPostMigrationNote": "이 계정의 팔로잉 해제는 이사 후 24시간 뒤에 실행됩니다.\n이 계정의 팔로우 및 팔로워 수는 0으로 표시됩니다. 팔로워 해제는 이루어지지 않으므로, 당신의 팔로워는 이 계정의 팔로워 한정 게시물을 계속해서 열람할 수 있습니다.",
	"accountMigrationMovedAndCannotBeUndone": "\n이사한 계정입니다.\n이사는 취소할 수 없습니다.",
	"accountMigrationMovedTo": "이사할 계정:",
	"accountMigrationMigrationConfirm": "정말로 이 계정을 {account} 으로 이전하시겠습니까? 한 번 이전한 다음에는 취소할 수 없으며, 두 번 다시 원래 상태로 복구할 수 없습니다.\n이사할 계정에서 계정 별칭을 지정하였는지 다시 한 번 확인하십시오."
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"accountMigrationMoveFrom": "Migrate another account to this one",
	"accountMigrationMoveFromSub": "Create alias to another account",
	"accountMigrationMoveFromDescription": "You must create an alias for the account to move from on this account.\nEnter the account to migrate from in the following format: @username@server.example.com\nTo delete the alias, leave the field empty (not recommended).",
	"add": "Toevoegen",
	"save": "Opslaan",
	"accountMigrationMoveFromLabel": "Original Account #{n}",
	"accountMigrationMoveTo": "Migrate this account to a different one",
	"accountMigrationMoveAccountDescription": "This will migrate your account to a different one.\n\u3000・Followers from this account will automatically be migrated to the new account\n\u3000・This account will unfollow all users it is currently following\n\u3000・You will be unable to create new notes etc. on this account\n\nWhile migration of followers is automatic, you must manually prepare some steps to migrate the list of users you are following. To do so, carry out a follows export that you will later import on the new account in the settings menu. The same procedure applies to your lists as well as your muted and blocked users.\n\n(This explanation applies to Misskey v13.12.0 and later. Other ActivityPub software, such as Mastodon, might function differently.)",
	"accountMigrationMoveAccountHowTo": "To migrate, first create an alias for this account on the account to move to.\nAfter you have created the alias, enter the account to move to in the following format: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "Account migration cannot be undone.",
	"accountMigrationMoveToLabel": "Account to move to:",
	"accountMigrationStartMigration": "Migrate",
	"accountMigrationPostMigrationNote": "This account will unfollow all accounts it is currently following 24 hours after migration finishes.\nBoth the number of follows and followers will then become zero. To avoid your followers from being unable to see followers only posts of this account, they will however continue following this account.",
	"accountMigrationMovedAndCannotBeUndone": "\nThis account has been migrated.\nMigration cannot be reversed.",
	"accountMigrationMovedTo": "New account:",
	"accountMigrationMigrationConfirm": "Really migrate this account to {account}? Once started, this process cannot be stopped or taken back, and you will not be able to use this account in its original state anymore."
}
</locale>

<locale lang="json" locale="no-NO">
{
	"accountMigrationMoveFrom": "Migrate another account to this one",
	"accountMigrationMoveFromSub": "Create alias to another account",
	"accountMigrationMoveFromDescription": "You must create an alias for the account to move from on this account.\nEnter the account to migrate from in the following format: @username@server.example.com\nTo delete the alias, leave the field empty (not recommended).",
	"add": "Legg til",
	"save": "Lagre",
	"accountMigrationMoveFromLabel": "Original Account #{n}",
	"accountMigrationMoveTo": "Migrate this account to a different one",
	"accountMigrationMoveAccountDescription": "This will migrate your account to a different one.\n\u3000・Followers from this account will automatically be migrated to the new account\n\u3000・This account will unfollow all users it is currently following\n\u3000・You will be unable to create new notes etc. on this account\n\nWhile migration of followers is automatic, you must manually prepare some steps to migrate the list of users you are following. To do so, carry out a follows export that you will later import on the new account in the settings menu. The same procedure applies to your lists as well as your muted and blocked users.\n\n(This explanation applies to Misskey v13.12.0 and later. Other ActivityPub software, such as Mastodon, might function differently.)",
	"accountMigrationMoveAccountHowTo": "To migrate, first create an alias for this account on the account to move to.\nAfter you have created the alias, enter the account to move to in the following format: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "Account migration cannot be undone.",
	"accountMigrationMoveToLabel": "Account to move to:",
	"accountMigrationStartMigration": "Migrate",
	"accountMigrationPostMigrationNote": "This account will unfollow all accounts it is currently following 24 hours after migration finishes.\nBoth the number of follows and followers will then become zero. To avoid your followers from being unable to see followers only posts of this account, they will however continue following this account.",
	"accountMigrationMovedAndCannotBeUndone": "\nThis account has been migrated.\nMigration cannot be reversed.",
	"accountMigrationMovedTo": "New account:",
	"accountMigrationMigrationConfirm": "Really migrate this account to {account}? Once started, this process cannot be stopped or taken back, and you will not be able to use this account in its original state anymore."
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"accountMigrationMoveFrom": "Migrate another account to this one",
	"accountMigrationMoveFromSub": "Create alias to another account",
	"accountMigrationMoveFromDescription": "You must create an alias for the account to move from on this account.\nEnter the account to migrate from in the following format: @username@server.example.com\nTo delete the alias, leave the field empty (not recommended).",
	"add": "Dodaj",
	"save": "Zapisz",
	"accountMigrationMoveFromLabel": "Original Account #{n}",
	"accountMigrationMoveTo": "Migrate this account to a different one",
	"accountMigrationMoveAccountDescription": "This will migrate your account to a different one.\n\u3000・Followers from this account will automatically be migrated to the new account\n\u3000・This account will unfollow all users it is currently following\n\u3000・You will be unable to create new notes etc. on this account\n\nWhile migration of followers is automatic, you must manually prepare some steps to migrate the list of users you are following. To do so, carry out a follows export that you will later import on the new account in the settings menu. The same procedure applies to your lists as well as your muted and blocked users.\n\n(This explanation applies to Misskey v13.12.0 and later. Other ActivityPub software, such as Mastodon, might function differently.)",
	"accountMigrationMoveAccountHowTo": "To migrate, first create an alias for this account on the account to move to.\nAfter you have created the alias, enter the account to move to in the following format: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "Account migration cannot be undone.",
	"accountMigrationMoveToLabel": "Account to move to:",
	"accountMigrationStartMigration": "Migrate",
	"accountMigrationPostMigrationNote": "This account will unfollow all accounts it is currently following 24 hours after migration finishes.\nBoth the number of follows and followers will then become zero. To avoid your followers from being unable to see followers only posts of this account, they will however continue following this account.",
	"accountMigrationMovedAndCannotBeUndone": "\nThis account has been migrated.\nMigration cannot be reversed.",
	"accountMigrationMovedTo": "New account:",
	"accountMigrationMigrationConfirm": "Really migrate this account to {account}? Once started, this process cannot be stopped or taken back, and you will not be able to use this account in its original state anymore."
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"accountMigrationMoveFrom": "Migrar outra conta para essa",
	"accountMigrationMoveFromSub": "Criar um 'alias' a outra conta",
	"accountMigrationMoveFromDescription": "Se você deseja migrar de outra conta para esta, é necessário criar um alias aqui. Por favor, insira a conta de origem da migração no seguinte formato: @username@server.example.com. Para excluir o alias, deixe o campo em branco e clique em salvar (não recomendado).",
	"add": "Adicionar",
	"save": "Salvar",
	"accountMigrationMoveFromLabel": "Conta original #{n}",
	"accountMigrationMoveTo": "Migrar dessa conta para outra",
	"accountMigrationMoveAccountDescription": "Você está migrando para uma nova conta.\n\u3000・Seus seguidores irão automaticamente seguir a nova conta.\n\u3000・Todas as suas conexões de seguidores nesta conta serão removidas.\n\u3000・Você não poderá mais criar novas notas nesta conta.\n\nA migração dos seguidores é automática, mas a migração das pessoas que você segue deve ser feita manualmente. Antes de migrar, exporte quem você está seguindo nesta conta e, assim que migrar, importe essa lista na nova conta.\nO mesmo se aplica para listas, silenciamentos e bloqueios, que também devem ser migrados manualmente.\n\n(Esta descrição se refere ao comportamento do servidor Misskey v13.12.0 ou posterior. Outros softwares ActivityPub, como Mastodon, podem ter comportamentos diferentes.)",
	"accountMigrationMoveAccountHowTo": "Para realizar a migração da conta, primeiro crie um alias para esta conta no destino da migração. Após criar o alias, insira a conta de destino da migração no seguinte formato: @username@server.example.com.",
	"accountMigrationMoveCannotBeUndone": "A migração de conta não pode ser desfeita.",
	"accountMigrationMoveToLabel": "Conta para a qual se mover:",
	"accountMigrationStartMigration": "Migrar",
	"accountMigrationPostMigrationNote": "A remoção dos seguidores desta conta será realizada 24 horas após a operação de migração. O número de seguidores e seguidos desta conta se tornará zero. Os seguidores não serão removidos, portanto, eles continuarão a ver as postagens destinadas aos seguidores desta conta.",
	"accountMigrationMovedAndCannotBeUndone": "Essa conta foi migrada. A migração não pode ser desfeita.",
	"accountMigrationMovedTo": "Conta para a qual se mover:",
	"accountMigrationMigrationConfirm": "Tem certeza de que deseja migrar esta conta para '{account}'? Uma vez migrada, não poderá ser desfeita e não será possível usar esta conta novamente em seu estado original."
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"accountMigrationMoveFrom": "Перенести другую учётную запись сюда",
	"accountMigrationMoveFromSub": "Create alias to another account",
	"accountMigrationMoveFromDescription": "You must create an alias for the account to move from on this account.\nEnter the account to migrate from in the following format: @username@server.example.com\nTo delete the alias, leave the field empty (not recommended).",
	"add": "Добавить",
	"save": "Сохранить",
	"accountMigrationMoveFromLabel": "Original Account #{n}",
	"accountMigrationMoveTo": "Перенести учётную запись на другой сервер",
	"accountMigrationMoveAccountDescription": "Это действие перенесёт ваш аккаунт на другой сервер.\n\u3000・Подписчики с этого аккаунта автоматически подпишутся на новый\n\u3000・Этот аккаунт отпишется от всех пользователей, на которых подписан сейчас\n\u3000・Вы не сможете создавать новые заметки и т.д. на этом аккаунте\n\nТогда как перенос подписчиков происходит автоматически, вы должны будете подготовиться, сделав некоторые шаги, чтобы перенести список пользователей, на которых вы подписаны. Чтобы сделать это, экспортируйте список подписчиков в файл, который затем импортируете на новом аккаунте в меню настроек. То же самое необходимо будет сделать со списками, также как и со скрытыми и заблокированными пользователями.\n\n(Это объяснение применяется к Misskey v13.12.0 и выше. Другое ActivityPub программное обеспечение, такое, как Mastodon, может работать по-другому.",
	"accountMigrationMoveAccountHowTo": "To migrate, first create an alias for this account on the account to move to.\nAfter you have created the alias, enter the account to move to in the following format: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "Account migration cannot be undone.",
	"accountMigrationMoveToLabel": "Account to move to:",
	"accountMigrationStartMigration": "Перенести",
	"accountMigrationPostMigrationNote": "This account will unfollow all accounts it is currently following 24 hours after migration finishes.\nBoth the number of follows and followers will then become zero. To avoid your followers from being unable to see followers only posts of this account, they will however continue following this account.",
	"accountMigrationMovedAndCannotBeUndone": "Аккаунт был перемещён. Это действие необратимо.",
	"accountMigrationMovedTo": "New account:",
	"accountMigrationMigrationConfirm": "Really migrate this account to {account}? Once started, this process cannot be stopped or taken back, and you will not be able to use this account in its original state anymore."
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"accountMigrationMoveFrom": "Migrate another account to this one",
	"accountMigrationMoveFromSub": "Create alias to another account",
	"accountMigrationMoveFromDescription": "You must create an alias for the account to move from on this account.\nEnter the account to migrate from in the following format: @username@server.example.com\nTo delete the alias, leave the field empty (not recommended).",
	"add": "Pridať",
	"save": "Uložiť",
	"accountMigrationMoveFromLabel": "Original Account #{n}",
	"accountMigrationMoveTo": "Migrate this account to a different one",
	"accountMigrationMoveAccountDescription": "This will migrate your account to a different one.\n\u3000・Followers from this account will automatically be migrated to the new account\n\u3000・This account will unfollow all users it is currently following\n\u3000・You will be unable to create new notes etc. on this account\n\nWhile migration of followers is automatic, you must manually prepare some steps to migrate the list of users you are following. To do so, carry out a follows export that you will later import on the new account in the settings menu. The same procedure applies to your lists as well as your muted and blocked users.\n\n(This explanation applies to Misskey v13.12.0 and later. Other ActivityPub software, such as Mastodon, might function differently.)",
	"accountMigrationMoveAccountHowTo": "To migrate, first create an alias for this account on the account to move to.\nAfter you have created the alias, enter the account to move to in the following format: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "Account migration cannot be undone.",
	"accountMigrationMoveToLabel": "Account to move to:",
	"accountMigrationStartMigration": "Migrate",
	"accountMigrationPostMigrationNote": "This account will unfollow all accounts it is currently following 24 hours after migration finishes.\nBoth the number of follows and followers will then become zero. To avoid your followers from being unable to see followers only posts of this account, they will however continue following this account.",
	"accountMigrationMovedAndCannotBeUndone": "\nThis account has been migrated.\nMigration cannot be reversed.",
	"accountMigrationMovedTo": "New account:",
	"accountMigrationMigrationConfirm": "Really migrate this account to {account}? Once started, this process cannot be stopped or taken back, and you will not be able to use this account in its original state anymore."
}
</locale>

<locale lang="json" locale="th-TH">
{
	"accountMigrationMoveFrom": "ย้ายจากบัญชีอื่นมาที่บัญชีนี้",
	"accountMigrationMoveFromSub": "สร้างนามแฝงไปยังบัญชีอื่น",
	"accountMigrationMoveFromDescription": "หากต้องการโอนข้อมูลจากบัญชีอื่นมายังบัญชีนี้ จำเป็นต้องสร้างบัญชีนามแฝง (alias) ไว้ที่นี่ด้วย\nกรุณากรอกบัญชีเดิมในรูปแบบ: @username@server.example.com\nหากต้องการลบ alias, ให้เว้นว่างไว้แล้วบันทึก (ไม่แนะนำ)",
	"add": "เพิ่ม",
	"save": "บันทึก",
	"accountMigrationMoveFromLabel": "บัญชีที่จะย้ายจาก #{n}",
	"accountMigrationMoveTo": "ย้ายบัญชีนี้ไปยังบัญชีใหม่",
	"accountMigrationMoveAccountDescription": "การดำเนินการนี้จะย้ายบัญชีของคุณไปยังบัญชีอื่น\n・ผู้ที่กำลังติดตามคุณจากบัญชีนี้จะถูกย้ายไปยังบัญชีใหม่โดยอัตโนมัติ\n・บัญชีนี้จะเลิกติดตามผู้ใช้ทั้งหมดที่กำลังติดตามอยู่\n・คุณจะไม่สามารถสร้างโน้ต ฯลฯ ในบัญชีนี้ได้\n\nแม้ว่าการย้ายผู้ที่ติดตามคุณจะเป็นไปโดยอัตโนมัติ แต่คุณต้องเตรียมขั้นตอนบางอย่างด้วยตนเอง เพื่อย้ายรายชื่อผู้ใช้ที่คุณกำลังติดตาม โดยดำเนินการส่งออกรายชื่อแล้วค่อยนำเข้ามาภายหลังในเมนูการตั้งค่าของบัญชีใหม่ ใช้ขั้นตอนเดียวกันนี้ใช้รายชื่อผู้ใช้ที่ถูกปิดเสียงและถูกบล็อก\n\n(คำอธิบายนี้ใช้กับ Misskey v13.12.0 ขึ้นไป, ซอฟต์แวร์ ActivityPub อื่นๆ เช่น Mastodon อาจทำงานแตกต่างออกไป)",
	"accountMigrationMoveAccountHowTo": "การย้ายบัญชีจะเริ่มต้นโดยการสร้างบัญชีนามแฝง (alias) ของบัญชีนี้ ณ บัญชีที่เป็นปลายทาง หลังจากสร้างนามแฝงแล้ว ให้ป้อนบัญชีปลายทางในรูปแบบดังนี้: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "ไม่สามารถยกเลิกการโอนย้ายบัญชีได้",
	"accountMigrationMoveToLabel": "บัญชีที่จะย้ายไปที่:",
	"accountMigrationStartMigration": "โอนย้าย",
	"accountMigrationPostMigrationNote": "บัญชีนี้จะดำเนินการยกเลิกการติดตามทั้งหมดหลังจากการย้ายข้อมูลไปแล้ว 24 ชั่วโมง จำนวนกำลังติดตามและจำนวนผู้ติดตามของบัญชีนี้จะเป็น 0 และเพื่อหลีกเลี่ยงไม่ให้ผู้ติดตามคุณนั้นไม่สามารถเห็นโพสต์เฉพาะผู้ติดตามฯได้  การยกเลิกการติดตามจะไม่กระทบกับผู้ติดตามคุณ ดังนั้นผู้ติดตามคุณยังคงสามารถดูโพสต์ของบัญชีนี้ได้",
	"accountMigrationMovedAndCannotBeUndone": "\nบัญชีนี้ถูกโอนย้ายไปแล้ว\nไม่สามารถยกเลิกการโอนย้ายได้",
	"accountMigrationMovedTo": "บัญชีที่จะย้ายไป:",
	"accountMigrationMigrationConfirm": "ยืนยันการย้ายข้อมูลบัญชีนี้ไปที่ {account} เมื่อเริ่มแล้วจะไม่สามารถหยุดหรือนำกลับคืนมาได้ และคุณจะไม่สามารถใช้บัญชีนี้ในสถานะดั้งเดิมได้อีกต่อไป\n\nนอกจากนี้ คุณจำเป็นต้องสร้างบัญชีสำรองสำหรับการย้ายบัญชี"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"accountMigrationMoveFrom": "Başka bir hesabı bu hesaba taşıyın",
	"accountMigrationMoveFromSub": "Başka bir hesaba takma ad oluşturun",
	"accountMigrationMoveFromDescription": "Bu hesaptan taşınacak hesap için bir takma ad oluşturmalısınız.\nTaşınacak hesabı aşağıdaki biçimde girin: @username@server.example.com\nTakma adı silmek için alanı boş bırakın (önerilmez).",
	"add": "Ekle",
	"save": "Kaydet",
	"accountMigrationMoveFromLabel": "Orijinal Hesap #{n}",
	"accountMigrationMoveTo": "Bu hesabı başka bir hesaba taşıyın",
	"accountMigrationMoveAccountDescription": "Bu işlem, hesabını farklı bir hesaba taşıyacaktır.\n・Bu hesabın takipçileri otomatik olarak yeni hesaba taşınacak.\n・Bu hesap, şu anda takip ettiği tüm kullanıcıları takipten çıkaracak.\n・Bu hesapta yeni notlar vb. oluşturamayacaksın.\n\nTakipçilerin taşınması otomatik olarak gerçekleşirken, takip ettiğin kullanıcıların listesini taşımak için bazı adımları manuel olarak hazırlaman gerekir. Bunu yapmak için, ayarlar menüsünden takipçilerini dışa aktar ve daha sonra yeni hesaba içe aktar. Aynı prosedür, listelerinin yanı sıra sessize aldığın ve engellediğin kullanıcılar için de geçerli.\n\n(Bu açıklama Misskey v13.12.0 ve sonraki sürümler için geçerlidir. Mastodon gibi diğer ActivityPub yazılımları farklı şekilde çalışabilir.)",
	"accountMigrationMoveAccountHowTo": "Geçiş yapmak için, önce taşınacak hesapta bu hesap için bir takma ad oluşturun.\nTakma adı oluşturduktan sonra, taşınacak hesabı aşağıdaki biçimde girin: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "Hesap taşıma işlemi geri alınamaz.",
	"accountMigrationMoveToLabel": "Taşınacak hesap:",
	"accountMigrationStartMigration": "Taşın",
	"accountMigrationPostMigrationNote": "Bu hesap, geçiş işlemi tamamlandıktan 24 saat sonra şu anda takip ettiği tüm hesapları takipten çıkaracak.\nHem takipçi sayısı hem de takip edilenler sayısı sıfır olacak. Takipçilerinin bu hesabın yalnızca takipçilere açık gönderilerini görememesi durumunu önlemek için, takipçilerin bu hesabı takip etmeye devam edecek.",
	"accountMigrationMovedAndCannotBeUndone": "\nBu hesap taşınmıştır.\nTaşıma işlemi geri alınamaz.",
	"accountMigrationMovedTo": "Yeni hesap:",
	"accountMigrationMigrationConfirm": "Bu hesabı {account} hesabına gerçekten taşımak istiyor musun? Bu işlem başlatıldıktan sonra durdurulamaz veya geri alınamaz ve bu hesabı artık orijinal haliyle kullanamazsın."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"accountMigrationMoveFrom": "Migrate another account to this one",
	"accountMigrationMoveFromSub": "Create alias to another account",
	"accountMigrationMoveFromDescription": "You must create an alias for the account to move from on this account.\nEnter the account to migrate from in the following format: @username@server.example.com\nTo delete the alias, leave the field empty (not recommended).",
	"add": "Add",
	"save": "Save",
	"accountMigrationMoveFromLabel": "Original Account #{n}",
	"accountMigrationMoveTo": "Migrate this account to a different one",
	"accountMigrationMoveAccountDescription": "This will migrate your account to a different one.\n\u3000・Followers from this account will automatically be migrated to the new account\n\u3000・This account will unfollow all users it is currently following\n\u3000・You will be unable to create new notes etc. on this account\n\nWhile migration of followers is automatic, you must manually prepare some steps to migrate the list of users you are following. To do so, carry out a follows export that you will later import on the new account in the settings menu. The same procedure applies to your lists as well as your muted and blocked users.\n\n(This explanation applies to Misskey v13.12.0 and later. Other ActivityPub software, such as Mastodon, might function differently.)",
	"accountMigrationMoveAccountHowTo": "To migrate, first create an alias for this account on the account to move to.\nAfter you have created the alias, enter the account to move to in the following format: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "Account migration cannot be undone.",
	"accountMigrationMoveToLabel": "Account to move to:",
	"accountMigrationStartMigration": "Migrate",
	"accountMigrationPostMigrationNote": "This account will unfollow all accounts it is currently following 24 hours after migration finishes.\nBoth the number of follows and followers will then become zero. To avoid your followers from being unable to see followers only posts of this account, they will however continue following this account.",
	"accountMigrationMovedAndCannotBeUndone": "\nThis account has been migrated.\nMigration cannot be reversed.",
	"accountMigrationMovedTo": "New account:",
	"accountMigrationMigrationConfirm": "Really migrate this account to {account}? Once started, this process cannot be stopped or taken back, and you will not be able to use this account in its original state anymore."
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"accountMigrationMoveFrom": "Migrate another account to this one",
	"accountMigrationMoveFromSub": "Create alias to another account",
	"accountMigrationMoveFromDescription": "You must create an alias for the account to move from on this account.\nEnter the account to migrate from in the following format: @username@server.example.com\nTo delete the alias, leave the field empty (not recommended).",
	"add": "Додати",
	"save": "Зберегти",
	"accountMigrationMoveFromLabel": "Original Account #{n}",
	"accountMigrationMoveTo": "Migrate this account to a different one",
	"accountMigrationMoveAccountDescription": "This will migrate your account to a different one.\n\u3000・Followers from this account will automatically be migrated to the new account\n\u3000・This account will unfollow all users it is currently following\n\u3000・You will be unable to create new notes etc. on this account\n\nWhile migration of followers is automatic, you must manually prepare some steps to migrate the list of users you are following. To do so, carry out a follows export that you will later import on the new account in the settings menu. The same procedure applies to your lists as well as your muted and blocked users.\n\n(This explanation applies to Misskey v13.12.0 and later. Other ActivityPub software, such as Mastodon, might function differently.)",
	"accountMigrationMoveAccountHowTo": "To migrate, first create an alias for this account on the account to move to.\nAfter you have created the alias, enter the account to move to in the following format: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "Account migration cannot be undone.",
	"accountMigrationMoveToLabel": "Account to move to:",
	"accountMigrationStartMigration": "Migrate",
	"accountMigrationPostMigrationNote": "This account will unfollow all accounts it is currently following 24 hours after migration finishes.\nBoth the number of follows and followers will then become zero. To avoid your followers from being unable to see followers only posts of this account, they will however continue following this account.",
	"accountMigrationMovedAndCannotBeUndone": "\nThis account has been migrated.\nMigration cannot be reversed.",
	"accountMigrationMovedTo": "New account:",
	"accountMigrationMigrationConfirm": "Really migrate this account to {account}? Once started, this process cannot be stopped or taken back, and you will not be able to use this account in its original state anymore."
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"accountMigrationMoveFrom": "Chuyển một tài khoản khác vào tài khoản này",
	"accountMigrationMoveFromSub": "Create alias to another account",
	"accountMigrationMoveFromDescription": "You must create an alias for the account to move from on this account.\nEnter the account to migrate from in the following format: @username@server.example.com\nTo delete the alias, leave the field empty (not recommended).",
	"add": "Thêm",
	"save": "Lưu",
	"accountMigrationMoveFromLabel": "Tài khoản gốc #{n}",
	"accountMigrationMoveTo": "Chuyển tài khoản này vào một tài khoản khác",
	"accountMigrationMoveAccountDescription": "Điều này sẽ chuyển tài khoản này sang một tài khoản khác.\n\u3000・Những người theo dõi sẽ tự động được chuyển sang tài khoản mới\n\u3000・Tài khoản này sẽ tự bỏ theo dõi những người mà bạn đã theo dõi trước đây\n\u3000・Bạn sẽ không thể đăng tút mới, v.v trên tài khoản này\n\nDù việc chuyển người theo dõi được diễn ra tự động, bạn vẫn phải tự chuẩn bị một vài bước để chuyển danh sách những người dùng bạn đang theo dõi. Để làm vậy, vui lòng thực hiện việc xuất dữ liệu những người dùng đã theo dõi mà sau này bạn sẽ dùng để nhập vào tài khoản mới ở menu Cài đặt. Hành động tương tự áp dụng với danh sách những người dùng bị chặn hoặc tắt tiếng.\n\n(Điều này áp dụng cho phiên bản Misskey v13.12.0 và sau này. Các phần mềm ActivityPub khác , ví dụ như Mastodon, sẽ có thể hoạt động khác đi.)",
	"accountMigrationMoveAccountHowTo": "To migrate, first create an alias for this account on the account to move to.\nAfter you have created the alias, enter the account to move to in the following format: @username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "Việc chuyển tài khoản không thể huỷ.",
	"accountMigrationMoveToLabel": "Account to move to:",
	"accountMigrationStartMigration": "Chuyển",
	"accountMigrationPostMigrationNote": "This account will unfollow all accounts it is currently following 24 hours after migration finishes.\nBoth the number of follows and followers will then become zero. To avoid your followers from being unable to see followers only posts of this account, they will however continue following this account.",
	"accountMigrationMovedAndCannotBeUndone": "\nTài khoản này đã được chuyển đi.\nViệc di chuyển tài khoản không thể bị huỷ bỏ.",
	"accountMigrationMovedTo": "Tài khoản mới:",
	"accountMigrationMigrationConfirm": "Really migrate this account to {account}? Once started, this process cannot be stopped or taken back, and you will not be able to use this account in its original state anymore."
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"accountMigrationMoveFrom": "从别的账号迁移到此账户",
	"accountMigrationMoveFromSub": "为另一个账户建立别名",
	"accountMigrationMoveFromDescription": "如果迁移时需要继承其他账户的关注者，你需要创建一个别名。此操作需要在迁移前完成！\n请像这样输入要迁移的账户：@username@server.example.com\n如果要删除，请将输入字段留空，并保存（不推荐）。",
	"add": "添加",
	"save": "保存",
	"accountMigrationMoveFromLabel": "迁移前的账户 #{n}",
	"accountMigrationMoveTo": "把这个账户迁移到新的账户",
	"accountMigrationMoveAccountDescription": "\n迁移到新帐户。\n\u3000・现有的关注者自动关注新帐户\n\u3000・此帐户的所有关注者都将被删除\n\u3000・您将无法再使用此帐户发帖。\n关注者迁移是自动的，但关注中迁移必须手动完成。请在迁移前在此帐户上导出关注列表，并在迁移后立即在目标帐户上执行导入。\n列表、隐藏、屏蔽也是如此，因此您必须手动迁移它。\n（此描述适用于该服务器（Misskey v13.12.0 或更高版本）。其他 ActivityPub 软件（例如 Mastodon）的行为可能有所不同。）",
	"accountMigrationMoveAccountHowTo": "要进行账户迁移，请现在目标账户中为此账户建立一个别名。\n建立别名后，请像这样输入目标账户：@username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "一旦迁移账户，就无法撤销。",
	"accountMigrationMoveToLabel": "迁移后的账户",
	"accountMigrationStartMigration": "迁移",
	"accountMigrationPostMigrationNote": "这个账户的关注会在迁移操作后的24小时后解除。该账户的 “关注中” 和 “关注者” 的数量都将变为0。由于不会解除关注关系，你的关注者仍然可以继续查看该账户发布的帖子。",
	"accountMigrationMovedAndCannotBeUndone": "该账户已被迁移。\n迁移操作无法撤销。",
	"accountMigrationMovedTo": "迁移后的账户",
	"accountMigrationMigrationConfirm": "确定要把此账户迁移到 {account} 吗？一旦确定后，此操作无法取消，此账户也无法以原来的状态使用。\n同时，请确认迁移后的账户，已创造别名。"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"accountMigrationMoveFrom": "從其他帳戶遷移到這個帳戶",
	"accountMigrationMoveFromSub": "為另一個帳戶建立別名",
	"accountMigrationMoveFromDescription": "如果你想把追隨者從別的帳戶遷移過來，必須先在這裡建立別名。請務必在執行遷移之前建立別名！請像這樣輸入要遷移的帳戶：@person@instance.com",
	"add": "新增",
	"save": "儲存",
	"accountMigrationMoveFromLabel": "要遷移過來的帳戶 #{n}",
	"accountMigrationMoveTo": "將這個帳戶遷移至新的帳戶",
	"accountMigrationMoveAccountDescription": "遷移至新帳戶。\n\u3000・此帳戶的追隨者將自動追隨新帳戶；\n\u3000・此帳戶的所有追隨者將被取消追隨；\n\u3000・此帳戶不能再發文。\n\n雖然會自動遷移您的追隨者，但必須手動遷移您追隨的帳戶。請在遷移前匯出此帳戶的「追隨中」名單，並在遷移後自行匯入。\n列表名單、靜音名單及封鎖名單也必須如此處理。\n\n（此說明適用於本伺服器，以及運行 Misskey v13.12.0 或更新版本的其他伺服器；如 Mastodon 等使用 ActivityPub 協定的其他軟體或有不同的處理方式。）",
	"accountMigrationMoveAccountHowTo": "要遷移帳戶，首先要在目標帳戶中為此帳戶建立一個別名。\n 建立別名後，像這樣輸入目標帳戶：@username@server.example.com",
	"accountMigrationMoveCannotBeUndone": "一旦遷移帳戶，就無法取消。",
	"accountMigrationMoveToLabel": "要遷移到的帳戶：",
	"accountMigrationStartMigration": "遷移",
	"accountMigrationPostMigrationNote": "將在完成遷移的 24 小時後取消追隨所有帳號。\n此帳戶的追隨中/追隨者人數將歸零。由於不會解除粉絲對您的追隨，因此他們仍然可以繼續閱覽此帳戶內僅對追隨者公開的貼文。",
	"accountMigrationMovedAndCannotBeUndone": "帳戶已遷移。\n遷移無法撤消。",
	"accountMigrationMovedTo": "要遷移到的帳戶：",
	"accountMigrationMigrationConfirm": "確定要將這個帳戶遷移至 {account} 嗎？一旦遷移就無法撤銷，也就無法以原來的狀態使用這個帳戶。\n另外，請確認在要遷移到的帳戶已經建立了一個別名。"
}
</locale>
