"use strict";
const RACE_JSON_URL = "data/races.json";

class StatGen {
	static isValidState (state) {
		if (!state) return false;
		if (typeof state !== "object") return false;
		if (!state.t || !state.m || !state.p) return false;
		if (!Object.keys(state.t).length) return false;
		return !Object.entries(state.t).some(([k, v]) => isNaN(Number(k)) || isNaN(Number(v)));
	}

	async init () {
		this.amount = null;
		this.count = null;
		this.raceData = null;
		this.$advanced = $(`#advanced`);
		this.$budget = $(`#budget`);
		this.budget = StatGen.DEFAULT_POINTS;
		this.doSaveDebounced = MiscUtil.debounce(this.doSaveState, 200, true);

		await ExcludeUtil.pInitialise();
		await this.pLoadRaceJson();
		this.initialiseChangeHandlers();

		// load from local storage
		try {
			const savedState = await StorageUtil.pGet(POINTBUY_STORAGE);
			if (StatGen.isValidState(savedState)) this.doLoadStateFrom(savedState);
			else this.savedState = MiscUtil.copy(StatGen.DEFAULT_COSTS);
		} catch (e) {
			this.savedState = MiscUtil.copy(StatGen.DEFAULT_COSTS);
		}

		// load from URL
		try {
			this.doLoadUrlState(true);
		} catch (e) {
			window.location.hash = "";
		}

		this.renderCostsTable();

		this.$advanced.change(() => {
			const isAdvanced = this.isAdvanced;
			$(`#pointbuy`).toggleClass("pbuy__advanced_active", isAdvanced);
			this.$budget.attr("readonly", !isAdvanced);

			if (isAdvanced) this.$budget.val(this.budget);
			else this.$budget.val(StatGen.DEFAULT_POINTS);

			this.renderCostsTable();
			this.handleCostChanges();
			this.doSaveDebounced();
		}).change();

		this.isInit = true;
	}

	doLoadStateFrom (savedState) {
		this.savedState = savedState.t;
		this.$advanced.prop("checked", !!savedState.m.a);
		this.$budget.val(savedState.p);
		this.budget = savedState.p;
		this.renderCostsTable();
	}

	doLoadUrlState (firstLoad) {
		if (window.location.hash.length) {
			const splitHash = window.location.hash.slice(1).split(",");
			if (splitHash.length > 1) {
				const toLoad = JSON.parse(decodeURIComponent(splitHash[1]));
				if (StatGen.isValidState(toLoad)) {
					this.doLoadStateFrom(toLoad);

					if (firstLoad !== true) this.handleCostChanges();
				}

				location.replace("#pointbuy");
			}
		}
	}

	handleCostChanges () {
		$(".base").each((i, e) => e.value = this.limit(e.value));
		this.changeBase();
	}

	getSaveableState () {
		return MiscUtil.copy({
			t: this.savedState,
			p: this.budget,
			m: {
				a: this.isAdvanced
			}
		})
	}

	doSaveState () {
		StorageUtil.pSet(POINTBUY_STORAGE, this.getSaveableState());
	}

	async pLoadRaceJson () {
		const data = await DataUtil.loadJSON(RACE_JSON_URL);

		let brew;
		try {
			brew = await BrewUtil.pAddBrewData();
		} catch (e) {
			return BrewUtil.pPurgeBrew();
		}

		this.raceData = EntryRenderer.race.mergeSubraces(data.race);
		if (brew.race) this.raceData = this.raceData.concat(brew.race);
		this.raceData = this.raceData.filter(it => !ExcludeUtil.isExcluded(it.name, "race", it.source));

		$("#rollbutton").click(() => this.rollStats());

		const isCrypto = RollerUtil.isCrypto();
		const titleStr = isCrypto ? "Numbers will be generated using Crypto.getRandomValues()" : "Numbers will be generated using Math.random()";
		$(`#roller-mode`).html(`Cryptographically strong random generation: <span title="${titleStr}" class="crypto-${isCrypto}">${isCrypto ? `<span class="glyphicon glyphicon-lock"></span> enabled` : `<span class="glyphicon glyphicon-ban-circle"></span> not available`}</span>`);

		$("#reset").click(() => {
			$(".base").val(this.statMin);
			$(".choose").prop("checked", false);
			this.changeBase();
		});

		$(".base").on("input", () => this.changeBase());
		$("input.choose").on("change", (evt) => this.chooseRace(evt.target));

		const races = this.raceData.map(x => ({name: x.name, source: x.source})).sort((a, b) => SortUtil.ascSort(a.name, b.name) || SortUtil.ascSort(a.source, b.source));
		const options = races.map(it => `<option value="${it.name}_${it.source}">${it.name} ${it.source !== SRC_PHB ? `[${Parser.sourceJsonToAbv(it.source)}]` : ""}</option>`).join("");
		$("#race")
			.append(`<option value="">None</option>`)
			.append(`<option value="_CUSTOM">Custom</option>`)
			.append(options)
			.change((evt) => this.changeRace(evt.target))
			.change();

		if (window.location.hash) window.onhashchange();
		else window.location.hash = "#rolled";
	}

	renderCostsTable () {
		$(`.pbuy__add_row_btn_wrap`).remove();
		const $table = $(`#costs`);
		$table.empty().append(`
			<thead>
				<tr><th>Score</th><th>Modifier</th><th>Point Cost</th><th class="pbuy__adv--visible"></th></tr>
			</thead>
		`);
		const $tbody = $(`<tbody/>`).appendTo($table);

		const renderState = (isAdvanced) => {
			const state = isAdvanced ? this.savedState : StatGen.DEFAULT_COSTS;
			const keys = Object.keys(state).map(Number).sort(SortUtil.ascSort);
			for (let i = 0; i < keys.length; ++i) {
				const k = keys[i]; const v = state[k];

				const $row = $(`
					<tr${isAdvanced ? ` class="pbuy__tbl_row"` : ""}>
						<td>${k}</td>
						<td>${Parser.getAbilityModifier(Number(k))}</td>
						<td>
							<span class="pbuy__adv--hidden">${v}</span>
							<span class="pbuy__wrp_cost_ipt pbuy__adv--visible"/>
						</td>
						<td class="pbuy__adv--visible"/>
					</tr>
				`).appendTo($tbody);

				$(`<input value="${v}" type="number">`).on("change", (evt) => {
					state[k] = Number(evt.target.value);
					this.doSaveDebounced();
					this.handleCostChanges();
				}).appendTo($row.find(`.pbuy__wrp_cost_ipt`));

				if (isAdvanced && (i === 0 || i === keys.length - 1) && keys.length > 1) {
					const $btnRm = $(`<button class="btn btn-xs btn-danger"><span class="glyphicon glyphicon-remove"></span></button>`).click(() => {
						delete state[k];
						this.doSaveDebounced();

						this.renderCostsTable();
						this.handleCostChanges();
					}).appendTo($row.find(`td`).last());
				}
			}
		};

		if (this.isAdvanced) {
			renderState(true);

			const $wrpBtnsTop = $(`<div class="pbuy__add_row_btn_wrap"/>`).insertBefore($table);

			const $btnAddLow = $(`<button class="btn btn-xs btn-primary" style="margin-right: 7px;">Add Lower</button>`)
				.click(() => {
					const lowest = Object.keys(this.savedState).map(Number).sort(SortUtil.ascSort)[0];
					if (lowest === 0) return alert("Can't go any lower!");

					this.savedState[lowest - 1] = this.savedState[lowest];
					this.doSaveDebounced();

					this.renderCostsTable();
				}).appendTo($wrpBtnsTop);

			const $btnAddHigh = $(`<button class="btn btn-xs btn-primary" style="margin-right: 14px;">Add Higher</button>`)
				.click(() => {
					const highest = Object.keys(this.savedState).map(Number).sort(SortUtil.ascSort).reverse()[0];

					this.savedState[highest + 1] = this.savedState[highest];
					this.doSaveDebounced();

					this.renderCostsTable();
				}).appendTo($wrpBtnsTop);

			const $btnReset = $(`<button class="btn btn-xs btn-default">Reset</button>`)
				.click(() => {
					this.savedState = MiscUtil.copy(StatGen.DEFAULT_COSTS);
					this.budget = StatGen.DEFAULT_POINTS;
					this.$budget.val(this.budget);
					this.doSaveDebounced();

					this.renderCostsTable();
					this.handleCostChanges();
				}).appendTo($wrpBtnsTop);

			const $wrpBtnsBtm = $(`<div class="pbuy__add_row_btn_wrap" style="margin-top: 2rem;"/>`).insertAfter($table);
			const $btnSaveFile = $(`<button class="btn btn-xs btn-primary" style="margin-right: 7px;">Save to File</button>`)
				.click(() => DataUtil.userDownload(`statgen-pointbuy`, this.getSaveableState()))
				.appendTo($wrpBtnsBtm);

			const $btnLoadFile = $(`<button class="btn btn-xs btn-primary" style="margin-right: 14px;">Load from File</button>`)
				.click(() => {
					DataUtil.userUpload((json) => {
						if (StatGen.isValidState(json)) {
							this.doLoadStateFrom(json);
							this.doSaveDebounced();
							this.handleCostChanges();
						} else return alert("Invalid save!");
					});
				}).appendTo($wrpBtnsBtm);

			const $btnSaveUrl = $(`<button class="btn btn-xs btn-primary">Save to URL</button>`)
				.click(() => {
					const encoded = `${window.location.href.split("#")[0]}#pointbuy${HASH_PART_SEP}${encodeURIComponent(JSON.stringify(this.getSaveableState()))}`;
					copyText(encoded);
					showCopiedEffect($btnSaveUrl);
				}).appendTo($wrpBtnsBtm);
		} else renderState();
	}

	initialiseChangeHandlers () {
		$(`.base`).each((i, ele) => {
			const input = $(ele);
			input.on("change", (evt) => {
				const ele = evt.target;
				let num = parseInt(ele.value);

				if (isNaN(num)) ele.value = this.statMin;
				else ele.value = this.limit(num);

				this.changeTotal();
			})
		});

		this.$budget.on("change", () => {
			this.changeBase();
			if (this.isAdvanced) {
				this.budget = Number(this.$budget.val());
				this.doSaveDebounced();
			}
		});
	}

	limit (num) {
		return Math.max(Math.min(num, this.statMax), this.statMin)
	}

	get statMin () {
		if (this.isAdvanced) {
			return Object.keys(this.savedState).map(Number).sort(SortUtil.ascSort)[0];
		} else {
			return StatGen.DEFAULT_MIN;
		}
	}

	get statMax () {
		if (this.isAdvanced) {
			return Object.keys(this.savedState).map(Number).sort(SortUtil.ascSort).reverse()[0];
		} else {
			return StatGen.DEFAULT_MAX;
		}
	}

	getPointBuyCost (n) {
		if (this.isAdvanced) {
			return this.savedState[n];
		} else {
			return StatGen.DEFAULT_COSTS[n];
		}
	}

	chooseRace (ele) {
		if ($("input.choose:checked").length > this.count) return ele.checked = false;

		$(".racial", ele.parentNode.parentNode)
			.val(ele.checked ? this.amount : 0);
		this.changeTotal();
	}

	changeRace (ele) {
		const handleStats = (stats) => {
			$(".racial").val(0);
			Object.keys(stats).forEach(key => $(`#${key} .racial`).val(stats[key]));

			this.changeTotal();
			$(".choose").hide().prop("checked", false);

			if (!stats.choose) return;

			const {from} = stats.choose[0];
			this.amount = stats.choose[0].amount || 1;
			this.count = stats.choose[0].count;

			$("td.choose").text(`Choose ${this.count}`).show();
			from.forEach(key => $(`#${key} .choose`).show())
		};

		const race = ele.value;
		if (race === "_CUSTOM") {
			$(`#custom`).show();
			const custom = $(`.custom`);
			custom.off("input").on("input", () => {
				const stats = {};
				custom.each((i, e) => {
					const val = Number($(e).val());
					stats[$(e).attr("name")] = val || 0;
				});
				handleStats(stats);
			})
		} else {
			$(`#custom`).hide();
			const stats = race === ""
				? {}
				: this.raceData.find(({name, source}) => `${name}_${source}` === race).ability;
			handleStats(stats);
		}
	}

	getCostAndBudget () {
		const budget = Number(this.$budget.val());
		let cost = 0;
		$(".base").each((i, el) => cost += this.getPointBuyCost(this.limit(Number(el.value))));
		return {cost, budget};
	}

	checkBudget (costBudget) {
		if (!costBudget) costBudget = this.getCostAndBudget();
		$(`#remaining`).toggleClass("error-background", costBudget.cost > costBudget.budget);
	}

	changeBase () {
		const constBudget = this.getCostAndBudget();
		$("#remaining").val(constBudget.budget - constBudget.cost);
		this.checkBudget(constBudget);

		this.changeTotal();
	}

	changeTotal () {
		$("#pointbuy tr[id]").each((i, el) => {
			const [base, racial, total, mod] = $("input", el).get();
			const raw = total.value = Number(base.value) + Number(racial.value);
			mod.value = Math.floor((raw - 10) / 2)
		});
	}

	rollStats () {
		const formula = $(`#stats-formula`).val();

		const tree = EntryRenderer.dice._parse2(formula);

		const $rolled = $("#rolled");
		if (!tree) {
			$rolled.find("#rolls").prepend(`<p>Invalid dice formula!</p>`)
		} else {
			const rolls = [];
			for (let i = 0; i < 6; i++) {
				const meta = {};
				meta.__total = tree.evl(meta);
				rolls.push(meta);
			}
			rolls.sort((a, b) => SortUtil.ascSort(b.__total, a.__total));

			$rolled.find("#rolls").prepend(`<p class="stat-roll-line">${rolls.map(r => `<span class="stat-roll-item" title="${r.rawText}">${r.__total}</span>`).join("")}</p>`);
		}
		$rolled.find("#rolls p:eq(15)").remove();
	}

	get isAdvanced () {
		return this.$advanced.prop("checked");
	}
}
StatGen.DEFAULT_COSTS = {
	8: 0,
	9: 1,
	10: 2,
	11: 3,
	12: 4,
	13: 5,
	14: 7,
	15: 9
};
StatGen.DEFAULT_MIN = 8;
StatGen.DEFAULT_MAX = 15;
StatGen.DEFAULT_POINTS = 27;

const statGen = new StatGen();

window.onload = function load () {
	statGen.init();
};

window.onhashchange = function hashchange () {
	let hash = window.location.hash.slice(1);
	$(".statmethod").hide();
	if (hash === "") hash = "rolled";
	$(`#${hash.split(HASH_PART_SEP)[0]}`).show();
	if (statGen.isInit) statGen.doLoadUrlState();
};
