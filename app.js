const fs = require("fs");
const csv = require("csvtojson");
const fetch = require("node-fetch");
const parse = require("node-html-parser").parse;

let path = "./websites.csv";
let deps = [];

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

async function getSiteDependencies(name, text) {
  const doc = parse(text);
  let scripts = doc.querySelectorAll("script");

  let dependencies = scripts
    .map(e => {
      if (e.attributes.src) {
        let src = e.attributes.src;
        let fileName = getFileName(src);
        return fileName;
      }
    })
    .filter(Boolean);
  console.log(`${name}: ${text.length} bytes`);
  console.log(`${name} dependencies:\n  ${dependencies.join("\n  ")}\n`);
  deps = [...deps, ...dependencies];
}

function getFrequency(arr) {
  return new Map(
    [...new Set(arr)].map(x => [x, arr.filter(y => y === x).length])
  );
}

async function analyzeFile() {
  let file = await csv().fromFile(path);
  file.map(f => {
    if (f.url.startsWith("http")) fromHttp(f);
    else fromLocalFile(f);
  });
}

function fromLocalFile(file) {
  fs.readFile(file.url, "utf8", async (e, r) => {
    if (e) throw e;
    getSiteDependencies(file.name, r);
  });
}

async function fromHttp(site) {
  let website = await fetch(site.url);
  website = await website.text();
  getSiteDependencies(site.name, website);
}

(() => {
  analyzeFile();
  setTimeout(() => {
    console.log("Frequency", getFrequency(deps));
  }, 3000);
})();
