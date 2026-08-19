import { load } from 'cheerio';
import fs from 'node:fs';

function normalize(html) {
  const $ = load(html, { xmlMode: false });
  $('script, style').remove();
  const text = $('body').text().replace(/\s+/g, '');
  const classes = [];
  $('[class]').each((i, el) => { classes.push($(el).attr('class')); });
  return { text, classes };
}

function check(srcPath, outPath, label, verbose) {
  const src = normalize(fs.readFileSync(srcPath, 'utf8'));
  const out = normalize(fs.readFileSync(outPath, 'utf8'));
  const textOk = src.text === out.text;
  const classOk = JSON.stringify(src.classes) === JSON.stringify(out.classes);
  if ((!textOk || !classOk) && verbose) {
    console.log(label, 'text:', textOk, 'classes:', classOk);
    if (!textOk) {
      for (let i = 0; i < Math.max(src.text.length, out.text.length); i++) {
        if (src.text[i] !== out.text[i]) { console.log(' text diff at', i, JSON.stringify(src.text.slice(Math.max(0, i - 40), i + 40)), '|VS|', JSON.stringify(out.text.slice(Math.max(0, i - 40), i + 40))); break; }
      }
    }
    if (!classOk) {
      for (let i = 0; i < Math.max(src.classes.length, out.classes.length); i++) {
        if (src.classes[i] !== out.classes[i]) { console.log(' class diff at', i, src.classes[i], '|VS|', out.classes[i]); break; }
      }
    }
  }
  return textOk && classOk;
}

const routes = fs.readFileSync('../parity/routes-source.txt', 'utf8').trim().split('\n').filter(Boolean);
let fail = 0;
for (const route of routes) {
  const ok = check('../voskes.ir/' + route, 'dist/' + route, route, true);
  if (!ok) fail++;
}
console.log('failures:', fail, '/', routes.length);
