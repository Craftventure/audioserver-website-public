import Vue from "vue";
import App from "./App.vue";
import audioServer from "@/audioserver/audioserver";

// @ts-ignore
import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.min.css'
import AreaManager from "@/audioserver/areamanager";
import LocalConfig from "@/audioserver/localconfig";
import SpatialAudioManager from "@/audioserver/spatialaudiomanager";
import OperatorManager from "@/audioserver/operatormanager";
import UrlUtils from "@/assets/urlutils";

Vue.config.productionTip = false;

Vue.use(VueMaterial);

UrlUtils.saveCurrentParams();
// UrlUtils.clearParamsFromHistory();

// @ts-ignore
Howler.init();
// @ts-ignore
Howler.ctx = new (window.AudioContext ?? window.webkitAudioContext!!)();
Vue.prototype.$localConfig = new LocalConfig();
Vue.prototype.$audioServer = audioServer;
Vue.prototype.$areaManager = new AreaManager(audioServer);
Vue.prototype.$spatialAudioManager = new SpatialAudioManager(audioServer);
Vue.prototype.$operatorManager = new OperatorManager(audioServer);
Vue.config.productionTip = false;

new Vue({
    render: h => h(App)
}).$mount("#app");

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
            registration.unregister()
        }
    });
    caches.keys().then(keyList => {
        return Promise.all(
            keyList.map(key => {
                return caches.delete(key);
            }),
        );
    });
}