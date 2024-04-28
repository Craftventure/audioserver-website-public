module.exports = {
    pwa: {
        themeColor: "#ff9600"
    },
    configureWebpack: {
        entry: {
            app: './src/main.ts'
        }
    },
    productionSourceMap: false,
};