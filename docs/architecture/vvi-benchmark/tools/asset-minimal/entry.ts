import {createInternationalization,setActiveInternationalization} from 'virtual:vite-vue-internationalization';
const lang=new URL(location.href).searchParams.get('locale')??'ja-JP';localStorage.setItem('lang',lang);const runtime=createInternationalization({initialLocale:lang});await runtime.ready;await runtime.loadLocale(lang);setActiveInternationalization(runtime);await import('./assets.ts');
