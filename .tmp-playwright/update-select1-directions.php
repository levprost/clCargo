<?php
/**
 * Rewrite select-1 options on Forminator forms 5 (RU) and 12 (UK) so one
 * select covers the 6 directions from form.md brief: turkey, china_air,
 * china_sea, europe, india_air, india_sea — each option label includes
 * country + shipping method + estimated delivery time.
 *
 * Also renames the field label from "Страна отправления" / "Країна
 * відправлення" to "Направление" / "Напрямок".
 *
 * The meta is a PHP-serialized blob stored twice — once flat in `fields`,
 * once nested inside `wrappers[].fields[]`. We update both. Idempotent.
 */

$dbPath = 'C:/Users/leos/projects/clcargo/wp-content/database/.ht.sqlite';
$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$forms = [
    5 => [
        // Russian labels + required message
        'field_label'   => 'Направление',
        'required_msg'  => 'Выберите направление отправления',
        'empty_label'   => '-- Выберите направление --',
        'options' => [
            ['value' => 'turkey',     'label' => 'Турция 🇹🇷 — 7–10 дней'],
            ['value' => 'china_air',  'label' => 'Китай 🇨🇳 — авиа — 12–15 дней'],
            ['value' => 'china_sea',  'label' => 'Китай 🇨🇳 — море — 52–60 дней'],
            ['value' => 'europe',     'label' => 'Европа 🇪🇺 / склад Польша — 7 дней'],
            ['value' => 'india_air',  'label' => 'Индия 🇮🇳 — авиа — 14–16 дней'],
            ['value' => 'india_sea',  'label' => 'Индия 🇮🇳 — море — 52–60 дней'],
            ['value' => 'other',      'label' => 'Другое'],
        ],
    ],
    12 => [
        'field_label'   => 'Напрямок',
        'required_msg'  => 'Оберіть напрямок відправлення',
        'empty_label'   => '-- Оберіть напрямок --',
        'options' => [
            ['value' => 'turkey',     'label' => 'Туреччина 🇹🇷 — 7–10 днів'],
            ['value' => 'china_air',  'label' => 'Китай 🇨🇳 — авіа — 12–15 днів'],
            ['value' => 'china_sea',  'label' => 'Китай 🇨🇳 — море — 52–60 днів'],
            ['value' => 'europe',     'label' => 'Європа 🇪🇺 / склад Польща — 7 днів'],
            ['value' => 'india_air',  'label' => 'Індія 🇮🇳 — авіа — 14–16 днів'],
            ['value' => 'india_sea',  'label' => 'Індія 🇮🇳 — море — 52–60 днів'],
            ['value' => 'other',      'label' => 'Інше'],
        ],
    ],
];

function build_options(array $spec, string $emptyLabel): array {
    // Forminator's option entry is a 3-key array: label, value, limit.
    // The empty placeholder keeps value="" so required validation still fires.
    $opts = [ ['label' => $emptyLabel, 'value' => '', 'limit' => ''] ];
    foreach ($spec as $o) {
        $opts[] = ['label' => $o['label'], 'value' => $o['value'], 'limit' => ''];
    }
    return $opts;
}

foreach ($forms as $formId => $cfg) {
    $stmt = $pdo->prepare("SELECT meta_id, meta_value FROM wp_postmeta WHERE post_id = ? AND meta_key = 'forminator_form_meta'");
    $stmt->execute([$formId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        echo "form $formId: forminator_form_meta not found\n";
        continue;
    }

    $meta = @unserialize($row['meta_value']);
    if (!is_array($meta)) {
        echo "form $formId: unserialize failed\n";
        continue;
    }

    $newOptions = build_options($cfg['options'], $cfg['empty_label']);
    $touched = 0;

    // 1) Flat `fields` list — used at frontend render
    if (isset($meta['fields']) && is_array($meta['fields'])) {
        foreach ($meta['fields'] as &$field) {
            if (isset($field['element_id']) && $field['element_id'] === 'select-1') {
                $field['field_label'] = $cfg['field_label'];
                $field['options']     = $newOptions;
                if (isset($field['validation_messages']) && is_array($field['validation_messages'])) {
                    $field['validation_messages']['required'] = $cfg['required_msg'];
                }
                $touched++;
            }
        }
        unset($field);
    }

    // 2) `wrappers[].fields[]` — used by admin editor
    if (isset($meta['wrappers']) && is_array($meta['wrappers'])) {
        foreach ($meta['wrappers'] as &$wrapper) {
            if (!isset($wrapper['fields']) || !is_array($wrapper['fields'])) continue;
            foreach ($wrapper['fields'] as &$field) {
                if (isset($field['element_id']) && $field['element_id'] === 'select-1') {
                    $field['field_label'] = $cfg['field_label'];
                    $field['options']     = $newOptions;
                    if (isset($field['validation_messages']) && is_array($field['validation_messages'])) {
                        $field['validation_messages']['required'] = $cfg['required_msg'];
                    }
                    $touched++;
                }
            }
            unset($field);
        }
        unset($wrapper);
    }

    if ($touched === 0) {
        echo "form $formId: select-1 not found in meta\n";
        continue;
    }

    $newBlob = serialize($meta);
    $upd = $pdo->prepare("UPDATE wp_postmeta SET meta_value = ? WHERE meta_id = ?");
    $upd->execute([$newBlob, $row['meta_id']]);
    echo "form $formId: updated ($touched location(s))  new blob length=" . strlen($newBlob) . "\n";
}
