class StyleSwitcher {

	constructor(toggleButton) {
		this.currentStylesheet = this.STYLE_DEFAULT;
		this.toggleButton = toggleButton;
	}

	setActiveStyleSheet(title) {
		if (title !== StyleSwitcher.STYLE_DEFAULT && title !== StyleSwitcher.STYLE_NIGHT) title = StyleSwitcher.STYLE_DEFAULT;
		let i, a;
		for (i = 0; (a = document.getElementsByTagName("link")[i]); i++) {
			if (a.getAttribute("rel").indexOf("style") !== -1 && a.getAttribute("title")) {
				a.disabled = a.getAttribute("title") !== title;
			}
		}
		this.currentStylesheet = title;
		this.toggleButton.html(title === StyleSwitcher.STYLE_DEFAULT ? "Night Mode" : "Day Mode");
	}

	static getActiveStyleSheet() {
		let i, a;
		for (i = 0; (a = document.getElementsByTagName("link")[i]); i++) {
			if (a.getAttribute("rel").indexOf("style") !== -1 && a.getAttribute("title") && !a.disabled) return a.getAttribute("title");
		}
		return null;
	}

	static getPreferredStyleSheet() {
		let i, a;
		for (i = 0; (a = document.getElementsByTagName("link")[i]); i++) {
			if (a.getAttribute("rel").indexOf("style") !== -1
				&& a.getAttribute("rel").indexOf("alt") === -1
				&& a.getAttribute("title")
			) return a.getAttribute("title");
		}
		return null;
	}

	static createCookie(name, value, days) {
		let expires;
		if (days) {
			const date = new Date();
			date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
			expires = "; expires=" + date.toGMTString();
		} else {
			expires = "";
		}
		document.cookie = name + "=" + value + expires + "; path=/";
	}

	static readCookie(name) {
		const nameEQ = name + "=";
		let ca = document.cookie.split(';');
		for (let i = 0; i < ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) === ' ') c = c.substring(1, c.length);
			if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
		}
		return null;
	}

	toggleActiveStyleSheet() {
		if (this.currentStylesheet === StyleSwitcher.STYLE_DEFAULT) this.setActiveStyleSheet(StyleSwitcher.STYLE_NIGHT);
		else this.setActiveStyleSheet(StyleSwitcher.STYLE_DEFAULT);
	}
}
StyleSwitcher.STYLE_DEFAULT = "default";
StyleSwitcher.STYLE_NIGHT = "alternate";