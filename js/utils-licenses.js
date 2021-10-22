"use strict";

class UtilsLicenses {
	static renderLicenses (licenses) {
		const $wrp = $(`#wrp-licenses`).empty();
		const renderer = Renderer.get();
		$$`${(licenses.map(it => {
			return `<div class="row"><div class="home__stripe-header text-right home__h-player">
			<div class="text-center">${it.name != null ? it.name : ""}</div></div>
			<div>${it.entries.map(e => renderer.render(e)).join("<br>")}</div>
			</div></div>`
		}).join("<hr>"))}`.appendTo($wrp);
	}

	// TODO: Homebrew licenses
}
