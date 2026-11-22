const Database = require('better-sqlite3');
const db = new Database('C:/Users/leos/projects/clcargo/wp-content/database/.ht.sqlite', { readonly: true });

for (const id of [5, 12]) {
  const row = db.prepare("SELECT meta_value FROM wp_postmeta WHERE post_id=? AND meta_key='forminator_form_meta'").get(id);
  if (!row) { console.log('no meta for', id); continue; }
  const data = require('php-unserialize').unserialize(row.meta_value);
  const fields = data.fields || [];
  console.log('=== form_id', id, '===');
  for (const f of fields) {
    if (!f || !f.type) continue;
    if (f.type === 'select' || f.type === 'radio' || f.type === 'checkbox') {
      console.log('  ', f.element_id, '(' + f.type + ')  field_label=', f.field_label);
      const opts = f.options || [];
      for (const o of opts) console.log('      value=', o.value, '  label=', o.label);
    } else {
      console.log('  ', f.element_id, '(' + f.type + ')  field_label=', f.field_label);
    }
  }
}
db.close();
