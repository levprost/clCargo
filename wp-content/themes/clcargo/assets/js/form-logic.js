(function () {
	'use strict';

	// ---- Language detection --------------------------------------------------

	var LANG = (document.documentElement.lang || 'uk').toLowerCase().indexOf('ru') === 0
		? 'ru' : 'uk';

	var STRINGS = {
		ru: {
			selectPlaceholder: {
				'select-1': 'Выберите направление',
				'select-2': 'Выберите товар',
			},
			etaLabel:         'Ориентировочный срок доставки:',
			etaFallback:      'Выберите направление',
			submitText:       'Запросить расчёт',
			approxError:      'Пожалуйста, укажите приблизительную оценку груза',
			// Labels used to match weight/volume/places rows — RU AND UK forms
			weightLabels:  [ 'Вес груза', 'Вага вантажу' ],
			volumeLabels:  [ 'Объём груза', "Об'єм вантажу", 'Объем груза' ],
			placesLabels:  [ 'Количество мест', 'Кількість місць' ],
			approxLabels:  [ 'Приблизительная оценка', 'Приблизна оцінка' ],
		},
		uk: {
			selectPlaceholder: {
				'select-1': 'Оберіть напрямок',
				'select-2': 'Оберіть товар',
			},
			etaLabel:         'Орієнтовний термін доставки:',
			etaFallback:      'Оберіть напрямок',
			submitText:       'Запросити розрахунок',
			approxError:      'Будь ласка, вкажіть приблизну оцінку вантажу',
			weightLabels:  [ 'Вес груза', 'Вага вантажу' ],
			volumeLabels:  [ 'Объём груза', "Об'єм вантажу", 'Объем груза' ],
			placesLabels:  [ 'Количество мест', 'Кількість місць' ],
			approxLabels:  [ 'Приблизительная оценка', 'Приблизна оцінка' ],
		},
	}[LANG];

	// ---- ETA direction table -------------------------------------------------
	// Keys match the 6 select-1 option values (see Forminator form meta).
	var ETA_BY_DIRECTION = {
		turkey:    { ru: '7–10 дней',    uk: '7–10 днів' },
		china_air: { ru: '12–15 дней',   uk: '12–15 днів' },
		china_sea: { ru: '52–60 дней',   uk: '52–60 днів' },
		europe:    { ru: '7 дней',       uk: '7 днів' },
		india_air: { ru: '14–16 дней',   uk: '14–16 днів' },
		india_sea: { ru: '52–60 дней',   uk: '52–60 днів' },
	};

	// ---- Select2 placeholder localisation ----------------------------------

	function initSelectPlaceholders(form) {
		var dict = STRINGS.selectPlaceholder;
		Object.keys(dict).forEach(function (name) {
			var sel = form.querySelector('select[name="' + name + '"]');
			if (!sel) return;

			// Native hidden <option value="">
			var opt = sel.querySelector('option[value=""]');
			if (opt) opt.textContent = dict[name];

			// Visible Select2 placeholder span
			var container = sel.closest('.forminator-field, .forminator-col, div');
			var ph = container && container.querySelector('.select2-selection__placeholder');
			if (ph) ph.textContent = dict[name];
		});
	}

	// ---- Phone input: + and digits only ------------------------------------

	function initPhoneInput(form) {
		var inputs = form.querySelectorAll('input[type="tel"], input[name^="phone-"]');
		inputs.forEach(function (input) {
			if (input.dataset.clPhoneBound) return;
			input.dataset.clPhoneBound = 'true';

			function normalize(val) {
				if (!val) return '';
				var digits = val.replace(/\D+/g, '');
				return digits ? '+' + digits : '';
			}

			if (input.value) input.value = normalize(input.value);

			input.addEventListener('focus', function () {
				if (!input.value) input.value = '+';
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
				try {
					var pos = Math.min(newVal.length, Math.max(1, oldStart));
					input.setSelectionRange(pos, pos);
				} catch (_) {}
			});

			input.addEventListener('keydown', function (e) {
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
				if (input.value === '+') input.value = '';
			});
		});
	}

	// ---- Find a row by one of several possible labels ----------------------

	function findRowByLabels(form, labels) {
		var nodes = form.querySelectorAll('label, .forminator-label');
		for (var i = 0; i < nodes.length; i++) {
			var txt = nodes[i].textContent || '';
			for (var j = 0; j < labels.length; j++) {
				if (txt.indexOf(labels[j]) !== -1) {
					return nodes[i].closest('.forminator-row, .forminator-field-container, .forminator-field, .wp-block-group');
				}
			}
		}
		return null;
	}

	// ---- ETA block + method selector ---------------------------------------

	function injectEtaBlock(form, state) {
		if (form.querySelector('.clcargo-eta')) return;

		var submitBtn = form.querySelector('.forminator-button-submit');
		if (!submitBtn) return;

		// The row that contains the submit button (Forminator wraps it)
		var submitRow = submitBtn.closest('.forminator-row') || submitBtn.parentNode;

		var etaRow = document.createElement('div');
		etaRow.className = 'forminator-row clcargo-eta-row';
		var etaBlock = document.createElement('div');
		etaBlock.className = 'clcargo-eta';
		etaBlock.setAttribute('aria-live', 'polite');
		etaBlock.innerHTML = ''
			+ '<span class="clcargo-eta__label">' + STRINGS.etaLabel + '</span>'
			+ '<span class="clcargo-eta__value" data-eta-value>' + STRINGS.etaFallback + '</span>';
		etaRow.appendChild(etaBlock);

		submitRow.parentNode.insertBefore(etaRow, submitRow);

		state.eta = etaBlock.querySelector('[data-eta-value]');
	}

	function updateEta(state) {
		if (!state.eta) return;
		var direction = state.countrySelect ? (state.countrySelect.value || '') : '';
		var mapping = ETA_BY_DIRECTION[direction];

		if (!mapping) {
			state.eta.textContent = STRINGS.etaFallback;
		} else {
			state.eta.textContent = mapping[LANG];
		}
	}

	// ---- Submit button text ------------------------------------------------

	function overrideSubmitText(form) {
		var btn = form.querySelector('.forminator-button-submit');
		if (btn && btn.textContent.trim() !== STRINGS.submitText) {
			// Preserve any inner loader markup Forminator may inject; only
			// replace the first text node.
			var replaced = false;
			for (var i = 0; i < btn.childNodes.length; i++) {
				var n = btn.childNodes[i];
				if (n.nodeType === 3 && n.textContent.trim()) {
					n.textContent = STRINGS.submitText;
					replaced = true;
					break;
				}
			}
			if (!replaced) btn.textContent = STRINGS.submitText;
		}
	}

	// ---- Weight/volume/places visibility toggle ----------------------------

	function wireCheckboxToggle(form, state) {
		var checkbox = form.querySelector('input[value="yes"][type="checkbox"]');
		if (!checkbox) return;

		var weightRow = findRowByLabels(form, STRINGS.weightLabels);
		var volumeRow = findRowByLabels(form, STRINGS.volumeLabels);
		var placesRow = findRowByLabels(form, STRINGS.placesLabels);
		var approxRow = findRowByLabels(form, STRINGS.approxLabels);
		var approxTA  = approxRow ? approxRow.querySelector('textarea') : null;

		function applyState() {
			var checked = checkbox.checked;

			[weightRow, volumeRow, placesRow].forEach(function (row) {
				if (!row) return;
				row.style.display = checked ? 'none' : '';
				row.querySelectorAll('input').forEach(function (inp) {
					if (checked) {
						inp.removeAttribute('required');
						inp.dataset.wasRequired = 'true';
					} else if (inp.dataset.wasRequired) {
						inp.setAttribute('required', 'required');
					}
				});
			});

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

		applyState();
		checkbox.addEventListener('change', applyState);

		form.addEventListener('submit', function (e) {
			if (checkbox.checked && approxTA && approxTA.value.trim() === '') {
				e.preventDefault();
				e.stopImmediatePropagation();
				approxTA.focus();
				showError(approxTA, STRINGS.approxError);
			}
		}, true);
	}

	function showError(field, msg) {
		var existing = field.parentNode.querySelector('.clcargo-field-error');
		if (existing) existing.remove();
		var err = document.createElement('span');
		err.className = 'clcargo-field-error';
		err.textContent = msg;
		field.parentNode.appendChild(err);
		field.style.borderColor = '#FCA5A5';
		field.addEventListener('input', function () {
			err.remove();
			field.style.borderColor = '';
		}, { once: true });
	}

	// ---- Direction prefill from direction cards ----------------------------
	//
	// Direction cards (section #directions) each carry a CTA with class
	// `is-dir-<key>` where <key> matches a select-1 option value
	// (turkey / china_air / china_sea / europe / india_air). Clicking a
	// CTA scrolls to #form AND prefills the direction select so the user
	// arrives at the form with their chosen route already selected.
	var DIRECTION_CLASS_RX = /\bis-dir-([a-z_]+)\b/;

	function wireDirectionPrefill(form, state) {
		function applyDirection(value) {
			var select = form.querySelector('select[name="select-1"]');
			if (!select) return;
			var opt = select.querySelector('option[value="' + value + '"]');
			if (!opt) return;
			select.value = value;
			if (window.jQuery) {
				window.jQuery(select).val(value).trigger('change');
			} else {
				select.dispatchEvent(new Event('change', { bubbles: true }));
			}
		}

		document.addEventListener('click', function (e) {
			var link = e.target.closest('a[href="#form"]');
			if (!link) return;
			// Look for is-dir-<key> on the link or its wp-block-button wrapper
			var host = link.classList.contains('wp-block-button__link')
				? (link.closest('.wp-block-button') || link)
				: link;
			var m = DIRECTION_CLASS_RX.exec(host.className || '');
			if (!m) return;
			// Defer until after the hash scroll so the form is mounted
			var value = m[1];
			setTimeout(function () { applyDirection(value); }, 0);
			setTimeout(function () { applyDirection(value); }, 300);
		});
	}

	// ---- Country select change listener ------------------------------------

	function wireCountrySelect(form, state) {
		state.countrySelect = form.querySelector('select[name="select-1"]');
		if (!state.countrySelect) return;

		// 1) Native listener — catches programmatic `.value = x; dispatchEvent`.
		state.countrySelect.addEventListener('change', function () { updateEta(state); });

		// 2) jQuery listener — Forminator's Select2 updates the native select
		//    via jQuery and calls `$(sel).trigger('change')`. In jQuery 3.x
		//    .trigger('change') fires jQuery-bound handlers but does NOT
		//    dispatch a native DOM change event, so listener #1 misses it.
		if (window.jQuery) {
			window.jQuery(state.countrySelect).on('change.clcargoEta', function () {
				updateEta(state);
			});
		}

		// 3) MutationObserver on the visible Select2 render span — ultimate
		//    belt-and-suspenders fallback in case neither of the above fires
		//    (older jQuery, patched Select2, etc.).
		try {
			if (window.MutationObserver) {
				var col = state.countrySelect.closest('.forminator-col, .forminator-field');
				var rendered = col && col.querySelector('.select2-selection__rendered');
				if (rendered) {
					new MutationObserver(function () { updateEta(state); })
						.observe(rendered, { childList: true, subtree: true, characterData: true });
				}
			}
		} catch (_) {}

		updateEta(state);
	}

	// ---- Reset handling ----------------------------------------------------
	//
	// Forminator resets the form via a .forminator-button-reset or by
	// clearing values in success handler. Hook form.reset() and any
	// Forminator-fired forminator:form:reset event.
	function wireResetSync(form, state) {
		form.addEventListener('reset', function () {
			// values haven't been cleared yet; defer
			setTimeout(function () { updateEta(state); }, 0);
		});
		document.addEventListener('forminator:form:reset', function () { updateEta(state); });
		document.addEventListener('forminator:form:submit:success', function () {
			setTimeout(function () { updateEta(state); }, 0);
		});
	}

	// ---- Initialisation ----------------------------------------------------

	function initFormLogic() {
		var form = document.querySelector('.clcargo-form-section .forminator-custom-form')
			|| document.querySelector('.forminator-custom-form');
		if (!form) return;
		if (form.dataset.clcargoInit === 'true') return;
		form.dataset.clcargoInit = 'true';

		var state = {};

		initSelectPlaceholders(form);
		initPhoneInput(form);
		overrideSubmitText(form);
		injectEtaBlock(form, state);
		wireCheckboxToggle(form, state);
		wireCountrySelect(form, state);
		wireDirectionPrefill(form, state);
		wireResetSync(form, state);
	}

	function boot() {
		initFormLogic();

		// Forminator renders asynchronously; retry a few times.
		document.addEventListener('forminator:form:render', initFormLogic);
		var tries = 0;
		var timer = setInterval(function () {
			if (++tries > 20) { clearInterval(timer); return; }
			var form = document.querySelector('.forminator-custom-form');
			if (form && !form.dataset.clcargoInit) {
				initFormLogic();
			} else if (form && form.dataset.clcargoInit === 'true') {
				// Re-sync ETA in case Forminator re-rendered values
				clearInterval(timer);
			}
		}, 250);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	} else {
		boot();
	}
})();
