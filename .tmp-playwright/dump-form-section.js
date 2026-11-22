const Database = require('better-sqlite3');
const db = new Database('C:/Users/leos/projects/clcargo/wp-content/database/.ht.sqlite', { readonly: true });
for (const id of [6, 7]) {
  const row = db.prepare("SELECT post_title, post_content FROM wp_posts WHERE ID=?").get(id);
  if (!row) continue;
  console.log('=== page', id, '-', row.post_title, '===');
  const c = row.post_content;
  const start = c.indexOf('====== FORM ======');
  const end = c.indexOf('====== DIRECTIONS ======');
  if (start >= 0 && end >= 0) {
    console.log(c.slice(start, end));
  } else {
    const idx = c.indexOf('forminator_form');
    console.log('(markers not found)');
    console.log(c.slice(Math.max(0, idx - 800), idx + 400));
  }
}
db.close();
