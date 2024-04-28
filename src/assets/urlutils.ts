const UrlUtils = {
    _getParameterByName: function (name: string, url: string) {
        if (!url) url = window.location.href;
        name = name.replace(/[[\]]/g, "\\$&");
        let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    },
    urlParams: null as URLSearchParams | null,
    getParam: function (name: string) {
        if (this.urlParams != null) {
            if (this.urlParams.has(name)) {
                return this.urlParams.get(name);
            }
        }
        return null;
    },
    saveCurrentParams: function () {
        this.urlParams = new URLSearchParams(window.location.search);
    },
    clearParamsFromHistory: function () {
        history.replaceState({}, '', location.pathname);
        // let userName = this._getParameterByName('username');
        // let auth = this._getParameterByName('auth');
        // let socket = this._getParameterByName('socket');
    }
};

export default UrlUtils;