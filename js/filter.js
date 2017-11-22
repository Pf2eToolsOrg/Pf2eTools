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
	 * @param filterList a list of `Filter` objects to build the menus from
	 */
	constructor(inputGroup, filterList) {
		this.inputGroup = inputGroup;
		this.filterList = filterList;

		this.headers = {};
	}

	/**
	 * Render the "Filters" button in the inputGroup
	 */
	render() {
		const $buttonGroup = getButtonGroup();

		const $outer = makeOuterList();
		for (let i = 0; i < this.filterList.length; ++i) {
			$outer.append(makeOuterItem(this, this.filterList[i]));
		}
		$(this.inputGroup).append($outer);
		$(this.inputGroup).prepend($buttonGroup);

		// selection library
		$.fn.select2.defaults.set("theme", "bootstrap");
		$(".locationMultiple").select2({
			width: null,
			closeOnSelect: false
		});

		addShowHideHandlers();

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

			self.headers[filter.header] = {size: filter.items.length, ele: $multi};

			return $outI;

			function makeHeaderLine() {
				const $line = $(`<div class="h-wrap"/>`);
				const $label = `<div>${filter.header}</div>`;
				$line.append($label);
				const $all = $(`<button class="btn btn-default btn-xs" style="margin-left: auto">All</button>`);
				$line.append($all);
				const $clear = $(`<button class="btn btn-default btn-xs" style="margin-left: 5px">Clear</button>`);
				$line.append($clear);

				$clear.on(EVNT_CLICK, function() {
					$multi.find("option").prop("selected", false);
					$multi.trigger("change");
				});

				$all.on(EVNT_CLICK, function() {
					$multi.find("option").prop("selected", true);
					$multi.trigger("change");
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
					$opt.val(filter.valueFunction(item));
					$opt.html(filter.displayFunction(item));
					$opt.prop("selected", true);
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
	}

	/**
	 * Get a map of {Filter.header: {map of Filter.items (with Filter.valueFunction applied): <true/false> matching
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
			if (values.length === cur.size) {
				// everything is selected
				tempObj[FilterBox.VAL_SELECT_ALL] = true;
			} else {
				for (let i = 0; i < values.length; ++i) {
					tempObj[values[i]] = true;
				}
			}
			outObj[header] = tempObj;
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
	 * Reset the selected filters to default (everything selected).
	 * Note that this does not re-apply any deselectIf(...)s you might have applied earlier.
	 */
	reset() {
		for (const header in this.headers) {
			if (!this.headers.hasOwnProperty(header)) continue;
			const cur = this.headers[header];
			cur.ele.find("option").prop("selected", true);
			cur.ele.trigger("change");
		}
		this._fireValChangeEvent();
	}

	/**
	 * Deselect values for a Filter.header which cause func to evaluate to true
	 *
	 * Useful to e.g. de-select all "Unearthed Arcana"-source items.
	 *
	 * @param func a function taking a single argument and returning true/false, which is called on
	 * the Filter.valueFunction(Filter.items[x])
	 *
	 * @param filterHeader the Filter.header for the Filter.items to call func(val) on
	 */
	deselectIf(func, filterHeader) {
		const cur = this.headers[filterHeader];
		let anyDeselected = false;
		const values = cur.ele.val();
		for (let i = 0; i < values.length; ++i) {
			const value = values[i];
			if (func(value)) {
				cur.ele.find(`option[value="${value}"]`).prop("selected", false);
				anyDeselected = true;
			}
		}
		cur.ele.trigger("change");
		this._fireValChangeEvent();
	}


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
FilterBox.VAL_SELECT_ALL = "select-all";
FilterBox.EVNT_VALCHANGE = "valchange";
FilterBox.P_IS_OPEN = "isOpen";
class Filter {
	/**
	 * A single filter category
	 *
	 * @param header the category header, e.g. "Source"
	 *
	 * @param storageAttribute the HTML property which the FilterBox will read to get the value for each list item
	 * e.g. FLTR_SOURCE
	 *
	 * @param items a list of items to display (after applying the displayFunction) in the FilterBox once `render()`
	 * has been called e.g. ["PHB", "DMG"]
	 * Note that you can pass a pointer to a list, and add items afterwards. Call `render()` to display them.
	 *
	 * @param displayFunction A function to apply to each item in items when displaying the FilterBox on the page e.g.
	 * Parser.sourceJsonToFull - alternatively, use `Filter.asIs` to keep the items as-is when rendering them on the page
	 *
	 * @param valueFunction A function to apply to each item in items prior to storing them internally in FilterBox.
	 * Only affects the keys returned by `getValues()` (I think) e.g. Parser.sourceJsonToAbv - alternatively, use
	 * `Filter.asIs` to keep the items as-is when using them as keys in the object returned by `getValues()`
	 */
	constructor(header, storageAttribute, items, displayFunction, valueFunction) {
		this.header = header;
		this.storageAttribute = storageAttribute;
		this.items = items;
		this.displayFunction = displayFunction === undefined || displayFunction === null ? Filter.asIs : displayFunction;
		this.valueFunction = valueFunction === undefined || valueFunction === null ? Filter.asIs : valueFunction;
	}
}

/**
 * Cheeky function to just render a string as-is
 *
 * @param str the input
 * @returns {*} the output, which is... just the input.
 */
Filter.asIs = function(str) { return str; };
