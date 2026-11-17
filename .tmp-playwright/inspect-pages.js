const Database = require('better-sqlite3');
const db = new Database('C:/Users/leos/projects/clcargo/wp-content/database/.ht.sqlite', { readonly: true });
const rows = db.prepare("SELECT ID, post_status, post_title, SUBSTR(post_content, 1, 30000) c FROM wp_posts WHERE ID IN (6,7)").all();
for (const r of rows) {
  console.log('=== page', r.ID, r.post_status, r.post_title);
  const idx = r.c.indexOf('forminator');
  if (idx >= 0) {
    console.log('around forminator block:');
    console.log(r.c.slice(Math.max(0, idx - 200), idx + 400));
  } else {
    console.log('no forminator block in first 30k chars');
  }
}
db.close();
