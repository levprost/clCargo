(function () {
	'use strict';

	function initContactModal() {
		var modal = document.getElementById('clcargo-contact-modal');
		if (!modal) return;

		var hasDialog = typeof modal.showModal === 'function';

		function lockScroll() {
			var sbw = window.innerWidth - document.documentElement.clientWidth;
			if (sbw > 0) document.body.style.paddingRight = sbw + 'px';
			document.body.classList.add('clcargo-scroll-lock');
		}

		function unlockScroll() {
			document.body.classList.remove('clcargo-scroll-lock');
			document.body.style.paddingRight = '';
		}

		function openModal() {
			if (modal.open) return;
			if (hasDialog) {
				modal.showModal();
			} else {
				modal.setAttribute('open', '');
			}
			lockScroll();
		}

		function closeModal() {
			if (!modal.open && !modal.hasAttribute('open')) return;
			if (hasDialog) {
				modal.close();
			} else {
				modal.removeAttribute('open');
				unlockScroll();
			}
		}

		// Global click: open on contact trigger, close on close trigger
		document.addEventListener('click', function (e) {
			var opener = e.target.closest('[data-clcargo-contact-open]');
			if (opener) {
				e.preventDefault();
				openModal();
				return;
			}
			var closer = e.target.closest('[data-clcargo-contact-close]');
			if (closer && modal.contains(closer)) {
				e.preventDefault();
				closeModal();
			}
		});

		// Backdrop click: native <dialog> fires click on itself when the
		// backdrop is clicked (event.target === modal). Clicks on inner
		// content target a child element, so they don't close.
		modal.addEventListener('click', function (e) {
			if (e.target === modal) {
				closeModal();
			}
		});

		// Restore body scroll on any close (Escape, form submit, close())
		modal.addEventListener('close', unlockScroll);

		// Escape fallback for browsers lacking native <dialog> (very rare).
		if (!hasDialog) {
			document.addEventListener('keydown', function (e) {
				if (e.key === 'Escape' && modal.hasAttribute('open')) {
					closeModal();
				}
			});
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initContactModal);
	} else {
		initContactModal();
	}
})();
