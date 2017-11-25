/**
 * The API is as follows:
 * - render()
 * - getValues()
 * - addEventListener(type, listener, useCapture)
 * - reset()
 * - deselectIf(func, Filter.header)
 *
 * See the docs for each function for full explanations.
 */
class FilterBox {
	/**
	 * A FilterBox which sits in the search bar. See the Spells or Psionics page for a live example. Allows selection
	 * of multiple sources/spell schools/item types/etc.
	 *
	 * @param inputGroup the search bar DOM element to add the button to
	 * @param resetButton element to bind a reset-on-click to
	 * @param filterList a list of `Filter` objects to build the menus from
	 */
	constructor(inputGroup, resetButton, filterList) {
		this.inputGroup = inputGroup;
		this.resetButton = resetButton;
		this.filterList = filterList;

		this.headers = {};
	}

	/**
	 * Render the "Filters" button in the inputGroup
	 */
	render() {
		const $buttonGroup = getButtonGroup();
		const $inputGroup = $(this.inputGroup);

		const $outer = makeOuterList();
		for (let i = 0; i < this.filterList.length; ++i) {
			$outer.append(makeOuterItem(this, this.filterList[i]));
		}
		$inputGroup.append($outer);
		$inputGroup.prepend($buttonGroup);

		// selection library
		$.fn.select2.defaults.set("theme", "bootstrap");
		$(".locationMultiple").select2({
			width: null,
			closeOnSelect: false
		});

		addShowHideHandlers();
		addResetHandler(this);

		function getButtonGroup() {
			const $buttonGroup = $(`<div id="filter-toggle-btn"/>`);
			$buttonGroup.addClass(FilterBox.CLS_INPUT_GROUP_BUTTON);

			const filterButton = getFilterButton();
			$buttonGroup.append(filterButton);
			return $buttonGroup;

			function getFilterButton() {
				const button = document.createElement(ELE_BUTTON);
				button.classList.add("btn");
				button.classList.add("btn-default");
				button.classList.add("dropdown-toggle");
				button.setAttribute("data-toggle", "dropdown");
				button.innerHTML = "Filter <span class='caret'></span>";
				return button;
			}
		}

		function makeOuterList() {
			const $outL = $("<ul/>");
			$outL.addClass(FilterBox.CLS_DROPDOWN_MENU);
			$outL.addClass(FilterBox.CLS_DROPDOWN_MENU_FILTER);
			return $outL;
		}

		function makeOuterItem(self, filter) {
			const $outI = $("<li/>");
			$outI.addClass("filter-item");
			// TODO

			const $multi = makeMultiPicker();
			const $innerListHeader = makeHeaderLine();

			$outI.append($innerListHeader);
			$outI.append($multi);

			addEventHandlers();

			const newHeader = {size: filter.items.length, ele: $multi, invert: false, outer: $outI, filter: filter};
			self.headers[filter.header] = newHeader;

			return $outI;

			function makeHeaderLine() {
				const $line = $(`<div class="h-wrap"/>`);
				const $label = `<div>${filter.header}</div>`;
				$line.append($label);
				const $invert = $(`<button class="btn btn-default btn-xs invert-button" style="margin-left: auto">Invert</button>`);
				$line.append($invert);
				const $quickBtns = $(`<span class="btn-group" style="margin-left: 12px"/>`);
				const $all = $(`<button class="btn btn-default btn-xs">All</button>`);
				$quickBtns.append($all);
				const $none = $(`<button class="btn btn-default btn-xs">None</button>`);
				$quickBtns.append($none);
				const $default = $(`<button class="btn btn-default btn-xs">Default</button>`);
				$quickBtns.append($default);
				$line.append($quickBtns);

				$invert.on(EVNT_CLICK, function() {
					newHeader.invert = !newHeader.invert;
					filter.invert = newHeader.invert;
					if (newHeader.invert) {
						$outI.addClass(FilterBox.CLS_FILTER_INVERT)
					} else {
						$outI.removeClass(FilterBox.CLS_FILTER_INVERT)
					}
					self._fireValChangeEvent();
				});

				$none.on(EVNT_CLICK, function() {
					$multi.find("option").prop("selected", false);
					$multi.trigger("change");
				});

				$all.on(EVNT_CLICK, function() {
					$multi.find("option").prop("selected", true);
					$multi.trigger("change");
				});

				$default.on(EVNT_CLICK, function() {
					self._reset(filter.header);
				});

				return $line;
			}

			function makeMultiPicker() {
				const $box = $("<select/>");
				$box.addClass("locationMultiple");
				$box.addClass("form-control");
				$box.attr("multiple", "multiple");

				for (const item of filter.items) {
					const $opt = $("<option/>");
					const val = filter.valueFn ? filter.valueFn(item) : item;
					$opt.val(val);
					$opt.html(filter.displayFn ? filter.displayFn(item) : item);
					if (!filter.desel || (filter.desel && !filter.desel(val))) {
						$opt.prop("selected", true);
					} else {
						$opt.prop("selected", false);
					}
					$box.append($opt)
				}

				return $box;
			}

			function addEventHandlers() {
				$multi.on("change", function () {
					self._fireValChangeEvent();
				})
			}
		}

		function addShowHideHandlers() {
			// watch for the button changing to "open"
			const $filterToggleButton = $("#filter-toggle-btn");
			const observer = new MutationObserver(function(mutations) {
				mutations.forEach(function(mutationRecord) {
					if (!$filterToggleButton.hasClass("open")) {
						$outer.hide();
					} else {
						$outer.show();
					}
				});
			});
			observer.observe($filterToggleButton[0], { attributes : true, attributeFilter : ["class"] });

			// squash events from the menu, otherwise the dropdown gets hidden when we click inside it
			$outer.on(EVNT_CLICK, function (e) {
				e.stopPropagation();
			});
		}

		function addResetHandler(self) {
			if (self.resetButton !== null && self.resetButton !== undefined) {
				self.resetButton.addEventListener(EVNT_CLICK, function () {
					self.reset();
				}, false);
			}
		}
	}

	/**
	 * Get a map of {Filter.header: {map of Filter.items (with Filter.valueFn applied): <true/false> matching
	 * the state of the checkbox}}
	 * Note that there is a special entry in the second map ({Filter.items: booleans}) with the
	 * key `FilterBox.VAL_SELECT_ALL` as a convenience flag for "all items in this category selected"
	 *
	 * @returns the map described above e.g.
	 *
	 * {
	 *  "Source": { "select-all": false, "PHB": true, "DMG": false},
	 *  "School": { "select-all": true, "A": true, "EV": true }
     * }
	 *
	 */
	getValues() {
		const outObj = {};
		for (const header in this.headers) {
			if (!this.headers.hasOwnProperty(header)) continue;
			const cur = this.headers[header];
			const tempObj = {};

			const values = cur.ele.val();
			if (!cur.invert) {
				if (values.length === cur.size) {
					// everything is selected
					tempObj[FilterBox.VAL_SELECT_ALL] = true;
				} else {
					for (let i = 0; i < values.length; ++i) {
						tempObj[values[i]] = true;
					}
				}
				outObj[header] = tempObj;
			} else {
				if (values.length === 0) { // probably bugged if there's no filter items
					// everything is unselected
					tempObj[FilterBox.VAL_SELECT_ALL] = true;
				} else {
					const valSet = new Set(values);
					cur.ele.find("option").get().map(o => o.value).forEach(v => {
						tempObj[v] = !valSet.has(v);
					});
				}

				outObj[header] = tempObj;
			}
		}
		return outObj;
	}

	/**
	 * Convenience function to cleanly add event listeners
	 *
	 * @param type should probably always be `FilterBox.EVNT_VALCHANGE` which is fired when the values available
	 * from getValues() change
	 *
	 * @param listener A function to call when the event is fired. See JS addEventListener docs for more.
	 * @param useCapture See JS addEventListener docs.
	 */
	addEventListener (type, listener, useCapture) {
		this.inputGroup.addEventListener(type, listener, useCapture)
	}

	/**
	 * Reset the selected filters to default, applying any `desel` functions from the filters
	 */
	reset() {
		for (const header in this.headers) {
			if (!this.headers.hasOwnProperty(header)) continue;
			this._reset(header);
		}
	}

	/**
	 * Helper which resets an section of the filter
	 * @param header the name of the section to reset
	 * @private
	 */
	_reset(header) {
		const cur = this.headers[header];
		const filter = cur.filter;
		let anyChanged = false;

		if (cur.invert || filter.invert) {
			cur.outer.removeClass(FilterBox.CLS_FILTER_INVERT);
			cur.invert = false;
			filter.invert = false;
			anyChanged = true;
		}

		cur.ele.find("option").each(function() {
			if (!filter.desel || (filter.desel && !filter.desel(this.value))) {
				this.selected = true;
				anyChanged = true;
			} else {
				this.selected = false;
				anyChanged = true;
			}
		});

		if (anyChanged) {
			cur.ele.trigger("change");
		}
	}

	/**
	 * Deselect values for a Filter.header which cause func to evaluate to true
	 *
	 * Useful to e.g. de-select all "Unearthed Arcana"-source items.
	 *
	 * @param func a function taking a single argument and returning true/false, which is called on
	 * the Filter.valueFn(Filter.items[x])
	 *
	 * @param filterHeader the Filter.header for the Filter.items to call func(val) on
	 */
	deselectIf(func, filterHeader) {
		const cur = this.headers[filterHeader];
		let anyDeselected = false;
		cur.ele.find("option").each(function() {
			if (func(this.value)) {
				this.selected = false;
				anyDeselected = true;
			}
		});
		if (anyDeselected) cur.ele.trigger("change");
	}

	/**
	 * @private
	 * Helper which dispatched the event when the filter needs to fire a "changed" event
	 */
	_fireValChangeEvent() {
		const eventOut = new Event(FilterBox.EVNT_VALCHANGE);
		this.inputGroup.dispatchEvent(eventOut);
	}
}
FilterBox.CLS_INPUT_GROUP_BUTTON = "input-group-btn";
FilterBox.CLS_DROPDOWN_MENU = "dropdown-menu";
FilterBox.CLS_DROPDOWN_MENU_FILTER = "dropdown-menu-filter";
FilterBox.CLS_DROPDOWN_SUBMENU = "dropdown-submenu";
FilterBox.CLS_FILTER_SUBLIST_ITEM_WRAPPER = "filter-sublist-item-wrapper";
FilterBox.CLS_SUBMENU_PARENT = "submenu-parent";
FilterBox.CLS_FILTER_INVERT = "filter-invert";
FilterBox.VAL_SELECT_ALL = "select-all";
FilterBox.EVNT_VALCHANGE = "valchange";
FilterBox.P_IS_OPEN = "isOpen";

class Filter {
	/**
	 * A single filter category
	 *
	 * @param options an object with the following properties:
	 *
	 *   header: the category header e.g. "Source"
	 *
	 *   items: a list of items to display (after applying the displayFn) in the FilterBox once `render()`
	 *     has been called e.g. ["PHB", "DMG"]
	 *     Note that you can pass a pointer to a list, and add items afterwards. Call `render()` to display them.
	 *
	 *   (OPTIONAL)
	 *   displayFn: A function to apply to each item in items when displaying the FilterBox on the page
	 *     e.g. Parser.sourceJsonToFull
	 *
	 *   (OPTIONAL)
	 *   valueFn: A function[1] to apply to each item to convert it to a HTML `value`
	 *     Affects the keys returned by `getValues()`
	 *     e.g. `Parser.sourceJsonToAbv`
	 *
	 *   (OPTIONAL)
	 *   desel: a function, defaults items as deselected if `desel(valueFn(item))` is true
	 *
	 *   TODO docs for other shite
	 */
	constructor(options) {
		this.header = options.header;
		this.items = options.items;
		this.displayFn = options.displayFn;
		this.valueFn = options.valueFn;
		this.desel = options.desel;
		this.matchFn = options.matchFn ? options.matchFn : Filter.basicMatchFn;
		this.matchFnInv = options.matchFnInv;

		this.invert = false;
	}

	/**
	 * @returns {boolean} true if this filter has been inverted; false otherwise
	 */
	isInverted() {
		return this.invert;
	}

	/**
	 * Add an item if it doesn't already exist in the filter
	 * @param item the item to add
	 */
	addIfAbsent(item) {
		if ($.inArray(item, this.items) === -1) this.items.push(item);
	}

	matches(valObj, toCheck) {
		if (valObj[this.header][FilterBox.VAL_SELECT_ALL]) return true;
		if (this.isInverted() && this.matchFnInv) {
			return this.matchFnInv(valObj[this.header], toCheck);
		} else {
			return this.matchFn(valObj[this.header], toCheck);
		}
	}
}

/**
 * An example of a basic filter which could be used by `Filter.matches(..)`
 * If no `matchFn` is specified for a `Filter`, this is the default match function.
 *
 * @param valGroup A group from the current filter values (all current filter values returned by `FilterBox.getValues()`)
 * @param toCheck The value compare with the selected filters (e.g. `spell.level`)
 * @returns {*}
 */
Filter.basicMatchFn = function(valGroup, toCheck) {
	return valGroup[toCheck];
};