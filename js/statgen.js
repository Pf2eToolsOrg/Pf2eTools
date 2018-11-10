"use strict";
const RACE_JSON_URL = "data/races.json";

class StatGen {
	init () {
		this.amount = null;
		this.count = null;
		this.raceData = null;
		this.$advanced = $(`#advanced`);

		ExcludeUtil.initialise();
		this.loadRaceJson();
		this.initialiseChangeHandlers();

		// TODO load saved state here
		this.renderCostsTable();

		this.$advanced.change(() => {
			this.renderCostsTable();
			// TODO update visible/etc
		});
	}

	async loadRaceJson () {
		const data = await DataUtil.loadJSON(RACE_JSON_URL);

		let brew;
		try {
			brew = await BrewUtil.pAddBrewData();
		} catch (e) {
			return BrewUtil.purgeBrew();
		}

		this.raceData = EntryRenderer.race.mergeSubraces(data.race);
		if (brew.race) this.raceData = this.raceData.concat(brew.race);
		this.raceData = this.raceData.filter(it => !ExcludeUtil.isExcluded(it.name, "race", it.source));

		$("#rollbutton").click(() => this.rollStats());

		const isCrypto = RollerUtil.isCrypto();
		const titleStr = isCrypto ? "Numbers will be generated using Crypto.getRandomValues()" : "Numbers will be generated using Math.random()";
		$(`#roller-mode`).html(`Cryptographically strong random generation: <span title="${titleStr}" class="crypto-${isCrypto}">${isCrypto ? `<span class="glyphicon glyphicon-lock"></span> enabled` : `<span class="glyphicon glyphicon-ban-circle"></span> not available`}</span>`);

		$("#reset").click((evt) => {
			$(".base").val(this.statMin);
			$(".choose").prop("checked", false);
			this.changeTotal();
			this.changeBase(evt.target);
		});

		$(".base").on("input", (evt) => this.changeBase(evt.target));
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
		const $table = $(`#costs`);
		$table.empty().append(`
			<thead>
				<tr>
					<th>Score</th><th>Modifier</th><th>Point Cost</th>
				</tr>
			</thead>
		`);
		const $tbody = $(`<tbody/>`).appendTo($table);

		if (this.isAdvanced) {
			// TODO
		} else {
			Object.entries(StatGen.DEFAULT_COSTS).forEach(([k, v]) => {
				$tbody.append(`
					<tr><td>${k}</td><td>${Parser.getAbilityModifier(Number(k))}</td><td>${v}</td></tr>
				`);
			});
		}
	}

	initialiseChangeHandlers () {
		$(`.base`).each((i, ele) => {
			const input = $(ele);
			input.on("change", (evt) => {
				const ele = evt.target;
				let num = parseInt(ele.value);

				if (isNaN(num)) ele.value = this.statMin;
				else ele.value = Math.max(Math.min(num, this.statMax), this.statMin);

				this.changeTotal();
			})
		});
	}

	get statMin () {
		if (this.isAdvanced) {
			// TODO
		} else {
			return StatGen.DEFAULT_MIN;
		}
	}

	get statMax () {
		if (this.isAdvanced) {
			// TODO
		} else {
			return StatGen.DEFAULT_MAX;
		}
	}

	getPointBuyCost (n) {
		if (this.isAdvanced) {
			// TODO
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

	changeBase (ele) {
		const budget = Number($("#budget").val());
		let cost = 0;
		$(".base").each((i, el) => cost += this.getPointBuyCost(Number(el.value)));
		if (cost > budget) return ele.value = ele.dataset.prev;
		ele.dataset.prev = ele.value;
		$("#remaining").val(budget - cost);

		this.changeTotal()
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

const statGen = new StatGen();

window.onload = function load () {
	statGen.init();
};

window.onhashchange = function hashchange () {
	let hash = window.location.hash.slice(1);
	$(".statmethod").hide();
	if (hash === "") hash = "rolled";
	$(`#${hash}`).show();
};
