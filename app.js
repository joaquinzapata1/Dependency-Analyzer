const fs = require("fs");
const csv = require("csvtojson");
const fetch = require("node-fetch");
const parse = require("node-html-parser").parse;

let path = "./websites.csv";

function getFileName(url) {
  url = url.substring(
    0,
    url.indexOf("#") == -1 ? url.length : url.indexOf("#")
  );
  url = url.substring(
    0,
    url.indexOf("?") == -1 ? url.length : url.indexOf("?")
  );
  url = url.substring(url.lastIndexOf("/") + 1, url.length);

  return url;
}
async function getSrc(doc) {
  let scripts = doc.querySelectorAll("script");
  scripts = scripts
    .map(e => {
      if (e.attributes.src) {
        let src = e.attributes.src;
        let fileName = getFileName(src);
        return fileName;
      }
    })
    .filter(Boolean);
  return scripts;
}
async function getSiteDependencies(name, text) {
  const doc = await parse(text);
  let fileNames = await getSrc(doc);
  console.log(`${name}: ${text.length} bytes`);
  console.log(`${name} dependencies:\n  ${fileNames.join("\n  ")}\n`);
  return fileNames;
}

async function getFrequency() {
  let dependencies = await analyzeFile();
  return new Map(
    [...new Set(dependencies)].map(x => [
      x,
      dependencies.filter(y => y === x).length
    ])
  );
}

async function analyzeFile() {
  let file = await csv().fromFile(path);
  let deps = await Promise.all(
    file.map(async f =>
      f.url.startsWith("http") ? await fromHttp(f) : await fromLocalFile(f)
    )
  );
  return deps.flat();
}

async function fromLocalFile(file) {
  let r = fs.readFileSync(file.url, { encoding: "utf8" });
  return getSiteDependencies(file.name, r);
}

async function fromHttp(site) {
  let website = await fetch(site.url);
  website = await website.text();
  return getSiteDependencies(site.name, website);
}

(async () => {
  console.log("Frequency", await getFrequency());
})();
