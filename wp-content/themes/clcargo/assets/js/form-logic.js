(function () {
	'use strict';

	function initSelectPlaceholders() {
		var form = document.querySelector('.forminator-custom-form');
		if (!form) return;

		var isRu = (document.documentElement.lang || '').toLowerCase().indexOf('ru') === 0;
		var dict = {
			'select-1': isRu ? 'Выберите страну'    : 'Оберіть країну',
			'select-2': isRu ? 'Выберите товар'     : 'Оберіть товар',
		};

		Object.keys(dict).forEach(function (name) {
			var sel = form.querySelector('select[name="' + name + '"]');
			if (!sel) return;

			// Update the native hidden <option value=""> that Select2 reads.
			var opt = sel.querySelector('option[value=""]');
			if (opt) opt.textContent = dict[name];

			// Update the visible Select2 placeholder span.
			var container = sel.closest('.forminator-field, .forminator-col, div');
			var ph = container && container.querySelector('.select2-selection__placeholder');
			if (ph) ph.textContent = dict[name];
		});
	}

	function initPhoneInput() {
		var form = document.querySelector('.forminator-custom-form');
		if (!form) return;

		var inputs = form.querySelectorAll('input[type="tel"], input[name^="phone-"]');
		inputs.forEach(function (input) {
			if (input.dataset.clPhoneBound) return;
			input.dataset.clPhoneBound = 'true';

			// Only digits after the leading "+"
			function normalize(val) {
				if (!val) return '';
				var digits = val.replace(/\D+/g, '');
				return digits ? '+' + digits : '';
			}

			// Normalise any prefilled value
			if (input.value) input.value = normalize(input.value);

			input.addEventListener('focus', function () {
				if (!input.value) input.value = '+';
				// put caret at the end
				try {
					var len = input.value.length;
					input.setSelectionRange(len, len);
				} catch (_) {}
			});

			input.addEventListener('input', function () {
				var oldVal = input.value;
				var oldStart = input.selectionStart;
				var newVal = normalize(oldVal);
				if (oldVal === newVal) return;
				input.value = newVal;
				// Keep caret from drifting into the "+" sign
				try {
					var pos = Math.min(newVal.length, Math.max(1, oldStart));
					input.setSelectionRange(pos, pos);
				} catch (_) {}
			});

			input.addEventListener('keydown', function (e) {
				// Protect the leading "+"
				if ((e.key === 'Backspace' || e.key === 'Delete') &&
					input.selectionStart <= 1 && input.selectionEnd <= 1 && input.value.charAt(0) === '+') {
					if (input.value.length <= 1) {
						e.preventDefault();
						input.value = '';
					} else if (e.key === 'Backspace' && input.selectionStart === 1) {
						e.preventDefault();
					}
				}
			});

			input.addEventListener('paste', function (e) {
				e.preventDefault();
				var text = (e.clipboardData || window.clipboardData).getData('text') || '';
				var start = input.selectionStart || 0;
				var end = input.selectionEnd || 0;
				var combined = input.value.slice(0, start) + text + input.value.slice(end);
				input.value = normalize(combined);
				try {
					var len = input.value.length;
					input.setSelectionRange(len, len);
				} catch (_) {}
			});

			input.addEventListener('blur', function () {
				// Clear lone "+" so required-validation fires correctly
				if (input.value === '+') input.value = '';
			});
		});
	}

	function initFormLogic() {
		// Forminator renders asynchronously; find our form after it loads
		var form = document.querySelector('.forminator-custom-form');
		if (!form) return;

		// Localise select2 placeholders for country + goods selects.
		initSelectPlaceholders();

		// Enforce phone format: leading "+" and digits only.
		initPhoneInput();

		var checkbox   = form.querySelector('input[value="yes"][type="checkbox"]');
		if (!checkbox) return;

		// Rows containing the three numeric fields
		var weightRow  = findRowByLabel(form, 'Вес груза');
		var volumeRow  = findRowByLabel(form, 'Объём груза');
		var placesRow  = findRowByLabel(form, 'Количество мест');

		// Row containing the approximate estimate textarea
		var approxRow  = findRowByLabel(form, 'Приблизительная оценка');
		var approxTA   = approxRow ? approxRow.querySelector('textarea') : null;

		function applyState() {
			var checked = checkbox.checked;

			// Toggle numeric rows
			[weightRow, volumeRow, placesRow].forEach(function (row) {
				if (!row) return;
				row.style.display = checked ? 'none' : '';
				// Toggle required attr so Forminator won't block submission
				row.querySelectorAll('input').forEach(function (inp) {
					if (checked) {
						inp.removeAttribute('required');
						inp.dataset.wasRequired = 'true';
					} else if (inp.dataset.wasRequired) {
						inp.setAttribute('required', 'required');
					}
				});
			});

			// Toggle approx field
			if (approxRow) {
				approxRow.style.display = checked ? '' : 'none';
				if (approxTA) {
					if (checked) {
						approxTA.setAttribute('required', 'required');
					} else {
						approxTA.removeAttribute('required');
						approxTA.value = '';
					}
				}
			}
		}

		// Set initial state (approx hidden by default)
		applyState();

		checkbox.addEventListener('change', applyState);

		// Extra guard on submit: if checkbox checked but approx empty → block
		form.addEventListener('submit', function (e) {
			if (checkbox.checked && approxTA && approxTA.value.trim() === '') {
				e.preventDefault();
				e.stopImmediatePropagation();
				approxTA.focus();
				showError(approxTA, 'Пожалуйста, укажите приблизительную оценку груза');
			}
		}, true);
	}

	function findRowByLabel(form, labelText) {
		var labels = form.querySelectorAll('label, .forminator-label');
		for (var i = 0; i < labels.length; i++) {
			if (labels[i].textContent.indexOf(labelText) !== -1) {
				return labels[i].closest('.forminator-row, .forminator-field-container, .wp-block-group');
			}
		}
		return null;
	}

	function showError(field, msg) {
		var existing = field.parentNode.querySelector('.clcargo-field-error');
		if (existing) existing.remove();
		var err = document.createElement('span');
		err.className = 'clcargo-field-error';
		err.style.cssText = 'color:#E53E3E;font-size:0.85rem;display:block;margin-top:4px';
		err.textContent = msg;
		field.parentNode.appendChild(err);
		field.style.borderColor = '#E53E3E';
		field.addEventListener('input', function () {
			err.remove();
			field.style.borderColor = '';
		}, { once: true });
	}

	// Forminator fires a custom event when the form is ready
	document.addEventListener('DOMContentLoaded', function () {
		// Try immediately
		initFormLogic();
		// Also try after Forminator finishes rendering (it uses AJAX)
		document.addEventListener('forminator:form:render', initFormLogic);
		// Fallback: retry a few times
		var tries = 0;
		var timer = setInterval(function () {
			if (++tries > 10) { clearInterval(timer); return; }
			var form = document.querySelector('.forminator-custom-form');
			if (form && form.querySelector('input[value="yes"][type="checkbox"]')) {
				clearInterval(timer);
				initFormLogic();
			}
		}, 300);
	});
})();
