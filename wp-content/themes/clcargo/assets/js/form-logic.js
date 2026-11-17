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

	function initFormLogic() {
		// Forminator renders asynchronously; find our form after it loads
		var form = document.querySelector('.forminator-custom-form');
		if (!form) return;

		// Localise select2 placeholders for country + goods selects.
		initSelectPlaceholders();

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
