<?php
/**
 * Updates the form-section heading + subtitle on pages 6 (RU) and 7 (UK)
 * to match form.md brief: «Калькулятор доставки» with gold accent and a
 * new subtitle. Idempotent — safe to run multiple times.
 */
$dbPath = 'C:/Users/leos/projects/clcargo/wp-content/database/.ht.sqlite';
$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$pages = [
    6 => [
        'old_h2_marker' => 'Рассчитаем стоимость вашей доставки за 15 минут',
        'new_h2_inner'  => '<span class="clcargo-calc-title__main">Калькулятор</span> <span class="clcargo-calc-title__accent">доставки</span>',
        'old_p_marker'  => 'Заполните форму — менеджер свяжется с вами и назовёт точную стоимость с учётом доставки и растаможки.',
        'new_p_inner'   => 'Рассчитайте ориентировочные сроки и стоимость перевозки вашего груза',
    ],
    7 => [
        'old_h2_marker' => 'Розрахуємо вартість вашої доставки за 15 хвилин',
        'new_h2_inner'  => '<span class="clcargo-calc-title__main">Калькулятор</span> <span class="clcargo-calc-title__accent">доставки</span>',
        'old_p_marker'  => 'Заповніть форму — менеджер зв\'яжеться з вами і назве точну вартість з урахуванням доставки та розмитнення.',
        'new_p_inner'   => 'Розрахуйте орієнтовні терміни та вартість перевезення вашого вантажу',
    ],
];

foreach ($pages as $id => $cfg) {
    $stmt = $pdo->prepare('SELECT post_content FROM wp_posts WHERE ID = ?');
    $stmt->execute([$id]);
    $content = $stmt->fetchColumn();
    if ($content === false) {
        echo "page $id not found\n";
        continue;
    }

    $new = $content;

    // Replace the h2 inner text with our two-span structure.
    // Add className to the block so the new gradient title styles apply.
    // Pattern: <!-- wp:heading {"level":2,"textAlign":"center"} --><h2 class="wp-block-heading has-text-align-center">...<old>...</h2><!-- /wp:heading -->
    $oldH2Full = '<!-- wp:heading {"level":2,"textAlign":"center"} --><h2 class="wp-block-heading has-text-align-center">' . $cfg['old_h2_marker'] . '</h2><!-- /wp:heading -->';
    $newH2Full = '<!-- wp:heading {"level":2,"textAlign":"center","className":"clcargo-calc-title"} --><h2 class="wp-block-heading has-text-align-center clcargo-calc-title">' . $cfg['new_h2_inner'] . '</h2><!-- /wp:heading -->';

    if (strpos($new, $oldH2Full) !== false) {
        $new = str_replace($oldH2Full, $newH2Full, $new);
        echo "page $id: H2 replaced\n";
    } elseif (strpos($new, $cfg['new_h2_inner']) !== false) {
        echo "page $id: H2 already up to date\n";
    } else {
        echo "page $id: H2 not found (markers changed?)\n";
    }

    // Replace subtitle paragraph. The old <p> has a lot of block attributes;
    // I only touch the inner text, leaving the block wrapper intact.
    if (strpos($new, $cfg['old_p_marker']) !== false) {
        $new = str_replace($cfg['old_p_marker'], $cfg['new_p_inner'], $new);
        echo "page $id: subtitle replaced\n";
    } elseif (strpos($new, $cfg['new_p_inner']) !== false) {
        echo "page $id: subtitle already up to date\n";
    } else {
        echo "page $id: subtitle not found\n";
    }

    if ($new !== $content) {
        $pdo->prepare('UPDATE wp_posts SET post_content = ?, post_modified = datetime("now") WHERE ID = ?')
            ->execute([$new, $id]);
        echo "page $id: saved (new length " . strlen($new) . ")\n";
    }
}
