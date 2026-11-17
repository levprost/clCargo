(function () {
	'use strict';

	function initHeader() {
		var header = document.querySelector('.clcargo-header');
		if (!header) return;

		var burger = header.querySelector('.clcargo-header__burger');
		if (!burger) return;

		function setOpen(open) {
			header.classList.toggle('is-open', open);
			burger.setAttribute('aria-expanded', open ? 'true' : 'false');
			burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
		}

		burger.addEventListener('click', function () {
			setOpen(!header.classList.contains('is-open'));
		});

		// Close menu when a nav link or CTA is clicked (mobile)
		header.addEventListener('click', function (e) {
			var link = e.target.closest('a');
			if (!link) return;
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
