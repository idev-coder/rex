const path = require('path');

const commonConfig = {
    entry: './src/index.js',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
        ],
    },
    resolve: {
        extensions: ['.js'],
        fallback: {
            path: require.resolve('path-browserify'), // From the previous solution
            url: false, // Exclude the url module
            crypto: false,
            zlib: false,
            stream: false,
            querystring: false,
            http: false,
            net: false,
            fs: false,
        },
    },
};

const umdConfig = {
    ...commonConfig,
    output: {
        path: path.resolve(__dirname, 'lib'),
        filename: 'index.umd.js',
        library: 'MyLibrary',
        libraryTarget: 'umd',
        globalObject: 'this',
    },
};

const commonjsConfig = {
    ...commonConfig,
    output: {
        path: path.resolve(__dirname, 'lib'),
        filename: 'index.cjs.js',
        libraryTarget: 'commonjs2',
    },
};

const esmConfig = {
    ...commonConfig,
    output: {
        path: path.resolve(__dirname, 'lib'),
        filename: 'index.esm.js',
        libraryTarget: 'module',
    },
    experiments: {
        outputModule: true,
    },
};

module.exports = [umdConfig, commonjsConfig, esmConfig];
