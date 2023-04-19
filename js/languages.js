"use strict";

class LanguagesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterLanguages();
		super({
			dataSource: "data/languages.json",

			pageFilter,

			listClass: "languages",

			sublistClass: "sublanguages",

			dataProps: ["language"],
		});
	}

	getListItem (it, anI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(it, isExcluded);

		const eleLi = document.createElement("li");
		eleLi.className = `row ${isExcluded ? "row--blacklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(it.source);
		const hash = UrlUtil.autoEncodeHash(it);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border">
			<span class="col-6 bold pl-0">${it.name}</span>
			<span class="col-3 text-center">${(it.type || "\u2014").uppercaseFirst()}</span>
			<span class="col-3 text-center ${Parser.sourceJsonToColor(it.source)}" title="${Parser.sourceJsonToFull(it.source)}" ${BrewUtil.sourceJsonToStyle(it.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			anI,
			eleLi,
			it.name,
			{
				hash,
				source,
				dialects: it.dialects || [],
				type: it.type || "",
				aliases: it.alias ? it.alias.join(" - ") : "",
			},
			{
				uniqueId: it.uniqueId ? it.uniqueId : anI,
				isExcluded,
			},
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => ListUtil.openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	handleFilterChange () {
		const f = this._filterBox.getValues();
		this._list.filter(item => this._pageFilter.toDisplay(f, this._dataList[item.ix]));
		FilterBox.selectFirstVisible(this._dataList);
	}

	getSublistItem (it, pinId) {
		const hash = UrlUtil.autoEncodeHash(it);

		const $ele = $(`<li class="row">
			<a href="#${hash}" class="lst--border">
				<span class="bold col-9 pl-0">${it.name}</span>
				<span class="col-3 text-center">${(it.type || "\u2014").uppercaseFirst()}</span>
			</a>
		</li>`)
			.contextmenu(evt => ListUtil.openSubContextMenu(evt, listItem));

		const listItem = new ListItem(
			pinId,
			$ele,
			it.name,
			{
				hash,
				type: it.type || "",
				script: it.script || "",
			},
		);
		return listItem;
	}

	doLoadHash (id) {
		const $content = $("#pagecontent").empty();
		const it = this._dataList[id];

		function buildStatsTab () {
			$content.append(Renderer.language.getRenderedString(it));
		}
		const buildInfoTab = async () => {
			const quickRules = await Renderer.utils.pGetQuickRules("language");
			$content.append(quickRules);
		}
		const statTab = Renderer.utils.tabButton(
			"Language",
			() => {},
			buildStatsTab,
		);
		const fontTab = Renderer.utils.tabButton(
			"Fonts",
			() => {},
			() => {
				$content.append(Renderer.utils.getNameDiv(it, {page: UrlUtil.PG_LANGUAGES, type: `${it.type ? `${it.type} ` : ""}language`}));
				$content.append(Renderer.utils.getDividerDiv());
				const $div = $(`<div class=""></div>`);
				$$`<div class="text">${$div}</div>`.appendTo($content);

				if (!it.fonts) {
					$div.append("<i>No fonts available.</i>");
					return;
				}

				const $styleFont = $(`<style/>`);

				let lastStyleIndex = null;
				let lastStyleClass = null;
				const renderStyle = (ix) => {
					if (ix === lastStyleIndex) return;

					const font = it.fonts[ix];
					const slugName = Parser.stringToSlug(font.split("/").last().split(".")[0]);

					const styleClass = `languages__sample--${slugName}`;

					$styleFont.empty().append(`
						@font-face { font-family: ${slugName}; src: url('${font}'); }
						.${styleClass} { font-family: ${slugName}, sans-serif; }
					`);

					if (lastStyleClass) $ptOutput.removeClass(lastStyleClass);
					lastStyleClass = styleClass;
					$ptOutput.addClass(styleClass);
					lastStyleIndex = ix;
				};

				const saveTextDebounced = MiscUtil.debounce((text) => StorageUtil.pSetForPage("sampleText", text), 500);
				const updateText = (val) => {
					if (val === undefined) val = $iptSample.val();
					else $iptSample.val(val);
					$ptOutput.text(val);
					saveTextDebounced(val);
				};

				const DEFAULT_TEXT = "Dr. Pavel, I'm CIA.";

				const $iptSample = $(`<textarea class="form-control w-100 mr-2 resize-vertical font-ui mb-2" style="height: 110px">${DEFAULT_TEXT}</textarea>`)
					.keyup(() => updateText())
					.change(() => updateText());

				const $selFont = it.fonts.length === 1
					? null
					: $(`<select class="form-control font-ui languages__sel-sample input-xs">${it.fonts.map((f, i) => `<option value="${i}">${f.split("/").last().split(".")[0]}</option>`).join("")}</select>`)
						.change(() => {
							const ix = Number($selFont.val());
							renderStyle(ix);
						});

				const $ptOutput = $(`<pre class="languages__sample p-2 mb-0">${DEFAULT_TEXT}</pre>`);

				renderStyle(0);

				StorageUtil.pGetForPage("sampleText")
					.then(val => {
						if (val != null) updateText(val);
					});

				$$`<div class="flex-col w-100">
					${$styleFont}
					${$selFont ? $$`<label class="flex-v-center mb-2"><div class="mr-2">Font:</div>${$selFont}</div>` : ""}
					${$iptSample}
					${$ptOutput}
					<hr class="hr-4">
					<h5 class="mb-2 mt-0">Downloads</h5>
					<ul class="pl-5 mb-0">
						${it.fonts.map(f => `<li><a href="${f}" target="_blank">${f.split("/").last()}</a></li>`).join("")}
					</ul>
				</div>`.appendTo($div);
			},
		);
		const infoTab = Renderer.utils.tabButton(
			"Quick Rules",
			() => {},
			buildInfoTab,
		);
		if (it.fonts) Renderer.utils.bindTabButtons(statTab, fontTab, infoTab);
		else Renderer.utils.bindTabButtons(statTab, infoTab);

		ListUtil.updateSelected();
	}

	async pDoLoadSubHash (sub) {
		sub = this._filterBox.setFromSubHashes(sub);
		await ListUtil.pSetFromSubHashes(sub);
	}
}

let languagesPage;
window.addEventListener("load", async () => {
	await Renderer.trait.preloadTraits();
	languagesPage = new LanguagesPage();
	languagesPage.pOnLoad()
});
