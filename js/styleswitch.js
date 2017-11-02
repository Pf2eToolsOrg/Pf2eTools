const DAY_CSS = "header { \tmargin-bottom: 3px; \tpadding: 25px 15px; \tcolor: white; \tbackground-color: rgb(0, 107, 196); }  header p.lead { \tcolor: lightgrey; }  ul.list li:hover { \tbackground: lightgrey; }  table#stats, table#statsprof { \tbackground: #fdf1dc; }  table#stats table tbody tr:nth-child(odd) { \tbackground: #e4d8c3; }  th.border { \tborder: 1px solid black; \tbackground: #e69a28; }  tr.text td {; \tcolor: black !important; }  table#stats td#typerarityattunement { \tcolor: black; }  tr.text td { \tcolor: black !important; }  table#stats td#sizetypealignment { \tcolor: black; }  tr.trait td, tr.action td, tr.reaction td, tr.legendary td { \tcolor: black !important; }  #output { \tbackground: lightgrey; }  #crcalc label span.explanation { \tborder: 1px solid lightgrey; }  #msbcr tr:nth-child(even) { \tbackground: lightgrey; }  #croutput { \tbackground: lightgrey; }  /* section: class features */  td._class_feature.feature strong { \tcolor: #922610; }  td._class_feature.subfeature strong { \tcolor: #922610; }  td._class_feature.subfeature.sub2 span.inline-header { \tcolor: #922610; \tfont-family: serif; \tfont-weight: bold; \tfont-style: italic; }  table#stats td._class_feature table th { \tcolor: black; }  /* end section: class features */  #classtable table { \tbackground: #fdf1dc; }  #classtable table th { \tcolor: black; }  #classtable table tr:nth-child(odd) td, #rulescontent table tbody tr:nth-child(odd) td { \tbackground: lightgrey; }  #rulescontent caption { \tcolor: black; }  div#subclasses > span { \tbackground: lightgrey; }  tr.trait td { \tcolor: black !important; }";
const NIGHT_CSS = "header { \tcolor: white; \tbackground-color: transparent; }  header p.lead { \tcolor: black; }  body { \tcolor: grey; \tbackground: #222 url(data:image/png;base64,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) repeat scroll left top !important; }  h1, h2, h3, h4, h5, h6 { \tcolor: grey; }  .nav > li > a:focus, .nav > li > a:hover { \ttext-decoration: none; \tbackground-color: transparent; }  .nav .open > a, .nav .open > a:focus, .nav .open > a:hover { \tbackground-color: transparent; \tborder-color: #337ab7; }  .btn-default { \tbackground-color: transparent !important; \tcolor: grey; }  .dropdown-menu { \tbackground-color: #1a1a1a; \tcolor: grey; }  .dropdown-menu > li > a { \tcolor: grey; }  input.search { \twidth: 62%; \tbackground-color: transparent !important; }  form#filtertools select { \tmargin: 1px; \tbackground-color: transparent !important; }  ul.list li:hover { \tbackground: black; }  table#stats, table#statsprof { \tbackground: transparent; }  table#stats table tbody tr:nth-child(odd) { \tbackground: transparent; }  th.border { \tborder: transparent; \tbackground: transparent; }  tr.text td { \tcolor: grey !important; }  table#stats td#typerarityattunement { \tcolor: grey; }  tr.text td { \tcolor: grey !important; }  table#stats td#sizetypealignment { \tcolor: grey; }  tr.trait td, tr.action td, tr.reaction td, tr.legendary td { \tcolor: grey !important; }  #output { \tbackground: black; }  #crcalc label span.explanation { \tborder: 1px solid black; }  #msbcr tr:nth-child(even) { \tbackground: black; }  #croutput { \tbackground: black; }  /* section: class features */  td._class_feature.feature strong { \tcolor: #337ab7; }  td._class_feature.subfeature strong { \tcolor: #337ab7; }  td._class_feature.subfeature.sub2 span.inline-header { \tcolor: #337ab7; \tfont-family: serif; \tfont-weight: bold; \tfont-style: italic; }  table#stats td._class_feature table th { \tcolor: grey; }  /* end section: class features */  #classtable table { \tbackground: transparent; }  #classtable table th { \tcolor: grey; }  #classtable table tr:nth-child(odd) td, #rulescontent table tbody tr:nth-child(odd) td { \tbackground: black; }  #rulescontent caption { \tcolor: grey; }  div#subclasses > span { \tbackground: black; }  tr.trait td { \tcolor: grey !important; }";

class StyleSwitcher {

	constructor() {
		this.currentStylesheet = this.STYLE_DAY;
		this.dynamicStyleEle = document.getElementById("dynamicStyle");
	}

	setActiveStyleSheet(title) {
		if (title !== StyleSwitcher.STYLE_DAY && title !== StyleSwitcher.STYLE_NIGHT) title = StyleSwitcher.STYLE_DAY;
		this.dynamicStyleEle.innerHTML = title === StyleSwitcher.STYLE_DAY ? DAY_CSS : NIGHT_CSS;
		this.currentStylesheet = title;
	}

	getActiveStyleSheet() {
		return this.currentStylesheet;
	}

	static createCookie(name, value, days) {
		let expires;
		if (days) {
			const date = new Date();
			date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
			expires = "; expires=" + date.toUTCString();
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
		if (this.currentStylesheet === StyleSwitcher.STYLE_DAY) this.setActiveStyleSheet(StyleSwitcher.STYLE_NIGHT);
		else this.setActiveStyleSheet(StyleSwitcher.STYLE_DAY);

		$(".nightModeToggle").html(this.currentStylesheet === StyleSwitcher.STYLE_DAY ? "Night Mode" : "Day Mode");
	}
}
StyleSwitcher.STYLE_DAY = "day";
StyleSwitcher.STYLE_NIGHT = "night";

// NIGHT MODE ==========================================================================================================
const styleSwitcher = new StyleSwitcher();
// load user's preferred CSS
let cookie = StyleSwitcher.readCookie("style");
cookie = cookie ? cookie : StyleSwitcher.STYLE_DAY;
styleSwitcher.setActiveStyleSheet(cookie);

window.addEventListener("unload", function() {
	const title = styleSwitcher.getActiveStyleSheet();
	StyleSwitcher.createCookie("style", title, 365);
});