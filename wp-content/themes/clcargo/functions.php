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
 * Centralised contact data — single source of truth for phone and messenger
 * links. Any template that shows contact info reads this through the
 * [clcargo_phone] / [clcargo_messengers] shortcodes below.
 */
function clcargo_contacts() {
	return [
		'phone_display' => '+380 66 171 82 89',
		'phone_tel'     => '+380661718289',
		'whatsapp_url'  => 'https://wa.me/380661718289',
		'telegram_url'  => 'https://t.me/+380661718289',
		'viber_url'     => 'viber://chat?number=%2B380661718289',
	];
}

// Allow the viber:// scheme through WordPress URL sanitisation.
add_filter( 'kses_allowed_protocols', function ( $protocols ) {
	if ( ! in_array( 'viber', $protocols, true ) ) {
		$protocols[] = 'viber';
	}
	return $protocols;
} );

add_shortcode( 'clcargo_phone', function () {
	$c = clcargo_contacts();
	return sprintf(
		'<a class="clcargo-phone-link" href="%s">%s</a>',
		esc_attr( 'tel:' . $c['phone_tel'] ),
		esc_html( $c['phone_display'] )
	);
} );

add_shortcode( 'clcargo_messengers', function ( $atts ) {
	$c    = clcargo_contacts();
	$atts = shortcode_atts( [ 'lang' => '' ], $atts, 'clcargo_messengers' );
	$lang = $atts['lang'];
	if ( ! $lang && function_exists( 'pll_current_language' ) ) {
		$lang = pll_current_language();
	}
	if ( ! $lang ) {
		$lang = 'uk';
	}

	$labels = $lang === 'ru'
		? [
			'whatsapp' => 'Написать в WhatsApp',
			'telegram' => 'Написать в Telegram',
			'viber'    => 'Написать в Viber',
		]
		: [
			'whatsapp' => 'Написати у WhatsApp',
			'telegram' => 'Написати в Telegram',
			'viber'    => 'Написати у Viber',
		];

	$items = [
		[ 'url' => $c['whatsapp_url'], 'name' => 'WhatsApp', 'label' => $labels['whatsapp'], 'protocols' => [ 'https' ] ],
		[ 'url' => $c['telegram_url'], 'name' => 'Telegram', 'label' => $labels['telegram'], 'protocols' => [ 'https' ] ],
		[ 'url' => $c['viber_url'],    'name' => 'Viber',    'label' => $labels['viber'],    'protocols' => [ 'viber' ] ],
	];

	$html = '<ul class="clcargo-messengers">';
	foreach ( $items as $i ) {
		$html .= sprintf(
			'<li><a class="clcargo-messengers__link clcargo-messengers__link--%s" href="%s" aria-label="%s" rel="noopener">%s</a></li>',
			esc_attr( strtolower( $i['name'] ) ),
			esc_url( $i['url'], $i['protocols'] ),
			esc_attr( $i['label'] ),
			esc_html( $i['name'] )
		);
	}
	$html .= '</ul>';
	return $html;
} );

/**
 * Localise header + footer template parts.
 * Templates are authored in Ukrainian (default language).
 * When Polylang reports current language = ru, a UK→RU dictionary is applied
 * to the rendered HTML of each template-part (header, footer).
 * Shortcodes inside template-parts are expanded here (template-part output
 * does not run through the_content).
 */
add_filter( 'render_block', function ( $html, $block ) {
	if ( empty( $block['blockName'] ) || $block['blockName'] !== 'core/template-part' ) {
		return $html;
	}
	$lang = function_exists( 'pll_current_language' ) ? pll_current_language() : 'uk';
	if ( $lang === 'ru' ) {
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
		$html = strtr( $html, $dict );
	}

	return do_shortcode( $html );
}, 10, 2 );
