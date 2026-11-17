const Database = require('better-sqlite3');
const db = new Database('C:/Users/leos/projects/clcargo/wp-content/database/.ht.sqlite', { readonly: true });

// 1. All pages (+posts) with lang/translations
const pages = db.prepare("SELECT ID, post_type, post_status, post_title, LENGTH(post_content) clen FROM wp_posts WHERE post_type IN ('page','post','wp_navigation','forminator_forms') ORDER BY post_type, ID").all();
console.log('=== All content posts ===');
for (const p of pages) console.log(p);

// 2. Taxonomy for Polylang — term_taxonomy of post_translations
const pllTx = db.prepare(`
  SELECT t.term_id, t.name, t.slug, tt.taxonomy, tt.description, tt.count
  FROM wp_term_taxonomy tt JOIN wp_terms t ON t.term_id = tt.term_id
  WHERE tt.taxonomy LIKE 'post_translations' OR tt.taxonomy LIKE 'language' OR tt.taxonomy LIKE 'term_language' OR tt.taxonomy LIKE 'term_translations'
  ORDER BY tt.taxonomy, t.term_id
`).all();
console.log('\n=== Polylang taxonomies ===');
for (const t of pllTx) console.log(t);

// 3. Term relationships for the posts we care about
console.log('\n=== Term rels for pages 6,7 and form 5 ===');
const rels = db.prepare(`
  SELECT tr.object_id, t.slug, tt.taxonomy, tt.description
  FROM wp_term_relationships tr
  JOIN wp_term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
  JOIN wp_terms t ON t.term_id = tt.term_id
  WHERE tr.object_id IN (5,6,7)
  ORDER BY tr.object_id, tt.taxonomy
`).all();
for (const r of rels) console.log(r);

db.close();
