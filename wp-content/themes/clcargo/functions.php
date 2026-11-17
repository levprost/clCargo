<?php

add_action( 'wp_enqueue_scripts', function () {
	$uri = get_stylesheet_directory_uri();
	$ver = wp_get_theme()->get( 'Version' );

	// Google Fonts: Inter
	wp_enqueue_style(
		'clcargo-inter',
		'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap',
		[],
		null
	);

	// Theme identity (required for child theme)
	wp_enqueue_style( 'clcargo-style', get_stylesheet_uri(), [], $ver );

	$css_files = [
		'variables',
		'base',
		'wp-overrides',
		'header',
		'hero',
		'sections',
		'cards',
		'steps',
		'form',
		'faq',
		'footer',
		'responsive',
	];

	$prev = 'clcargo-style';
	foreach ( $css_files as $file ) {
		$handle = 'clcargo-' . $file;
		wp_enqueue_style(
			$handle,
			"{$uri}/assets/css/{$file}.css",
			[ $prev ],
			$ver
		);
		$prev = $handle;
	}

	// Header burger menu
	wp_enqueue_script(
		'clcargo-header',
		"{$uri}/assets/js/header.js",
		[],
		$ver,
		true
	);

	// Form conditional logic
	wp_enqueue_script(
		'clcargo-form-logic',
		"{$uri}/assets/js/form-logic.js",
		[],
		$ver,
		true
	);
} );

add_action( 'after_setup_theme', function () {
	add_theme_support( 'block-templates' );
} );

/**
 * Localise header + footer template parts.
 * Templates are authored in Ukrainian (default language).
 * When Polylang reports current language = ru, a UK→RU dictionary is applied
 * to the rendered HTML of each template-part (header, footer).
 */
add_filter( 'render_block', function ( $html, $block ) {
	if ( empty( $block['blockName'] ) || $block['blockName'] !== 'core/template-part' ) {
		return $html;
	}
	$lang = function_exists( 'pll_current_language' ) ? pll_current_language() : 'uk';
	if ( $lang !== 'ru' ) {
		return $html;
	}

	$dict = [
		// Navigation labels (header)
		'Напрямки'                                       => 'Направления',
		'Послуги'                                        => 'Услуги',
		'Як працюємо'                                    => 'Как работаем',
		'Контакти'                                       => 'Контакты',
		// Header CTA + burger a11y
		'Розрахувати доставку'                           => 'Рассчитать доставку',
		'Відкрити меню'                                  => 'Открыть меню',
		// Footer
		'Ваш вантаж у надійних руках'                    => 'Ваш груз в надёжных руках',
		'Політика конфіденційності'                      => 'Политика конфиденциальности',
		'Договір оферти'                                 => 'Договор оферты',
	];

	return strtr( $html, $dict );
}, 10, 2 );
