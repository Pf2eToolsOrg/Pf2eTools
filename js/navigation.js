"use strict";

class NavBar {
	static init () {
		// render the visible elements ASAP
		window.addEventListener(
			"DOMContentLoaded",
			function () {
				NavBar.initElements();
				NavBar.highlightCurrentPage();
			}
		);
		window.addEventListener("load", NavBar.initHandlers);
	}

	static initElements () {
		const navBar = document.getElementById("navbar");

		// create mobile "Menu" button
		const btnShowHide = document.createElement("button");
		btnShowHide.className = "btn btn-default page__btn-toggle-nav";
		btnShowHide.innerHTML = "Menu";
		btnShowHide.onclick = () => {
			$(btnShowHide).toggleClass("active");
			$(`.page__nav-hidden-mobile`).toggleClass("block", $(btnShowHide).hasClass("active"));
		};
		document.getElementById("navigation").prepend(btnShowHide);

		addLi(navBar, "5etools.html", "Home", {isRoot: true});

		const ulRules = addDropdown(navBar, "Rules");
		addLi(ulRules, "quickreference.html", "Quick Reference");
		addLi(ulRules, "variantrules.html", "Variant & Optional Rules/Misc");
		addLi(ulRules, "tables.html", "Tables");
		addDivider(ulRules);
		addLi(ulRules, "book.html", "Dungeon Master's Guide", {aHash: "DMG"});
		addLi(ulRules, "book.html", "Monster Manual", {aHash: "MM"});
		addLi(ulRules, "book.html", "Player's Handbook", {aHash: "PHB"});
		addDivider(ulRules);
		addLi(ulRules, "book.html", "Acquisitions Incorporated", {aHash: "AI"});
		addLi(ulRules, "book.html", "Guildmasters' Guide to Ravnica", {aHash: "GGR"});
		addLi(ulRules, "book.html", "Mordenkainen's Tome of Foes", {aHash: "MTF"});
		addLi(ulRules, "book.html", "Sword Coast Adventurer's Guide", {aHash: "SCAG"});
		addLi(ulRules, "book.html", "Volo's Guide to Monsters", {aHash: "VGM"});
		addLi(ulRules, "book.html", "Xanathar's Guide to Everything", {aHash: "XGE"});
		addDivider(ulRules);
		addLi(ulRules, "book.html", "Adventurers League", {aHash: "AL"});
		addDivider(ulRules);
		addLi(ulRules, "books.html", "View All/Homebrew");

		const ulPlayers = addDropdown(navBar, "Player Options");
		addLi(ulPlayers, "classes.html", "Classes");
		addLi(ulPlayers, "backgrounds.html", "Backgrounds");
		addLi(ulPlayers, "feats.html", "Feats");
		addLi(ulPlayers, "races.html", "Races");
		addDivider(ulPlayers);
		addLi(ulPlayers, "statgen.html", "Statgen");
		addDivider(ulPlayers);
		addLi(ulPlayers, "lifegen.html", "This Is Your Life");
		addLi(ulPlayers, "names.html", "Names");

		const ulDms = addDropdown(navBar, "DM Tools");
		addLi(ulDms, "dmscreen.html", "DM Screen");
		addDivider(ulDms);
		const ulAdventures = addDropdown(ulDms, "Adventures", true);
		addLi(ulAdventures, "adventure.html", "Lost Mines of Phandelver", {isSide: true, aHash: "LMoP"});
		addLi(ulAdventures, "adventure.html", "Hoard of the Dragon Queen", {isSide: true, aHash: "HotDQ"});
		addLi(ulAdventures, "adventure.html", "Rise of Tiamat", {isSide: true, aHash: "RoT"});
		addLi(ulAdventures, "adventure.html", "Princes of the Apocalypse", {isSide: true, aHash: "PotA"});
		addLi(ulAdventures, "adventure.html", "Out of the Abyss", {isSide: true, aHash: "OotA"});
		addLi(ulAdventures, "adventure.html", "Curse of Strahd", {isSide: true, aHash: "CoS"});
		addLi(ulAdventures, "adventure.html", "Storm King's Thunder", {isSide: true, aHash: "SKT"});
		addLi(ulAdventures, "adventure.html", "Tales from the Yawning Portal: The Sunless Citadel", {isSide: true, aHash: "TftYP-TSC"});
		addLi(ulAdventures, "adventure.html", "Tales from the Yawning Portal: The Forge of Fury", {isSide: true, aHash: "TftYP-TFoF"});
		addLi(ulAdventures, "adventure.html", "Tales from the Yawning Portal: The Hidden Shrine of Tamoachan", {isSide: true, aHash: "TftYP-THSoT"});
		addLi(ulAdventures, "adventure.html", "Tales from the Yawning Portal: White Plume Mountain", {isSide: true, aHash: "TftYP-WPM"});
		addLi(ulAdventures, "adventure.html", "Tales from the Yawning Portal: Dead in Thay", {isSide: true, aHash: "TftYP-DiT"});
		addLi(ulAdventures, "adventure.html", "Tales from the Yawning Portal: Against the Giants", {isSide: true, aHash: "TftYP-AtG"});
		addLi(ulAdventures, "adventure.html", "Tales from the Yawning Portal: Tomb of Horrors", {isSide: true, aHash: "TftYP-ToH"});
		addLi(ulAdventures, "adventure.html", "Tomb of Annihilation", {isSide: true, aHash: "ToA"});
		addLi(ulAdventures, "adventure.html", "The Tortle Package", {isSide: true, aHash: "TTP"});
		addLi(ulAdventures, "adventure.html", "Waterdeep: Dragon Heist", {isSide: true, aHash: "WDH"});
		addLi(ulAdventures, "adventure.html", "Lost Laboratory of Kwalish", {isSide: true, aHash: "LLK"});
		addLi(ulAdventures, "adventure.html", "Waterdeep: Dungeon of the Mad Mage", {isSide: true, aHash: "WDMM"});
		addLi(ulAdventures, "adventure.html", "Krenko's Way", {isSide: true, aHash: "KKW"});
		addLi(ulAdventures, "adventure.html", "Ghosts of Saltmarsh", {isSide: true, aHash: "GoS"});
		addLi(ulAdventures, "adventure.html", "The Orrery of the Wanderer", {isSide: true, aHash: "OoW"});
		addLi(ulAdventures, "adventure.html", "Dragon of Icespire Peak", {isSide: true, aHash: "DIP"});
		addDivider(ulAdventures);
		addLi(ulAdventures, "adventures.html", "View All/Homebrew");
		addLi(ulDms, "cultsboons.html", "Cults & Demonic Boons");
		addLi(ulDms, "objects.html", "Objects");
		addLi(ulDms, "trapshazards.html", "Traps & Hazards");
		addDivider(ulDms);
		addLi(ulDms, "crcalculator.html", "CR Calculator");
		addLi(ulDms, "encountergen.html", "Encounter Generator");
		addLi(ulDms, "lootgen.html", "Loot Generator");

		const ulReferences = addDropdown(navBar, "References");
		addLi(ulReferences, "bestiary.html", "Bestiary");
		addLi(ulReferences, "conditionsdiseases.html", "Conditions & Diseases");
		addLi(ulReferences, "deities.html", "Deities");
		addLi(ulReferences, "items.html", "Items");
		addLi(ulReferences, "optionalfeatures.html", "Other Options and Features");
		addLi(ulReferences, "rewards.html", "Other Rewards");
		addLi(ulReferences, "psionics.html", "Psionics");
		addLi(ulReferences, "ships.html", "Vehicles");
		addLi(ulReferences, "spells.html", "Spells");

		const ulUtils = addDropdown(navBar, "Utilities");
		addLi(ulUtils, "blacklist.html", "Content Blacklist");
		addLi(ulUtils, "managebrew.html", "Homebrew Manager");
		addLi(ulUtils, "inittrackerplayerview.html", "Initiative Tracker Player View");
		addDivider(ulUtils);
		addLi(ulUtils, "makebrew.html", "Homebrew Builder");
		addLi(ulUtils, "demo.html", "Renderer Demo");
		addLi(ulUtils, "converter.html", "Text Converter");
		addDivider(ulUtils);
		addLi(ulUtils, "roll20.html", "Roll20 Script Help");
		addLi(ulUtils, "makeshaped.html", "Roll20 Shaped Sheet JS Builder");

		addLi(navBar, "donate.html", "Donate", {isRoot: true});

		const ulSettings = addDropdown(navBar, "Settings");
		addButton(
			ulSettings,
			{
				html: styleSwitcher.getActiveStyleSheet() === StyleSwitcher.STYLE_DAY ? "Night Mode" : "Day Mode",
				click: (evt) => {
					evt.preventDefault();
					styleSwitcher.toggleActiveStyleSheet();
				},
				className: "nightModeToggle"
			}
		);
		addButton(
			ulSettings,
			{
				html: "Save State to File",
				click: async (evt) => {
					evt.preventDefault();
					const sync = StorageUtil.syncGetDump();
					const async = await StorageUtil.pGetDump();
					const dump = {sync, async};
					DataUtil.userDownload("5etools", dump);
				},
				title: "Save any locally-stored data (loaded homebrew, active blacklists, DM Screen configuration,...) to a file."
			}
		);
		addButton(
			ulSettings,
			{
				html: "Load State from File",
				click: async (evt) => {
					evt.preventDefault();
					const dump = await DataUtil.pUserUpload();

					StorageUtil.syncSetFromDump(dump.sync);
					await StorageUtil.pSetFromDump(dump.async);
					location.reload();
				},
				title: "Load previously-saved data (loaded homebrew, active blacklists, DM Screen configuration,...) from a file."
			}
		);

		/**
		 * Adds a new item to the navigation bar. Can be used either in root, or in a different UL.
		 * @param appendTo - Element to append this link to.
		 * @param aHref - Where does this link to.
		 * @param aText - What text does this link have.
		 * @param [opts] - Options object.
		 * @param [opts.isSide] - True if this item is part of a side menu.
		 * @param [opts.aHash] - Optional hash to be appended to the base href
		 * @param [opts.isRoot] - If the item is a root navbar element.
		 */
		function addLi (appendTo, aHref, aText, opts) {
			opts = opts || {};
			const hashPart = opts.aHash ? `#${opts.aHash}`.toLowerCase() : "";

			const li = document.createElement("li");
			li.setAttribute("role", "presentation");
			li.setAttribute("id", aText.toLowerCase().replace(/\s+/g, ""));
			li.setAttribute("data-page", `${aHref}${hashPart}`);
			if (opts.isRoot) {
				li.classList.add("page__nav-hidden-mobile");
				li.classList.add("page__btn-nav-root");
			}
			if (opts.isSide) {
				li.onmouseenter = function () { NavBar.handleSideItemMouseEnter(this) }
			} else {
				li.onmouseenter = function () { NavBar.handleItemMouseEnter(this) };
				li.onclick = function () { NavBar._dropdowns.forEach(ele => ele.classList.remove("open")) }
			}

			const a = document.createElement("a");
			a.href = `${aHref}${hashPart}`;
			a.innerHTML = aText;

			li.appendChild(a);
			appendTo.appendChild(li);
		}

		function addDivider (appendTo) {
			const li = document.createElement("li");
			li.setAttribute("role", "presentation");
			li.className = "divider";

			appendTo.appendChild(li);
		}

		/**
		 * Adds a new dropdown starting list to the navigation bar
		 * @param {String} appendTo - Element to append this link to.
		 * @param {String} text - Dropdown text.
		 * @param {boolean} [isSide=false] - If this is a sideways dropdown.
		 */
		function addDropdown (appendTo, text, isSide = false) {
			const li = document.createElement("li");
			li.setAttribute("role", "presentation");
			li.className = `dropdown dropdown--navbar page__nav-hidden-mobile ${isSide ? "" : "page__btn-nav-root"}`;
			if (isSide) {
				li.onmouseenter = function () { NavBar.handleSideItemMouseEnter(this); };
			} else {
				li.onmouseenter = function () { NavBar.handleItemMouseEnter(this); };
			}

			const a = document.createElement("a");
			a.className = "dropdown-toggle";
			a.href = "#";
			a.setAttribute("role", "button");
			a.onclick = function (event) { NavBar.handleDropdownClick(this, event, isSide); };
			if (isSide) {
				a.onmouseenter = function () { NavBar.handleSideDropdownMouseEnter(this); };
				a.onmouseleave = function () { NavBar.handleSideDropdownMouseLeave(this); };
			}
			a.innerHTML = `${text} <span class="caret ${isSide ? "caret--right" : ""}"></span>`;

			const ul = document.createElement("li");
			ul.className = `dropdown-menu ${isSide ? "dropdown-menu--side" : ""}`;
			ul.onclick = function (event) { event.stopPropagation(); };

			li.appendChild(a);
			li.appendChild(ul);
			appendTo.appendChild(li);
			return ul;
		}

		/**
		 * Special LI for buttong
		 * @param appendTo The element to append to.
		 * @param options Options.
		 * @param options.html Button text.
		 * @param options.click Button click handler.
		 * @param options.title Button title.
		 * @param options.className Additional button classes.
		 */
		function addButton (appendTo, options) {
			const li = document.createElement("li");
			li.setAttribute("role", "presentation");

			const a = document.createElement("a");
			a.href = "#";
			if (options.className) a.className = options.className;
			a.onclick = options.click;
			a.innerHTML = options.html;

			if (options.title) li.setAttribute("title", options.title);

			li.appendChild(a);
			appendTo.appendChild(li);
		}
	}

	static highlightCurrentPage () {
		let currentPage = window.location.pathname;
		currentPage = currentPage.substr(currentPage.lastIndexOf("/") + 1);

		if (!currentPage) currentPage = "5etools.html";

		let isSecondLevel = false;
		if (currentPage.toLowerCase() === "book.html" || currentPage.toLowerCase() === "adventure.html") {
			const hashPart = window.location.hash.split(",")[0];
			if (currentPage.toLowerCase() === "adventure.html") isSecondLevel = true;
			currentPage += hashPart.toLowerCase();
		}
		if (currentPage.toLowerCase() === "adventures.html") isSecondLevel = true;

		try {
			let current = document.querySelector(`li[data-page="${currentPage}"]`);
			if (current == null) {
				currentPage = currentPage.split("#")[0];
				if (NavBar.ALT_CHILD_PAGES[currentPage]) currentPage = NavBar.ALT_CHILD_PAGES[currentPage];
				current = document.querySelector(`li[data-page="${currentPage}"]`);
			}
			current.parentNode.childNodes.forEach(n => n.classList && n.classList.remove("active"));
			current.classList.add("active");

			let closestLi = current.parentNode;
			const setNearestParentActive = () => {
				while (closestLi !== null && (closestLi.nodeName !== "LI" || !closestLi.classList.contains("dropdown"))) closestLi = closestLi.parentNode;
				closestLi && closestLi.classList.add("active");
			};
			setNearestParentActive();
			if (isSecondLevel) {
				closestLi = closestLi.parentNode;
				setNearestParentActive();
			}
		} catch (ignored) { setTimeout(() => { throw ignored }); }
	}

	static initHandlers () {
		NavBar._dropdowns = [...document.getElementById("navbar").querySelectorAll(`li.dropdown--navbar`)];
		document.addEventListener("click", () => NavBar._dropdowns.forEach(ele => ele.classList.remove("open")));
		document.addEventListener("mousemove", evt => {
			NavBar._mouseX = evt.clientX;
			NavBar._mouseY = evt.clientY;
		});

		NavBar._clearAllTimers();
	}

	static handleDropdownClick (ele, event, isSide) {
		event.preventDefault();
		event.stopPropagation();
		if (isSide) return;
		const isOpen = ele.parentNode.classList.contains("open");
		if (isOpen) NavBar._dropdowns.forEach(ele => ele.classList.remove("open"));
		else NavBar._openDropdown(ele);
	}

	static _openDropdown (fromLink) {
		const noRemove = new Set();
		let parent = fromLink.parentNode;
		parent.classList.add("open");
		noRemove.add(parent);

		while (parent.nodeName !== "NAV") {
			parent = parent.parentNode;
			if (parent.nodeName === "LI") {
				parent.classList.add("open");
				noRemove.add(parent);
			}
		}

		NavBar._dropdowns.filter(ele => !noRemove.has(ele)).forEach(ele => ele.classList.remove("open"));
	}

	static handleItemMouseEnter (ele) {
		const $ele = $(ele);
		const timerIds = $ele.siblings("[data-timer-id]").map((i, e) => ({$ele: $(e), timerId: $(e).data("timer-id")})).get();
		timerIds.forEach(({$ele, timerId}) => {
			if (NavBar._timersOpen[timerId]) {
				clearTimeout(NavBar._timersOpen[timerId]);
				delete NavBar._timersOpen[timerId];
			}

			if (!NavBar._timersClose[timerId] && $ele.hasClass("open")) {
				const getTimeoutFn = () => {
					if (NavBar._timerMousePos[timerId]) {
						const [xStart, yStart] = NavBar._timerMousePos[timerId];
						// for generalised use, this should be made check against the bounding box for the side menu
						// and possibly also check Y pos; e.g.
						// || NavBar._mouseY > yStart + NavBar.MIN_MOVE_PX
						if (NavBar._mouseX > xStart + NavBar.MIN_MOVE_PX) {
							NavBar._timerMousePos[timerId] = [NavBar._mouseX, NavBar._mouseY];
							NavBar._timersClose[timerId] = setTimeout(() => getTimeoutFn(), NavBar.DROP_TIME / 2);
						} else {
							$ele.removeClass("open");
							delete NavBar._timersClose[timerId];
						}
					} else {
						$ele.removeClass("open");
						delete NavBar._timersClose[timerId];
					}
				};

				NavBar._timersClose[timerId] = setTimeout(() => getTimeoutFn(), NavBar.DROP_TIME);
			}
		});
	}

	static handleSideItemMouseEnter (ele) {
		const timerId = $(ele).closest(`li.dropdown`).data("timer-id");
		if (NavBar._timersClose[timerId]) {
			clearTimeout(NavBar._timersClose[timerId]);
			delete NavBar._timersClose[timerId];
			delete NavBar._timerMousePos[timerId];
		}
	}

	static handleSideDropdownMouseEnter (ele) {
		const $ele = $(ele);
		const timerId = $ele.parent().data("timer-id") || NavBar._timerId++;
		$ele.parent().attr("data-timer-id", timerId);

		if (NavBar._timersClose[timerId]) {
			clearTimeout(NavBar._timersClose[timerId]);
			delete NavBar._timersClose[timerId];
		}

		if (!NavBar._timersOpen[timerId]) {
			NavBar._timersOpen[timerId] = setTimeout(() => {
				NavBar._openDropdown(ele);
				delete NavBar._timersOpen[timerId];
				NavBar._timerMousePos[timerId] = [NavBar._mouseX, NavBar._mouseY];
			}, NavBar.DROP_TIME);
		}
	}

	static handleSideDropdownMouseLeave (ele) {
		const $ele = $(ele);
		if (!$ele.parent().data("timer-id")) return;
		const timerId = $ele.parent().data("timer-id");
		clearTimeout(NavBar._timersOpen[timerId]);
		delete NavBar._timersOpen[timerId];
	}

	static _clearAllTimers () {
		Object.entries(NavBar._timersOpen).forEach(([k, v]) => {
			clearTimeout(v);
			delete NavBar._timersOpen[k];
		});
	}
}
NavBar.DROP_TIME = 250;
NavBar.MIN_MOVE_PX = 7;
NavBar.ALT_CHILD_PAGES = {
	"book.html": "books.html",
	"adventure.html": "adventures.html"
};
NavBar._timerId = 1;
NavBar._timersOpen = {};
NavBar._timersClose = {};
NavBar._timerMousePos = {};
NavBar._mouseX = null;
NavBar._mouseY = null;
NavBar.init();
