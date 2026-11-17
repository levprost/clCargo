const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('C:/Users/leos/projects/clcargo/wp-content/database/.ht.sqlite', { readonly: true });
for (const id of [6, 7]) {
  const row = db.prepare('SELECT post_title, post_content FROM wp_posts WHERE ID=?').get(id);
  fs.writeFileSync(`C:/Users/leos/projects/clcargo/.tmp-playwright/page-${id}.html`, row.post_content);
  console.log('wrote', id, row.post_title, 'len=', row.post_content.length);
}
db.close();
