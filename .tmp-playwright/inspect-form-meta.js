const Database = require('better-sqlite3');
const db = new Database('C:/Users/leos/projects/clcargo/wp-content/database/.ht.sqlite', { readonly: true });
const row = db.prepare("SELECT meta_value FROM wp_postmeta WHERE post_id = 5 AND meta_key = 'forminator_form_meta'").get();
const v = row.meta_value;
console.log('length:', v.length);
// find fields marker
const idx = v.indexOf('fields');
console.log('fields idx:', idx);
console.log('tail:', v.slice(-1200));
console.log('---head---');
console.log(v.slice(0, 2500));
db.close();
