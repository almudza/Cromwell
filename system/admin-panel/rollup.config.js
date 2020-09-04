import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import packageJson from './package.json';
import json from '@rollup/plugin-json';
const { resolve } = require('path');

const external = id => {
    const exts = ['tslib', 'util', 'path'];

    for (const ext of exts) if (id === ext) return true;

    if (id.includes('.cromwell/imports') || id.includes('cromwell/plugins')
        || id.includes('cromwell/themes'))
        return true;

    for (const pack of Object.keys(packageJson.dependencies)) {
        if (id === pack) {
            return true;
        }
    }

    for (const pack of Object.keys(packageJson.devDependencies)) {
        if (id === pack) {
            return true;
        }
    }
}

const buildDir = 'build';

export default [
    {
        // preserveModules: true,
        input: resolve(__dirname, "src/server.ts"),
        output: [
            {
                file: resolve(__dirname, buildDir, 'server.js'),
                // dir: './build',
                format: "cjs",
            }
        ],
        external,
        plugins: [
            json(),
            nodeResolve({
                preferBuiltins: false
            }),
            commonjs(),
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        module: "ESNext"
                    }
                }
            }),
        ]
    },
    {
        // preserveModules: true,
        input: resolve(__dirname, "src/generator.ts"),
        watch: false,
        output: [
            {
                file: resolve(__dirname, buildDir, 'generator.js'),
                // dir: './build',
                format: "cjs",
            }
        ],
        external,
        plugins: [
            nodeResolve({
                preferBuiltins: false
            }),
            commonjs(),
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        module: "ESNext"
                    }
                }
            }),
        ]
    },
];