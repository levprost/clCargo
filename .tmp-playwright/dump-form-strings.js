// Parse the serialized PHP meta of form 5 and dump all translatable strings
const Database = require('better-sqlite3');
const php = require('php-unserialize');
const db = new Database('C:/Users/leos/projects/clcargo/wp-content/database/.ht.sqlite', { readonly: true });
const row = db.prepare("SELECT meta_value FROM wp_postmeta WHERE post_id=5 AND meta_key='forminator_form_meta'").get();
const meta = php.unserialize(row.meta_value);

function* walk(node, path = []) {
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      yield* walk(v, [...path, k]);
    }
  } else if (typeof node === 'string' && node.length > 0) {
    yield { path: path.join('.'), value: node };
  }
}

const hits = [];
for (const h of walk(meta)) {
  if (/[А-Яа-яЁё]/.test(h.value)) hits.push(h);
}
for (const h of hits) console.log(JSON.stringify(h));
console.log('\ncount:', hits.length);
db.close();
