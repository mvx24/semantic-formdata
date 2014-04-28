/* jshint curly: false */
'use strict';
$.formData = $.fn.formData = function(action, rules, data, settings) {
	var fieldName, fieldRules, field, callback, value, html;
	if(action === 'render') {
		fieldRules = rules;
		callback = $.fn.formData.callbacks.render[fieldRules.type];
		if(callback) {
			return callback(fieldRules);
		}
		else {
			var placeholder = fieldRules.placeholder || fieldRules.label;
			var required = false;
			html = '<div class="field">';
			for(var i = 0 ; i < fieldRules.rules.length; ++i) {
				if(fieldRules.rules[i].type === 'empty') {
					required = true;
					break;
				}
			}
			html += '<label for="' + fieldRules.identifier + '">' + fieldRules.label + '</label>';
			if(fieldRules.icon)
				html += '<div class="ui left labeled icon input">';
			else
				html += '<div class="ui labeled input">';
			html += '<input type="text" id="' + fieldRules.identifier + '" name="' + fieldRules.identifier + '" placeholder="' + placeholder + '" />';
			if(fieldRules.icon)
				html += '<i class="' + fieldRules.icon + ' icon"></i>';
			if(required)
				html += '<div class="ui corner label"><i class="icon asterisk"></i></div>';
			html += '</div></div>';
			return html;
		}
	}
	else if(action === 'set' || action === 'setup') {
		var obj;
		data = data || {};
		for(fieldName in rules) {
			fieldRules = rules[fieldName];
			field = this.form('get field', fieldRules.identifier);
			if(field.parent().length === 0)
				continue;
			value = data[fieldName] || fieldRules.defaultValue;
			if(value === undefined)
				value = '';
			callback = $.fn.formData.callbacks.set[fieldRules.type];
			if(callback) {
				obj = callback(fieldRules, field, value);
				if(obj)
					$.fn.formData.objects[fieldName] = obj;
			}
			else {
				switch(fieldRules.type) {
					case 'bool':
						if(value)
							field[0].checked = true;
						else
							field[0].checked = false;
						break;
					default:
						field.val(value);
						break;
				}
			}
		}
		return this;
	}
	else if(action === 'get') {
		for(fieldName in rules) {
			fieldRules = rules[fieldName];
			field = this.form('get field', fieldRules.identifier);
			if(field.parent().length === 0)
				continue;
			callback = $.fn.formData.callbacks.get[fieldRules.type];
			if(callback) {
				value = callback(fieldRules, field, $.fn.formData.objects[fieldName]);
				if(value instanceof Date) {
					// TODO: convert to iso 8601 string
				}
				data[fieldName] = value;
			}
			else {
				switch(fieldRules.type) {
					case 'integer':
						data[fieldName] = parseInt(field.val());
						break;
					case 'decimal':
						data[fieldName] = parseFloat(field.val());
						break;
					case 'bool':
						data[fieldName] = field[0].checked;
						break;
					default:
						data[fieldName] = field.val();
						break;
				}
			}
		}
		return this;
	}
	else if(action === 'modal') {
		// Create a modal, append it to document.body and then show it
		var formSettings = {}, modalSettings = {}, submitButton, $form;
		data = data || {};
		if(settings && settings.form)
			formSettings = settings.form;
		if(settings && settings.modal)
			modalSettings = settings.modal;
		html = '<div id="modal-formdata" class="ui modal"><i class="close icon"></i><div class="header">' + settings.title + '</div><div id="form-modal-formdata" class="ui form content">';
		for(fieldName in rules)
			html += $.formData('render', rules[fieldName]);
		submitButton = 'Submit';
		if(settings && settings.submitButton)
			submitButton = settings.submitButton;
		if(submitButton.indexOf('<') === 0)
			html += submitButton;
		else
			html += '<div class="ui right floated positive large submit button">' + submitButton + '</div>';
		html += '</div></div>';
		$(document.body).append(html);
		formSettings.onSuccess = function() {
			$(this).formData('get', rules, data);
			settings.onSuccess.call(this, data);
			$('#modal-formdata').modal('hide');
		};
		$form = $('#form-modal-formdata');
		$form.form(rules, formSettings);
		$form.formData('set', rules, data);
		modalSettings.onHidden = function() { $(this).remove(); };
		$('#modal-formdata').modal('setting', modalSettings).modal('show');
	}
};

// Store returned javascript objects from the set callbacks
$.fn.formData.objects = {};
$.fn.formData.callbacks = {
	render: {
		bool: function(fieldRules) {
			var html = '<div class="field"><div class="ui toggle checkbox">';
			html += '<input type="checkbox" id="' + fieldRules.identifier + '" name="' + fieldRules.identifier + '" />';
			html += '<label for="' + fieldRules.identifier + '">' + fieldRules.label + '</label>';
			html += '</div></div>';
			return html;
		},
		text: function(fieldRules) {
			var html = '<div class="field">';
			html += '<label for="' + fieldRules.identifier + '">' + fieldRules.label + '</label>';
			html += '<textarea id="' + fieldRules.identifier + '" name="' + fieldRules.identifier + '"></textarea>';
			html += '</div>';
			return html;
		},
		choices: function(fieldRules) {
			var html, val;
			html = '<div class="field"><label>' + fieldRules.label + '</label>';
			html += '<div class="ui selection dropdown"><input type="hidden" id="' + fieldRules.identifier + '" name="' + fieldRules.identifier + '" />';
			html += '<div class="default text">' + fieldRules.label + '</div>';
			html += '<i class="dropdown icon"></i>';
			html += '<div class="menu">';
			for(val in fieldRules.choices)
				html += '<div class="item" data-value="' + val + '">' + fieldRules.choices[val] + '</div>';
			html += '</div></div></div>';
			return html;
		}
	},
	set: {
		choices: function(fieldRules, $element, value) {
			$element.val(value);
			$element.parent().dropdown();
		}
	},
	get: {}
};

/*** Semantic UI form rules ***/

$.fn.form.settings.rules.integer = function(value) {
	return (value.match(/^[\+-]?\d*$/) !== null);
};

$.fn.form.settings.rules.decimal = function(value) {
	// Matches an integer or simple decimal number, no exponents
	var match = value.match(/^[\+-]?\d*$/);
	if(match !== null)
		return true;
	return (value.match(/^[\+-]?\d*\.\d*$/) !== null);
};

$.fn.form.settings.rules.min = function(value, min) {
	return value >= parseInt(min);
};

$.fn.form.settings.rules.max = function(value, max) {
	return value <= parseInt(max);
};

$.fn.form.settings.rules.regex = function(value, regex) {
	return value.match(regex) !== null;
};
