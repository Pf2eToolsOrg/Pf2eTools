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
			vPatch = Number(vPatch);

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
						const nxtDepth = Math.ceil((l.length - l.trimLeft().length) / 2);

						if (nxtDepth > depth) {
							htmlStack += `${"<ul>".repeat(nxtDepth - depth)}<li>${cleanListLine(l)}</li>`;
							depth = nxtDepth;
						} else if (nxtDepth < depth) {
							htmlStack += `${"</ul>".repeat(depth - nxtDepth)}<li>${cleanListLine(l)}</li>`;
							depth = nxtDepth;
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

			// Earliest Github release was v0.1.2
			const hasGithubRelease = vMajor || vMinor > 1 || vMinor === 1 && vPatch >= 2;

			const titlePart = it.title ? `, &quot;<span ${it.titleAlt ? `class="help" title="AKA &quot;${it.titleAlt.escapeQuotes()}&quot; Edition"` : ""}>${it.title.escapeQuotes()}</span>&quot; Edition` : "";
			$wrp.prepend(`<div class="flex-col" id="v${it.ver}">
				<div class="split-v-center">
					<h${hLevel} class="bold">${hasGithubRelease ? `<a href="https://github.com/Pf2eToolsOrg/Pf2eTools/releases/tag/v${it.ver}">` : ""}v${it.ver}${hasGithubRelease ? `</a>` : ""}${titlePart}</h${hLevel}>
					<span class="text-muted">${it.date}</span>
				</div>

				${htmlStack}
			</div>`);

			lastMajorVersion = vMajor;
			lastMinorVersion = vMinor;
		});
		// Finally, add depre-- I mean, stagnation notice
		$wrp.prepend(`
			<div class="flex">
				<div class="pf2-box pf2-box--red" style="border-radius: 6px">
					<div style="margin-bottom: 8px"></div>
					<span class="pf2-box__title">
						Stagnation Notice
					</span>
					<p class="pf2-box__text">
						The v0.8.5 update of August 2023 marked the end of the Pf2eTools project in its current incarnation. The remastered ruleset and general development kludge have conspired to make <i>Player Core</i> (and later books) broadly unconvertable in any satisfying way, rendering Pf2eTools stuck.
					</p>
					<p class="pf2-box__text">
						Although we'll continue to fix minor bugs and correct conversion typos, <b>no new content or features are planned</b>. The updates we've pushed out since v0.8.5 are (almost entirely) thanks to the <a href="https://github.com/Pf2eToolsOrg/Pf2eTools">contributions</a> of our amazing community!
					</p>
					<p class="pf2-box__text">
						The good news, though, is that we're <i>not</i> abandoning the project. In fact, <b>we're already working on a new version of the website</b>, rebuilt from the ground up... although we can't promise when it'll be ready. An alpha version is available to our <a href="https://ko-fi.com/mrvauxs">supporters</a>; you can also join our <a href="https://discord.gg/2hzNxErtVu">Discord server</a> to receive more informal updates or just chat about things.
					</p>
					<p class="pf2-box__text">
						Please remember that we're all volunteers working in our spare time: your appreciation (in every form!) goes a <i>long</i> way to keep us motivated. Thanks for understanding\u2014we'll see you around!
					</p>
				</div>
			</div>
		`);
	}
}
