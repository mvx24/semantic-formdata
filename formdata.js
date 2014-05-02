/* jshint curly: false, unparam: true */
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
				// Decode the value
				if(!$.fn.formData.settings.noISODates) {
					switch(fieldRules.type) {
						case 'date':
							// Process substrings because new Date(value) assumes the date is midnight UTC and can parse into an entirely different day depending on the browser's timezone offset
							value = new Date(parseInt(value.substr(0,4)), parseInt(value.substr(5,2)) - 1, parseInt(value.substr(8,2)), 0, 0, 0, 0);
							break;
						case 'datetime':
							value = new Date(value);
							break;
						default:
							// Don't decode all other values into Dates etc. including the time type
							break;
					}
				}
				obj = callback(fieldRules, field, value);
				if(obj)
					$.fn.formData.objects[fieldRules.identifier] = obj;
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
				value = callback(fieldRules, field, $.fn.formData.objects[fieldRules.identifier]);
				if(value instanceof Date) {
					if(fieldRules.type === 'datetime' && $.fn.formData.settings.timezoneOffset && value.getTimezoneOffset() !== $.fn.formData.settings.timezoneOffset) {
						// Adjust the datetime because the value coming from the form will be a reflection of the exact time in the browser's preferred 
						// timezone, but may not be the user's set preferred timezone that they want to be functioning in
						value.setMinutes(value.getMinutes() + (value.getTimezoneOffset() - $.fn.formData.settings.timezoneOffset));
					}
					// Encode the value
					if(!$.fn.formData.settings.noISODates) {
						var pad = function(num) {
							if(num.length == 1)
								return '0' + num;
							else
								return '' + num;
						};
						switch(fieldRules.type) {
							case 'date':
								value = value.getFullYear() + '-' + pad(value.getMonth() + 1) + '-' + pad(value.getDate());
								break;
							case 'datetime':
								// Convert to ISO 8601 string with milliseconds removed (the timezone will always be Z)
								// http://www.ecma-international.org/ecma-262/5.1/#sec-15.9.5.43
								value = value.toISOString().replace(/\.\d*/,'');
								break;
							case 'time':
								// Time probably shouldn't be given as a date, but convert it here just in case
								value = pad(value.getHours()) + ':' + pad(value.getMinutes()) + ':' + pad(value.getSeconds());;
								break;
							default:
								break;
						}
					}
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

$.fn.formData.settings = {};
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

// Fix the url and email rules which don't allow blank values, use empty instead to check required fields
// Set $.formData.settings.noEmptyFix = true to disable this fix
$.fn.formData._emailRule = $.fn.form.settings.rules.email;
$.fn.formData._urlRule = $.fn.form.settings.rules.url;

$.fn.form.settings.rules.email = function(value) {
	if(!$.fn.formData.settings.noEmptyFix) {
		if(value === undefined || value === '')
			return true;
	}
	return $.fn.formData._emailRule.call(this, value);
}

$.fn.form.settings.rules.url = function(value) {
	if(!$.fn.formData.settings.noEmptyFix) {
		if(value === undefined || value === '')
			return true;
	}
	return $.fn.formData._urlRule.call(this, value);
}

$.fn.formData._dateRule = function($field, past) {
	var fieldRules = $($field.parents('.ui.form')[0]).form('get validation', $field);
	var callback = $.fn.formData.callbacks.get[fieldRules.type];
	if(callback) {
		var value = callback(fieldRules, $field, $.fn.formData.objects[fieldRules.identifier]);
		var now = new Date();
		switch(fieldRules.type) {
			case 'date':
				if(past) {
					now.setHours(0);
					now.setMinutes(0);
					now.setSeconds(0);
					now.setMilliseconds(0);
				}
				else {
					now.setHours(23);
					now.setMinutes(59);
					now.setSeconds(59);
					now.setMilliseconds(999);
				}
				break;
			case 'datetime':
				if($.fn.formData.settings.timezoneOffset && value.getTimezoneOffset() !== $.fn.formData.settings.timezoneOffset) {
					// See the same adjustment made above for comments
					value.setMinutes(value.getMinutes() + (value.getTimezoneOffset() - $.fn.formData.settings.timezoneOffset));
				}
				break;
			default:
				// All others, not applicable
				return true;
		}
		// Both now and value should have their timezone set to the browser's so they are comparable
		if(past)
			return value < now;
		else
			return value > now;
	}
	return true;
};

$.fn.form.settings.rules.past = function(value) {
	return $.fn.formData._dateRule(this, true);
};

$.fn.form.settings.rules.future = function(value) {
	return $.fn.formData._dateRule(this, false);
};

$.fn.form.settings.rules.order = function(stringValue, identifiers) {
	// Note: this is the form, unlike the normal rule without
	var $form = this;
	identifiers = identifiers.split(',');
	var $field = $form.form('get field', identifiers[0]);
	var fieldRules = $form.form('get validation', $field);
	var $otherField = $form.form('get field', identifiers[1]);
	var otherFieldRules = $form.form('get validation', $otherField);
	var callback = $.fn.formData.callbacks.get[fieldRules.type];
	if(callback) {
		var value = callback(fieldRules, $field, $.fn.formData.objects[identifiers[0]]);
		var otherValue = callback(otherFieldRules, $otherField, $.fn.formData.objects[identifiers[1]]);
		var isValid;
		if(!value || !otherValue)
			return true;
		isValid = value < otherValue;
		// TODO: validate the other field
		return isValid;
	}
	return true;
};
