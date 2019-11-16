"use strict";

window.addEventListener("load", () => {
	if (typeof [].flat !== "function") {
		const $body = $(`body`);
		$body.addClass("edge__body");
		const $btnClose = $(`<button class="btn btn-danger edge__btn-close"><span class="glyphicon glyphicon-remove"/></button>`)
			.click(() => {
				$overlay.remove();
				$body.removeClass("edge__body");
			});
		const $overlay = $(`<div class="flex-col flex-vh-center relative edge__overlay"/>`);
		$btnClose.appendTo($overlay);
		$overlay.append(`<div class="flex-col flex-vh-center">
			<div class="edge__title mb-2">UPDATE YOUR BROWSER</div>
			<div><i>It looks like you're using an outdated/unsupported browser.<br>
			5etools recommends and supports the latest <a href="https://www.google.com/chrome/" class="edge__link">Chrome</a> and the latest <a href="https://www.mozilla.org/firefox/" class="edge__link">Firefox</a>.</i></div>
		</div>`).appendTo($body);
	}
});
