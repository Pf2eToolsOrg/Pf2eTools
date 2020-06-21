"use strict";

class UtilsChangelog {
	static renderChangelog (changelog, $wrp) {
		let lastMajorVersion = 0;
		let lastMinorVersion = 0;
		changelog.forEach((it, i) => {
			if (!it.txt) return;

			let [vMajor, vMinor, vPatch] = it.ver.split(".");
			vMajor = Number(vMajor);
			vMinor = Number(vMinor);

			const hLevel = vMajor !== lastMajorVersion ? "2" : vMinor !== lastMinorVersion ? "3" : "4";
			const blocks = it.txt.trim().split(/\n\n+/g);

			let htmlStack = "";

			const cleanListLine = l => l.trim().replace(/^-\s*/, "");

			blocks.forEach(block => {
				htmlStack += `<div class="small mb-2">`;

				const lines = block.split("\n");

				let ulStack = [];
				let depth = -1;
				lines.forEach(l => {
					if (l.trim().startsWith("-")) {
						const nxtDepth = l.length - l.trimLeft().length;

						if (nxtDepth > depth) {
							depth = nxtDepth;
							htmlStack += `<ul><li>${cleanListLine(l)}</li>`;
						} else if (nxtDepth < depth) {
							depth = nxtDepth;
							htmlStack += `</ul><li>${cleanListLine(l)}</li>`;
						} else {
							htmlStack += `<li>${cleanListLine(l)}</li>`;
						}
					} else {
						while (ulStack.length) {
							ulStack.pop();
							htmlStack += "</ul>";
						}
						depth = -1;
						htmlStack += `<div class="mb-1">${l}</div>`;
					}
				});

				while (ulStack.length) {
					ulStack.pop();
					htmlStack += "</ul>";
				}

				htmlStack += `</div>`;
			});

			htmlStack += `</div>`;

			const isLast = i === changelog.length - 1;

			const titlePart = it.title ? `, &quot;<span ${it.titleAlt ? `class="help" title="AKA &quot;${it.titleAlt.escapeQuotes()}&quot; Edition"` : ""}>${it.title.escapeQuotes()}</span>&quot; Edition` : "";
			$wrp.prepend(`<div class="flex-col" id="v${it.ver}">
				<div class="split-v-center">
					<h${hLevel} class="bold">v${isLast ? `<a href="https://get.5e.tools/">` : ""}${it.ver}${isLast ? `</a>` : ""}${titlePart}</h${hLevel}>
					<span class="text-muted">${it.date}</span>
				</div>

				${htmlStack}
			</div>`);

			lastMajorVersion = vMajor;
			lastMinorVersion = vMinor;
		});
	}
}
