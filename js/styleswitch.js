"use strict";

class StyleSwitcher {
	constructor () {
		this.currentStylesheet = this.STYLE_DAY;
	}

	setActiveStyleSheet (style) {
		const bodyClasses = document.body.classList;
		const setMethod = style === StyleSwitcher.STYLE_DAY ? bodyClasses.remove : bodyClasses.add;
		setMethod.call(bodyClasses, StyleSwitcher.NIGHT_CLASS);

		this.setButtonText(style);

		this.currentStylesheet = style;
		StyleSwitcher.createCookie(this.currentStylesheet);
	}

	setButtonText (style) {
		const $button = StyleSwitcher.getButton();
		if (!$button.length) {
			return;
		}
		$button.html(`${style === StyleSwitcher.STYLE_DAY ? "Night" : "Day"} Mode`);
	}

	getActiveStyleSheet () {
		return this.currentStylesheet;
	}

	static getButton () {
		return $(".nightModeToggle");
	}

	static createCookie (value) {
		Cookies.set("style", value, {expires: 365});
	}

	static readCookie () {
		return Cookies.get("style");
	}

	toggleActiveStyleSheet () {
		const newStyle = this.currentStylesheet === StyleSwitcher.STYLE_DAY ? StyleSwitcher.STYLE_NIGHT : StyleSwitcher.STYLE_DAY;
		this.setActiveStyleSheet(newStyle);
	}
}

StyleSwitcher.STYLE_DAY = "day";
StyleSwitcher.STYLE_NIGHT = "night";
StyleSwitcher.NIGHT_CLASS = "night-mode";

// NIGHT MODE ==========================================================================================================
const styleSwitcher = new StyleSwitcher();
// load user's preferred CSS

document.addEventListener('DOMContentLoaded', () => {
	styleSwitcher.cookie = StyleSwitcher.readCookie();
	styleSwitcher.cookie = styleSwitcher.cookie ? styleSwitcher.cookie : StyleSwitcher.STYLE_DAY;
	styleSwitcher.setActiveStyleSheet(styleSwitcher.cookie);
});

window.addEventListener("unload", function () {
	const title = styleSwitcher.getActiveStyleSheet();
	StyleSwitcher.createCookie(title);
});
