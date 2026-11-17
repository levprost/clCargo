const Database = require('better-sqlite3');
const db = new Database('C:/Users/leos/projects/clcargo/wp-content/database/.ht.sqlite', { readonly: true });

// 1. Get the Forminator form post
const post = db.prepare("SELECT ID, post_type, post_status, post_title FROM wp_posts WHERE ID = 5").get();
console.log('post #5:', post);

// 2. Get all forminator-related post types
const types = db.prepare("SELECT post_type, COUNT(*) c FROM wp_posts GROUP BY post_type").all();
console.log('post types:', types);

// 3. Find form by forminator post_type
const forms = db.prepare("SELECT ID, post_type, post_status, post_title FROM wp_posts WHERE post_type LIKE 'forminator%'").all();
console.log('forminator posts:', forms);

// 4. Meta of post 5
const meta5 = db.prepare("SELECT meta_key, SUBSTR(meta_value, 1, 200) v FROM wp_postmeta WHERE post_id = 5").all();
console.log('post #5 meta:', meta5);

// 5. Check widgets / any form reference
db.close();
