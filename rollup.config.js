import builder from "@daybrush/builder";

const defaultOptions = {
    tsconfig: "tsconfig.build.json",
    external: {
        "@daybrush/utils": "utils",
        "gesto": "Gesto",
        "@egjs/axes": "eg.Axes",
        "react": "React",
        "keycon": "KeyController",
        "react-dom": "ReactDOM",
        "react-css-styled": "styled"
    },
};

export default builder([
    {
        ...defaultOptions,
        input: "src/react-folder/index.esm.ts",
        output: "./dist/folder.esm.js",
        format: "es",
        exports: "named",
    },
    {
        ...defaultOptions,
        input: "src/react-folder/index.umd.ts",
        output: "./dist/folder.cjs.js",
        format: "cjs",
        exports: "default",
    },
]);
