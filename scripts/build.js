const Path = require("path");
const Chalk = require("chalk");
const FileSystem = require("fs");
const Vite = require("vite");
const compileTs = require("./private/tsc");

function buildRenderer() {
  return Vite.build({
    configFile: Path.join(__dirname, "..", "vite.config.js"),
    base: "./",
    mode: "production",
  });
}

function buildMain() {
  const mainPath = Path.join(__dirname, "..", "src", "main");
  return compileTs(mainPath);
}

FileSystem.rmSync(Path.join(__dirname, "..", "build"), {
  recursive: true,
  force: true,
});

console.log(Chalk.blueBright("Transpiling renderer & main..."));

Promise.allSettled([buildRenderer(), buildMain()]).then(() => {
  console.log(
    Chalk.greenBright(
      "Renderer & main successfully transpiled! (ready to be built with electron-builder)"
    )
  );

  // === 自动复制protobuf目录 ===
  const fs = require('fs');
  const path = require('path');
  const src = path.join(__dirname, '../src/protobuf');
  const dest = path.join(__dirname, '../build/main/src/protobuf');
  if (fs.existsSync(src)) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(file => {
      fs.copyFileSync(path.join(src, file), path.join(dest, file));
    });
    console.log(Chalk.greenBright('Protobuf definitions copied to build/main/src/protobuf'));
  } else {
    console.warn(Chalk.yellow('src/protobuf directory does not exist, skip copy.'));
  }

  // === 复制生产环境配置文件 ===
  const prodConfigSrc = path.join(__dirname, '../config.production.env');
  const buildConfigDest = path.join(__dirname, '../build/config.env');
  if (fs.existsSync(prodConfigSrc)) {
    fs.copyFileSync(prodConfigSrc, buildConfigDest);
    console.log(Chalk.greenBright('Production config copied to build/config.env'));
  } else {
    console.warn(Chalk.yellow('config.production.env does not exist, using development config'));
    const devConfigSrc = path.join(__dirname, '../config.env');
    if (fs.existsSync(devConfigSrc)) {
      fs.copyFileSync(devConfigSrc, buildConfigDest);
    }
  }
});
