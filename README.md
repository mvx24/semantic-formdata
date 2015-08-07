About
-------------------------------

jQuery plugin to extend the functionality of semantic-ui's 1.x form module to get an retrieve data from the form, auto-generate entire forms and modal forms, and to extend support for other types of data, like date pickers for Date.

Each form is an object consisting of multiple fields as specified below, keyed off of the model's field name.

* **identifier**: The field’s id
* **rules**: An array of rules with objects that pair together a named rule and a prompt
* **type**: integer, decimal, bool, date, datetime, time, email, url, string, text, choices (or any other custom type to match a template e.g. color)
* **choices**: if the type is choices, the choices mapping values to display names will be here
* **label**: the field’s label
* **icon**: the icon to put into the field
* **placeholder**: will be the same as label if not specified
* **help**: text that will appear under the field
* **defaultValue**: the initial value to set	
* **required**: this isn’t a setting, but a field will be considered required if the empty rule is set

FormData Plugin Methods
-------------------------------

Accessible by the general form $('.foo').formData('behavior name', rules, data, identifier)

#### Behavior Names:

* **'render'**, *fieldRules, data* - renders the field into html tags, using a template matching the type of the field and sets the value if supplied.
* **'set'**, *rules, data* - set the values of the form fields with data from a model.
* **'setup'**, *rules* - same as set with no data, to get the fields initialized
* **'get'**, *rules, data* - get the values of all the form fields with their backbone field names appropriately encoded, will parse integers, decimals, and bools.
* **'modal'**, *rules, data, settings* - constructs and runs a modal that automatically sets and gets the data. Settings must have a title variable set, and an onSuccess method for accepting the data when submitted and the modal is closed. Other settings include form, for settings form settings, modal for modal settings, submitButton for the text on the submit button, and subtitle for a subtitle on the modal header.

FormData Callbacks
-------------------------------

Configurable under the objects `$.fn.formData.callbacks.{render, set, get}`

* **render.\[type\]**, *fieldRules* - return html to use as the field
* **set.\[type\]**, *fieldRules, $element, value* - set the value and optionally configure a field, return an optional javascript object (e.g. Pikaday object) to later be used in the get.\[type\] callback
* **get.\[type\]**, *fieldRules, $element, javascript object* - functionality to return the value directly instead of the get method. Return a Date object and it will be automatically converted to a iso 8601 string.

If no get callback is specified for a type, the value will be assumed to already be in the correct text format.

Semantic UI Form - Additional Rules
-------------------------------

As added to $.fn.form.settings.rules

* **'min'**, *value, minValue* - make sure the value is a numerical value no less than minValue
* **'max'**, *value, maxValue* - make sure the value is a numerical value no greater than maxValue
* **'regex'**, *value, pattern* - make sure the value matches the regex pattern
* **'integer'**, *value* - make sure that the value is an integer
* **'decimal'**, *value* - make sure the value is a decimal
* **'past'**, *value* - make sure the value (Date) is in the past
* **'future'**, *value* - make sure the value (Date) is in the future
* **'order'**, *value, identifiers* - make sure the values (Dates) are in order

The url and email rules which don't allow blank values are fixed to allow blank values, use empty instead to check required fields

#### Settings

* `$.formData.settings.noEmptyFix = true` to disable the empty email and url rule fix. Default is false
* `$.fn.formData.settings.noISODates = true` to disable the auto ISO 8601 decoding/encoding of input/output dates, times, and datetimes. Default is false
* `$.fn.formData.settings.timezoneOffset = 3600` if set, the timezone the user is operating in, which could be different from the browser’s timezone offset to adjust getting and settings data.  Specified in minutes. Default is 0 for no adjustment.

License
-------------------------------

The BSD License
