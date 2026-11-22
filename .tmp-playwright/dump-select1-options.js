// Dump the raw forminator_form_meta serialized blob for inspection
const Database = require('better-sqlite3');
const db = new Database('C:/Users/leos/projects/clcargo/wp-content/database/.ht.sqlite', { readonly: true });

for (const id of [5, 12]) {
  const row = db.prepare("SELECT meta_value FROM wp_postmeta WHERE post_id=? AND meta_key='forminator_form_meta'").get(id);
  if (!row) { console.log('no meta for', id); continue; }
  const v = row.meta_value;
  console.log('=== form ' + id + '  length=' + v.length + ' ===');
  // Find select-1 block
  const idx = v.indexOf('"select-1"');
  if (idx < 0) { console.log('no select-1'); continue; }
  console.log(v.substr(idx, 1200));
}
db.close();
