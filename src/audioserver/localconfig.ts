import Vue from "vue";

export default class LocalConfig {
    config = new Vue({
        data: {
            theme: this._safeString(localStorage.getItem('theme'))
        },
        watch: {
            theme: function (value) {
                localStorage.setItem('theme', value);
            }
        }
    });

    constructor() {

    }

    _safeString(input: string | undefined | null): string | null {
        if (input === null || input == null || input === 'null' || typeof input === 'undefined') {
            return null;
        } else {
            return input;
        }
    }
}

declare module 'vue/types/vue' {
    interface Vue {
        $localConfig: LocalConfig
        $material: any
    }
}