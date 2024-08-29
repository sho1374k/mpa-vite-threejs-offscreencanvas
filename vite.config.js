import { defineConfig } from "vite";
import { resolve, extname, dirname, basename, join, relative } from "path";
import fs from "fs";
import autoprefixer from "autoprefixer";
import * as dotenv from "dotenv";
import glsl from "vite-plugin-glsl";

const result = dotenv.config();
if (result.error) throw result.error;

const DIR = {
  DIST: "dist",
  SRC: "src",
  PUBLIC: "public",
};

const HASH = `${new Date().getFullYear()}${new Date().getMonth() + 1}${new Date().getDate()}`;

const getAllHtmlFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = resolve(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllHtmlFiles(filePath));
    } else if (extname(file) === ".html") {
      results.push(filePath);
    }
  });
  return results;
};

const htmlFiles = getAllHtmlFiles(resolve(__dirname, DIR.SRC));

const input = {};
htmlFiles.forEach((file) => {
  const relativePath = file.replace(resolve(__dirname, DIR.SRC) + "/", "");

  let name = relativePath.replace(/\.html$/, "");
  const dirName = basename(dirname(name));

  if (basename(name) === "index") {
    name = dirName ? `${dirName}` : "index";
  } else {
    name = `${dirName ? dirName + "-" : ""}${basename(name)}`;
  }

  if (name === "." || name.includes(".") || name === "") name = "index";

  input[name] = file;
});

export default defineConfig(({ mode }) => {
  // const IS_DEV = mode === "development";
  return {
    base: "./",
    root: DIR.SRC,
    publicDir: resolve(__dirname, DIR.PUBLIC),
    resolve: {
      alias: {
        "@scss": resolve(__dirname, "src/assets/scss"),
      },
    },
    css: {
      devSourcemap: true,
      postcss: {
        plugins: [autoprefixer({ grid: true })],
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@scss/common.scss";`,
        },
      },
    },
    esbuild: {
      drop: ["console", "debugger"],
    },
    build: {
      outDir: resolve(__dirname, DIR.DIST),
      emptyOutDir: true,
      modulePreload: {
        polyfill: false,
      },
      chunkSizeWarningLimit: 100000000,
      rollupOptions: {
        input: input,
        output: {
          entryFileNames: (chunkInfo) => {
            const relativePath = relative(join(process.cwd()), chunkInfo.facadeModuleId);
            let filename = relativePath
              .replace("src/", "")
              .replace("index.html", "")
              .replace(/\//g, "-")
              .replace(/-$/, "");
            if (filename === "") filename = "index";
            filename = filename || chunkInfo.name || "index";
            return `assets/js/${filename}.${HASH}.js`;
          },
          chunkFileNames: (chunkInfo) => {
            const name = chunkInfo.name || "index";
            return `assets/js/_chunk/${name}.${HASH}.js`;
          },
          assetFileNames: (assetInfo) => {
            let filename = assetInfo.originalFileName;
            if (filename != null) {
              filename = assetInfo.originalFileName;
              filename = filename.replace("index.html", "").replace(/\//g, "-").replace(/-$/, "");
              if (filename === "") filename = "index";
            }
            return filename != null
              ? `assets/[ext]/${filename}.${HASH}[extname]`
              : `assets/[ext]/[name].${HASH}[extname]`;
          },
          manualChunks: undefined,
        },
      },
    },
    plugins: [
      glsl({
        include: /\.(vs|fs|frag|vert|glsl)$/,
        compress: mode === "production",
      }),
    ],
    server: {
      open: true,
      port: process.env.PORT,
      host: true,
    },
  };
});
