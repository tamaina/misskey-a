<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<SearchMarker path="/admin/object-storage" :label="$locale.sfc.objectStorage" :keywords="['objectStorage']" icon="ti ti-cloud">
			<div class="_gaps_m">
				<SearchMarker>
					<MkSwitch v-model="useObjectStorage"><SearchLabel>{{ $locale.sfc.useObjectStorage }}</SearchLabel></MkSwitch>
				</SearchMarker>

				<template v-if="useObjectStorage">
					<SearchMarker>
						<MkInput v-model="objectStorageBaseUrl" :placeholder="'https://example.com'" type="url">
							<template #label><SearchLabel>{{ $locale.sfc.objectStorageBaseUrl }}</SearchLabel></template>
							<template #caption><SearchText>{{ $locale.sfc.objectStorageBaseUrlDesc }}</SearchText></template>
						</MkInput>
					</SearchMarker>

					<SearchMarker>
						<MkInput v-model="objectStorageBucket">
							<template #label><SearchLabel>{{ $locale.sfc.objectStorageBucket }}</SearchLabel></template>
							<template #caption><SearchText>{{ $locale.sfc.objectStorageBucketDesc }}</SearchText></template>
						</MkInput>
					</SearchMarker>

					<SearchMarker>
						<MkInput v-model="objectStoragePrefix">
							<template #label><SearchLabel>{{ $locale.sfc.objectStoragePrefix }}</SearchLabel></template>
							<template #caption><SearchText>{{ $locale.sfc.objectStoragePrefixDesc }}</SearchText></template>
						</MkInput>
					</SearchMarker>

					<SearchMarker>
						<MkInput v-model="objectStorageEndpoint" :placeholder="'example.com'">
							<template #label><SearchLabel>{{ $locale.sfc.objectStorageEndpoint }}</SearchLabel></template>
							<template #prefix>https://</template>
							<template #caption><SearchText>{{ $locale.sfc.objectStorageEndpointDesc }}</SearchText></template>
						</MkInput>
					</SearchMarker>

					<SearchMarker>
						<MkInput v-model="objectStorageRegion">
							<template #label><SearchLabel>{{ $locale.sfc.objectStorageRegion }}</SearchLabel></template>
							<template #caption><SearchText>{{ $locale.sfc.objectStorageRegionDesc }}</SearchText></template>
						</MkInput>
					</SearchMarker>

					<FormSplit :minWidth="280">
						<SearchMarker>
							<MkInput v-model="objectStorageAccessKey">
								<template #prefix><i class="ti ti-key"></i></template>
								<template #label><SearchLabel>Access key</SearchLabel></template>
							</MkInput>
						</SearchMarker>

						<SearchMarker>
							<MkInput v-model="objectStorageSecretKey" type="password" autocomplete="new-password">
								<template #prefix><i class="ti ti-key"></i></template>
								<template #label><SearchLabel>Secret key</SearchLabel></template>
							</MkInput>
						</SearchMarker>
					</FormSplit>

					<SearchMarker>
						<MkSwitch v-model="objectStorageUseSSL">
							<template #label><SearchLabel>{{ $locale.sfc.objectStorageUseSSL }}</SearchLabel></template>
							<template #caption><SearchText>{{ $locale.sfc.objectStorageUseSSLDesc }}</SearchText></template>
						</MkSwitch>
					</SearchMarker>

					<SearchMarker>
						<MkSwitch v-model="objectStorageUseProxy">
							<template #label><SearchLabel>{{ $locale.sfc.objectStorageUseProxy }}</SearchLabel></template>
							<template #caption><SearchText>{{ $locale.sfc.objectStorageUseProxyDesc }}</SearchText></template>
						</MkSwitch>
					</SearchMarker>

					<SearchMarker>
						<MkSwitch v-model="objectStorageSetPublicRead">
							<template #label><SearchLabel>{{ $locale.sfc.objectStorageSetPublicRead }}</SearchLabel></template>
						</MkSwitch>
					</SearchMarker>

					<SearchMarker>
						<MkSwitch v-model="objectStorageS3ForcePathStyle">
							<template #label><SearchLabel>s3ForcePathStyle</SearchLabel></template>
							<template #caption><SearchText>{{ $locale.sfc.s3ForcePathStyleDesc }}</SearchText></template>
						</MkSwitch>
					</SearchMarker>
				</template>
			</div>
		</SearchMarker>
	</div>
	<template #footer>
		<div :class="$style.footer">
			<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 16px;">
				<MkButton primary rounded @click="save"><i class="ti ti-check"></i> {{ $locale.sfc.save }}</MkButton>
			</div>
		</div>
	</template>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import FormSplit from '@features/ui/frontend/components/form/split.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { fetchInstance } from '@features/instance/frontend/instance.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';

const meta = await misskeyApi('admin/meta');

const useObjectStorage = ref(meta.useObjectStorage);
const objectStorageBaseUrl = ref(meta.objectStorageBaseUrl);
const objectStorageBucket = ref(meta.objectStorageBucket);
const objectStoragePrefix = ref(meta.objectStoragePrefix);
const objectStorageEndpoint = ref(meta.objectStorageEndpoint);
const objectStorageRegion = ref(meta.objectStorageRegion);
const objectStoragePort = ref(meta.objectStoragePort);
const objectStorageAccessKey = ref(meta.objectStorageAccessKey);
const objectStorageSecretKey = ref(meta.objectStorageSecretKey);
const objectStorageUseSSL = ref(meta.objectStorageUseSSL);
const objectStorageUseProxy = ref(meta.objectStorageUseProxy);
const objectStorageSetPublicRead = ref(meta.objectStorageSetPublicRead);
const objectStorageS3ForcePathStyle = ref(meta.objectStorageS3ForcePathStyle);

function save() {
	os.apiWithDialog('admin/update-meta', {
		useObjectStorage: useObjectStorage.value,
		objectStorageBaseUrl: objectStorageBaseUrl.value,
		objectStorageBucket: objectStorageBucket.value,
		objectStoragePrefix: objectStoragePrefix.value,
		objectStorageEndpoint: objectStorageEndpoint.value,
		objectStorageRegion: objectStorageRegion.value,
		objectStoragePort: objectStoragePort.value,
		objectStorageAccessKey: objectStorageAccessKey.value,
		objectStorageSecretKey: objectStorageSecretKey.value,
		objectStorageUseSSL: objectStorageUseSSL.value,
		objectStorageUseProxy: objectStorageUseProxy.value,
		objectStorageSetPublicRead: objectStorageSetPublicRead.value,
		objectStorageS3ForcePathStyle: objectStorageS3ForcePathStyle.value,
	}).then(() => {
		fetchInstance(true);
	});
}

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.objectStorage,
	icon: 'ti ti-cloud',
}));
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
}
</style>

<locale locale="ar-SA" lang="json">
{
	"objectStorage": "Object Storage",
	"useObjectStorage": "Use object storage",
	"objectStorageBaseUrl": "الرابط الأساسي",
	"objectStorageBaseUrlDesc": "The URL used as reference. Specify the URL of your CDN or Proxy if you are using either.\nFor S3 use 'https://\u003cbucket>.s3.amazonaws.com' and for GCS or equivalent services use 'https://storage.googleapis.com/\u003cbucket>', etc.",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Please specify the bucket name used at your provider.",
	"objectStoragePrefix": "البادئة",
	"objectStoragePrefixDesc": "ستُحفظ الملفات في مجلدات تحوي اسماءها هذه البادئة.",
	"objectStorageEndpoint": "نقطة النهاية",
	"objectStorageEndpointDesc": "Leave this empty if you are using AWS S3, otherwise specify the endpoint as '\u003chost>' or '\u003chost>:\u003cport>', depending on the service you are using.",
	"objectStorageRegion": "المنطقة",
	"objectStorageRegionDesc": "حدد منطقة مثل \"xx-east-1\". إذا كانت خدمتك لا تميز بين المناطق استخدم \"us-east-1\" أو اتركها فارغة إذا كنت تستخدم متغيرات البيئة أو ملفات ضبط AWS.",
	"objectStorageUseSSL": "استخدم SSL",
	"objectStorageUseSSLDesc": "عطل هذا الخيار إذا لم ترد استخدام API عبر HTTPS",
	"objectStorageUseProxy": "اتصل عبر وكيل",
	"objectStorageUseProxyDesc": "عطل هذا الخيار إذا لم ترد استخدام API عبر وكيل",
	"objectStorageSetPublicRead": "عينها ك\"علنية\" عند الرفع",
	"s3ForcePathStyleDesc": "If s3ForcePathStyle is enabled, the bucket name has to included in the path of the URL as opposed to the hostname of the URL. You may need to enable this setting when using services such as a self-hosted Minio instance.",
	"save": "حفظ"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"objectStorage": "Emmagatzematge d'objectes\n",
	"useObjectStorage": "Utilitzar l'emmagatzematge d'objectes",
	"objectStorageBaseUrl": "Base d'enllaç",
	"objectStorageBaseUrlDesc": "Prefix d'enllaç utilitzat per a fer referencia als fitxers. Especifica l'enllaç del teu CDN o Proxy si n'estàs utilitzant qualsevol, en cas contrari, especifica l'enllaç al que es pot accedir públicament segons la guia de servei que vosté utilitza.\nPer l'ús d'S3 utilitza 'https://\u003cbucket>.s3.amazonaws.com' I per a GCS o serveis equivalents utilitza 'https://storage.googleapis.com/\u003cbucket>'.",
	"objectStorageBucket": "Dipòsit ",
	"objectStorageBucketDesc": "Escriu el nom del dipòsit que fas servir al teu proveïdor d'emmagatzematge ",
	"objectStoragePrefix": "Prefix",
	"objectStoragePrefixDesc": "Els fitxers es deixaren a directoris amb aquest prefix",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "Deixa'l buit si fas servir AWS S3, si no és així específica un punt d'entrada com '\u003chost>' o '\u003chost>:\u003cport>', depenent del servei que facis servir.",
	"objectStorageRegion": "Regió ",
	"objectStorageRegionDesc": "Especifica una regió com 'xx-east-1'. Si el teu servei no diferència regions has de posar 'us-east-1'. Deixa'l buit si fas servir variables d'entorn o un arxiu de configuració d'AWS.",
	"objectStorageUseSSL": "Fes servir SSL",
	"objectStorageUseSSLDesc": "Desactiva'l si no tens pensat fer servir HTTPS per les connexions de l'API",
	"objectStorageUseProxy": "Connectar-se  mitjançant un Proxy",
	"objectStorageUseProxyDesc": "Desactiva'l si no faràs servir un Proxy per les connexions de l'API",
	"objectStorageSetPublicRead": "Configurar les pujades com públiques ",
	"s3ForcePathStyleDesc": "Si s3ForcePathStyle es troba activat el nom del cubell s'haurà d'especificar com a part de l'adreça URL en comptes del nom del servidor. Podria ser que necessitis activar aquesta opció quan facis servir serveis com ara l'allotjament a un servidor propi.",
	"save": "Desa"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"objectStorage": "Úložiště objektů",
	"useObjectStorage": "Použít úložiště objektů",
	"objectStorageBaseUrl": "Base URL",
	"objectStorageBaseUrlDesc": "URL použitá jako reference. Upřesněte URL vlastní CDN nebo Proxy pokud používáte jeden z nich. Pro S3 použijte 'https://\u003cbucket>.s3.amazonaws.com' a pro GCS nebo ekvivalentní služby použijte 'https://storage.googleapis.com/\u003cbucket>', apd.",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Prosím upřesněte název bucketu používaný poskytovatelem.",
	"objectStoragePrefix": "Předpona",
	"objectStoragePrefixDesc": "Soubory budou ukládány pod složkama s tímhle prefixem.",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "Ponechte tohle prázdné pokud používáte AWS S3, jinak upřesněte endpoint jako \"\u003chost>\" nebo \"\u003chost>:\u003cport>\", podle toho jakou službu používáte.",
	"objectStorageRegion": "Región",
	"objectStorageRegionDesc": "Upřesněte region jako například \"xx-east-1\". Pokud vlastní služba nerozlišuje mezi regiony, zadejte \"us-east-1\". Zanechte prázdné pokud používáte AWS konfiguraci či proměnné veličiny.",
	"objectStorageUseSSL": "Použít SSL",
	"objectStorageUseSSLDesc": "Vypněte to pokud nebudete používat HTTPS pro API připojení",
	"objectStorageUseProxy": "Připojení skrze Proxy",
	"objectStorageUseProxyDesc": "Vypněte to pokud nebudete používat Proxy pro API připojení.",
	"objectStorageSetPublicRead": "Při nahrátí nastavit na \"public-read\"",
	"s3ForcePathStyleDesc": "Pokud je povolena funkce s3ForcePathStyle, musí být název Bucketu zahrnut do cesty k adrese URL, nikoli do názvu hostitele adresy URL. Toto nastavení může být nutné povolit při používání služeb, jako je například samostatně hostovaná instance Minio.",
	"save": "Uložit"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"objectStorage": "Object Storage",
	"useObjectStorage": "Use object storage",
	"objectStorageBaseUrl": "Base URL",
	"objectStorageBaseUrlDesc": "The URL used as reference. Specify the URL of your CDN or Proxy if you are using either.\nFor S3 use 'https://\u003cbucket>.s3.amazonaws.com' and for GCS or equivalent services use 'https://storage.googleapis.com/\u003cbucket>', etc.",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Please specify the bucket name used at your provider.",
	"objectStoragePrefix": "Prefix",
	"objectStoragePrefixDesc": "Files will be stored under directories with this prefix.",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "Leave this empty if you are using AWS S3, otherwise specify the endpoint as '\u003chost>' or '\u003chost>:\u003cport>', depending on the service you are using.",
	"objectStorageRegion": "Region",
	"objectStorageRegionDesc": "Specify a region like 'xx-east-1'. If your service does not distinguish between regions, enter 'us-east-1'. Leave empty if using AWS configuration files or environment variables.",
	"objectStorageUseSSL": "Use SSL",
	"objectStorageUseSSLDesc": "Turn this off if you are not going to use HTTPS for API connections",
	"objectStorageUseProxy": "Connect over Proxy",
	"objectStorageUseProxyDesc": "Turn this off if you are not going to use a Proxy for API connections",
	"objectStorageSetPublicRead": "Set \"public-read\" on upload",
	"s3ForcePathStyleDesc": "If s3ForcePathStyle is enabled, the bucket name has to included in the path of the URL as opposed to the hostname of the URL. You may need to enable this setting when using services such as a self-hosted Minio instance.",
	"save": "Save"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"objectStorage": "Object Storage",
	"useObjectStorage": "Object Storage verwenden",
	"objectStorageBaseUrl": "Basis-URL",
	"objectStorageBaseUrlDesc": "Die als Referenz verwendete URL. Verwendest du einen CDN oder Proxy, gib dessen URL an. Für S3 verwende 'https://\u003cbucket>.s3.amazonaws.com'. Für GCS o.ä. verwende 'https://storage.googleapis.com/\u003cbucket>'.",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Bitte gib den Namen des Buckets an, der bei deinem Anbieter verwendet wird.",
	"objectStoragePrefix": "Prefix",
	"objectStoragePrefixDesc": "Dateien werden in Ordnern unter diesem Prefix gespeichert.",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "Im Falle von S3 leerlassen, für andere Anbieter den relevanten Endpoint im Format „\u003chost>“ oder „\u003chost>:\u003cport>“ angeben.",
	"objectStorageRegion": "Region",
	"objectStorageRegionDesc": "Gib eine Region wie z.B. „xx-east-1“ an. Falls dein Anbieter nicht zwischen Regionen unterscheidet, gib „us-east-1“ an. Lasse es leer bei Verwendung von AWS Konfigurationsdateien oder Umgebungsvariablen.",
	"objectStorageUseSSL": "SSL verwenden",
	"objectStorageUseSSLDesc": "Deaktiviere dies, falls du für API-Verbindungen kein HTTPS verwenden wirst",
	"objectStorageUseProxy": "Über Proxy verbinden",
	"objectStorageUseProxyDesc": "Deaktiviere dies, falls du für Verbindungen zur API keinen Proxy verwenden wirst",
	"objectStorageSetPublicRead": "Bei Upload auf \"public-read\" stellen",
	"s3ForcePathStyleDesc": "Ist s3ForcePathStyle aktiviert, so muss der Bucketname nicht im Hostnamen der URL, sondern im Pfad der URL angeben werden. Diese Option muss eventuell aktiviert werden, wenn Dienste wie z.B. eine selbstbetriebene Minio-Instanz verwendet werden.",
	"save": "Speichern"
}
</locale>

<locale locale="en-US" lang="json">
{
	"objectStorage": "Object Storage",
	"useObjectStorage": "Use object storage",
	"objectStorageBaseUrl": "Base URL",
	"objectStorageBaseUrlDesc": "The URL used as reference. Specify the URL of your CDN or Proxy if you are using either.\nFor S3 use 'https://\u003cbucket>.s3.amazonaws.com' and for GCS or equivalent services use 'https://storage.googleapis.com/\u003cbucket>', etc.",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Please specify the bucket name used at your provider.",
	"objectStoragePrefix": "Prefix",
	"objectStoragePrefixDesc": "Files will be stored under directories with this prefix.",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "Leave this empty if you are using AWS S3, otherwise specify the endpoint as '\u003chost>' or '\u003chost>:\u003cport>', depending on the service you are using.",
	"objectStorageRegion": "Region",
	"objectStorageRegionDesc": "Specify a region like 'xx-east-1'. If your service does not distinguish between regions, enter 'us-east-1'. Leave empty if using AWS configuration files or environment variables.",
	"objectStorageUseSSL": "Use SSL",
	"objectStorageUseSSLDesc": "Turn this off if you are not going to use HTTPS for API connections",
	"objectStorageUseProxy": "Connect over Proxy",
	"objectStorageUseProxyDesc": "Turn this off if you are not going to use a Proxy for API connections",
	"objectStorageSetPublicRead": "Set \"public-read\" on upload",
	"s3ForcePathStyleDesc": "If s3ForcePathStyle is enabled, the bucket name has to included in the path of the URL as opposed to the hostname of the URL. You may need to enable this setting when using services such as a self-hosted Minio instance.",
	"save": "Save"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"objectStorage": "Almacenamiento de objetos",
	"useObjectStorage": "Usar almacenamiento de objetos",
	"objectStorageBaseUrl": "Base URL",
	"objectStorageBaseUrlDesc": "Prefijo de URL utilizado para construir URL para hacer referencia a objetos (medios). Especifique su URL si está utilizando un CDN o Proxy; de lo contrario, especifique la dirección a la que se puede acceder públicamente de acuerdo con la guía de servicio que va a utilizar. i.g 'https://\u003cbucket>.s3.amazonaws.com' para AWS S3 y 'https://storage.googleapis.com/\u003cbucket>' para GCS.",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Especifique el nombre del depósito utilizado en el servicio configurado.",
	"objectStoragePrefix": "Prefix",
	"objectStoragePrefixDesc": "Los archivos se almacenarán en el directorio de este prefijo.",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "Deje esto en blanco si está utilizando AWS S3; de lo contrario, especifique el punto final como '\u003chost>' o '\u003chost>: \u003cport>' de acuerdo con la guía de servicio que va a utilizar.",
	"objectStorageRegion": "Region",
	"objectStorageRegionDesc": "Especifique una región como 'xx-east-1'. Si su servicio no tiene distinción sobre regiones, déjelo en blanco o complete con 'us-east-1'.",
	"objectStorageUseSSL": "Usar SSL",
	"objectStorageUseSSLDesc": "Desactive esto si no va a usar HTTPS para la conexión API",
	"objectStorageUseProxy": "Conectarse a través de Proxy",
	"objectStorageUseProxyDesc": "Desactive esto si no va a usar Proxy para la conexión de Almacenamiento de objetos",
	"objectStorageSetPublicRead": "Seleccionar \"public-read\" al subir ",
	"s3ForcePathStyleDesc": "Si s3ForcePathStyle esta habilitado el nombre del bucket debe ser especificado como parte de la URL en lugar del nombre de host en la URL. Puede ser necesario activar esta opción cuando se utilice, por ejemplo, Minio en un servidor propio.",
	"save": "Guardar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"objectStorage": "Stockage d'objets",
	"useObjectStorage": "Utiliser le stockage d'objets",
	"objectStorageBaseUrl": "URL de base",
	"objectStorageBaseUrlDesc": "Préfixe d’URL utilisé pour construire l’URL vers le référencement d’objet (média). Spécifiez son URL si vous utilisez un CDN ou un proxy, sinon spécifiez l’adresse accessible au public selon le guide de service que vous allez utiliser. P.ex. 'https://\u003cbucket>.s3.amazonaws.com' pour AWS S3 et 'https://storage.googleapis.com/\u003cbucket>' pour GCS.",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Veuillez spécifier le nom du compartiment utilisé sur le service configuré.",
	"objectStoragePrefix": "Prefix",
	"objectStoragePrefixDesc": "Les fichiers seront stockés sous le répertoire de ce préfixe.",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "Laissez ce champ vide si vous utilisez AWS S3, sinon spécifiez le point de terminaison comme '\u003chost>' ou '\u003chost>: \u003cport>' selon le guide de service que vous allez utiliser.",
	"objectStorageRegion": "Région",
	"objectStorageRegionDesc": "Spécifiez une région comme 'xx-east-1'. Si votre service ne fait pas de distinction entre les régions, laissez-le vide ou remplissez 'us-east-1'.",
	"objectStorageUseSSL": "Utiliser SSL",
	"objectStorageUseSSLDesc": "Désactivez cette option si vous n'utilisez pas HTTPS pour la connexion API",
	"objectStorageUseProxy": "Se connecter via proxy",
	"objectStorageUseProxyDesc": "Désactivez cette option si vous n'utilisez pas de proxy pour la connexion API",
	"objectStorageSetPublicRead": "Régler sur « public » lors de l'envoi",
	"s3ForcePathStyleDesc": "Si s3ForcePathStyle est activé, le nom du compartiment doit être spécifié comme une partie du chemin de l'URL plutôt que le nom d'hôte. Il faudra peut-être l'activer lors de l'utilisation d'une instance de Minio autohébergée, etc.",
	"save": "Enregistrer"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"objectStorage": "Object Storage",
	"useObjectStorage": "Gunakan object storage",
	"objectStorageBaseUrl": "Base URL",
	"objectStorageBaseUrlDesc": "Prefix URL digunakan untuk mengonstruksi URL ke object (media) referencing. Tentukan URL jika kamu menggunakan CDN atau Proxy. Jika tidak, tentukan alamat yang dapat diakses secara publik sesuai dengan panduan dari layanan yang akan kamu gunakan. Contohnya: 'https://\u003cbucket>.s3.amazonaws.com' untuk AWS S3, dan 'https://storage.googleapis.com/\u003cbucket>' untuk GCS.",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Mohon tentukan nama bucket yang digunakan pada layanan yang telah dikonfigurasi.",
	"objectStoragePrefix": "Prefix",
	"objectStoragePrefixDesc": "Berkas tidak akan disimpan dalam direktori dari prefix ini.",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "Kosongkan bagian ini jika kamu menggunakan AWS S3, jika tidak tentukan endpoint sebagai '\u003chost>' atau '\u003chost>:\u003cport>' sesuai dengan panduan dari layanan yang akan kamu gunakan.",
	"objectStorageRegion": "Region",
	"objectStorageRegionDesc": "Tentukan region seperti 'xx-east-1'. Jika layanan kamu tidak memiliki perbedaan mengenai region, kosongkan saja atau isi dengan 'us-east-1'.",
	"objectStorageUseSSL": "Gunakan SSL",
	"objectStorageUseSSLDesc": "Matikan ini jika kamu tidak akan menggunakan HTTPS untuk koneksi API",
	"objectStorageUseProxy": "Hubungkan melalui Proxy",
	"objectStorageUseProxyDesc": "Matikan ini jika kamu tidak akan menggunakan Proxy untuk koneksi ObjectStorage",
	"objectStorageSetPublicRead": "Setel \"public-read\" disaat mengunggah",
	"s3ForcePathStyleDesc": "Jika s3ForcePathStyle dinyalakan, nama bucket harus dimasukkan dalam path URL dan bukan URL nama host tersebut. Kamu perlu menyalakan pengaturan ini jika menggunakan layanan seperti instansi Minio yang self-hosted.",
	"save": "Simpan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"objectStorage": "Storage S3",
	"useObjectStorage": "Utilizza lo storage S3 in cloud",
	"objectStorageBaseUrl": "Base URL",
	"objectStorageBaseUrlDesc": "URL di riferimento. In caso di utilizzo di proxy o CDN l'URL è 'https://\u003cbucket>.s3.amazonaws.com' per S3, 'https://storage.googleapis.com/\u003cbucket>' per GCS eccetera. ",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Specificare il nome del bucket utilizzato dal provider.",
	"objectStoragePrefix": "Prefix",
	"objectStoragePrefixDesc": "I file saranno conservati sotto la directory di questo prefisso.",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "Lasciare vuoto se si sta utilizzando S3. In caso contrario si prega di specificare l'endpoint come '\u003chost>' oppure '\u003chost>:\u003cport>' a seconda del servizio utilizzato.",
	"objectStorageRegion": "Region",
	"objectStorageRegionDesc": "Specificate una regione, quale 'xx-east-1'. Se il servizio in utilizzo non distingue tra regioni, lasciate vuoto o inserite 'us-east-1'.",
	"objectStorageUseSSL": "Usare SSL",
	"objectStorageUseSSLDesc": "Disabilita quest'opzione se non utilizzi HTTPS per le connessioni API.",
	"objectStorageUseProxy": "Usa proxy",
	"objectStorageUseProxyDesc": "Disabilita quest'opzione se non usi proxy per la connessione API.",
	"objectStorageSetPublicRead": "Imposta \"visibilità pubblica\" al momento di caricare",
	"s3ForcePathStyleDesc": "L'attivazione di s3ForcePathStyle impone di specificare il nome del bucket come parte del percorso nell'URL anziché del nome host. Potrebbe tornare utile quando si utilizzano applicazioni come Minio.",
	"save": "Salva"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"objectStorage": "オブジェクトストレージ",
	"useObjectStorage": "オブジェクトストレージを使用",
	"objectStorageBaseUrl": "Base URL",
	"objectStorageBaseUrlDesc": "参照に使用するURL。CDNやProxyを使用している場合はそのURL、S3: 'https://\u003cbucket>.s3.amazonaws.com'、GCS等: 'https://storage.googleapis.com/\u003cbucket>'。",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "使用サービスのbucket名を指定してください。",
	"objectStoragePrefix": "Prefix",
	"objectStoragePrefixDesc": "このprefixのディレクトリ下に格納されます。",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "S3の場合は空、それ以外の場合は各サービスのendpointを指定してください。'\u003chost>'または'\u003chost>:\u003cport>'のように指定します。",
	"objectStorageRegion": "Region",
	"objectStorageRegionDesc": "'xx-east-1'のようなregionを指定してください。使用サービスにregionの概念がない場合は'us-east-1'にしてください。AWS設定ファイルまたは環境変数を参照する場合は空にしてください。",
	"objectStorageUseSSL": "SSLを使用する",
	"objectStorageUseSSLDesc": "API接続にhttpsを使用しない場合はオフにしてください",
	"objectStorageUseProxy": "Proxyを利用する",
	"objectStorageUseProxyDesc": "API接続にproxyを利用しない場合はオフにしてください",
	"objectStorageSetPublicRead": "アップロード時に'public-read'を設定する",
	"s3ForcePathStyleDesc": "s3ForcePathStyleを有効にすると、バケット名をURLのホスト名ではなくパスの一部として指定することを強制します。セルフホストされたMinioなどの使用時に有効にする必要がある場合があります。",
	"save": "保存"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"objectStorage": "オブジェクトストレージ",
	"useObjectStorage": "オブジェクトストレージを使う",
	"objectStorageBaseUrl": "Base URL",
	"objectStorageBaseUrlDesc": "参照に使うURLやで。CDNやProxyを使用してるんならそのURL、S3: 'https://\u003cbucket>.s3.amazonaws.com'、GCSとかなら: 'https://storage.googleapis.com/\u003cbucket>'。",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "使ってるサービスのbucket名を選んでな",
	"objectStoragePrefix": "Prefix",
	"objectStoragePrefixDesc": "このprefixのディレクトリ下に格納されるで",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "S3のときは空、それ以外は各サービスのendpointを指定してなー。'\u003chost>'ってやるか'\u003chost>:\u003cport>'みたいに指定するんやで。",
	"objectStorageRegion": "Region",
	"objectStorageRegionDesc": "'xx-east-1'みたいなregionを指定したってやー。使ってるサービスにregionの概念がないときは、空か'us-east-1'にするんやで。",
	"objectStorageUseSSL": "SSLを使う",
	"objectStorageUseSSLDesc": "API接続にhttpsを使わんのやったら消しといて",
	"objectStorageUseProxy": "Proxyを使う",
	"objectStorageUseProxyDesc": "API接続にproxy使わんのやったら切ってくれへん？",
	"objectStorageSetPublicRead": "アップロードした時に'public-read'を設定してや",
	"s3ForcePathStyleDesc": "s3ForcePathStyleを使たらバケット名をURLのホスト名やなくてパスの一部として必ず指定させるようになるで。セルフホストされたMinioとかを使うてるんやったら有効にせなあかん場合があるで。",
	"save": "とっとく"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"objectStorage": "Object Storage",
	"useObjectStorage": "Use object storage",
	"objectStorageBaseUrl": "Base URL",
	"objectStorageBaseUrlDesc": "The URL used as reference. Specify the URL of your CDN or Proxy if you are using either.\nFor S3 use 'https://\u003cbucket>.s3.amazonaws.com' and for GCS or equivalent services use 'https://storage.googleapis.com/\u003cbucket>', etc.",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Please specify the bucket name used at your provider.",
	"objectStoragePrefix": "Prefix",
	"objectStoragePrefixDesc": "Files will be stored under directories with this prefix.",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "Leave this empty if you are using AWS S3, otherwise specify the endpoint as '\u003chost>' or '\u003chost>:\u003cport>', depending on the service you are using.",
	"objectStorageRegion": "Region",
	"objectStorageRegionDesc": "Specify a region like 'xx-east-1'. If your service does not distinguish between regions, enter 'us-east-1'. Leave empty if using AWS configuration files or environment variables.",
	"objectStorageUseSSL": "Use SSL",
	"objectStorageUseSSLDesc": "Turn this off if you are not going to use HTTPS for API connections",
	"objectStorageUseProxy": "Connect over Proxy",
	"objectStorageUseProxyDesc": "Turn this off if you are not going to use a Proxy for API connections",
	"objectStorageSetPublicRead": "Set \"public-read\" on upload",
	"s3ForcePathStyleDesc": "If s3ForcePathStyle is enabled, the bucket name has to included in the path of the URL as opposed to the hostname of the URL. You may need to enable this setting when using services such as a self-hosted Minio instance.",
	"save": "Sekles"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"objectStorage": "Object Storage",
	"useObjectStorage": "Use object storage",
	"objectStorageBaseUrl": "Base URL",
	"objectStorageBaseUrlDesc": "The URL used as reference. Specify the URL of your CDN or Proxy if you are using either.\nFor S3 use 'https://\u003cbucket>.s3.amazonaws.com' and for GCS or equivalent services use 'https://storage.googleapis.com/\u003cbucket>', etc.",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Please specify the bucket name used at your provider.",
	"objectStoragePrefix": "Prefix",
	"objectStoragePrefixDesc": "Files will be stored under directories with this prefix.",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "Leave this empty if you are using AWS S3, otherwise specify the endpoint as '\u003chost>' or '\u003chost>:\u003cport>', depending on the service you are using.",
	"objectStorageRegion": "Region",
	"objectStorageRegionDesc": "Specify a region like 'xx-east-1'. If your service does not distinguish between regions, enter 'us-east-1'. Leave empty if using AWS configuration files or environment variables.",
	"objectStorageUseSSL": "Use SSL",
	"objectStorageUseSSLDesc": "Turn this off if you are not going to use HTTPS for API connections",
	"objectStorageUseProxy": "Connect over Proxy",
	"objectStorageUseProxyDesc": "Turn this off if you are not going to use a Proxy for API connections",
	"objectStorageSetPublicRead": "Set \"public-read\" on upload",
	"s3ForcePathStyleDesc": "If s3ForcePathStyle is enabled, the bucket name has to included in the path of the URL as opposed to the hostname of the URL. You may need to enable this setting when using services such as a self-hosted Minio instance.",
	"save": "ಉಳಿಸಿ"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"objectStorage": "오브젝트 스토리지",
	"useObjectStorage": "오브젝트 스토리지를 사용",
	"objectStorageBaseUrl": "Base URL",
	"objectStorageBaseUrlDesc": "오브젝트 (미디어) 참조 URL 을 만들 때 사용되는 URL입니다. CDN 또는 프록시를 사용하는 경우 그 URL을 지정하고, 그 외의 경우 사용할 서비스의 가이드에 따라 공개적으로 액세스 할 수 있는 주소를 지정해 주세요. 예를 들어, AWS S3의 경우 'https://\u003cbucket>.s3.amazonaws.com', GCS등의 경우 'https://storage.googleapis.com/\u003cbucket>' 와 같이 지정합니다.",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "사용하는 서비스의 bucket 이름을 지정해 주세요.",
	"objectStoragePrefix": "Prefix",
	"objectStoragePrefixDesc": "이 Prefix 의 디렉토리 아래에 파일이 저장됩니다.",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "AWS S3는 비워 두고 다른 서비스는 각 서비스의 endpoint를 설정해 주세요. ‘\u003chost>’ 혹은 ‘\u003chost>:\u003cport>’처럼 지정합니다.",
	"objectStorageRegion": "Region",
	"objectStorageRegionDesc": "‘xx-east-1’처럼 region을 지정해 주세요. 사용하는 서비스에 region 개념이 없으면 ‘us-east-1’처럼 설정해 주세요. AWS 설정 파일이나 환경 변수가 있으면 비워 주세요.",
	"objectStorageUseSSL": "SSL 사용",
	"objectStorageUseSSLDesc": "API 호출시 HTTPS 를 사용하지 않는 경우 OFF 로 설정해 주세요",
	"objectStorageUseProxy": "연결에 프록시를 사용",
	"objectStorageUseProxyDesc": "오브젝트 스토리지 API 호출시 프록시를 사용하지 않는 경우 OFF 로 설정해 주세요",
	"objectStorageSetPublicRead": "업로드할 때 'public-read'를 설정하기",
	"s3ForcePathStyleDesc": "s3ForcePathStyle을 활성화하면, 버킷 이름을 URL의 호스트명이 아닌 경로의 일부로써 취급합니다. 셀프 호스트 Minio와 같은 서비스를 사용할 경우 활성화해야 할 수 있습니다.",
	"save": "저장"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"objectStorage": "Object Storage",
	"useObjectStorage": "Object Storage gebruiken",
	"objectStorageBaseUrl": "Basis-URL",
	"objectStorageBaseUrlDesc": "De URL die wordt gebruikt als referentie. Als je een CDN of proxy gebruikt, voer dan de URL daarvan in. Gebruik voor S3 ‘https://\u003cbucket>.s3.amazonaws.com’. Gebruik voor GCS of vergelijkbaar ‘https://storage.googleapis.com/\u003cbucket>’.",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Geef de bucketnaam op die bij je provider wordt gebruikt.",
	"objectStoragePrefix": "Prefix",
	"objectStoragePrefixDesc": "Bestanden worden opgeslagen in de mappen onder deze prefix.",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "Laat dit leeg als je AWS S3 gebruikt, anders geef je het eindpunt op als ‘\u003chost>’ of ‘\u003chost>:\u003cport>’, afhankelijk van de service die je gebruikt.",
	"objectStorageRegion": "Region",
	"objectStorageRegionDesc": "Voer een regio in zoals “xx-east-1”. Als je provider geen onderscheid maakt tussen regio's, voer dan “us-east-1” in. Laat leeg als je AWS-configuratiebestanden of omgevingsvariabelen gebruikt.",
	"objectStorageUseSSL": "SSL gebruiken",
	"objectStorageUseSSLDesc": "Deactiveer dit als u geen HTTPS gebruikt voor API-verbindingen",
	"objectStorageUseProxy": "Verbinden via proxy",
	"objectStorageUseProxyDesc": "Deactiveer dit als u geen proxy wilt gebruiken voor verbindingen met de API",
	"objectStorageSetPublicRead": "Instellen op “public-read” op upload",
	"s3ForcePathStyleDesc": "Als s3ForcePathStyle is geactiveerd, moet de bucketnaam niet worden opgegeven in de hostnaam van de URL, maar in het pad van de URL. Deze optie moet mogelijk worden geactiveerd als services zoals een zelfbediende Minio-instantie worden gebruikt.",
	"save": "Opslaan"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"objectStorage": "Object Storage",
	"useObjectStorage": "Use object storage",
	"objectStorageBaseUrl": "Base URL",
	"objectStorageBaseUrlDesc": "The URL used as reference. Specify the URL of your CDN or Proxy if you are using either.\nFor S3 use 'https://\u003cbucket>.s3.amazonaws.com' and for GCS or equivalent services use 'https://storage.googleapis.com/\u003cbucket>', etc.",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Please specify the bucket name used at your provider.",
	"objectStoragePrefix": "Prefix",
	"objectStoragePrefixDesc": "Files will be stored under directories with this prefix.",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "Leave this empty if you are using AWS S3, otherwise specify the endpoint as '\u003chost>' or '\u003chost>:\u003cport>', depending on the service you are using.",
	"objectStorageRegion": "Region",
	"objectStorageRegionDesc": "Specify a region like 'xx-east-1'. If your service does not distinguish between regions, enter 'us-east-1'. Leave empty if using AWS configuration files or environment variables.",
	"objectStorageUseSSL": "Bruk SSL",
	"objectStorageUseSSLDesc": "Turn this off if you are not going to use HTTPS for API connections",
	"objectStorageUseProxy": "Bruk Proxy",
	"objectStorageUseProxyDesc": "Turn this off if you are not going to use a Proxy for API connections",
	"objectStorageSetPublicRead": "Set \"public-read\" on upload",
	"s3ForcePathStyleDesc": "If s3ForcePathStyle is enabled, the bucket name has to included in the path of the URL as opposed to the hostname of the URL. You may need to enable this setting when using services such as a self-hosted Minio instance.",
	"save": "Lagre"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"objectStorage": "Pamięć obiektowa",
	"useObjectStorage": "Używaj pamięci obiektowej",
	"objectStorageBaseUrl": "Podstawowy URL",
	"objectStorageBaseUrlDesc": "Adres URL używany jako odniesienie. Podaj adres URL swojego CDN lub Proxy, gdy używasz któregokolwiek z nich.\nDla S3 użyj 'https://\u003cbucket>.s3.amazonaws.com' a dla GCS lub równej usługi użyj 'https://storage.googleapis.com/\u003cbucket>', itd.",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Podaj nazwę „wiadra” używaną przez konfigurowaną usługę.",
	"objectStoragePrefix": "Prefiks",
	"objectStoragePrefixDesc": "Pliki będą przechowywane w katalogu z tym prefiksem.",
	"objectStorageEndpoint": "Punkt końcowy",
	"objectStorageEndpointDesc": "Pozostaw puste jeżeli używasz AWS S3, w innym wypadku określ punkt końcowy jako '\u003chost>' lub '\u003chost>:\u003cport>' zgodnie z instrukcjami usługi, której używasz.",
	"objectStorageRegion": "Region",
	"objectStorageRegionDesc": "Określ region, np. 'xx-east-1'. Jeżeli usługa której używasz nie zawiera rozróżnienia regionów, pozostaw to pustym lub wprowadź 'us-east-1'.",
	"objectStorageUseSSL": "Użyj SSL",
	"objectStorageUseSSLDesc": "Wyłącz, jeżeli nie zamierzasz używać HTTPS dla połączenia z API",
	"objectStorageUseProxy": "Połącz przez proxy",
	"objectStorageUseProxyDesc": "Wyłącz, jeżeli nie zamierzasz używać proxy dla połączenia z pamięcią blokową",
	"objectStorageSetPublicRead": "Ustaw opcję \"public-read\" przy przesyłaniu",
	"s3ForcePathStyleDesc": "Jeśli opcja s3ForcePathStyle jest włączona, nazwa Bucket'u musi być zawarta w ścieżce adresu URL, a nie w nazwie hosta adresu URL. Włączenie tego ustawienia może być konieczne w przypadku użycia usług takich jak self-hosted instancja Minio.",
	"save": "Zapisz"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"objectStorage": "Armazenamento de objetos",
	"useObjectStorage": "Usar armazenamento de objetos",
	"objectStorageBaseUrl": "URL base",
	"objectStorageBaseUrlDesc": "O URL usado para referência. Se você estiver usando um CDN ou Proxy, seu URL, S3:'https: // \u003cbucket> .s3.amazonaws.com', GCS, etc .:'https://storage.googleapis.com/ \u003cbucket>' .",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Especifique o nome do bucket do serviço a ser usado.",
	"objectStoragePrefix": "Prefixo",
	"objectStoragePrefixDesc": "Ele é armazenado neste diretório de prefixo.",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "No caso do S3, deixe em branco; para outros serviços, especifique o endpoint de cada serviço. Informe-o no formato '\u003chost>' ou '\u003chost>:\u003cport>'.",
	"objectStorageRegion": "Região",
	"objectStorageRegionDesc": "Especifique uma região como 'xx-east-1'. Caso seu serviço não tenha o conceito de região, ele deve estar vazio ou 'us-east-1'.",
	"objectStorageUseSSL": "Usar SSL",
	"objectStorageUseSSLDesc": "Desative-o se não quiser usar https para conexões de API",
	"objectStorageUseProxy": "Usar proxy",
	"objectStorageUseProxyDesc": "Se você não usa proxy para conexão de API, desative-o.",
	"objectStorageSetPublicRead": "Definir 'public-read' ao fazer o upload",
	"s3ForcePathStyleDesc": "Ao habilitar s3ForcePathStyle, o nome do bucket é especificado como parte do caminho em vez de ser o nome do host na URL. Isso pode ser necessário ao usar serviços auto-hospedados como o Minio.",
	"save": "Salvar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"objectStorage": "Хранилище",
	"useObjectStorage": "Занято в хранилище",
	"objectStorageBaseUrl": "Базовый адрес",
	"objectStorageBaseUrlDesc": "Это начальная часть адреса, используемого CDN или прокси, например для S3: https://\u003cbucket>.s3.amazonaws.com, или дя GCS: 'https://storage.googleapis.com/\u003cbucket>'",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Укажите название контейнера (Bucket) который используется на выбранном сервисе.",
	"objectStoragePrefix": "Префикс",
	"objectStoragePrefixDesc": "Файлы будут храниться в директории, соответствующей указанному здесь префиксу пути",
	"objectStorageEndpoint": "Конечная точка",
	"objectStorageEndpointDesc": "Если используете AWS S3, оставьте пустым. В остальных случаях укажите конечную точку (endpoint) в форме «\u003chost>» или «\u003chost>:\u003cport>», так, как это описано в руководстве той службы, которую собираетесь использовать.",
	"objectStorageRegion": "Регион",
	"objectStorageRegionDesc": "Укажите регион, например xx-east-1. Если ваша служба не различает регионы, оставьте поле пустым, или впишите us-east-1.",
	"objectStorageUseSSL": "Использовать SSL",
	"objectStorageUseSSLDesc": "Отключите, если не собираетесь использовать протокол HTTPS для обмена по API.",
	"objectStorageUseProxy": "Использовать прокси",
	"objectStorageUseProxyDesc": "Отключите, если не будете испоьзовать прокси для соединений по протоколу ObjectStorage.",
	"objectStorageSetPublicRead": "Устанавливать public-read при загрузке на сервер",
	"s3ForcePathStyleDesc": "Включение s3ForcePathStyle приводит к тому, что имя корзины указывается как часть пути в URL, а не в имени хоста. Может потребоваться включить при использовании локального Minio или чего-то подобного.",
	"save": "Сохранить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"objectStorage": "Objektové úložisko",
	"useObjectStorage": "Použiť objektové úložisko",
	"objectStorageBaseUrl": "Základná URL",
	"objectStorageBaseUrlDesc": "URL použitá ako referencia. Zadajte URL svojho CDN alebo Proxy ak niektoré používate. S3: 'https://\u003cbucket>.s3.amazonaws.com', GCS: 'https://storage.googleapis.com/\u003cbucket>' atď.",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Prosím zadajte názov bucketu od svojho poskytovateľa.",
	"objectStoragePrefix": "Prefix",
	"objectStoragePrefixDesc": "Súbory budú ukladané do priečinkov pod týmto prefixom.",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "Nechajte prázdne ak používate AWS S3, inak zadajte endpoint ako \"\u003chost>\" alebo \"\u003chost>:\u003cport>\". Záleží to od služby, ktorú používate.",
	"objectStorageRegion": "Región",
	"objectStorageRegionDesc": "Zadajte región ako 'xx-east-1'. Ak vaša služba nerozlišuje regióny, nechajte prázdne alebo zadajte 'us-east-1'.",
	"objectStorageUseSSL": "Použiť SSL",
	"objectStorageUseSSLDesc": "Vypnite to ak nechcete použiť HTTPS na API spojenia.",
	"objectStorageUseProxy": "Pripájať cez Proxy",
	"objectStorageUseProxyDesc": "Vypnite ak nechcete, aby spojenia na API išli cez Proxy",
	"objectStorageSetPublicRead": "Pri nahratí nastaviť \"public-read\"",
	"s3ForcePathStyleDesc": "If s3ForcePathStyle is enabled, the bucket name has to included in the path of the URL as opposed to the hostname of the URL. You may need to enable this setting when using services such as a self-hosted Minio instance.",
	"save": "Uložiť"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"objectStorage": "การจัดเก็บในรูปแบบอ็อบเจกต์",
	"useObjectStorage": "ใช้การจัดเก็บในรูปแบบอ็อบเจกต์",
	"objectStorageBaseUrl": "Base URL",
	"objectStorageBaseUrlDesc": "URL ที่ใช้เป็นข้อมูลอ้างอิง ระบุ URL ของ CDN หรือ Proxy ถ้าหากคุณใช้อย่างใดอย่างหนึ่ง\n สำหรับการใช้งาน S3 'https://\u003cbucket>.s3.amazonaws.com' และสำหรับ GCS หรือบริการที่เทียบเท่าใช้ 'https://storage.googleapis.com/\u003cbucket>', เป็นต้น",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "โปรดระบุชื่อบัคเก็ตของบริการที่ใช้อยู่",
	"objectStoragePrefix": "คำนำหน้า",
	"objectStoragePrefixDesc": "ไฟล์ทั้งหมดจะถูกเก็บไว้ภายใต้ไดเร็กทอรีที่มีคำนำหน้านี้",
	"objectStorageEndpoint": "ปลายทาง",
	"objectStorageEndpointDesc": "เว้นว่างไว้หากคุณใช้ AWS S3 หรือระบุปลายทางเป็น '\u003chost>' หรือ '\u003chost>:\u003cport>' ทั้งนี้ขึ้นอยู่กับผู้ให้บริการที่คุณใช้อยู่ด้วย",
	"objectStorageRegion": "ภูมิภาค",
	"objectStorageRegionDesc": "ระบุภูมิภาค เช่น ‘xx-east-1’ หากบริการของคุณไม่แยกภูมิภาค ให้ระบุเป็น ‘us-east-1’ หรือเว้นวางไว้หากใช้ AWS configuration files / environment variables",
	"objectStorageUseSSL": "ใช้ SSL",
	"objectStorageUseSSLDesc": "ปิดการทำงานนี้ไว้ ถ้าหากคุณจะไม่ใช้ HTTPS สำหรับการเชื่อมต่อ API",
	"objectStorageUseProxy": "เชื่อมต่อผ่านพร็อกซี",
	"objectStorageUseProxyDesc": "ปิดสิ่งนี้ไว้ถ้าหากคุณจะไม่ใช้ Proxy สำหรับการเชื่อมต่อ API",
	"objectStorageSetPublicRead": "ตั้งค่าเป็น “public-read” เมื่ออัปโหลด",
	"s3ForcePathStyleDesc": "เมื่อเปิดใช้งาน s3ForcePathStyle จะบังคับให้ ระบุชื่อบัคเก็ตเป็นส่วนหนึ่งของพาธ แทนที่จะเป็นชื่อโฮสต์ใน URL, อาจจำเป็นต้องเปิดใช้งานตัวเลือกนี้เมื่อใช้กับ Minio ที่โฮสต์เองหรือบริการที่คล้ายกัน",
	"save": "บันทึก"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"objectStorage": "Nesne Depolama",
	"useObjectStorage": "Nesne depolamayı kullanın",
	"objectStorageBaseUrl": "Temel URL",
	"objectStorageBaseUrlDesc": "Referans olarak kullanılan URL. CDN veya Proxy kullanıyorsanız, bunların URL'sini belirtin.\nS3 için ‘https://\u003cbucket>.s3.amazonaws.com’ ve GCS veya eşdeğer hizmetler için ‘https://storage.googleapis.com/\u003cbucket>’ vb. kullanın.",
	"objectStorageBucket": "Kova",
	"objectStorageBucketDesc": "Lütfen sağlayıcınızda kullanılan kova adını belirtin.",
	"objectStoragePrefix": "Ön ek",
	"objectStoragePrefixDesc": "Dosyalar bu öneke sahip dizinler altında saklanacaktır.",
	"objectStorageEndpoint": "Uç nokta",
	"objectStorageEndpointDesc": "AWS S3 kullanıyorsanız bu alanı boş bırakın, aksi takdirde kullandığınız hizmete bağlı olarak uç noktayı ‘\u003chost>’ veya ‘\u003chost>:\u003cport>’ olarak belirtin.",
	"objectStorageRegion": "Bölge",
	"objectStorageRegionDesc": "'xx-east-1' gibi bir bölge belirt. Hizmetin bölgeler arasında ayrım yapmıyorsa, ‘us-east-1’ girin. AWS yapılandırma dosyalarını veya ortam değişkenlerini kullanıyorsan boş bırak.",
	"objectStorageUseSSL": "SSL kullanın",
	"objectStorageUseSSLDesc": "API bağlantıları için HTTPS kullanmayacaksanız bunu kapatın.",
	"objectStorageUseProxy": "Proxy üzerinden bağlan",
	"objectStorageUseProxyDesc": "API bağlantıları için Proxy kullanmayacaksanız bunu kapatın.",
	"objectStorageSetPublicRead": "Yükleme sırasında \"genel-okuma\" ayarını yapın",
	"s3ForcePathStyleDesc": "s3ForcePathStyle etkinleştirilirse, kova adı URL'nin ana bilgisayar adı yerine URL yoluna eklenmelidir. Kendi kendine barındırılan bir Minio örneği gibi hizmetleri kullanırken bu ayarı etkinleştirmen gerekebilir.",
	"save": "Kaydet"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"objectStorage": "Object Storage",
	"useObjectStorage": "Use object storage",
	"objectStorageBaseUrl": "Base URL",
	"objectStorageBaseUrlDesc": "The URL used as reference. Specify the URL of your CDN or Proxy if you are using either.\nFor S3 use 'https://\u003cbucket>.s3.amazonaws.com' and for GCS or equivalent services use 'https://storage.googleapis.com/\u003cbucket>', etc.",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Please specify the bucket name used at your provider.",
	"objectStoragePrefix": "Prefix",
	"objectStoragePrefixDesc": "Files will be stored under directories with this prefix.",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "Leave this empty if you are using AWS S3, otherwise specify the endpoint as '\u003chost>' or '\u003chost>:\u003cport>', depending on the service you are using.",
	"objectStorageRegion": "Region",
	"objectStorageRegionDesc": "Specify a region like 'xx-east-1'. If your service does not distinguish between regions, enter 'us-east-1'. Leave empty if using AWS configuration files or environment variables.",
	"objectStorageUseSSL": "Use SSL",
	"objectStorageUseSSLDesc": "Turn this off if you are not going to use HTTPS for API connections",
	"objectStorageUseProxy": "Connect over Proxy",
	"objectStorageUseProxyDesc": "Turn this off if you are not going to use a Proxy for API connections",
	"objectStorageSetPublicRead": "Set \"public-read\" on upload",
	"s3ForcePathStyleDesc": "If s3ForcePathStyle is enabled, the bucket name has to included in the path of the URL as opposed to the hostname of the URL. You may need to enable this setting when using services such as a self-hosted Minio instance.",
	"save": "Save"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"objectStorage": "Object Storage",
	"useObjectStorage": "Використовувати object storage",
	"objectStorageBaseUrl": "Base URL",
	"objectStorageBaseUrlDesc": "Це початкова частина адреси, що використовується CDN або проксі, наприклад для S3: https://\u003cbucket>.s3.amazonaws.com, або GCS: 'https://storage.googleapis.com/\u003cbucket>'",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Будь ласка вкажіть назву відра в налаштованому сервісі.",
	"objectStoragePrefix": "Prefix",
	"objectStoragePrefixDesc": "Файли будуть зберігатись у розташуванні з цим префіксом.",
	"objectStorageEndpoint": "Endpoint",
	"objectStorageEndpointDesc": "Залиште пустим при використанні AWS S3. Інакше введіть кінцевий пункт як '\u003chost>' або '\u003chost>:\u003cport>' слідуючи інструкціям сервісу, який використовується.",
	"objectStorageRegion": "Region",
	"objectStorageRegionDesc": "Введіть регіон у формі 'xx-east-1'. Залиште пустим, якщо ваш сервіс не різниться відповідно до регіонів, або введіть 'us-east-1'.",
	"objectStorageUseSSL": "Використовувати SSL",
	"objectStorageUseSSLDesc": "Вимкніть коли не використовується HTTPS для з'єднання API",
	"objectStorageUseProxy": "Використовувати Proxy",
	"objectStorageUseProxyDesc": "Вимкніть коли проксі не використовується для з'єднання ObjectStorage",
	"objectStorageSetPublicRead": "Встановіть 'публічне читання' при завантаженні",
	"s3ForcePathStyleDesc": "Якщо увімкнено s3ForcePathStyle, назва бакету має бути включена до шляху URL, а не до імені хосту URL. Можливо, вам потрібно ввімкнути це налаштування під час використання таких сервісів, як власний екземпляр Minio.",
	"save": "Зберегти"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"objectStorage": "Đối tượng lưu trữ",
	"useObjectStorage": "Dùng đối tượng lưu trữ",
	"objectStorageBaseUrl": "Base URL",
	"objectStorageBaseUrlDesc": "URL được sử dụng làm tham khảo. Chỉ định URL của CDN hoặc Proxy của bạn nếu bạn đang sử dụng. Với S3 dùng 'https://\u003cbucket>.s3.amazonaws.com', còn GCS hoặc dịch vụ tương tự dùng 'https://storage.googleapis.com/\u003cbucket>', etc.",
	"objectStorageBucket": "Bucket",
	"objectStorageBucketDesc": "Nhập tên bucket dùng ở nhà cung cấp của bạn.",
	"objectStoragePrefix": "Tiền tố",
	"objectStoragePrefixDesc": "Các tập tin sẽ được lưu trữ trong các thư mục có tiền tố này.",
	"objectStorageEndpoint": "Đầu cuối",
	"objectStorageEndpointDesc": "Để trống nếu bạn đang dùng AWS S3, nếu không thì chỉ định đầu cuối là '\u003chost>' hoặc '\u003chost>:\u003cport>', tùy thuộc vào nhà cung cấp dịch vụ.",
	"objectStorageRegion": "Khu vực",
	"objectStorageRegionDesc": "Nhập một khu vực cụ thể như 'xx-east-1'. Nếu nhà cung cấp dịch vụ của bạn không phân biệt giữa các khu vực, hãy để trống hoặc nhập 'us-east-1'.",
	"objectStorageUseSSL": "Dùng SSL",
	"objectStorageUseSSLDesc": "Tắt nếu bạn không dùng HTTPS để kết nối API",
	"objectStorageUseProxy": "Kết nối thông qua Proxy",
	"objectStorageUseProxyDesc": "Tắt nếu bạn không dùng Proxy để kết nối API",
	"objectStorageSetPublicRead": "Đặt \"public-read\" khi tải lên",
	"s3ForcePathStyleDesc": "Nếu s3ForcePathStyle được bật, tên bucket phải được thêm vào địa chỉ URL thay vì chỉ có tên miền. Bạn có thể phải sử dụng thiết lập này nếu bạn sử dụng các dịch vụ như Minio mà bạn tự cung cấp.",
	"save": "Lưu"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"objectStorage": "对象存储",
	"useObjectStorage": "使用对象存储",
	"objectStorageBaseUrl": "Base URL",
	"objectStorageBaseUrlDesc": "用于参考的 URL，如果您正在使用 CDN 或 Proxy，请填入服务商提供的 URL；S3：“https://\u003cbucket>.s3.amazonaws.com”；GCS：“https://storage.googleapis.com/\u003cbucket>”",
	"objectStorageBucket": "存储桶",
	"objectStorageBucketDesc": "请指定使用的对象存储服务的存储桶名称。",
	"objectStoragePrefix": "前缀",
	"objectStoragePrefixDesc": "文件将存储在此前缀的目录下。",
	"objectStorageEndpoint": "端点",
	"objectStorageEndpointDesc": "如果你使用 AWS S3 请留空。否则请根据你使用的服务商的说明来进行设置，指定端点形式为“\u003chost>”或“\u003chost>:\u003cport>”。",
	"objectStorageRegion": "可用区",
	"objectStorageRegionDesc": "指定一个可用区，例如“xx-east-1”。 如果您的对象存储服务没有可用区概念，请将其留空或填写“us-east-1”。如果引用 AWS 的配置文件或环境变量，则留空。",
	"objectStorageUseSSL": "使用 SSL",
	"objectStorageUseSSLDesc": "如果不使用 https 进行 API 连接，请关闭。",
	"objectStorageUseProxy": "使用代理",
	"objectStorageUseProxyDesc": "如果不使用代理进行 API 连接，请关闭。",
	"objectStorageSetPublicRead": "上传时设置为 public-read",
	"s3ForcePathStyleDesc": "启用 s3ForcePathStyle 会强制将存储桶名称指定为 URL 中路径的一部分，而不是主机名。使用自托管 Minio 等时可能需要启用。",
	"save": "保存"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"objectStorage": "物件儲存",
	"useObjectStorage": "使用物件儲存",
	"objectStorageBaseUrl": "Base URL",
	"objectStorageBaseUrlDesc": "用於引用的 URL。如果您使用的是 CDN 或反向代理，請指定其 URL，例如 S3（https://\u003cbucket>.s3.amazonaws.com）、GCS（https://storage.googleapis.com/\u003cbucket>）。",
	"objectStorageBucket": "儲存空間（Bucket）",
	"objectStorageBucketDesc": "請填寫所用服務的儲存桶（Bucket）名稱。 ",
	"objectStoragePrefix": "前綴",
	"objectStoragePrefixDesc": "它儲存在此前綴目錄下。",
	"objectStorageEndpoint": "端點（Endpoint）",
	"objectStorageEndpointDesc": "如使用 AWS S3，請留空。如使用其他服務，請按照其說明文件以「\u003chost>」或「\u003chost>:\u003cport>」的形式設定端點（Endpoint）。",
	"objectStorageRegion": "區域（Region）",
	"objectStorageRegionDesc": "請填寫一個分區，例如「xx-east-1」。 如果您使用的服務不設分區，請留空或填寫「us-east-1」。",
	"objectStorageUseSSL": "使用 SSL",
	"objectStorageUseSSLDesc": "請在不使用 https 連接 API 時關閉",
	"objectStorageUseProxy": "使用網路代理",
	"objectStorageUseProxyDesc": "請在不使用網路代理連接 API 時關閉",
	"objectStorageSetPublicRead": "上傳時設定為「public-read」",
	"s3ForcePathStyleDesc": "啟用 s3ForcePathStyle 將強制填寫儲存空間（Bucket）名稱至 URL 路徑內，而非寫入主機名。 使用如 Minio 等自行託管服務時可能需要啟用。",
	"save": "儲存"
}
</locale>
