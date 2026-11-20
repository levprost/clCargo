(function () {
	'use strict';

	function initHeader() {
		var header = document.querySelector('.clcargo-header');
		if (!header) return;

		var burger = header.querySelector('.clcargo-header__burger');
		if (!burger) return;

		var isRu = (document.documentElement.getAttribute('lang') || '').toLowerCase().indexOf('ru') === 0;
		var labels = isRu
			? { open: 'Открыть меню', close: 'Закрыть меню' }
			: { open: 'Відкрити меню', close: 'Закрити меню' };

		function setOpen(open) {
			header.classList.toggle('is-open', open);
			burger.setAttribute('aria-expanded', open ? 'true' : 'false');
			burger.setAttribute('aria-label', open ? labels.close : labels.open);
		}

		burger.addEventListener('click', function () {
			setOpen(!header.classList.contains('is-open'));
		});

		// Close menu when a nav link, CTA, or the contact button is clicked (mobile)
		header.addEventListener('click', function (e) {
			var trigger = e.target.closest('a, [data-clcargo-contact-open]');
			if (!trigger) return;
			if (header.classList.contains('is-open') && window.innerWidth < 1030) {
				setOpen(false);
			}
		});

		// Close on Escape
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && header.classList.contains('is-open')) {
				setOpen(false);
				burger.focus();
			}
		});

		// Collapse when resizing back to desktop
		var resizeTimer;
		window.addEventListener('resize', function () {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(function () {
				if (window.innerWidth >= 1030 && header.classList.contains('is-open')) {
					setOpen(false);
				}
			}, 120);
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initHeader);
	} else {
		initHeader();
	}
})();
