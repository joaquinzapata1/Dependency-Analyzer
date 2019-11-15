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

function getSiteDependencies(name, text) {
  const doc = parse(text);
  let dependencies = [];

  let scripts = doc.querySelectorAll("script");

  scripts.map(e => {
    if (e.attributes.src) {
      let src = e.attributes.src;
      let fileName = getFileName(src);
      dependencies.push(fileName);
      deps.push(fileName);
    }
  });
  console.log(`${name}: ${text.length} bytes`);
  console.log(`${name} dependencies:\n  ${dependencies.join("\n  ")}`);
}

function getFrequency(arr) {
  const count = new Map(
    [...new Set(arr)].map(x => [x, arr.filter(y => y === x).length])
  );
  return count;
}

function analyzeFile() {
  csv()
    .fromFile(path)
    .then(obj => {
      obj.map(o => {
        if (o.url.startsWith("http")) {
          fetch(o.url).then(
            r => {
              r.text()
                .then(t => {
                  getSiteDependencies(o.name, t);
                })
                .catch(e => console.log(e));
            },
            e => {
              console.log(e.toString());
            }
          );
        } else {
          fs.readFile(o.url, "utf8", (e, r) => {
            if (e) throw e;
            getSiteDependencies(o.name, r);
          });
        }
      });
    })
    .then(() => setTimeout(() => console.log(getFrequency(deps)), 2500))
    .catch(e => {
      console.log(e.toString());
    });
}

analyzeFile();
