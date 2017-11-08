class FilterBox {
	constructor(inputGroup, filterList) {
		this.inputGroup = inputGroup;
		this.filterList = filterList;

		this.headers = {};
	}

	render() {
		const buttonGroup = getButtonGroup();

		const outer = makeOuterList();
		for (let i = 0; i < this.filterList.length; ++i) {
			outer.appendChild(makeOuterItem(this, this.filterList[i]));
		}
		buttonGroup.appendChild(outer);
		this.inputGroup.insertBefore(buttonGroup, this.inputGroup.firstChild);

		function getButtonGroup() {
			const buttonGroup = document.createElement(ELE_DIV);
			buttonGroup.setAttribute(ATB_CLASS, FilterBox.CLS_INPUT_GROUP_BUTTON);
			const filterButton = getFilterButton();
			buttonGroup.appendChild(filterButton);
			return buttonGroup;

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
			const outL = document.createElement(ELE_UL);
			outL.setAttribute(ATB_CLASS, FilterBox.CLS_DROPDOWN_MENU);
			return outL;
		}

		function makeOuterItem(self, filter) {
			const outI = document.createElement(ELE_LI);
			outI.setAttribute(ATB_CLASS, FilterBox.CLS_DROPDOWN_SUBMENU);
			const innerListHeader = makeInnerHeader();
			outI.appendChild(innerListHeader);
			const innerList = makeInnerList();
			outI.appendChild(innerList);
			addEventHandlers();

			return outI;

			function makeInnerHeader() {
				const inH = document.createElement(ELE_A);
				inH.setAttribute(ATB_CLASS, FilterBox.CLS_SUBMENU_PARENT);
				inH.setAttribute(ATB_HREF, STR_VOID_LINK);
				inH.innerHTML = filter.header + " <span class='caret caret-right'></span>";
				return inH;
			}

			function makeInnerList() {
				const inL = document.createElement(ELE_UL);
				inL.setAttribute(ATB_CLASS, FilterBox.CLS_DROPDOWN_MENU);
				const selectAll = makeAllInnerItem();
				inL.appendChild(selectAll);
				inL.appendChild(makeInnerDividerItem());
				for (let j = 0; j < filter.items.length; ++j) {
					const displayText = filter.displayFunction(filter.items[j]);
					const valueText = filter.valueFunction(filter.items[j]);
					inL.appendChild(makeInnerItem(filter.header, displayText, valueText, true, selectAll.cb));
				}
				return inL;

				function makeAllInnerItem() {
					return makeInnerItem(filter.header, "Select All", FilterBox.VAL_SELECT_ALL, true);
				}

				function makeInnerDividerItem() {
					const divLi = document.createElement(ELE_LI);
					divLi.setAttribute(ATB_CLASS, FilterBox.CLS_DIVIDER);
					return divLi;
				}

				function makeInnerItem(header, displayText, valueText, isChecked, parentCheckBox) {
					parentCheckBox = parentCheckBox === undefined || parentCheckBox === null ? null : parentCheckBox;
					const innLi = document.createElement(ELE_LI);

					const child = getChild();

					innLi.appendChild(child);
					return innLi;

					function getChild() {
						const liLink = document.createElement(ELE_A); // bootstrap v3 requires dropdowns to contain links...
						liLink.setAttribute(ATB_HREF, STR_VOID_LINK);
						liLink.appendChild(getChild());
						liLink.addEventListener(EVNT_CLICK, clickHandler);
						return liLink;

						function getChild() {
							const liWrapper = document.createElement(ELE_DIV);
							liWrapper.setAttribute(ATB_CLASS, FilterBox.CLS_FILTER_SUBLIST_ITEM_WRAPPER);
							liWrapper.append(getTextChild());
							liWrapper.append(getCheckboxChild());
							return liWrapper;

							function getTextChild() {
								const text = document.createElement(ELE_SPAN);
								text.setAttribute(ATB_CLASS, "filter-sublist-item-text");
								text.innerHTML = displayText;
								return text;
							}
							function getCheckboxChild() {
								const cb = document.createElement(ELE_INPUT);
								cb.classList.add("filter-checkbox");
								cb.classList.add("readonly");
								cb.setAttribute(ATB_TYPE, "checkbox");
								cb.childCheckBoxes = [];
								if (isChecked) cb.checked  = true;
								if (parentCheckBox !== null) {
									parentCheckBox.childCheckBoxes.push(cb);
								}
								innLi.cb = cb;
								addToValueMap();
								return cb;

								function addToValueMap() {
									let valueObj;
									if (self.headers[header] !== undefined) valueObj = self.headers[header];
									else {
										valueObj = {entries: []};
										self.headers[header] = valueObj;
									}
									const entry = {};
									entry.value = valueText;
									entry.cb = cb;
									valueObj.entries.push(entry);
								}
							}
						}

						function clickHandler(event) {
							stopEvent(event);
							toggleCheckBox(innLi.cb);
							for (let i = 0; i < innLi.cb.childCheckBoxes.length; ++i) {
								innLi.cb.childCheckBoxes[i].checked = innLi.cb.checked; // set all the children to the parent's value
							}
							if (parentCheckBox !== null) {
								if (parentCheckBox.checked && !innLi.cb.checked) {
									// if we unchecked a child, we're no longer selecting all children, so uncheck the parent
									parentCheckBox.checked = false;
								} else if (!parentCheckBox.checked && innLi.cb.checked) {
									// if we checked a child, check if all the children are checked, and if so, check the parent
									let allChecked = true;
									for (let i = 0; i < parentCheckBox.childCheckBoxes.length; ++i) {
										if (!parentCheckBox.childCheckBoxes[i].checked) {
											allChecked = false;
											break;
										}
									}
									if (allChecked) parentCheckBox.checked = true;
								}
							}

							self._fireValChangeEvent();
						}
					}
				}
			}

			function addEventHandlers() {
				// open sub-menu when we hover over sub-menu header
				outI.addEventListener(
					EVNT_MOUSEOVER,
					function(event) {
						stopEvent(event);
						show(innerList);
					},
					false
				);
				// click version, required for mobile to function
				outI.addEventListener(
					EVNT_CLICK,
					function(event) {
						stopEvent(event);
						show(innerList);
					},
					false
				);

				// close other sub-menus when we hover over a sub-menu header
				outI.addEventListener(
					EVNT_MOUSEENTER,
					function(event) {
						stopEvent(event);
						const allOutIs = outI.parentNode.childNodes;
						for (let i = 0; i < allOutIs.length; ++i) {
							if (outI !== allOutIs[i]) {
								const childMenus = allOutIs[i].getElementsByClassName(FilterBox.CLS_DROPDOWN_MENU);
								for (let j = 0; j < childMenus.length; ++j) {
									hide(childMenus[j]);
								}
							}
						}
					},
					false
				);

				// prevent the sub-menu from closing on moving the cursor to the page
				innerList.addEventListener(
					EVNT_MOUSEOUT,
					function(event) {
						stopEvent(event);
					},
					false
				);

				// reset the menus on closing the filter interface
				$(buttonGroup).on({
					"hide.bs.dropdown":  function() { hide(innerList); }
				});
			}
		}
	}

	getValues() {
		const outObj = {};
		for (const header in this.headers) {
			if (!this.headers.hasOwnProperty(header)) continue;
			const cur = this.headers[header];
			const tempObj = {};
			for (let i = 0; i < cur.entries.length; ++i) {
				tempObj[cur.entries[i].value] = cur.entries[i].cb.checked;
			}
			outObj[header] = tempObj;
		}
		return outObj;
	}

	addEventListener (type, listener, useCapture) {
		this.inputGroup.addEventListener(type, listener, useCapture)
	}

	reset() {
		for (const header in this.headers) {
			if (!this.headers.hasOwnProperty(header)) continue;
			const cur = this.headers[header];
			for (let i = 0; i < cur.entries.length; ++i) {
				cur.entries[i].cb.checked = true;
			}
		}
		this._fireValChangeEvent();
	}

	deselectIf(func, filterHeader) {
		const cur = this.headers[filterHeader];
		let anyDeselected = false;
		for (let i = 0; i < cur.entries.length; ++i) {
			const curEntry = cur.entries[i];
			if (func(curEntry.value)) {
				cur.entries[i].cb.checked = false;
				anyDeselected = true;
			}
		}
		if (anyDeselected) {
			for (let i = 0; i < cur.entries.length; ++i) {
				const curEntry = cur.entries[i];
				if (curEntry.value === FilterBox.VAL_SELECT_ALL) {
					cur.entries[i].cb.checked = false;
					break;
				}
			}
		}
		this._fireValChangeEvent();
	}


	_fireValChangeEvent() {
		const eventOut = new Event(FilterBox.EVNT_VALCHANGE);
		this.inputGroup.dispatchEvent(eventOut);
	}
}
FilterBox.CLS_INPUT_GROUP_BUTTON = "input-group-btn";
FilterBox.CLS_DROPDOWN_MENU = "dropdown-menu";
FilterBox.CLS_DROPDOWN_SUBMENU = "dropdown-submenu";
FilterBox.CLS_FILTER_SUBLIST_ITEM_WRAPPER = "filter-sublist-item-wrapper";
FilterBox.CLS_SUBMENU_PARENT = "submenu-parent";
FilterBox.CLS_DIVIDER = "divider";
FilterBox.VAL_SELECT_ALL = "select-all";
FilterBox.EVNT_VALCHANGE = "valchange";
class Filter {
	constructor(header, storageAttribute, items, displayFunction, valueFunction) {
		this.header = header;
		this.storageAttribute = storageAttribute;
		this.items = items;
		this.displayFunction = displayFunction;
		this.valueFunction = valueFunction;
	}
}
Filter.asIs = function(str) { return str; };
