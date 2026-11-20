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
		'contact-modal',
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

	// Contact modal (native <dialog> + open/close triggers)
	wp_enqueue_script(
		'clcargo-contact-modal',
		"{$uri}/assets/js/contact-modal.js",
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

/* =============================================
 * Hero content + SVG assets (content kit v1, 2026-11)
 *
 * All UA/RU copy comes verbatim from cl-cargo-hero-kit/content.json.
 * Edit here when the copy changes — this is the theme's source of
 * truth for the hero block. The page content only invokes
 * `[clcargo_hero]`; language is picked via `pll_current_language()`.
 * ============================================= */
function clcargo_hero_content() {
	return [
		'uk' => [
			'expBadge'          => 'Понад 30 років досвіду у міжнародній логістиці',
			'heroTitle'         => 'Міжнародна логістика та митниця',
			'heroTitleAccent'   => '«під ключ»',
			'heroLead'          => 'Надійна доставка комерційних та збірних вантажів вагою',
			'heroWeight'        => 'від 20 кг',
			'destinationsLabel' => 'Країни відправлення',
			'destinations'      => [
				[ 'name' => 'Туреччина', 'flags' => [ 'tr' ] ],
				[ 'name' => 'Китай',     'flags' => [ 'cn' ] ],
				[ 'name' => 'Індія',     'flags' => [ 'in' ] ],
				[ 'name' => 'Європа',    'flags' => [ 'eu', 'pl' ] ],
			],
			'heroDetails'       => 'Беремо на себе повний цикл: викуп та безпечну оплату товару постачальникам, приймання та консолідацію на наших закордонних складах, міжнародне перевезення та офіційне митне оформлення в Україні.',
			'mottoTitle'        => '«Надійність, перевірена десятиліттями — ваш вантаж у безпеці на кожному кілометрі шляху!»',
			'mottoSub'          => 'Гарантія збереження, суворий контроль термінів та повна юридична чистота угоди.',
			'highlights'        => [
				[ 'icon' => 'shield-check', 'text' => '100% відповідальність за збереження вантажу' ],
				[ 'icon' => 'package',      'text' => 'Збірні та комерційні партії від 20 кг' ],
				[ 'icon' => 'credit-card',  'text' => 'Допомога з оплатою товару постачальникам' ],
				[ 'icon' => 'warehouse',    'text' => 'Власні склади консолідації за кордоном' ],
			],
			'btnCalc'           => 'Розрахувати доставку',
			'btnCall'           => 'Зателефонувати менеджеру',
			'bannerAlt'         => 'CL CARGO — доставка та митне оформлення комерційних вантажів з-за кордону',
			'bannerLinkLabel'   => 'Перейти до розрахунку доставки',
			'desktopPhotoAlt'   => 'Вантажівка та контейнери у вантажному терміналі',
		],
		'ru' => [
			'expBadge'          => 'Более 30 лет опыта в международной логистике',
			'heroTitle'         => 'Международная логистика и таможня',
			'heroTitleAccent'   => '«под ключ»',
			'heroLead'          => 'Надёжная доставка коммерческих и сборных грузов весом',
			'heroWeight'        => 'от 20 кг',
			'destinationsLabel' => 'Страны отправления',
			'destinations'      => [
				[ 'name' => 'Турция', 'flags' => [ 'tr' ] ],
				[ 'name' => 'Китай',  'flags' => [ 'cn' ] ],
				[ 'name' => 'Индия',  'flags' => [ 'in' ] ],
				[ 'name' => 'Европа', 'flags' => [ 'eu', 'pl' ] ],
			],
			'heroDetails'       => 'Берём на себя полный цикл: выкуп и безопасную оплату товара поставщикам, приём и консолидацию на наших зарубежных складах, международную перевозку и официальное таможенное оформление в Украине.',
			'mottoTitle'        => '«Надёжность, проверенная десятилетиями — ваш груз в безопасности на каждом километре пути!»',
			'mottoSub'          => 'Гарантия сохранности, строгий контроль сроков и полная юридическая чистота сделки.',
			'highlights'        => [
				[ 'icon' => 'shield-check', 'text' => '100% ответственность за сохранность груза' ],
				[ 'icon' => 'package',      'text' => 'Сборные и коммерческие партии от 20 кг' ],
				[ 'icon' => 'credit-card',  'text' => 'Помощь с оплатой товара поставщикам' ],
				[ 'icon' => 'warehouse',    'text' => 'Собственные склады консолидации за рубежом' ],
			],
			'btnCalc'           => 'Рассчитать доставку',
			'btnCall'           => 'Позвонить менеджеру',
			'bannerAlt'         => 'CL CARGO — доставка и таможенное оформление коммерческих грузов из-за рубежа',
			'bannerLinkLabel'   => 'Перейти к расчёту доставки',
			'desktopPhotoAlt'   => 'Грузовик и контейнеры на грузовом терминале',
		],
	];
}

/** Flag SVGs supplied with the hero kit — embedded verbatim. */
function clcargo_hero_flag_svg( $code ) {
	$svgs = [
		'tr' => '<svg class="clcargo-hero__flag" viewBox="0 0 60 40" aria-hidden="true" focusable="false"><path fill="#E30A17" d="M0 0h60v40H0z"/><circle cx="25" cy="20" r="10" fill="white"/><circle cx="28" cy="20" r="8" fill="#E30A17"/><g fill="white"><polygon points="43.500,20.000 39.700,21.235 39.700,25.231 37.351,21.998 33.550,23.233 35.899,20.000 33.550,16.767 37.351,18.002 39.700,14.769 39.700,18.765"/></g></svg>',
		'cn' => '<svg class="clcargo-hero__flag" viewBox="0 0 60 40" aria-hidden="true" focusable="false"><path fill="#DE2910" d="M0 0h60v40H0z"/><g fill="#FFDE00"><polygon points="10.000,4.000 11.347,8.146 15.706,8.146 12.180,10.708 13.527,14.854 10.000,12.292 6.473,14.854 7.820,10.708 4.294,8.146 8.653,8.146"/><polygon points="18.285,5.029 19.239,3.933 18.491,2.687 19.829,3.255 20.783,2.159 20.655,3.607 21.992,4.176 20.576,4.502 20.449,5.949 19.701,4.703"/><polygon points="22.020,8.283 23.325,7.643 23.119,6.204 24.131,7.247 25.436,6.607 24.756,7.892 25.768,8.935 24.336,8.686 23.657,9.970 23.452,8.532"/><polygon points="22.077,13.451 23.529,13.398 23.928,12.001 24.427,13.366 25.879,13.314 24.735,14.210 25.233,15.575 24.027,14.764 22.883,15.659 23.282,14.262"/><polygon points="18.438,16.751 19.798,17.263 20.706,16.129 20.638,17.580 21.998,18.093 20.597,18.477 20.529,19.929 19.730,18.715 18.329,19.099 19.237,17.965"/></g></svg>',
		'in' => '<svg class="clcargo-hero__flag" viewBox="0 0 60 40" aria-hidden="true" focusable="false"><path fill="#FF9933" d="M0 0h60v13.333H0z"/><path fill="white" d="M0 13.333h60v13.334H0z"/><path fill="#138808" d="M0 26.667h60V40H0z"/><g fill="none" stroke="#000080"><circle cx="30" cy="20" r="5.7" stroke-width=".65"/></g><circle cx="30" cy="20" r="1" fill="#000080"/></svg>',
		'eu' => '<svg class="clcargo-hero__flag" viewBox="0 0 60 40" aria-hidden="true" focusable="false"><path fill="#003399" d="M0 0h60v40H0z"/><g fill="#FFCC00"><polygon points="30.000,6.000 30.449,7.382 31.902,7.382 30.727,8.236 31.176,9.618 30.000,8.764 28.824,9.618 29.273,8.236 28.098,7.382 29.551,7.382"/><polygon points="36.000,7.608 36.449,8.990 37.902,8.990 36.727,9.844 37.176,11.226 36.000,10.372 34.824,11.226 35.273,9.844 34.098,8.990 35.551,8.990"/><polygon points="40.392,12.000 40.841,13.382 42.294,13.382 41.119,14.236 41.568,15.618 40.392,14.764 39.217,15.618 39.666,14.236 38.490,13.382 39.943,13.382"/><polygon points="42.000,18.000 42.449,19.382 43.902,19.382 42.727,20.236 43.176,21.618 42.000,20.764 40.824,21.618 41.273,20.236 40.098,19.382 41.551,19.382"/><polygon points="40.392,24.000 40.841,25.382 42.294,25.382 41.119,26.236 41.568,27.618 40.392,26.764 39.217,27.618 39.666,26.236 38.490,25.382 39.943,25.382"/><polygon points="36.000,28.392 36.449,29.774 37.902,29.774 36.727,30.628 37.176,32.010 36.000,31.156 34.824,32.010 35.273,30.628 34.098,29.774 35.551,29.774"/><polygon points="30.000,30.000 30.449,31.382 31.902,31.382 30.727,32.236 31.176,33.618 30.000,32.764 28.824,33.618 29.273,32.236 28.098,31.382 29.551,31.382"/><polygon points="24.000,28.392 24.449,29.774 25.902,29.774 24.727,30.628 25.176,32.010 24.000,31.156 22.824,32.010 23.273,30.628 22.098,29.774 23.551,29.774"/><polygon points="19.608,24.000 20.057,25.382 21.510,25.382 20.334,26.236 20.783,27.618 19.608,26.764 18.432,27.618 18.881,26.236 17.706,25.382 19.159,25.382"/><polygon points="18.000,18.000 18.449,19.382 19.902,19.382 18.727,20.236 19.176,21.618 18.000,20.764 16.824,21.618 17.273,20.236 16.098,19.382 17.551,19.382"/><polygon points="19.608,12.000 20.057,13.382 21.510,13.382 20.334,14.236 20.783,15.618 19.608,14.764 18.432,15.618 18.881,14.236 17.706,13.382 19.159,13.382"/><polygon points="24.000,7.608 24.449,8.990 25.902,8.990 24.727,9.844 25.176,11.226 24.000,10.372 22.824,11.226 23.273,9.844 22.098,8.990 23.551,8.990"/></g></svg>',
		'pl' => '<svg class="clcargo-hero__flag" viewBox="0 0 60 40" aria-hidden="true" focusable="false"><path fill="white" d="M0 0h60v20H0z"/><path fill="#DC143C" d="M0 20h60v20H0z"/></svg>',
	];
	return isset( $svgs[ $code ] ) ? $svgs[ $code ] : '';
}

/** UI icon SVGs supplied with the hero kit — stroke currentColor so CSS controls colour. */
function clcargo_hero_icon_svg( $name ) {
	$svgs = [
		'calculator'   => '<svg class="clcargo-hero__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="5" y="2" width="14" height="20" rx="2"/><rect x="8" y="5" width="8" height="4" rx=".4"/><path d="M8 13h1M12 13h1M16 13h.1M8 17h1M12 17h1M16 17h.1"/></svg>',
		'phone'        => '<svg class="clcargo-hero__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7.2 3.5 4.6 4.7c-1.4.6-1.8 2-1.2 3.5 2.4 6.1 6.8 10.5 12.9 12.9 1.5.6 2.9.2 3.5-1.2l1.2-2.6a1 1 0 0 0-.4-1.3l-4-2.2a1 1 0 0 0-1.2.2l-1.6 1.6a15 15 0 0 1-5.4-5.4L10 8.6a1 1 0 0 0 .2-1.2L8.5 3.9a1 1 0 0 0-1.3-.4Z"/></svg>',
		'shield-check' => '<svg class="clcargo-hero__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 20 6v5c0 5-3.3 8-8 10-4.7-2-8-5-8-10V6Z"/><path d="m8 12 2.5 2.5L16 9"/></svg>',
		'package'      => '<svg class="clcargo-hero__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m12 2 9 5v10l-9 5-9-5V7Z"/><path d="m3 7 9 5 9-5M12 12v10M7.5 4.5l9 5v4"/></svg>',
		'credit-card'  => '<svg class="clcargo-hero__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20M6 15h4"/></svg>',
		'warehouse'    => '<svg class="clcargo-hero__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 21V8l9-5 9 5v13M7 21V11h10v10M2 21h20"/><path d="M9 16h6v5M12 13v3"/></svg>',
	];
	return isset( $svgs[ $name ] ) ? $svgs[ $name ] : '';
}

/**
 * Responsive <picture> for the mobile banner. 6 widths × WebP + JPEG.
 *
 * Structure: both <source> elements are gated by media="(max-width: 1030px)",
 * so on desktop neither matches and the browser falls back to the <img>,
 * which carries a 1×1 transparent GIF as src — zero network impact on
 * desktop while still providing an <img> for a11y. On mobile the browser
 * picks the correct WebP/JPEG candidate from srcset based on the
 * actual rendered width (sizes mirrors the real container padding).
 *
 * The whole picture is wrapped in an anchor to #form because the banner
 * already depicts a "Розрахувати доставку" button — the whole image
 * is one link, not a hotspot map.
 */
function clcargo_hero_mobile_banner_html( $strings ) {
	$base   = get_stylesheet_directory_uri() . '/assets/hero/mobile-banner';
	$widths = [ 320, 480, 640, 768, 960, 1254 ];
	$webp   = [];
	$jpeg   = [];
	foreach ( $widths as $w ) {
		$webp[] = sprintf( '%s/cl-cargo-mobile-%d.webp %dw', $base, $w, $w );
		$jpeg[] = sprintf( '%s/cl-cargo-mobile-%d.jpg %dw',  $base, $w, $w );
	}
	// Mirror the actual CSS padding on .clcargo-hero__inner:
	// ≤639 → 16px (16+16=32); 640–1030 → 24px (24+24=48).
	$sizes = '(max-width: 639px) calc(100vw - 32px), (max-width: 1030px) calc(100vw - 48px), 1px';

	// 1×1 transparent GIF — used as desktop fallback so no banner bytes
	// are fetched when sources don't match.
	$blank = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

	$alt   = esc_attr( $strings['bannerAlt'] );
	$label = esc_attr( $strings['bannerLinkLabel'] );

	return sprintf(
		'<a class="clcargo-hero__banner" href="#form" aria-label="%1$s">'
			. '<picture>'
				. '<source media="(max-width: 1030px)" type="image/webp" srcset="%2$s" sizes="%3$s">'
				. '<source media="(max-width: 1030px)" type="image/jpeg" srcset="%4$s" sizes="%3$s">'
				. '<img src="%5$s" width="1254" height="1254" alt="%6$s" decoding="async" fetchpriority="high">'
			. '</picture>'
		. '</a>',
		$label,
		esc_attr( implode( ', ', $webp ) ),
		esc_attr( $sizes ),
		esc_attr( implode( ', ', $jpeg ) ),
		esc_attr( $blank ),
		$alt
	);
}

/**
 * Full hero block. Language is resolved from Polylang; falls back to
 * UA. Preserves the two existing actions: calc CTA → anchor #form
 * (existing Forminator block id="form"), call CTA → opens the
 * contact modal via the shared `[data-clcargo-contact-open]` hook.
 */
add_shortcode( 'clcargo_hero', function () {
	$lang    = function_exists( 'pll_current_language' ) ? pll_current_language() : 'uk';
	$content = clcargo_hero_content();
	$s       = isset( $content[ $lang ] ) ? $content[ $lang ] : $content['uk'];

	ob_start();
	?>
	<section class="clcargo-section clcargo-section--hero clcargo-hero">
		<div class="clcargo-hero__inner">
			<?php echo clcargo_hero_mobile_banner_html( $s ); ?>

			<div class="clcargo-hero__grid">

				<div class="clcargo-hero__col clcargo-hero__col--text">
					<span class="clcargo-hero__badge">
						<span class="clcargo-hero__badge-dot" aria-hidden="true"></span>
						<?php echo esc_html( $s['expBadge'] ); ?>
					</span>

					<h1 class="clcargo-hero__title">
						<?php echo esc_html( $s['heroTitle'] ); ?>
						<span class="clcargo-hero__title-accent"><?php echo esc_html( $s['heroTitleAccent'] ); ?></span>
					</h1>

					<p class="clcargo-hero__lead">
						<?php echo esc_html( $s['heroLead'] ); ?>
						<strong class="clcargo-hero__lead-weight"><?php echo esc_html( $s['heroWeight'] ); ?></strong>
					</p>

					<ul class="clcargo-hero__destinations" aria-label="<?php echo esc_attr( $s['destinationsLabel'] ); ?>">
						<?php foreach ( $s['destinations'] as $dest ) : ?>
							<li class="clcargo-hero__dest">
								<span class="clcargo-hero__dest-flags">
									<?php foreach ( $dest['flags'] as $flag ) {
										echo clcargo_hero_flag_svg( $flag );
									} ?>
								</span>
								<span class="clcargo-hero__dest-name"><?php echo esc_html( $dest['name'] ); ?></span>
							</li>
						<?php endforeach; ?>
					</ul>

					<p class="clcargo-hero__details"><?php echo esc_html( $s['heroDetails'] ); ?></p>

					<div class="clcargo-hero__ctas">
						<a class="clcargo-hero__cta clcargo-hero__cta--primary" href="#form">
							<?php echo clcargo_hero_icon_svg( 'calculator' ); ?>
							<span><?php echo esc_html( $s['btnCalc'] ); ?></span>
						</a>
						<button type="button" class="clcargo-hero__cta clcargo-hero__cta--secondary" aria-haspopup="dialog" aria-controls="clcargo-contact-modal" data-clcargo-contact-open>
							<?php echo clcargo_hero_icon_svg( 'phone' ); ?>
							<span><?php echo esc_html( $s['btnCall'] ); ?></span>
						</button>
					</div>
				</div>

				<div class="clcargo-hero__col clcargo-hero__col--visual">
					<?php
					$photo_base = get_stylesheet_directory_uri() . '/assets/hero/mobile-banner';
					$photo_widths = [ 320, 480, 640, 768, 960, 1254 ];
					$photo_webp = [];
					$photo_jpeg = [];
					foreach ( $photo_widths as $pw ) {
						$photo_webp[] = sprintf( '%s/cl-cargo-mobile-%d.webp %dw', $photo_base, $pw, $pw );
						$photo_jpeg[] = sprintf( '%s/cl-cargo-mobile-%d.jpg %dw',  $photo_base, $pw, $pw );
					}
					// 44% of a 1280px container minus ~40px padding ≈ 540px fallback.
					$photo_sizes = '(min-width: 1281px) 540px, 44vw';
					?>
					<div class="clcargo-hero__photo">
						<picture>
							<source media="(min-width: 1031px)" type="image/webp" srcset="<?php echo esc_attr( implode( ', ', $photo_webp ) ); ?>" sizes="<?php echo esc_attr( $photo_sizes ); ?>">
							<source media="(min-width: 1031px)" type="image/jpeg" srcset="<?php echo esc_attr( implode( ', ', $photo_jpeg ) ); ?>" sizes="<?php echo esc_attr( $photo_sizes ); ?>">
							<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="1254" height="1254" alt="<?php echo esc_attr( $s['desktopPhotoAlt'] ); ?>" decoding="async">
						</picture>
					</div>

					<div class="clcargo-hero__motto">
						<span class="clcargo-hero__motto-icon">
							<?php echo clcargo_hero_icon_svg( 'shield-check' ); ?>
						</span>
						<p class="clcargo-hero__motto-title"><?php echo esc_html( $s['mottoTitle'] ); ?></p>
						<p class="clcargo-hero__motto-sub"><?php echo esc_html( $s['mottoSub'] ); ?></p>
					</div>
				</div>

			</div>

			<ul class="clcargo-hero__highlights">
				<?php foreach ( $s['highlights'] as $h ) : ?>
					<li class="clcargo-hero__highlight">
						<span class="clcargo-hero__highlight-icon"><?php echo clcargo_hero_icon_svg( $h['icon'] ); ?></span>
						<span class="clcargo-hero__highlight-text"><?php echo esc_html( $h['text'] ); ?></span>
					</li>
				<?php endforeach; ?>
			</ul>
		</div>
	</section>
	<?php
	return ob_get_clean();
} );

/**
 * Brand mark: flag badge (blue top / yellow bottom + "CL") + wordmark.
 * Links to the home page of the current language so switching languages
 * keeps the user in context.
 */
add_shortcode( 'clcargo_brand', function () {
	$home_url = home_url( '/' );
	if ( function_exists( 'pll_current_language' ) && function_exists( 'pll_home_url' ) ) {
		$lang = pll_current_language();
		if ( $lang ) {
			$home_url = pll_home_url( $lang );
		}
	}

	$aria = 'CL CARGO';
	return sprintf(
		'<a class="clcargo-brand" href="%1$s" rel="home" aria-label="%2$s">'
			. '<span class="clcargo-brand__badge" aria-hidden="true">'
				. '<span class="clcargo-brand__badge-letters">CL</span>'
			. '</span>'
			. '<span class="clcargo-brand__name">CL CARGO</span>'
		. '</a>',
		esc_url( $home_url ),
		esc_attr( $aria )
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
			// Header CTA + contact + burger a11y
			'Розрахувати доставку'                           => 'Рассчитать доставку',
			'Зв\'язатися з нами'                             => 'Связаться с нами',  // ASCII apostrophe
			'Зв’язатися з нами'                              => 'Связаться с нами',  // typographic U+2019
			'Зв&#8217;язатися з нами'                        => 'Связаться с нами',  // HTML entity form
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

/**
 * First-time visitors default to Ukrainian regardless of browser locale.
 * Only fires when no pll_language cookie exists; once the user picks a
 * language, Polylang's own cookie keeps their choice.
 */
add_filter( 'pll_preferred_language', function ( $lang ) {
	return 'uk';
} );

/**
 * Contact modal: three operator cards (Vodafone / Lifecell / Kyivstar).
 * Rendered once per page via wp_footer so the native <dialog> lives at
 * the end of <body>, outside any sticky stacking contexts.
 */
/**
 * Messenger glyph SVGs (WhatsApp / Telegram / Viber) for the modal's
 * action buttons. Simple monochrome paths inherit currentColor from the
 * button text colour (always white here).
 */
function clcargo_messenger_icon_svg( $slug ) {
	$svgs = [
		'whatsapp' => '<svg class="clcargo-contact-card__msg-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">'
			. '<path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.554-5.338 11.891-11.893 11.891a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.517 5.26l.241.383-1.001 3.645 3.832-1.005.37.219zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51a12.6 12.6 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>'
			. '</svg>',
		'telegram' => '<svg class="clcargo-contact-card__msg-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">'
			. '<path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>'
			. '</svg>',
		'viber' => '<svg class="clcargo-contact-card__msg-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">'
			. '<path d="M11.4 0C9.473.028 5.333.344 3.02 2.467 1.302 4.187.696 6.7.633 9.817c-.062 3.116-.134 8.955 5.5 10.54h.005l-.005 2.414s-.036.978.61 1.177c.76.236 1.016-.248 1.746-1.058.4-.444.953-1.1 1.37-1.6 3.85.324 6.812-.418 7.148-.526.775-.253 5.165-.816 5.88-6.65.735-6.014-.36-9.818-2.34-11.53l-.01-.004c-.6-.55-3-2.3-8.37-2.31 0 0-.63-.045-2.137-.055zm.1 1.766c1.277 0 .95.011 2.5.011 4.482 0 6.666 1.495 7.17 1.943 1.668 1.42 2.52 4.85 1.89 9.87-.6 4.864-4.17 5.17-4.83 5.38-.277.09-2.9.737-6.2.527 0 0-2.455 2.98-3.22 3.753-.246.246-.516.223-.512-.27 0-.324.02-4.022.02-4.022-.004 0-.012 0-.014.001-4.767-1.324-4.49-6.297-4.436-8.903.053-2.606.546-4.738 1.998-6.18 1.955-1.78 5.463-2.065 7.098-2.095z"/>'
			. '<path d="M11.5 3.953c-.325-.003-.325.49 0 .493 2.52.019 4.595.74 6.242 2.362 1.65 1.624 2.455 3.808 2.473 6.526.003.325.497.322.494-.003h-.001c-.02-2.823-.883-5.148-2.62-6.86-1.736-1.712-3.954-2.498-6.588-2.518zm.03 1.6c-.325-.01-.34.484-.015.492 1.806.062 3.293.682 4.47 1.878 1.175 1.195 1.754 2.699 1.749 4.524-.008.325.486.33.494.005v-.003c.006-1.945-.628-3.6-1.887-4.882-1.26-1.282-2.891-1.945-4.792-2.012h-.019zm.044 1.624c-.325-.013-.35.48-.025.492 1.08.052 1.936.395 2.603 1.082.667.687 1.004 1.59 1.012 2.74.004.325.498.322.493-.004h.001c-.01-1.264-.398-2.33-1.153-3.11-.756-.78-1.753-1.166-2.916-1.2h-.015zm-5.74.59C5.57 7.74 5.212 7.96 4.9 8.3c-.337.42-.517.858-.564 1.28-.06.414-.013.93.14 1.464.342 1.172 1.276 2.916 2.56 4.38 1.267 1.448 2.738 2.594 3.886 3.14.638.312 1.233.367 1.77.244.432-.098.816-.335 1.112-.705.336-.417.52-.839.544-1.275.023-.432-.12-.845-.46-1.25-.228-.23-1.1-.788-1.52-1.015-.413-.228-.682-.195-.952-.028l-.52.573c-.274.274-.707.244-.707.244-2.004-.52-2.515-2.516-2.515-2.516s-.045-.436.244-.707l.573-.52c.167-.27.2-.538-.028-.952-.227-.42-.785-1.29-1.015-1.52-.177-.147-.396-.252-.638-.316v-.005c-.204-.049-.413-.054-.618 0z"/>'
			. '<path d="M11.63 6.797c-.325-.02-.356.473-.03.493.733.044 1.311.242 1.773.696.46.455.666 1.043.705 1.78.012.325.504.308.494-.015-.044-.834-.3-1.558-.854-2.1-.555-.544-1.288-.814-2.057-.854h-.03z"/>'
			. '</svg>',
	];
	return isset( $svgs[ $slug ] ) ? $svgs[ $slug ] : '';
}

/**
 * Operator icon SVGs supplied by the client — embedded verbatim, no redraw.
 * Returns an <svg> element with the shared BEM class so CSS controls sizing.
 */
function clcargo_contact_icon_svg( $slug ) {
	$svgs = [
		'vodafone' => '<svg class="clcargo-contact-card__icon clcargo-contact-card__icon--vodafone" viewBox="0 0 512 512" aria-hidden="true" focusable="false">'
			. '<circle cx="256" cy="256" r="256" fill="#e60000"/>'
			. '<path d="M384 256c0-70.7-57.3-128-128-128s-128 57.3-128 128 57.3 128 128 128 128-57.3 128-128zm-64 0c0 35.3-28.7 64-64 64s-64-28.7-64-64 28.7-64 64-64 64 28.7 64 64z" fill="#fff"/>'
			. '<path d="M256 96c-88.4 0-160 71.6-160 160h32c0-70.7 57.3-128 128-128V96z" fill="#fff"/>'
			. '</svg>',
		'lifecell' => '<svg class="clcargo-contact-card__icon clcargo-contact-card__icon--lifecell" viewBox="0 0 512 512" aria-hidden="true" focusable="false">'
			. '<circle cx="256" cy="256" r="256" fill="#0056b3"/>'
			. '<circle cx="256" cy="256" r="180" fill="#ffd700"/>'
			. '<path d="M190 256a66 66 0 0 1 132 0 66 66 0 0 1-132 0z" fill="#0056b3"/>'
			. '<circle cx="256" cy="190" r="18" fill="#fff"/>'
			. '<circle cx="220" cy="290" r="18" fill="#fff"/>'
			. '<circle cx="292" cy="290" r="18" fill="#fff"/>'
			. '</svg>',
		'kyivstar' => '<svg class="clcargo-contact-card__icon clcargo-contact-card__icon--kyivstar" viewBox="0 0 512 512" aria-hidden="true" focusable="false">'
			. '<rect width="512" height="512" rx="256" fill="#0066cc"/>'
			. '<path d="M256 100l35 85h92l-74 54 28 85-71-51-71 51 28-85-74-54h92z" fill="#fff"/>'
			. '<circle cx="330" cy="135" r="12" fill="#ffd700"/>'
			. '<circle cx="375" cy="165" r="9" fill="#ffd700"/>'
			. '</svg>',
	];
	return isset( $svgs[ $slug ] ) ? $svgs[ $slug ] : '';
}

function clcargo_contact_modal_operators() {
	return [
		[
			'name_uk'  => 'Vodafone',
			'name_ru'  => 'Vodafone',
			'icon'     => 'vodafone',
			'display'  => '+380 66 171 8289',
			'tel'      => '+380661718289',
			'whatsapp' => 'https://wa.me/380661718289',
			'telegram' => 'https://t.me/+380661718289',
			'viber'    => 'viber://chat?number=%2B380661718289',
		],
		[
			'name_uk'  => 'Lifecell',
			'name_ru'  => 'Lifecell',
			'icon'     => 'lifecell',
			'display'  => '+380 63 259 9939',
			'tel'      => '+380632599939',
			'whatsapp' => 'https://wa.me/380632599939',
			'telegram' => 'https://t.me/+380632599939',
			'viber'    => 'viber://chat?number=%2B380632599939',
		],
		[
			'name_uk'  => 'Київстар',
			'name_ru'  => 'Киевстар',
			'icon'     => 'kyivstar',
			'display'  => '+380 98 589 2579',
			'tel'      => '+380985892579',
			'whatsapp' => 'https://wa.me/380985892579',
			'telegram' => 'https://t.me/+380985892579',
			'viber'    => 'viber://chat?number=%2B380985892579',
		],
	];
}

add_action( 'wp_footer', function () {
	$lang = function_exists( 'pll_current_language' ) ? pll_current_language() : 'uk';
	$is_ru = $lang === 'ru';

	$strings = $is_ru
		? [
			'title'     => 'Связаться с нами',
			'subtitle'  => 'Позвоните или напишите в удобный мессенджер.',
			'close'     => 'Закрыть',
			'call_aria' => 'Позвонить',
			'wa_aria'   => 'Написать в WhatsApp',
			'tg_aria'   => 'Написать в Telegram',
			'vb_aria'   => 'Написать в Viber',
			'whatsapp'  => 'WhatsApp',
			'telegram'  => 'Telegram',
			'viber'     => 'Viber',
		]
		: [
			'title'     => 'Зв\'язатися з нами',
			'subtitle'  => 'Зателефонуйте або напишіть у зручний месенджер.',
			'close'     => 'Закрити',
			'call_aria' => 'Зателефонувати',
			'wa_aria'   => 'Написати у WhatsApp',
			'tg_aria'   => 'Написати в Telegram',
			'vb_aria'   => 'Написати у Viber',
			'whatsapp'  => 'WhatsApp',
			'telegram'  => 'Telegram',
			'viber'     => 'Viber',
		];

	$operators = clcargo_contact_modal_operators();

	ob_start();
	?>
	<dialog id="clcargo-contact-modal" class="clcargo-contact-modal" aria-labelledby="clcargo-contact-modal-title" aria-describedby="clcargo-contact-modal-subtitle">
		<div class="clcargo-contact-modal__inner">
			<div class="clcargo-contact-modal__header">
				<button type="button" class="clcargo-contact-modal__close" aria-label="<?php echo esc_attr( $strings['close'] ); ?>" data-clcargo-contact-close>
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>
				</button>
				<h2 id="clcargo-contact-modal-title" class="clcargo-contact-modal__title"><?php echo esc_html( $strings['title'] ); ?></h2>
				<p id="clcargo-contact-modal-subtitle" class="clcargo-contact-modal__subtitle"><?php echo esc_html( $strings['subtitle'] ); ?></p>
			</div>
			<div class="clcargo-contact-modal__body">
				<ul class="clcargo-contact-modal__list">
					<?php foreach ( $operators as $op ) :
						$name = $is_ru ? $op['name_ru'] : $op['name_uk'];
					?>
						<li class="clcargo-contact-card">
							<div class="clcargo-contact-card__head">
								<?php echo clcargo_contact_icon_svg( $op['icon'] ); ?>
								<span class="clcargo-contact-card__name"><?php echo esc_html( $name ); ?></span>
							</div>
							<a class="clcargo-contact-card__phone" href="<?php echo esc_url( 'tel:' . $op['tel'] ); ?>" aria-label="<?php echo esc_attr( $strings['call_aria'] . ' ' . $name . ': ' . $op['display'] ); ?>">
								<?php echo esc_html( $op['display'] ); ?>
							</a>
							<div class="clcargo-contact-card__messengers">
								<a class="clcargo-contact-card__msg clcargo-contact-card__msg--whatsapp" href="<?php echo esc_url( $op['whatsapp'] ); ?>" target="_blank" rel="noopener" aria-label="<?php echo esc_attr( $strings['wa_aria'] . ' — ' . $name ); ?>"><?php echo clcargo_messenger_icon_svg( 'whatsapp' ); ?><span class="clcargo-contact-card__msg-label"><?php echo esc_html( $strings['whatsapp'] ); ?></span></a>
								<a class="clcargo-contact-card__msg clcargo-contact-card__msg--telegram" href="<?php echo esc_url( $op['telegram'] ); ?>" target="_blank" rel="noopener" aria-label="<?php echo esc_attr( $strings['tg_aria'] . ' — ' . $name ); ?>"><?php echo clcargo_messenger_icon_svg( 'telegram' ); ?><span class="clcargo-contact-card__msg-label"><?php echo esc_html( $strings['telegram'] ); ?></span></a>
								<a class="clcargo-contact-card__msg clcargo-contact-card__msg--viber" href="<?php echo esc_url( $op['viber'], [ 'viber' ] ); ?>" rel="noopener" aria-label="<?php echo esc_attr( $strings['vb_aria'] . ' — ' . $name ); ?>"><?php echo clcargo_messenger_icon_svg( 'viber' ); ?><span class="clcargo-contact-card__msg-label"><?php echo esc_html( $strings['viber'] ); ?></span></a>
							</div>
						</li>
					<?php endforeach; ?>
				</ul>
			</div>
		</div>
	</dialog>
	<?php
	echo ob_get_clean();
}, 20 );

/**
 * Rename switcher labels to UA / RU (displayed in the Polylang language
 * switcher block only — admin names stay untouched).
 */
add_filter( 'render_block', function ( $html, $block ) {
	if ( empty( $block['blockName'] ) || $block['blockName'] !== 'polylang/language-switcher' ) {
		return $html;
	}
	return strtr( $html, [
		'>УКР<'        => '>UA<',
		'>Укр<'        => '>UA<',
		'>Ukrainian<'  => '>UA<',
		'>Українська<' => '>UA<',
		'>РОС<'        => '>RU<',
		'>Рос<'        => '>RU<',
		'>Russian<'    => '>RU<',
		'>Русский<'    => '>RU<',
	] );
}, 10, 2 );
