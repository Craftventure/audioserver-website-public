module.exports = {
    presets: [
        [
            '@vue/cli-plugin-babel/preset', {
            useBuiltIns: "entry",
            polyfills: [
                'es2015.collection'
            ]
        }
        ]
    ]
};
