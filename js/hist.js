"use strict";

class Hist {
	static hashChange (forceLoad) {
		if (Hist.isHistorySuppressed) {
			Hist.setSuppressHistory(false);
			return;
		}

		const [link, ...sub] = Hist._getHashParts();

		let blankFilterLoad = false;
		if (link !== Hist.lastLoadedLink || sub.length === 0 || forceLoad) {
			Hist.lastLoadedLink = link;
			if (link === HASH_BLANK) {
				blankFilterLoad = true;
			} else {
				const $el = Hist._getListElem(link);
				if ($el === undefined) {
					if (typeof handleUnknownHash === "function" && window.location.hash.length) {
						handleUnknownHash(link, sub);
						return;
					} else {
						Hist._freshLoad();
						return;
					}
				}
				const toLoad = $el.attr("id");
				if (toLoad === undefined) Hist._freshLoad();
				else {
					const id = $el.attr("id");
					Hist.lastLoadedId = id;
					loadHash(id);
					document.title = decodeURIComponent($el.attr("title")) + " - 5etools";
				}
			}
		}

		if (typeof loadSubHash === "function" && (sub.length > 0 || forceLoad)) loadSubHash(sub);
		if (blankFilterLoad) {
			Hist._freshLoad();
		}
	}

	static init (initialLoadComplete) {
		window.onhashchange = Hist.hashChange;
		if (window.location.hash.length) {
			Hist.hashChange();
		} else {
			Hist._freshLoad();
		}
		if (initialLoadComplete) Hist.initialLoad = false;
	}

	/**
	 * Allows the hash to be modified without triggering a hashchange
	 * @param val
	 */
	static setSuppressHistory (val) {
		Hist.isHistorySuppressed = val;
	}

	static getSelectedListElement () {
		const [link, ...sub] = Hist._getHashParts();
		return Hist._getListElem(link);
	}

	static getSelectedListElementWithIndex () {
		const [link, ...sub] = Hist._getHashParts();
		return Hist._getListElem(link, true);
	}

	static _getHashParts () {
		return window.location.hash.slice(1).toLowerCase().replace(/%27/g, "'").split(HASH_PART_SEP);
	}

	static _getListElem (link, getIndex) {
		const listWrapper = $("#listcontainer");
		const searchFor = `#${link}`;
		if (listWrapper.data("lists")) {
			for (let x = 0; x < listWrapper.data("lists").length; ++x) {
				const list = listWrapper.data("lists")[x];
				for (let y = 0; y < list.items.length; ++y) {
					const item = list.items[y];
					const $elm = $(item.elm).find(`a[id]`);
					const foundEle = $elm.get().find(ele => ele.getAttribute("href").split(HASH_PART_SEP)[0] === searchFor);
					if (foundEle) {
						if (getIndex) return {$el: $(foundEle), x: x, y: y};
						return $(foundEle);
					}
				}
			}
		}
		return undefined;
	}

	static _freshLoad () {
		// defer this, in case the list needs to filter first
		setTimeout(() => {
			const goTo = $("#listcontainer").find(".list a").attr('href');
			if (goTo) {
				const parts = location.hash.split(HASH_PART_SEP);
				const fullHash = `${goTo}${parts.length > 1 ? `${HASH_PART_SEP}${parts.slice(1).join(HASH_PART_SEP)}` : ""}`;
				location.replace(fullHash);
			}
		}, 1);
	}

	static cleanSetHash (toSet) {
		window.location.hash = toSet.replace(/,+/g, ",").replace(/,$/, "").toLowerCase();
	}

	static getHashSource () {
		const [link, ...sub] = Hist._getHashParts();
		// by convention, the source is the last hash segment
		return link ? link.split(HASH_LIST_SEP).last() : null;
	}

	static getSubHash (key) {
		const [link, ...sub] = Hist._getHashParts();
		const hKey = `${key}${HASH_SUB_KV_SEP}`;
		const part = sub.find(it => it.startsWith(hKey));
		if (part) return part.slice(hKey.length);
		return null;
	}

	/**
	 * Sets a subhash with the key specified, overwriting any existing.
	 * @param key Subhash key.
	 * @param val Subhash value. Passing a nully object removes the k/v pair.
	 */
	static setSubhash (key, val) {
		const [link, ...sub] = Hist._getHashParts();
		if (!link) Hist.cleanSetHash("");

		const hKey = `${key}${HASH_SUB_KV_SEP}`;
		const out = [link];
		if (sub.length) sub.filter(it => !it.startsWith(hKey)).forEach(it => out.push(it));
		if (val != null) out.push(`${hKey}${val}`);

		Hist.cleanSetHash(out.join(HASH_PART_SEP));
	}
}
Hist.lastLoadedLink = null;
Hist.lastLoadedId = null;
Hist.initialLoad = true;
Hist.isHistorySuppressed = false;
