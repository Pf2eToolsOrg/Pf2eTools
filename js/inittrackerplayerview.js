"use strict";

const STORAGE_SHORT_TOKEN = "st";

window.addEventListener("load", () => {
	ExcludeUtil.pInitialise(); // don't await, as this is only used for search

	const view = new InitiativeTrackerPlayer();

	const storedCbShortVal = StorageUtil.syncGetForPage(STORAGE_SHORT_TOKEN);

	const $iptServerToken = $(`#initp__ipt_server_token`);
	const $btnGenClientToken = $(`#initp__btn_gen_client_token`);
	const $iptClientToken = $(`#initp__ipt_client_token`);
	const $cbShortToken = $(`#initp__cb_short`)
		.change(() => StorageUtil.syncSetForPage(STORAGE_SHORT_TOKEN, $cbShortToken.prop("checked")))
		.prop("checked", storedCbShortVal == null ? true : storedCbShortVal);

	$iptServerToken.keydown(evt => {
		$iptServerToken.removeClass("error-background");
		if (evt.which === 13) $btnGenClientToken.click();
	});

	$btnGenClientToken.click(async () => {
		$iptServerToken.removeClass("error-background");
		const serverToken = $iptServerToken.val();

		if (PeerUtil.isValidToken(serverToken)) {
			try {
				$iptServerToken.attr("disabled", true);
				$btnGenClientToken.attr("disabled", true);
				const clientData = await PeerUtil.pInitialiseClient(
					serverToken,
					msg => view.handleMessage(msg),
					function (err) {
						if (!this.isClosed) {
							JqueryUtil.doToast({
								content: `Server error:\n${err ? err.message || err : "(Unknown error)"}`,
								type: "danger"
							});
						}
					},
					{
						shortTokens: $cbShortToken.prop("checked")
					}
				);

				if (!clientData) {
					$iptServerToken.attr("disabled", false);
					$btnGenClientToken.attr("disabled", false);
					JqueryUtil.doToast({
						content: `Failed to create client. Are you sure the token was valid?`,
						type: "warning"
					});
				} else {
					view.clientData = clientData;
					$iptClientToken.val(clientData.textifiedSdp).attr("disabled", false);
				}
			} catch (e) {
				JqueryUtil.doToast({
					content: `Failed to create client! Are you sure the token was valid? (See the log for more details.)`,
					type: "danger"
				});
				setTimeout(() => { throw e; });
			}
		} else {
			$iptServerToken.addClass("error-background");
		}
	});

	$iptClientToken.click(async () => {
		await MiscUtil.pCopyTextToClipboard($iptClientToken.val());
		JqueryUtil.showCopiedEffect($iptClientToken);
	});

	const $body = $(`body`);
	$body.on("keypress", (e) => {
		if (((e.key === "f") && noModifierKeys(e))) {
			if (MiscUtil.isInInput(e)) return;
			e.preventDefault();

			if (view.isActive) $body.toggleClass("is-fullscreen");
		}
	});
});

class InitiativeTrackerPlayer {
	constructor () {
		this._clientData = null;
		this._isUiInit = false;

		this._$head = null;
		this._$rows = null;
	}

	set clientData (clientData) { this._clientData = clientData; }
	get isActive () { return this._isUiInit; }

	initUi () {
		if (this._isUiInit) return;

		this._isUiInit = true;
		$(`.initp__initial`).remove();
		$(`.initp__wrp_active`).show();

		this._$meta = $(`.initp__meta`);
		this._$head = $(`.initp__header`);
		this._$rows = $(`.initp__rows`);
	}

	handleMessage (msg) {
		this.initUi();
		const data = msg.data || {};

		this._$meta.empty();
		this._$head.empty();
		this._$rows.empty();

		if (data.n) {
			this._$meta.append(`
				<div class="flex-v-center mb-3">
					<div class="mr-2">Round: </div>
					<div class="bold">${data.n}</div>
				</div>		
			`);
		}

		this._$head.append(`
			<div class="initp__h_name">Creature/Status</div>
			<div class="initp__h_hp">Health</div>
			${(data.c || []).map(statCol => `<div class="initp_h_stat">${statCol.a || ""}</div>`).join("")}
			<div class="initp__h_score">Score</div>
		`);

		(data.r || []).forEach(rowData => {
			this._$rows.append(InitiativeTrackerPlayer._get$row(rowData));
		});
	}

	static _get$row (rowData) {
		const $conds = $(`<div class="init__wrp_conds"/>`);
		(rowData.c || []).forEach(cond => {
			InitiativeTrackerUtil.get$condition({
				...cond,
				readonly: true,
				width: 24,
				height: 24
			}).appendTo($conds);
		});

		const getHpContent = () => {
			if (rowData.hh != null) {
				const {text, color} = InitiativeTrackerUtil.getWoundMeta(rowData.hh);
				return {hpText: text, hpColor: color}
			} else {
				const woundLevel = InitiativeTrackerUtil.getWoundLevel(100 * Number(rowData.h) / Number(rowData.g));
				return {hpText: `${rowData.h == null ? "?" : rowData.h}/${rowData.g == null ? "?" : rowData.g}`, hpColor: InitiativeTrackerUtil.getWoundMeta(woundLevel).color};
			}
		};
		const {hpText, hpColor} = getHpContent();

		return $(`
			<div class="initp__r${rowData.a ? ` initp__r--active` : ""}">
				<div class="initp__r_name">
					<div>${(rowData.n || "").escapeQuotes()}${rowData.o != null ? ` (${rowData.o})` : ""}</div>
					<div data-r="$conds"/>
				</div>
				<div class="initp__r_hp">
					<div class="initp__r_hp_pill" style="background: ${hpColor};">${hpText}</div>
				</div>
				${(rowData.k || []).map(statVal => `<div class="initp_r_stat">${statVal.v}</div>`).join("")}
				<div class="initp__r_score">${rowData.i}</div>
			</div>
		`).swap({$conds});
	}
}
