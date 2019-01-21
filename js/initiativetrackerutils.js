"use strict";
class InitiativeTrackerUtil {
	static getWoundLevel (pctHp) {
		pctHp = Math.round(Math.max(Math.min(pctHp, 100), 0));
		if (pctHp === 100) return 0; // healthy
		if (pctHp > 50) return 1; // injured
		if (pctHp > 0) return 2; // bloody
		if (pctHp === 0) return 3; // defeated
		return -1; // unknown
	}

	static getWoundMeta (woundLevel) { return InitiativeTrackerUtil._WOUND_META[woundLevel] || InitiativeTrackerUtil._WOUND_META[-1]; }

	/**
	 * @param opts Options, which include:
	 *   `name` Condition name.
	 *   `color` Condition color.
	 *   `turns` Condition duration in turns.
	 *   `onStateChange` Function to be called on state change.
	 *   `readonly` If the marker is read-only.
	 *   `width` Width of the marker.
	 *   `height` Height of the marker.
	 * @return {JQuery} A condition marker.
	 */
	static get$condition (opts) {
		const fnOnStateChange = opts.onStateChange;

		const state = {
			name: opts.name,
			color: opts.color,
			turns: opts.turns ? Number(opts.turns) : null
		};

		const tickDown = (fromClick) => {
			if (opts.readonly) return;
			if (fromClick && state.turns == null) doRemove(); // remove permanent conditions
			if (state.turns == null) return fnOnStateChange && fnOnStateChange();
			else state.turns--;
			if (state.turns <= 0) doRemove();
			else doRender(fromClick);
			fnOnStateChange && fnOnStateChange();
		};

		const tickUp = (fromClick) => {
			if (opts.readonly) return;
			if (fromClick && state.turns == null) state.turns = 0; // convert permanent condition
			if (state.turns == null) return fnOnStateChange && fnOnStateChange();
			else state.turns++;
			doRender(fromClick);
			fnOnStateChange && fnOnStateChange();
		};

		const doRemove = () => $cond.tooltip("destroy").remove();

		const doRender = (fromClick) => {
			const turnsText = `${state.turns} turn${state.turns > 1 ? "s" : ""} remaining`;
			const ttpText = state.name && state.turns ? `${state.name.escapeQuotes()} (${turnsText})` : state.name ? state.name.escapeQuotes() : state.turns ? turnsText : "";
			const getBar = () => {
				const styleStack = [
					state.turns == null || state.turns > 3
						? `background-image: linear-gradient(45deg, ${state.color} 41.67%, transparent 41.67%, transparent 50%, ${state.color} 50%, ${state.color} 91.67%, transparent 91.67%, transparent 100%); background-size: 8.49px 8.49px;`
						: `background: ${state.color};`
				];
				if (opts.width) styleStack.push(`width: ${opts.width}px;`);
				return `<div class="init__cond_bar" style="${styleStack.join(" ")}"/>`
			};

			const inner = state.turns
				? [...new Array(Math.min(state.turns, 3))].map(() => getBar()).join("")
				: getBar();

			$cond.attr("title", ttpText);

			$cond.tooltip({trigger: "hover"});
			if (ttpText) {
				// update tooltips
				$cond.tooltip("enable").tooltip("fixTitle");
				if (fromClick) $cond.tooltip("show");
			} else $cond.tooltip("disable");

			$cond.html(inner);
			fnOnStateChange && fnOnStateChange();
		};

		const styleStack = [];
		if (opts.width) styleStack.push(`width: ${opts.width}px;`);
		if (opts.height) styleStack.push(`height: ${opts.height}px;`);
		const $cond = $(`<div class="init__cond" ${styleStack.length ? `style="${styleStack.join(" ")}"` : ""}/>`)
			.data("doTickDown", tickDown)
			.data("getState", () => JSON.parse(JSON.stringify(state)))
			.on("contextmenu", (e) => e.ctrlKey || (e.preventDefault() || tickDown(true)))
			.click(() => tickUp(true));

		if (opts.name) {
			const cond = InitiativeTrackerUtil.CONDITIONS.find(it => it.condName !== null && it.name.toLowerCase() === opts.name.toLowerCase().trim());
			if (cond) {
				$cond.on("mouseover", (evt) => {
					if (evt.shiftKey) {
						evt.shiftKey = false;
						EntryRenderer.hover.mouseOver(
							evt,
							$cond[0],
							UrlUtil.PG_CONDITIONS_DISEASES,
							SRC_PHB,
							UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CONDITIONS_DISEASES]({name: cond.condName || cond.name, source: SRC_PHB})
						);
					}
				})
			}
		}

		doRender();

		return $cond;
	}
}
InitiativeTrackerUtil._WOUND_META = {
	[-1]: {
		text: "Unknown",
		color: "#a5a5a5"
	},
	0: {
		text: "Healthy",
		color: "#00bb20"
	},
	1: {
		text: "Hurt",
		color: "#c5ca00"
	},
	2: {
		text: "Bloodied",
		color: "#f7a100"
	},
	3: {
		text: "Defeated",
		color: "#cc0000"
	}
};
InitiativeTrackerUtil.CONDITIONS = [
	{
		name: "Blinded",
		color: "#434343"
	},
	{
		name: "Charmed",
		color: "#f01789"
	},
	{
		name: "Concentrating",
		color: "#009f7a",
		condName: null
	},
	{
		name: "Deafened",
		color: "#c7d0d3"
	},
	{
		name: "Drunk",
		color: "#ffcc00"
	},
	{
		name: "Exhausted",
		color: "#947a47",
		condName: "Exhaustion"
	},
	{
		name: "Frightened",
		color: "#c9ca18"
	},
	{
		name: "Grappled",
		color: "#8784a0"
	},
	{
		name: "Incapacitated",
		color: "#3165a0"
	},
	{
		name: "Invisible",
		color: "#7ad2d6"
	},
	{
		name: "!!On Fire!!",
		color: "#ff6800",
		condName: null
	},
	{
		name: "Paralyzed",
		color: "#c00900"
	},
	{
		name: "Petrified",
		color: "#a0a0a0"
	},
	{
		name: "Poisoned",
		color: "#4dc200"
	},
	{
		name: "Prone",
		color: "#5e60a0"
	},
	{
		name: "Restrained",
		color: "#d98000"
	},
	{
		name: "Stunned",
		color: "#a23bcb"
	},
	{
		name: "Unconscious",
		color: "#1c2383"
	}
];
