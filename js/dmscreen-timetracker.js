"use strict";

class TimeTracker {
	static $getTracker (board, state) {
		const $wrpPanel = $(`<div class="w-100 h-100 dm-time__root"/>`) // time-tracker class used to identify for saving
			.data("getState", () => tracker.getSaveableState());
		const tracker = new TimeTrackerBase(board);
		tracker.setStateFrom(state);
		tracker.render($wrpPanel);
		return $wrpPanel;
	}
}

class TimeTrackerComponent {
	constructor (board) {
		this._board = board;

		ProxyUtil.decorate(this);

		// state
		this.__state = {...this._getDefaultState()};
		this._state = this._getProxy("state", this.__state);
		this._addHookAll("state", () => this._board.doSaveStateDebounced());
	}

	_addHookBase (prop, hook) {
		this._addHook("state", prop, hook);
	}

	_removeHookBase (prop, hook) {
		this._removeHook("state", prop, hook);
	}

	_getPod () {
		return {
			get: (prop) => this._state[prop],
			set: (prop, val) => this._state[prop] = val,
			assignState: (toAssign) => Object.assign(this._state, toAssign),
			addHook: (prop, hook) => this._addHookBase(prop, hook),
			removeHook: (prop, hook) => this._removeHookBase(prop, hook)
		}
	}

	// to be overridden as required
	_getDefaultState () { return {}; }

	getBaseSaveableState () {
		return {
			state: MiscUtil.copy(this.__state)
		};
	}

	setBaseSaveableStateFrom (toLoad) {
		toLoad.state && Object.assign(this._state, toLoad.state);
	}

	render () { throw new Error("Unimplemented!"); }

	// to be overridden as required
	getSaveableState () { return {...this.getBaseSaveableState()}; }
	setStateFrom (toLoad) { this.setBaseSaveableStateFrom(toLoad); }
}

class TimeTrackerBase extends TimeTrackerComponent {
	constructor (tracker) {
		super(tracker);

		// components
		this._compClock = new TimeTrackerBase_Clock(tracker);
		this._compCalendar = new TimeTrackerBase_Calendar(tracker);
		this._compSettings = new TimeTrackerBase_Settings(tracker);
	}

	getSaveableState () {
		return {
			...this.getBaseSaveableState(),
			compClockState: this._compClock.getSaveableState(),
			compCalendarState: this._compCalendar.getSaveableState(),
			compSettingsState: this._compSettings.getSaveableState()
		};
	}

	setStateFrom (toLoad) {
		this.setBaseSaveableStateFrom(toLoad);
		if (toLoad.compClockState) this._compClock.setStateFrom(toLoad.compClockState);
		if (toLoad.compCalendarState) this._compCalendar.setStateFrom(toLoad.compCalendarState);
		if (toLoad.compSettingsState) this._compSettings.setStateFrom(toLoad.compSettingsState);
	}

	render ($parent) {
		$parent.empty();

		const $wrpClock = $(`<div class="flex-col w-100 h-100 overflow-y-auto">`);
		const $wrpCalendar = $(`<div class="flex-col w-100 h-100 overflow-y-auto flex-h-center">`);
		const $wrpSettings = $(`<div class="flex-col w-100 h-100 overflow-y-auto">`);

		this._compClock.render($wrpClock, this._getPod(), this._getTimeInfo.bind(this), this._getMoonInfos.bind(this), this._doModTime.bind(this));
		this._compCalendar.render($wrpCalendar, this._getPod(), this._getTimeInfo.bind(this), this._getEvents.bind(this), this._getEncounters.bind(this), this._getMoonInfos.bind(this), this._doModTime.bind(this));
		this._compSettings.render($wrpSettings, this._getPod());

		const $btnShowClock = $(`<button class="btn btn-xs btn-default mr-2" title="Clock"><span class="glyphicon glyphicon-time"></span></button>`)
			.click(() => this._state.tab = 0);
		const $btnShowCalendar = $(`<button class="btn btn-xs btn-default mr-3" title="Calendar"><span class="glyphicon glyphicon-calendar"></span></button>`)
			.click(() => this._state.tab = 1);
		const $btnShowSettings = $(`<button class="btn btn-xs btn-default mr-3" title="Settings"><span class="glyphicon glyphicon-cog"></span></button>`)
			.click(() => this._state.tab = 2);
		const hookShowTab = () => {
			$btnShowClock.toggleClass("active", this._state.tab === 0);
			$btnShowCalendar.toggleClass("active", this._state.tab === 1);
			$btnShowSettings.toggleClass("active", this._state.tab === 2);
			$wrpClock.toggleClass("hidden", this._state.tab !== 0);
			$wrpCalendar.toggleClass("hidden", this._state.tab !== 1);
			$wrpSettings.toggleClass("hidden", this._state.tab !== 2);
		};
		this._addHookBase("tab", hookShowTab);
		hookShowTab();

		const $btnReset = $(`<button class="btn btn-xs btn-danger" title="Reset Clock/Calendar Time to First Day"><span class="glyphicon glyphicon-refresh"></span></button>`)
			.click(() => confirm("Are you sure?") && (this._state.time = 0));

		$$`<div class="flex-col h-100">
			<div class="flex p-1 no-shrink">
				${$btnShowClock}${$btnShowCalendar}${$btnShowSettings}${$btnReset}
			</div>
			<hr class="hr-0 mb-2 no-shrink">
			${$wrpClock}
			${$wrpCalendar}
			${$wrpSettings}
		</div>`.appendTo($parent);
	}

	_getTimeInfo (opts) {
		opts = opts || {};
		let numSecs = opts.numSecs != null ? opts.numSecs : Math.round(this._state.time / 1000); // discard millis

		const secsPerMinute = this._state.secondsPerMinute;
		const secsPerHour = secsPerMinute * this._state.minutesPerHour;
		const secsPerDay = secsPerHour * this._state.hoursPerDay;

		const numDays = Math.floor(numSecs / secsPerDay);
		numSecs = numSecs - (numDays * secsPerDay);

		const numHours = Math.floor(numSecs / secsPerHour);
		numSecs = numSecs - (numHours * secsPerHour);

		const numMinutes = Math.floor(numSecs / secsPerMinute);
		numSecs = numSecs - (numMinutes * secsPerMinute);

		const months = Object.values(this._state.months)
			.filter(it => !it.isDeleted)
			.sort((a, b) => SortUtil.ascSort(a.pos, b.pos));

		const days = Object.values(this._state.days)
			.filter(it => !it.isDeleted)
			.sort((a, b) => SortUtil.ascSort(a.pos, b.pos));

		const seasons = Object.values(this._state.seasons)
			.filter(it => !it.isDeleted)
			.sort((a, b) => SortUtil.ascSort(a.startDay, b.startDay));

		const secsPerYear = secsPerDay * months.map(it => it.days).reduce((a, b) => a + b, 0);
		const daysPerWeek = days.length;
		const dayOfWeek = numDays % daysPerWeek;
		const daysPerYear = months.map(it => it.days).reduce((a, b) => a + b, 0);
		const dayOfYear = numDays % daysPerYear;

		const out = {
			// handy stats
			secsPerMinute,
			secsPerHour,
			secsPerDay,
			secsPerYear,
			daysPerWeek,
			daysPerYear,

			// clock
			numSecs,
			numMinutes,
			numHours,
			numDays,

			// calendar
			date: 0, // current day in month, i.e. 0-30 for a 31-day month
			month: 0, // current month in year, i.e. 0-11 for a 12-month year
			year: 0,
			dayOfWeek,
			dayOfYear,
			monthStartDay: 0, // day the current month starts on, i.e. 0-6 for a 7-day week; e.g. if the first day of the current month is a Wednesday, this will be set to 2
			monthInfo: {...months[0]},
			dayInfo: {...days[dayOfWeek]},
			monthStartDayOfYear: 0, // day in the current year that the current month start on, e.g. "31" for the first day of February, or "58" for the first day of March
			seasonInfos: []
		};

		let tmpDays = numDays;
		outer: while (tmpDays > 0) {
			for (let i = 0; i < months.length; ++i) {
				const m = months[i];
				for (let j = 0; j < m.days; ++j, --tmpDays) {
					if (tmpDays === 0) {
						out.date = j;
						out.month = i;
						out.monthInfo = {...m};
						break outer;
					}
				}
				out.monthStartDayOfYear += m.days;
			}
			out.year++;
		}
		out.monthStartDay = (numDays - out.date) % daysPerWeek;

		if (seasons.length) out.seasonInfos = seasons.filter(it => dayOfYear >= it.startDay && dayOfYear <= it.endDay);

		// offsets
		out.year += this._state.offsetYears;
		out.monthStartDay += this._state.offsetMonthStartDay; out.monthStartDay %= daysPerWeek;

		if (opts.dayOfYear != null) {
			const diffSecs = (dayOfYear - opts.dayOfYear) * secsPerDay;
			const now = Math.round(this._state.time / 1000);
			return this._getTimeInfo({numSecs: now - diffSecs});
		} else return out;
	}

	_getEvents (year, dayOfYear) { return this._getEncountersEvents("events", year, dayOfYear); }

	_getEncounters (year, dayOfYear) { return this._getEncountersEvents("encounters", year, dayOfYear); }

	_getEncountersEvents (prop, year, dayOfYear) {
		return Object.values(this._state[prop]).filter(it => !it.isDeleted).filter(it => {
			if (it.when.year != null && it.when.day != null) {
				return it.when.year === year && it.when.day === dayOfYear;
			}

			// TODO consider expanding this in future
			//  - will also require changes to the event creation/management UI
			// else if (it.when.weekday != null) {...}
			// else if (it.when.fortnightDay != null) {...}
			// ... etc
		}).sort((a, b) => SortUtil.ascSort(a.pos, b.pos));
	}

	_getMoonInfos (numDays) {
		const moons = Object.values(this._state.moons)
			.filter(it => !it.isDeleted)
			.sort((a, b) => SortUtil.ascSort(a.phaseOffset, b.phaseOffset) || SortUtil.ascSort(a.name, b.name));

		return moons.map(moon => {
			// this should be never occur
			if (moon.period <= 0) throw new Error(`Invalid moon period "${moon.period}", should be greater than zero!`);

			const offsetNumDays = numDays - moon.phaseOffset;
			let dayOfPeriod = offsetNumDays % moon.period;
			while (dayOfPeriod < 0) dayOfPeriod += moon.period;

			const ixPhase = Math.floor((dayOfPeriod / moon.period) * 8);
			const phaseNameSlug = TimeTrackerBase._MOON_PHASES[ixPhase === 8 ? 0 : ixPhase];
			const phaseFirstDay = (Math.floor(((dayOfPeriod - 1) / moon.period) * 8) === ixPhase - 1); // going back a day would take us to the previous phase

			return {
				color: moon.color,
				name: moon.name,
				period: moon.period,
				phaseName: phaseNameSlug.split("-").map(it => it.uppercaseFirst()).join(" "),
				phaseFirstDay: phaseFirstDay,
				phaseIndex: ixPhase,
				dayOfPeriod
			}
		});
	}

	_doModTime (deltaSecs) {
		const oldTime = this._state.time;
		this._state.time = Math.max(0, oldTime + Math.round(deltaSecs * 1000));
	}

	_getDefaultState () { return {...TimeTrackerBase._DEFAULT_STATE}; }

	static getGenericDay (i) {
		return {
			...TimeTrackerBase._DEFAULT_STATE__DAY,
			id: CryptUtil.uid(),
			name: `${Parser.numberToText(i + 1)}day`.uppercaseFirst(),
			pos: i
		};
	}

	static getGenericMonth (i) {
		return {
			...TimeTrackerBase._DEFAULT_STATE__MONTH,
			id: CryptUtil.uid(),
			name: `${Parser.numberToText(i + 1)}uary`.uppercaseFirst(),
			days: 30,
			pos: i
		};
	}

	static getGenericEvent (pos, year, eventDay) {
		const out = {
			...MiscUtil.copy(TimeTrackerBase._DEFAULT_STATE__EVENT),
			id: CryptUtil.uid(),
			pos
		};
		if (year != null) out.when.year = year;
		if (eventDay != null) out.when.day = eventDay;
		return out;
	}

	static getGenericEncounter (pos, year, encounterDay) {
		const out = {
			...MiscUtil.copy(TimeTrackerBase._DEFAULT_STATE__ENCOUNTER),
			id: CryptUtil.uid(),
			pos
		};
		if (year != null) out.when.year = year;
		if (encounterDay != null) out.when.day = encounterDay;
		return out;
	}

	static getGenericSeason (i) {
		return {
			...TimeTrackerBase._DEFAULT_STATE__SEASON,
			id: CryptUtil.uid(),
			name: `Season ${i + 1}`,
			startDay: i * 90,
			endDay: ((i + 1) * 90) - 1
		};
	}

	static getGenericMoon (i) {
		return {
			...TimeTrackerBase._DEFAULT_STATE__MOON,
			id: CryptUtil.uid(),
			name: `Moon ${i + 1}`
		};
	}

	static formatDateInfo (dayInfo, date, monthInfo, seasonInfos) {
		return `${dayInfo.name || "[Nameless day]"} ${Parser.getOrdinalForm(date + 1)} ${monthInfo.name || "[Nameless month]"}${seasonInfos.length ? ` (${seasonInfos.map(it => it.name || "[Nameless season]").join("/")})` : ""}`;
	}

	static $getCvsMoon (moonInfo) {
		const $canvas = $(`<canvas title="${moonInfo.name.escapeQuotes()}\u2014${moonInfo.phaseName}" class="dm-time__cvs-moon" width="${TimeTrackerBase._MOON_RENDER_RES}" height="${TimeTrackerBase._MOON_RENDER_RES}"/>`);
		const c = $canvas[0];
		const ctx = c.getContext("2d");

		// draw image
		if (!TIME_TRACKER_MOON_SPRITE.hasError) {
			ctx.drawImage(
				TIME_TRACKER_MOON_SPRITE,
				moonInfo.phaseIndex * TimeTrackerBase._MOON_RENDER_RES, // source x
				0, // source y
				TimeTrackerBase._MOON_RENDER_RES, // source w
				TimeTrackerBase._MOON_RENDER_RES, // source h
				0, // dest x
				0, // dest y
				TimeTrackerBase._MOON_RENDER_RES, // dest w
				TimeTrackerBase._MOON_RENDER_RES // dest h
			);
		}

		// overlay color
		ctx.globalCompositeOperation = "multiply";
		ctx.fillStyle = moonInfo.color;
		ctx.rect(0, 0, TimeTrackerBase._MOON_RENDER_RES, TimeTrackerBase._MOON_RENDER_RES);
		ctx.fill();
		ctx.closePath();
		ctx.globalCompositeOperation = "source-over";

		// draw border
		ctx.beginPath();
		ctx.arc(TimeTrackerBase._MOON_RENDER_RES / 2, TimeTrackerBase._MOON_RENDER_RES / 2, TimeTrackerBase._MOON_RENDER_RES / 2, 0, 2 * Math.PI);
		ctx.lineWidth = 6;
		ctx.stroke();
		ctx.closePath();

		return $canvas;
	}
}
TimeTrackerBase._DEFAULT_STATE__DAY = {
	name: "Day",
	isDeleted: false
};
TimeTrackerBase._DEFAULT_STATE__MONTH = {
	name: "Month",
	days: 30,
	isDeleted: false
};
TimeTrackerBase._DEFAULT_STATE__EVENT = {
	name: "Event",
	entries: [],
	when: {
		year: 0,
		day: 0
	},
	isDeleted: false,
	isHidden: false
};
TimeTrackerBase._DEFAULT_STATE__ENCOUNTER = {
	name: "Encounter",
	when: {
		year: 0,
		day: 0
	},
	isDeleted: false,
	countUses: 0
};
TimeTrackerBase._DEFAULT_STATE__SEASON = {
	name: "Season",
	startDay: 0,
	endDay: 0,
	sunriseHour: 6,
	sunsetHour: 22,
	isDeleted: false
};
TimeTrackerBase._DEFAULT_STATE__MOON = {
	name: "Moon",
	color: "#ffffff",
	phaseOffset: 0,
	period: 24,
	isDeleted: false
};
TimeTrackerBase._DEFAULT_STATE = {
	tab: 0,

	time: 0,
	isPaused: false,
	isAutoPaused: false,

	unitsWindSpeed: "mph",

	offsetYears: 0,
	offsetMonthStartDay: 0,

	// clock
	hoursPerDay: 24,
	minutesPerHour: 60,
	secondsPerMinute: 60,

	// game mechanics
	hoursPerLongRest: 8,
	minutesPerShortRest: 60,
	secondsPerRound: 6,

	// calendar
	days: {
		...[...new Array(7)]
			.map((_, i) => TimeTrackerBase.getGenericDay(i))
			.map(it => ({[it.id]: it}))
			.reduce((a, b) => Object.assign(a, b), {})
	},
	months: {
		...[...new Array(12)]
			.map((_, i) => TimeTrackerBase.getGenericMonth(i))
			.map(it => ({[it.id]: it}))
			.reduce((a, b) => Object.assign(a, b), {})
	},
	events: {},
	encounters: {},
	seasons: {
		...[...new Array(4)]
			.map((_, i) => TimeTrackerBase.getGenericSeason(i))
			.map(it => ({[it.id]: it}))
			.reduce((a, b) => Object.assign(a, b), {})
	},
	moons: {
		...[...new Array(1)]
			.map((_, i) => TimeTrackerBase.getGenericMoon(i))
			.map(it => ({[it.id]: it}))
			.reduce((a, b) => Object.assign(a, b), {})
	}
};
TimeTrackerBase._MOON_PHASES = [
	"new-moon",
	"waxing-crescent",
	"first-quarter",
	"waxing-gibbous",
	"full-moon",
	"waning-gibbous",
	"last-quarter",
	"waning-crescent"
];
TimeTrackerBase._MOON_RENDER_RES = 32;
TimeTrackerBase._MIN_TIME = 1;
TimeTrackerBase._MAX_TIME = 9999;

class TimeTrackerBase_Clock extends TimeTrackerComponent {
	constructor (board) {
		super(board);

		this._compWeather = new TimeTrackerBase_Clock_Weather(board);

		this._ivTimer = null;
	}

	getSaveableState () {
		return {
			...this.getBaseSaveableState(),
			compWeatherState: this._compWeather.getSaveableState()
		};
	}

	setStateFrom (toLoad) {
		this.setBaseSaveableStateFrom(toLoad);
		if (toLoad.compWeatherState) this._compWeather.setStateFrom(toLoad.compWeatherState);
	}

	render ($parent, parent, getTimeInfo, getMoonInfos, doModTime) {
		$parent.empty();
		this._parent = parent;

		clearInterval(this._ivTimer);
		let time = Date.now();
		setInterval(() => {
			const timeNext = Date.now();
			const timeDelta = timeNext - time;
			time = timeNext;

			if (this._parent.get("isPaused") || this._parent.get("isAutoPaused")) return;

			this._parent.set("time", this._parent.get("time") + timeDelta);
		}, 1000);

		const $dispDayReadableDate = $(`<div class="small-caps mb-2"/>`);
		const $wrpMoons = $(`<div class="flex flex-wrap w-100 no-shrink flex-vh-center mb-3"/>`);

		const $wrpDayNight = $(`<div class="flex w-100 no-shrink flex-h-center flex-v-baseline mt-2"/>`);

		const getSecsToNextDay = (timeInfo) => {
			const {
				secsPerMinute,
				secsPerHour,
				secsPerDay,
				numSecs,
				numMinutes,
				numHours
			} = timeInfo;

			return secsPerDay - (
				numHours * secsPerHour
				+ numMinutes * secsPerMinute
				+ numSecs
			);
		};

		const $btnNextSunrise = $(`<button class="btn btn-xs btn-default mr-2" title="Skip time to the next sunrise. Skips to later today if it is currently night time, or to tomorrow otherwise.">Next Sunrise</button>`)
			.click(() => {
				const timeInfo = getTimeInfo();
				const {
					seasonInfos,
					numHours,
					numMinutes,
					numSecs,
					secsPerHour,
					secsPerMinute
				} = timeInfo;

				const sunriseHour = seasonInfos[0].sunriseHour;
				if (sunriseHour > this._parent.get("hoursPerDay")) {
					return JqueryUtil.doToast({content: "Could not skip to next sunrise\u2014sunrise time is greater than the number of hours in a day!", type: "warning"});
				}

				if (numHours < sunriseHour) {
					// skip to sunrise later today
					const targetSecs = sunriseHour * secsPerHour;
					const currentSecs = (secsPerHour * numHours) + (secsPerMinute * numMinutes) + numSecs;
					const toAdvance = targetSecs - currentSecs;
					doModTime(toAdvance);
				} else {
					// skip to sunrise the next day
					const toNextDay = getSecsToNextDay(timeInfo);
					const toAdvance = toNextDay + (secsPerHour * sunriseHour);
					doModTime(toAdvance);
				}
			});

		const $btnNextDay = $(`<button class="btn btn-xs btn-default" title="Skip time to next midnight.">Next Day</button>`)
			.click(() => doModTime(getSecsToNextDay(getTimeInfo())));

		const $getIpt = (propMax, timeProp, multProp) => {
			const $ipt = $(`<input class="form-control form-control--minimal text-center dm-time__ipt-time code mb-2 mx-1">`)
				.change(() => {
					const timeInfo = getTimeInfo();
					const multiplier = (multProp ? timeInfo[multProp] : 1);
					const curSecs = timeInfo[timeProp] * multiplier;

					const nxtRaw = Number($ipt.val().trim().replace(/^0+/g, ""));
					const nxtSecs = (isNaN(nxtRaw) ? 0 : nxtRaw) * multiplier;

					doModTime(nxtSecs - curSecs);
				})
				.focus(() => this._parent.set("isAutoPaused", true))
				.blur(() => this._parent.set("isAutoPaused", false));
			const hookDisplay = () => {
				const maxDigits = `${this._parent.get(propMax)}`.length;
				$ipt.css("width", 20 * maxDigits);
			};
			this._parent.addHook(propMax, hookDisplay);
			hookDisplay();
			return $ipt;
		};

		const doUpdate$Ipt = ($ipt, propMax, num) => {
			if ($ipt.is(":focus")) return; // freeze selected inputs
			const maxDigits = `${this._parent.get(propMax)}`.length;
			$ipt.val(`${num}`.padStart(maxDigits, "0"));
		};

		const $iptHours = $getIpt("hoursPerDay", "numHours", "secsPerHour");
		const $iptMinutes = $getIpt("minutesPerHour", "numMinutes", "secsPerMinute");
		const $iptSeconds = $getIpt("secondsPerMinute", "numSecs");

		const $wrpDays = $(`<div class="small-caps text-center mb-1"/>`);
		const $wrpHours = $$`<div class="flex flex-vh-center">${$iptHours}</div>`;
		const $wrpMinutes = $$`<div class="flex flex-vh-center">${$iptMinutes}</div>`;
		const $wrpSeconds = $$`<div class="flex flex-vh-center">${$iptSeconds}</div>`;

		// cache rendering
		let lastMoonInfo = null;
		let lastDayNightHtml = null;
		const hookClock = () => {
			const {
				numDays,
				numHours,
				numMinutes,
				numSecs,
				dayInfo,
				date,
				monthInfo,
				seasonInfos
			} = getTimeInfo();

			const todayMoonInfos = getMoonInfos(numDays);
			if (!CollectionUtil.deepEquals(lastMoonInfo, todayMoonInfos)) {
				lastMoonInfo = todayMoonInfos;
				$wrpMoons.empty();
				if (!todayMoonInfos.length) {
					$wrpMoons.hide();
				} else {
					$wrpMoons.show();
					todayMoonInfos.forEach(moon => {
						$$`<div class="flex-v-center mr-2 ui-tip__parent">
						${TimeTrackerBase.$getCvsMoon(moon).addClass("mr-2").addClass("dm-time__clock-moon-phase").attr("title", null)} 
						<div class="flex-col ui-tip__child">
							<div class="flex">${moon.name}</div>
							<div class="flex small"><i class="mr-1 no-wrap">${moon.phaseName}</i><span class="text-muted no-wrap">(Day ${moon.dayOfPeriod + 1}/${moon.period})</span></div>				
						</div>
					</div>`.appendTo($wrpMoons);
					});
				}
			}

			$dispDayReadableDate.text(TimeTrackerBase.formatDateInfo(dayInfo, date, monthInfo, seasonInfos));
			$wrpDays.text(`Day ${numDays + 1}`);

			doUpdate$Ipt($iptHours, "hoursPerDay", numHours);
			doUpdate$Ipt($iptMinutes, "minutesPerHour", numMinutes);
			doUpdate$Ipt($iptSeconds, "secondsPerMinute", numSecs);

			if (seasonInfos.length) {
				$wrpDayNight.removeClass("hidden");
				const dayNightHtml = seasonInfos.map(it => {
					const isDay = numHours >= it.sunriseHour && numHours < it.sunsetHour;
					const hoursToDayNight = isDay ? it.sunsetHour - numHours
						: numHours < it.sunriseHour ? it.sunriseHour - numHours : (this._parent.get("hoursPerDay") + it.sunriseHour) - numHours;
					return `<b class="mr-2">${isDay ? "Day" : "Night"}</b> <span class="small text-muted">(${hoursToDayNight === 1 ? `Less than 1 hour` : `More than ${hoursToDayNight - 1} hour${hoursToDayNight === 2 ? "" : "s"}`} to sun${isDay ? "set" : "rise"})</span>`;
				}).join("/");

				if (dayNightHtml !== lastDayNightHtml) {
					$wrpDayNight.html(dayNightHtml);
					lastDayNightHtml = dayNightHtml
				}

				$btnNextSunrise.removeClass("hidden");
			} else {
				$wrpDayNight.addClass("hidden");
				$btnNextSunrise.addClass("hidden");
			}
		};
		this._parent.addHook("time", hookClock);
		// clock settings
		this._parent.addHook("offsetYears", hookClock);
		this._parent.addHook("offsetMonthStartDay", hookClock);
		this._parent.addHook("hoursPerDay", hookClock);
		this._parent.addHook("minutesPerHour", hookClock);
		this._parent.addHook("secondsPerMinute", hookClock);
		// calendar periods
		this._parent.addHook("days", hookClock);
		this._parent.addHook("months", hookClock);
		this._parent.addHook("seasons", hookClock);
		this._parent.addHook("moons", hookClock);
		hookClock();

		const $btnSubDay = $(`<button class="btn btn-xxs btn-default dm-time__btn-day"  title="Subtract Day (SHIFT for 5)">-</button>`)
			.click(evt => doModTime(-1 * this._parent.get("hoursPerDay") * this._parent.get("minutesPerHour") * this._parent.get("secondsPerMinute") * (evt.shiftKey ? 5 : 1)));
		const $btnAddDay = $(`<button class="btn btn-xxs btn-default dm-time__btn-day" title="Add Day (SHIFT for 5)">+</button>`)
			.click(evt => doModTime(this._parent.get("hoursPerDay") * this._parent.get("minutesPerHour") * this._parent.get("secondsPerMinute") * (evt.shiftKey ? 5 : 1)));

		const $btnAddHour = $(`<button class="btn btn-xs btn-default dm-time__btn-time mb-2" title="Add Hour (SHIFT for 5)">+</button>`)
			.click(evt => doModTime(this._parent.get("minutesPerHour") * this._parent.get("secondsPerMinute") * (evt.shiftKey ? 5 : 1)));
		const $btnSubHour = $(`<button class="btn btn-xs btn-default dm-time__btn-time" title="Subtract Hour (SHIFT for 5)">-</button>`)
			.click(evt => doModTime(-1 * this._parent.get("minutesPerHour") * this._parent.get("secondsPerMinute") * (evt.shiftKey ? 5 : 1)));

		const $btnAddMinute = $(`<button class="btn btn-xs btn-default dm-time__btn-time mb-2" title="Add Minute (SHIFT for 5)">+</button>`)
			.click(evt => doModTime(this._parent.get("secondsPerMinute") * (evt.shiftKey ? 5 : 1)));
		const $btnSubMinute = $(`<button class="btn btn-xs btn-default dm-time__btn-time" title="Subtract Minute (SHIFT for 5)">-</button>`)
			.click(evt => doModTime(-1 * this._parent.get("secondsPerMinute") * (evt.shiftKey ? 5 : 1)));

		const $btnAddSecond = $(`<button class="btn btn-xs btn-default dm-time__btn-time mb-2" title="Add Second (SHIFT for 5)">+</button>`)
			.click(evt => doModTime((evt.shiftKey ? 5 : 1)));
		const $btnSubSecond = $(`<button class="btn btn-xs btn-default dm-time__btn-time" title="Subtract Second (SHIFT for 5)">-</button>`)
			.click(evt => doModTime(-1 * (evt.shiftKey ? 5 : 1)));

		const $btnIsPaused = $(`<button class="btn btn-default"><span class="glyphicon glyphicon-pause"></span></button>`)
			.click(() => this._parent.set("isPaused", !this._parent.get("isPaused")));
		const hookPaused = () => $btnIsPaused.toggleClass("active", this._parent.get("isPaused") || this._parent.get("isAutoPaused"));
		this._parent.addHook("isPaused", hookPaused);
		this._parent.addHook("isAutoPaused", hookPaused);
		hookPaused();

		const $btnAddLongRest = $(`<button class="btn btn-xs btn-default mr-2" title="Add Long Rest (SHIFT for Subtract)">Long Rest</button>`)
			.click(evt => doModTime((evt.shiftKey ? -1 : 1) * this._parent.get("hoursPerLongRest") * this._parent.get("minutesPerHour") * this._parent.get("secondsPerMinute")));
		const $btnAddShortRest = $(`<button class="btn btn-xs btn-default mr-2" title="Add Short Rest (SHIFT for Subtract)">Short Rest</button>`)
			.click(evt => doModTime((evt.shiftKey ? -1 : 1) * this._parent.get("minutesPerShortRest") * this._parent.get("secondsPerMinute")));
		const $btnAddTurn = $(`<button class="btn btn-xs btn-default" title="Add Round (6 seconds) (SHIFT for Subtract)">Add Round</button>`)
			.click(evt => doModTime((evt.shiftKey ? -1 : 1) * this._parent.get("secondsPerRound")));

		const $wrpWeather = $(`<div class="flex dm-time__wrp-weather">`);
		this._compWeather.render($wrpWeather, this._parent, getTimeInfo);

		$$`<div class="flex h-100">
			<div class="flex-col flex-vh-center w-100">
				${$dispDayReadableDate}
				${$wrpMoons}
				<div class="flex flex-v-center relative">
					<div class="flex-col">
						<div class="flex-vh-center">${$btnAddHour}</div>
						${$wrpHours}
						<div class="flex-vh-center">${$btnSubHour}</div>
					</div>
					<div class="dm-time__sep-time">:</div>
					<div class="flex-col">
						<div class="flex-vh-center">${$btnAddMinute}</div>
						${$wrpMinutes}
						<div class="flex-vh-center">${$btnSubMinute}</div>
					</div>
					<div class="dm-time__sep-time">:</div>
					<div class="flex-col">
						<div class="flex-vh-center">${$btnAddSecond}</div>
						${$wrpSeconds}
						<div class="flex-vh-center">${$btnSubSecond}</div>
					</div>
					<div class="flex-col ml-2">${$btnIsPaused}</div>
				</div>
				${$wrpDayNight}
				<hr class="hr-3">
				<div class="flex-col">
					<div class="flex mb-2">
						${$btnAddLongRest}${$btnAddShortRest}${$btnAddTurn}
					</div>
					<div class="flex">
						${$btnNextSunrise}
						${$btnNextDay}
					</div>
				</div>
			</div>
			
			<div class="dm-time__bar-clock"></div>
			
			<div class="flex-col no-shrink pr-1 flex-h-center">
				${$wrpDays}
				<div class="small flex-vh-center btn-group">
					${$btnSubDay}${$btnAddDay}
				</div>
				<hr class="hr-2">
				${$wrpWeather}
			</div>
		</div>`.appendTo($parent);
	}
}

class TimeTrackerBase_Clock_Weather extends TimeTrackerComponent {
	render ($parent, parent, getTimeInfo) {
		$parent.empty();
		this._parent = parent;

		const $btnTemperature = $(`<button class="btn btn-default btn-sm dm-time__btn-weather"/>`)
			.click(async () => {
				let ixCur = TimeTrackerBase_Clock_Weather._TEMPERATURES.indexOf(this._state.temperature);
				if (!~ixCur) ixCur = 2;

				const ix = await InputUiUtil.pGetUserIcon({
					values: TimeTrackerBase_Clock_Weather._TEMPERATURES.map((it, i) => {
						const meta = TimeTrackerBase_Clock_Weather._TEMPERATURE_META[i];
						return {
							name: it.uppercaseFirst(),
							buttonClass: meta.class,
							iconClass: `fal ${meta.icon}`
						}
					}),
					title: "Temperature",
					default: ixCur
				});

				if (ix != null) this._state.temperature = TimeTrackerBase_Clock_Weather._TEMPERATURES[ix];
			});
		const hookTemperature = () => {
			TimeTrackerBase_Clock_Weather._TEMPERATURE_META.forEach(it => $btnTemperature.removeClass(it.class));
			let ix = TimeTrackerBase_Clock_Weather._TEMPERATURES.indexOf(this._state.temperature);
			if (!~ix) ix = 0;
			const meta = TimeTrackerBase_Clock_Weather._TEMPERATURE_META[ix];
			$btnTemperature.addClass(meta.class);
			$btnTemperature.attr("title", this._state.temperature.uppercaseFirst()).html(`<div class="fal ${meta.icon}"/>`);
		};
		this._addHookBase("temperature", hookTemperature);
		hookTemperature();

		const revSlugtoText = it => it.split("-").reverse().map(s => s.split("|").join("- ")).join(" ").toTitleCase();

		const $btnPrecipitation = $(`<button class="btn btn-default btn-sm dm-time__btn-weather"/>`)
			.click(async () => {
				const {
					numHours,
					seasonInfos
				} = getTimeInfo();
				const useNightIcon = seasonInfos.length && !(numHours >= seasonInfos[0].sunriseHour && numHours < seasonInfos[0].sunsetHour);

				let ixCur = TimeTrackerBase_Clock_Weather._PRECIPICATION.indexOf(this._state.precipitation);
				if (!~ixCur) ixCur = 0;

				const ix = await InputUiUtil.pGetUserIcon({
					values: TimeTrackerBase_Clock_Weather._PRECIPICATION.map((it, i) => {
						const meta = TimeTrackerBase_Clock_Weather._PRECIPICATION_META[i];
						return {
							name: revSlugtoText(it),
							iconClass: `fal ${useNightIcon && meta.iconNight ? meta.iconNight : meta.icon}`,
							buttonClass: `btn-default`
						}
					}),
					title: "Weather",
					default: ixCur
				});

				if (ix != null) this._state.precipitation = TimeTrackerBase_Clock_Weather._PRECIPICATION[ix];
			});
		let lastPrecipitationTimeInfo = null;
		const hookPrecipitation = (prop) => {
			const {
				numHours,
				seasonInfos
			} = getTimeInfo();

			const precipitationTimeInfo = {numHours, seasonInfos};

			if (prop === "time" && CollectionUtil.deepEquals(lastPrecipitationTimeInfo, precipitationTimeInfo)) return;
			lastPrecipitationTimeInfo = precipitationTimeInfo;
			const useNightIcon = seasonInfos.length && !(numHours >= seasonInfos[0].sunriseHour && numHours < seasonInfos[0].sunsetHour);

			let ix = TimeTrackerBase_Clock_Weather._PRECIPICATION.indexOf(this._state.precipitation);
			if (!~ix) ix = 0;
			const meta = TimeTrackerBase_Clock_Weather._PRECIPICATION_META[ix];
			$btnPrecipitation.attr("title", revSlugtoText(this._state.precipitation)).html(`<div class="fal ${useNightIcon && meta.iconNight ? meta.iconNight : meta.icon}"/>`)
		};
		this._addHookBase("precipitation", hookPrecipitation);
		this._parent.addHook("time", hookPrecipitation);
		hookPrecipitation();

		const $btnWindDirection = $(`<button class="btn btn-default btn-sm dm-time__btn-weather"/>`)
			.click(async () => {
				const bearing = await InputUiUtil.pGetUserDirection({
					title: "Wind Bearing (Direction)",
					default: this._state.windDirection,
					stepButtons: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
				});
				if (bearing != null) this._state.windDirection = bearing;
			});
		const hookWindDirection = () => {
			let ixCur = TimeTrackerBase_Clock_Weather._WIND_SPEEDS.indexOf(this._state.windSpeed);
			if (!~ixCur) ixCur = 0;

			if (ixCur) {
				const speedClass = ixCur >= 5 ? "fas" : ixCur >= 3 ? "far" : "fal";
				$btnWindDirection.html(`<div class="${speedClass} fa-arrow-up" style="transform: rotate(${this._state.windDirection}deg);"/>`);
			} else $btnWindDirection.html(`<div class="fal fa-ellipsis-h"/>`);
		};
		this._addHookBase("windDirection", hookWindDirection);
		this._addHookBase("windSpeed", hookWindDirection);
		hookWindDirection();

		const $btnWindSpeed = $(`<button class="btn btn-default btn-xs"/>`)
			.click(async () => {
				let ixCur = TimeTrackerBase_Clock_Weather._WIND_SPEEDS.indexOf(this._state.windSpeed);
				if (!~ixCur) ixCur = 0;

				const ix = await InputUiUtil.pGetUserIcon({
					values: TimeTrackerBase_Clock_Weather._WIND_SPEEDS.map((it, i) => {
						const meta = TimeTrackerBase_Clock_Weather._WIND_SPEEDS_META[i];
						return {
							name: revSlugtoText(it),
							buttonClass: `btn-default`,
							iconContent: `<div class="mb-1 whitespace-normal dm-time__wind-speed">${this._parent.get("unitsWindSpeed") === "mph" ? `${meta.mph} mph` : `${meta.kmph} km/h`}</div>`
						}
					}),
					title: "Wind Speed",
					default: ixCur
				});

				if (ix != null) this._state.windSpeed = TimeTrackerBase_Clock_Weather._WIND_SPEEDS[ix];
			});
		const hookWindSpeed = () => {
			let ix = TimeTrackerBase_Clock_Weather._WIND_SPEEDS.indexOf(this._state.windSpeed);
			if (!~ix) ix = 0;
			const meta = TimeTrackerBase_Clock_Weather._WIND_SPEEDS_META[ix];
			$btnWindSpeed.text(revSlugtoText(this._state.windSpeed)).attr("title", this._parent.get("unitsWindSpeed") === "mph" ? `${meta.mph} mph` : `${meta.kmph} km/h`);
		};
		this._addHookBase("windSpeed", hookWindSpeed);
		this._parent.addHook("unitsWindSpeed", hookWindSpeed);
		hookWindSpeed();

		const $hovEnvEffects = $(`<div><span class="glyphicon glyphicon-info-sign"/></div>`);
		const $wrpEnvEffects = $$`<div class="mt-2">${$hovEnvEffects}</div>`;
		const hookEnvEffects = () => {
			$hovEnvEffects.off("mouseover");
			const hashes = [];
			const fnGetHash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_TRAPS_HAZARDS];
			if (this._state.temperature === TimeTrackerBase_Clock_Weather._TEMPERATURES[0]) {
				hashes.push(fnGetHash(({name: "Extreme Cold", source: SRC_DMG})));
			}

			if (this._state.temperature === TimeTrackerBase_Clock_Weather._TEMPERATURES.last()) {
				hashes.push(fnGetHash(({name: "Extreme Heat", source: SRC_DMG})));
			}

			if (["rain-heavy", "thunderstorm", "snow"].includes(this._state.precipitation)) {
				hashes.push(fnGetHash(({name: "Heavy Precipitation", source: SRC_DMG})));
			}

			if (TimeTrackerBase_Clock_Weather._WIND_SPEEDS.indexOf(this._state.windSpeed) >= 3) {
				hashes.push(fnGetHash(({name: "Strong Wind", source: SRC_DMG})));
			}

			$hovEnvEffects.show();
			if (hashes.length === 1) {
				$hovEnvEffects.mouseover(evt => Renderer.hover.mouseOver(evt, $hovEnvEffects[0], UrlUtil.PG_TRAPS_HAZARDS, SRC_DMG, hashes[0], false, null));
			} else if (hashes.length) {
				$hovEnvEffects.mouseover(async evt => {
					// load the first on its own, to avoid racing to fill the cache
					const first = await Renderer.hover.pCacheAndGet(UrlUtil.PG_TRAPS_HAZARDS, SRC_DMG, hashes[0]);
					const others = await Promise.all(hashes.slice(1).map(hash => Renderer.hover.pCacheAndGet(UrlUtil.PG_TRAPS_HAZARDS, SRC_DMG, hash)));
					const allEntries = [first, ...others].map(it => ({type: "dataTrapHazard", dataTrapHazard: MiscUtil.copy(it)}));
					const toShow = {
						type: "entries",
						entries: allEntries,
						data: {hoverTitle: `Weather Effects`}
					};
					Renderer.hover.doHover(evt, $hovEnvEffects[0], toShow)
				});
			} else $hovEnvEffects.hide();
		};
		this._addHookBase("temperature", hookEnvEffects);
		this._addHookBase("precipitation", hookEnvEffects);
		this._addHookBase("windSpeed", hookEnvEffects);
		hookEnvEffects();

		$$`<div class="flex-col w-100 flex-vh-center">
			<div class="mb-2">${$btnTemperature}</div>
			<div class="mb-3">${$btnPrecipitation}</div>
			<div class="flex-col flex-vh-center">
				<div class="small small-caps">Wind</div>
				<div class="mb-2">${$btnWindDirection}</div> 
				<div>${$btnWindSpeed}</div>
				${$wrpEnvEffects} 
			</div>
		</div>`.appendTo($parent);
	}

	_getDefaultState () { return {...TimeTrackerBase_Clock_Weather._DEFAULT_STATE}; }
}
TimeTrackerBase_Clock_Weather._TEMPERATURES = [
	"freezing",
	"cold",
	"mild",
	"hot",
	"scorching"
];
TimeTrackerBase_Clock_Weather._PRECIPICATION = [
	"sunny",
	"cloudy",
	"foggy",
	"rain-light",
	"rain-heavy",
	"thunderstorm",
	"hail",
	"snow"
];
TimeTrackerBase_Clock_Weather._WIND_SPEEDS = [
	"calm",
	"breeze-light",
	"breeze-moderate",
	"breeze-strong",
	"gale-near",
	"gale",
	"gale-severe",
	"storm",
	"hurricane"
];
TimeTrackerBase_Clock_Weather._DEFAULT_STATE = {
	temperature: TimeTrackerBase_Clock_Weather._TEMPERATURES[2],
	precipitation: TimeTrackerBase_Clock_Weather._PRECIPICATION[0],
	windDirection: 0,
	windSpeed: TimeTrackerBase_Clock_Weather._WIND_SPEEDS[0]
};
TimeTrackerBase_Clock_Weather._TEMPERATURE_META = [
	{icon: "fa-temperature-frigid", class: "btn-primary"},
	{icon: "fa-thermometer-quarter", class: "btn-info"},
	{icon: "fa-thermometer-half", class: "btn-default"},
	{icon: "fa-thermometer-three-quarters", class: "btn-warning"},
	{icon: "fa-temperature-hot", class: "btn-danger"}
];
TimeTrackerBase_Clock_Weather._PRECIPICATION_META = [
	{icon: "fa-sun", iconNight: "fa-moon"},
	{icon: "fa-clouds-sun", iconNight: "fa-clouds-moon"},
	{icon: "fa-fog"},
	{icon: "fa-cloud-drizzle"},
	{icon: "fa-cloud-showers-heavy"},
	{icon: "fa-thunderstorm"},
	{icon: "fa-cloud-hail"},
	{icon: "fa-cloud-snow"}
];
TimeTrackerBase_Clock_Weather._WIND_SPEEDS_META = [ // (Beaufort scale equivalent)
	{mph: "<1", kmph: "<2"}, // 0-2
	{mph: "1-7", kmph: "2-11"}, // 1-2
	{mph: "8-18", kmph: "12-28"}, // 3-4
	{mph: "19-31", kmph: "29-49"}, // 5-6
	{mph: "32-38", kmph: "50-61"}, // 7
	{mph: "39-46", kmph: "62-74"}, // 8
	{mph: "47-54", kmph: "75-88"}, // 9
	{mph: "55-72", kmph: "89-117"}, // 10-11
	{mph: "≥73", kmph: "≥118"} // 12
];

class TimeTrackerBase_Calendar extends TimeTrackerComponent {
	constructor (tracker) {
		super(tracker);

		// temp components
		this._tmpComps = [];
	}

	render ($parent, parent, getTimeInfo, getEvents, getEncounters, getMoonInfos, doModTime) {
		$parent.empty();
		this._parent = parent;

		// cache info to avoid re-rendering the calendar every second
		let lastRenderMeta = null;

		const $btnSubDay = $(`<button class="btn btn-xxs btn-default dm-time__btn-day"  title="Subtract Day (SHIFT for 5)">-</button>`)
			.click(evt => doModTime(-1 * getTimeInfo().secsPerDay * (evt.shiftKey ? 5 : 1)));
		const $btnAddDay = $(`<button class="btn btn-xxs btn-default dm-time__btn-day" title="Add Day (SHIFT for 5)">+</button>`)
			.click(evt => doModTime(getTimeInfo().secsPerDay * (evt.shiftKey ? 5 : 1)));

		const $btnSubYear = $(`<button class="btn btn-xxs btn-default dm-time__btn-day"  title="Subtract Year (SHIFT for 5)">-</button>`)
			.click(evt => doModTime(-1 * getTimeInfo().secsPerYear * (evt.shiftKey ? 5 : 1)));
		const $btnAddYear = $(`<button class="btn btn-xxs btn-default dm-time__btn-day" title="Add Year (SHIFT for 5)">+</button>`)
			.click(evt => doModTime(getTimeInfo().secsPerYear * (evt.shiftKey ? 5 : 1)));

		const $dispDayReadableDate = $(`<div class="small-caps mb-2"/>`);
		const $dispYear = $(`<div class="small-caps mb-2"/>`);
		const $wrpCalendar = $(`<div class="overflow-y-auto smooth-scroll"/>`);

		const hookCalendar = (prop) => {
			const {
				date,
				month,
				year,
				monthInfo,
				monthStartDay,
				daysPerWeek,
				dayInfo,
				dayOfYear,
				monthStartDayOfYear,
				seasonInfos,
				numDays
			} = getTimeInfo();

			const renderMeta = {
				date,
				month,
				year,
				monthInfo,
				monthStartDay,
				daysPerWeek,
				dayInfo,
				dayOfYear,
				monthStartDayOfYear,
				seasonInfos,
				numDays
			};
			if (prop === "time" && CollectionUtil.deepEquals(lastRenderMeta, renderMeta)) return;
			lastRenderMeta = renderMeta;

			$dispDayReadableDate.text(TimeTrackerBase.formatDateInfo(dayInfo, date, monthInfo, seasonInfos));
			$dispYear.text(`Year ${year + 1}`);

			$wrpCalendar.empty().css({
				display: "grid",
				"grid-template-columns": "auto-fit"
			});
			const daysInMonth = monthInfo.days;
			const loopBound = daysInMonth + (daysPerWeek - 1 - monthStartDay);
			for (let i = (-monthStartDay); i < loopBound; ++i) {
				let $ele;
				if (i < 0 || i >= daysInMonth) {
					$ele = $(`<div class="m-1"/>`);
				} else {
					const eventDay = monthStartDayOfYear + i;
					const moonDay = numDays - (date - i);

					const moonInfos = getMoonInfos(moonDay);
					const events = getEvents(year, eventDay);
					const encounters = getEncounters(year, eventDay);

					const activeMoons = moonInfos.filter(it => it.phaseFirstDay);
					let moonPart;
					if (activeMoons.length) {
						const $renderedMoons = activeMoons.map((m, i) => {
							if (i === 0 || activeMoons.length < 3) {
								return TimeTrackerBase.$getCvsMoon(m).addClass("dm-time__calendar-moon-phase");
							} else if (i === 1) {
								const otherMoons = activeMoons.length - 1;
								return `<div class="dm-time__calendar-moon-phase text-muted" title="${otherMoons} additional moon${otherMoons === 1 ? "" : "s"} not shown"><span class="glyphicon glyphicon-plus"/></div>`
							}
						});

						moonPart = $$`<div class="dm-time__disp-day-moon flex-col">${$renderedMoons}</div>`;
					} else moonPart = "";

					$ele = $$`<div class="dm-time__disp-calendar-day btn-xxs m-1 relative ${i === date ? "dm-time__disp-calendar-day--active" : ""}">
						${i + 1}
						${events.length ? `<div class="dm-time__disp-day-entry dm-time__disp-day-entry--event" title="Has Events">*</div>` : ""}
						${encounters.length ? `<div class="dm-time__disp-day-entry dm-time__disp-day-entry--encounter" title="Has Encounters">*</div>` : ""} 
						${moonPart}
					</div>`.click(() => this._render_openDayModal(eventDay, moonDay, getTimeInfo, getEvents, getEncounters, getMoonInfos));
				}
				const xPos = Math.floor((i + monthStartDay) % daysPerWeek);
				const yPos = Math.floor((i + monthStartDay) / daysPerWeek);
				$ele.css({
					"grid-column-start": `${xPos + 1}`,
					"grid-column-end": `${xPos + 2}`,
					"grid-row-start": `${yPos + 1}`,
					"grid-row-end": `${yPos + 2}`
				});
				$wrpCalendar.append($ele);
			}
		};
		this._parent.addHook("time", hookCalendar);
		this._parent.addHook("months", hookCalendar);
		this._parent.addHook("events", hookCalendar);
		this._parent.addHook("moons", hookCalendar);
		hookCalendar();

		$$`<div class="flex-col h-100">
			<div class="w-100 split px-2 no-shrink">
				<div class="flex-col">
					${$dispDayReadableDate} 
					<div class="flex btn-group">
						${$btnSubDay}
						${$btnAddDay} 
					</div>
				</div> 
				<div class="flex-col">
					${$dispYear} 
					<div class="flex-h-right btn-group">
						${$btnSubYear} 
						${$btnAddYear} 
					</div>
				</div>
			</div>
			<hr class="hr-2 no-shrink">
			${$wrpCalendar}
		</div>`.appendTo($parent);
	}

	_render_openDayModal (eventDay, moonDay, getTimeInfo, getEvents, getEncounters, getMoonInfos) {
		const $btnAddEvent = $(`<button class="btn btn-xs btn-primary"><span class="glyphicon glyphicon-plus"/> Add Event</button>`)
			.click(() => {
				const nxtPos = Object.keys(this._parent.get("events")).length;
				const nuEvent = TimeTrackerBase.getGenericEvent(nxtPos, year, eventDay);
				this._eventToEdit = nuEvent.id;
				this._parent.set("events", {...this._parent.get("events"), [nuEvent.id]: nuEvent});
			});

		const {year, dayInfo, date, monthInfo, seasonInfos} = getTimeInfo({dayOfYear: eventDay});

		const ctxEncounterId = ContextUtil.getNextGenericMenuId();
		ContextUtil.doInitContextMenu(
			ctxEncounterId,
			async (evt, ele, $invokedOn, $selectedMenu) => {
				const nxtPos = Object.keys(this._parent.get("encounters")).length;
				const nuEncounter = TimeTrackerBase.getGenericEncounter(nxtPos, year, eventDay);

				switch (Number($selectedMenu.data("ctx-id"))) {
					case 0: {
						const savedState = await EncounterUtil.pGetInitialState();
						if (savedState && savedState.data) {
							const encounter = savedState.data;
							const name = await InputUiUtil.pGetUserString({
								title: "Enter Encounter Name",
								default: EncounterUtil.getEncounterName(encounter)
							});
							nuEncounter.name = name || "(Unnamed encounter)";
							nuEncounter.data = encounter;
						} else {
							return JqueryUtil.doToast({
								content: `No saved encounter! Please first go to the Bestiary and create one.`,
								type: "warning"
							});
						}
						break;
					}
					case 1: {
						const savedEncounters = (await EncounterUtil.pGetSavedState()).savedEncounters || {};

						const savedKeys = Object.keys(savedEncounters);
						if (!savedKeys.length) return JqueryUtil.doToast({type: "warning", content: "No saved encounters were found! Go to the Bestiary and create some first."});

						const $cbCopy = $(`<input type="checkbox">`);
						$cbCopy.prop("checked", TimeTrackerBase_Calendar._tmpPrefCbCopy);
						const selected = await InputUiUtil.pGetUserEnum({
							values: savedKeys.map(it => savedEncounters[it].name || EncounterUtil.getEncounterName(savedEncounters[it])),
							placeholder: "Select an encounter",
							title: "Select Saved Encounter",
							fnGetExtraState: () => ({isCopy: $cbCopy.prop("checked")}),
							$elePost: $$`<label class="flex-label flex-h-center w-100 mb-2">
								<span class="mr-2 help" title="Turning this on will make a copy of the encounter as it currently exists, allowing the original to be modified or deleted without affecting the copy. Leaving this off will instead keep a reference to the encounter, so any change to the encounter will be reflected here.">Make Copy of Encounter</span>
								${$cbCopy}
							</label>`
						});
						if (selected != null) {
							const key = savedKeys[selected.ix];
							const save = savedEncounters[key];
							nuEncounter.name = save.name;

							// save the user's preference for copy vs. reference
							TimeTrackerBase_Calendar._tmpPrefCbCopy = selected.extraState.isCopy;

							if (selected.extraState.isCopy) nuEncounter.data = save.data;
							else nuEncounter.data = {isRef: true, bestiaryId: key};
						} else return;
						break;
					}
					case 2: {
						const json = await DataUtil.pUserUpload();
						if (json) {
							const name = await InputUiUtil.pGetUserString({
								title: "Enter Encounter Name",
								default: EncounterUtil.getEncounterName(json)
							});
							nuEncounter.name = name || "(Unnamed Encounter)";
							nuEncounter.data = json;
						} else return;
						break;
					}
				}

				this._parent.set("encounters", [...Object.values(this._parent.get("encounters")), nuEncounter].map(it => ({[it.id]: it})).reduce((a, b) => Object.assign(a, b), {}));
			},
			["From Current Bestiary Encounter", "From Saved Bestiary Encounter", "From Bestiary Encounter File"]
		);
		const $btnAddEncounter = $(`<button class="btn btn-xs btn-success"><span class="glyphicon glyphicon-plus"/> Add Encounter</button>`)
			.click(evt => ContextUtil.handleOpenContextMenu(evt, $btnAddEncounter, ctxEncounterId));

		const {$modalInner} = UiUtil.getShowModal({
			title: TimeTrackerBase.formatDateInfo(dayInfo, date, monthInfo, seasonInfos),
			cbClose: () => {
				this._parent.removeHook("events", hookEvents);
				ContextUtil.doTeardownContextMenu(ctxEncounterId);
			},
			// titleSplit: $$`<div class="flex">${$btnAddEvent}${$btnAddEncounter}</div>`,
			zIndex: 200,
			fullWidth: true,
			fullHeight: true
		});

		const $hrMoons = $(`<hr class="hr-2 no-shrink">`);
		const $wrpMoons = $(`<div class="flex flex-wrap w-100 no-shrink flex-v-center"/>`);
		const hookMoons = () => {
			const todayMoonInfos = getMoonInfos(moonDay);
			$wrpMoons.empty();
			todayMoonInfos.forEach(moon => {
				$$`<div class="flex-v-center mr-2">
					${TimeTrackerBase.$getCvsMoon(moon).addClass("mr-2")} 
					<div class="flex-col">
						<div class="flex">${moon.name}</div>
						<div class="flex small"><i class="mr-1">${moon.phaseName}</i><span class="text-muted">(Day ${moon.dayOfPeriod + 1}/${moon.period})</span></div>				
					</div>
				</div>`.appendTo($wrpMoons);
			});
			$hrMoons.toggle(!!todayMoonInfos.length);
		};
		this._parent.addHook("moons", hookMoons);
		hookMoons();

		const $wrpEvents = $(`<div class="flex-col w-100 overflow-y-auto dm-time__day-entry-wrapper"/>`);
		const hookEvents = () => {
			const todayEvents = getEvents(year, eventDay);
			$wrpEvents.empty();
			this._tmpComps = [];
			todayEvents.forEach(event => {
				const comp = new TimeTrackerBase_Settings_Event(this._board);
				this._tmpComps.push(comp);
				comp.setStateFrom({state: event});
				comp._addHookAll("state", () => {
					const otherEvents = Object.values(this._parent.get("events"))
						.filter(it => !(it.isDeleted || it.id === comp.getState().id));

					this._parent.set("events", [...otherEvents, comp.getState()].map(it => ({[it.id]: it})).reduce((a, b) => Object.assign(a, b), {}));
				});
				comp.render($wrpEvents);
			});
			if (!todayEvents.length) $wrpEvents.append(`<div class="flex-vh-center italic">(No events)</div>`);
			if (this._eventToEdit) {
				const toEdit = this._tmpComps.find(it => it._state.id === this._eventToEdit);
				this._eventToEdit = null;
				if (toEdit) toEdit.doOpenEditModal();
			}
		};
		this._parent.addHook("events", hookEvents);
		hookEvents();

		const pDereferenceEncounter = async (encounter) => {
			if (encounter.data.isRef) {
				const savedState = await EncounterUtil.pGetSavedState();
				return (savedState.savedEncounters || {})[encounter.data.bestiaryId];
			} else return encounter;
		};

		const $wrpEncounters = $(`<div class="flex-col w-100 overflow-y-auto dm-time__day-entry-wrapper"/>`);
		const doEncounterUpdate = () => this._parent.set("encounters", Object.values(this._parent.get("encounters")).filter(it => !it.isDeleted).map(it => ({[it.id]: it})).reduce((a, b) => Object.assign(a, b), {}));
		const hookEncounters = async () => {
			const todayEncounters = getEncounters(year, eventDay);
			$wrpEncounters.empty();

			// update reference names
			await Promise.all(todayEncounters.map(async encounter => {
				const fromStorage = await pDereferenceEncounter(encounter);
				if (fromStorage != null) encounter.name = fromStorage.name;
			}));

			todayEncounters.forEach(encounter => {
				const $btnCopyToTracker = $(`<button class="btn btn-xs btn-default mr-2 ${encounter.countUses > 0 ? "disabled" : ""}" title="${encounter.countUses > 0 ? "(Encounter has been used)" : "Add to Initiative Tracker"}"><span class="glyphicon glyphicon-play"/></button>`)
					.click(async () => {
						if (encounter.countUses > 0) return;

						const $existingTrackers = this._board.getPanelsByType(PANEL_TYP_INITIATIVE_TRACKER)
							.map(it => it.tabDatas.filter(td => td.type === PANEL_TYP_INITIATIVE_TRACKER).map(td => td.$content.find(`.dms__data_anchor`)))
							.flat();

						if ($existingTrackers.length) {
							let $tracker;
							if ($existingTrackers.length === 1) {
								$tracker = $existingTrackers[0];
							} else {
								const ix = await InputUiUtil.pGetUserEnum({
									default: 0,
									title: "Choose a Tracker",
									placeholder: "Select tracker"
								});
								if (ix != null && ~ix) {
									$tracker = $existingTrackers[ix]
								}
							}

							if ($tracker) {
								const toLoad = await pDereferenceEncounter(encounter);

								if (!toLoad) return JqueryUtil.doToast({content: "Could not find encounter data! Has the encounter been deleted?", type: "warning"});

								try {
									$tracker.data("doConvertAndLoadBestiaryList")(toLoad.data);
								} catch (e) {
									JqueryUtil.doToast({type: "error", content: "Failed to add encounter! See the console for more information."});
									throw e;
								}
								JqueryUtil.doToast({type: "success", content: "Encounter added."});
								encounter.countUses += 1;
								doEncounterUpdate();
							}
						} else return JqueryUtil.doToast({type: "warning", content: "Could not find an initiative tracker in the screen! Make sure one exists, and that it is an active tab."});
					});

				const $btnResetUse = $(`<button class="btn btn-xs btn-default mr-2 ${encounter.countUses === 0 ? "disabled" : ""}" title="Reset Usage"><span class="glyphicon glyphicon-refresh"/></button>`)
					.click(evt => {
						if (encounter.countUses === 0) return;

						encounter.countUses = 0;
						doEncounterUpdate();
					});

				const $btnSaveToFile = $(`<button class="btn btn-xs btn-default mr-2" title="Download Encounter File"><span class="glyphicon glyphicon-download"/></button>`)
					.click(async () => {
						const toSave = await pDereferenceEncounter(encounter);

						if (!toSave) return JqueryUtil.doToast({content: "Could not find encounter data! Has the encounter been deleted?", type: "warning"});

						DataUtil.userDownload("encounter", toSave.data);
					});

				const $btnDelete = $(`<button class="btn btn-xs btn-danger" title="Delete Encounter"><span class="glyphicon glyphicon-trash"/></button>`)
					.click(() => {
						encounter.isDeleted = true;
						doEncounterUpdate();
					});

				$$`<div class="flex-v-center w-100 py-1 px-2 stripe-even">
					<div class="w-100 ${encounter.countUses > 0 ? "text-muted small" : ""}">${encounter.name}</div>
					${$btnCopyToTracker} 
					${$btnResetUse}
					${$btnSaveToFile} 
					${$btnDelete}
				</div>`.appendTo($wrpEncounters);
			});
			if (!todayEncounters.length) $wrpEncounters.append(`<div class="flex-vh-center italic">(No encounters)</div>`);
		};
		this._parent.addHook("encounters", hookEncounters);
		hookEncounters();

		$$`<div class="flex-col w-100 h-100 px-2">
			${$wrpMoons}
			${$hrMoons}
			<div class="split flex-v-center mb-1 no-shrink">
				<div class="underline dm-time__day-entry-header">Events</div>
				${$btnAddEvent}	
			</div>
			${$wrpEvents}
			<hr class="hr-2 no-shrink">
			<div class="split flex-v-center mb-1 no-shrink">
				<div class="underline dm-time__day-entry-header">Encounters</div>
				${$btnAddEncounter}
			</div>
			${$wrpEncounters}
		</div>`.appendTo($modalInner);
	}
}
TimeTrackerBase_Calendar._tmpPrefCbCopy = false;

class TimeTrackerBase_Settings extends TimeTrackerComponent {
	static getTimeNum (str, isAllowNegative) {
		const num = Number(str.trim());
		if (isNaN(num)) return TimeTrackerBase._MIN_TIME;
		else return Math.max(Math.min(Math.round(num), TimeTrackerBase._MAX_TIME), isAllowNegative ? -TimeTrackerBase._MAX_TIME : TimeTrackerBase._MIN_TIME);
	}

	constructor (tracker) {
		super(tracker);

		// temp components
		this._tmpComps = {};
	}

	render ($parent, parent) {
		$parent.empty();
		this._parent = parent;

		const $getIptTime = (prop, opts) => {
			opts = opts || {};
			const $ipt = $(`<input class="form-control input-xs form-control--minimal w-30 no-shrink text-right">`)
				.change(() => this._parent.set(prop, TimeTrackerBase_Settings.getTimeNum($ipt.val(), opts.isAllowNegative)));
			const hook = () => $ipt.val(this._parent.get(prop));
			this._parent.addHook(prop, hook);
			hook();
			return $ipt;
		};

		const $getBtnReset = (...props) => {
			return $(`<button class="btn btn-xs btn-default mb-2">Reset Section</button>`)
				.click(() => {
					if (!confirm("Are you sure?")) return;
					const resetProps = {};
					props.forEach(prop => resetProps[prop] = TimeTrackerBase._DEFAULT_STATE[prop]);
					this._parent.assignState(resetProps);
				});
		};

		const $selWindUnits = $(`<select class="form-control input-xs">
				<option value="mph">Miles per Hour</option>
				<option value="kmph">Kilometres per Hour</option>
			</select>`)
			.change(() => this._parent.set("unitsWindSpeed", $selWindUnits.val()));
		const hookWindUnits = () => $selWindUnits.val(this._parent.get("unitsWindSpeed"));
		hookWindUnits();

		const metaDays = this._render_getChildMeta("days", TimeTrackerBase_Settings_Day, "Day", TimeTrackerBase.getGenericDay);
		const metaMonths = this._render_getChildMeta("months", TimeTrackerBase_Settings_Month, "Month", TimeTrackerBase.getGenericMonth);
		const metaSeasons = this._render_getChildMeta(
			"seasons",
			TimeTrackerBase_Settings_Season,
			"Season",
			TimeTrackerBase.getGenericSeason,
			{
				fnSort: (a, b) => SortUtil.ascSort(a.startDay, b.startDay),
				isEmptyMessage: `<div class="flex-vh-center my-1 italic w-100">(No seasons)</div>`
			}
		);
		const metaMoons = this._render_getChildMeta(
			"moons",
			TimeTrackerBase_Settings_Moon,
			"Moon",
			TimeTrackerBase.getGenericMoon,
			{
				fnSort: (a, b) => SortUtil.ascSort(a.phaseOffset, b.phaseOffset) || SortUtil.ascSort(a.name, b.name),
				isEmptyMessage: `<div class="flex-vh-center my-1 italic w-100">(No moons)</div>`
			}
		);

		$$`<div class="flex-col pl-2 pr-3">
			<div class="flex-h-right">${$getBtnReset("hoursPerDay", "minutesPerHour", "secondsPerMinute")}</div>
			<div class="split mb-2"><div class="w-100">Hours per Day</div>${$getIptTime("hoursPerDay")}</div>
			<div class="split mb-2"><div class="w-100">Minutes per Hour</div>${$getIptTime("minutesPerHour")}</div>
			<div class="split"><div class="w-100">Seconds per Minute</div>${$getIptTime("secondsPerMinute")}</div>
			
			<hr class="hr-2">
			<div class="flex-h-right">${$getBtnReset("hoursPerLongRest", "minutesPerShortRest", "secondsPerRound")}</div>
			<div class="split mb-2"><div class="w-100">Hours per Long rest</div>${$getIptTime("hoursPerLongRest")}</div>
			<div class="split mb-2"><div class="w-100">Minutes per Short Rest</div>${$getIptTime("minutesPerShortRest")}</div>
			<div class="split"><div class="w-100">Seconds per Round</div>${$getIptTime("secondsPerRound")}</div>
			
			<hr class="hr-2">
			<div class="flex-h-right">${$getBtnReset("offsetYears", "offsetMonthStartDay")}</div>
			<div class="split mb-2"><div class="w-100 help" title="For example, to have the starting year be &quot;Year 900,&quot; enter &quot;900&quot;.">Year Offset</div>${$getIptTime("offsetYears", {isAllowNegative: true})}</div>
			<div class="split"><div class="w-100 help" title="For example, to have the first year start on the third day of the week, enter &quot;2&quot;.">Year Start Weekday Offset</div>${$getIptTime("offsetMonthStartDay")}</div>
			
			<hr class="hr-2">
			<div class="split"><div class="w-100">Wind Speed Units</div>${$selWindUnits}</div>
			
			<hr class="hr-2">
			<div class="split w-100 mb-1">
				<div>Day</div>
				${metaDays.$btnAdd}
			</div>
			${metaDays.$wrp}
			
			<hr class="hr-2 mt-1">
			<div class="flex w-100 mb-1">
				<div class="w-100 flex-v-center">Month</div>
				<div class="w-25 no-shrink text-center mr-2">Days</div>
				<div class="dm-time__spc-drag-header no-shrink mr-2"/>
				${metaMonths.$btnAdd.addClass("no-shrink")}
			</div>
			${metaMonths.$wrp}
			
			<hr class="hr-2 mt-1">
			<div class="flex w-100 mb-1">
				<div class="w-100 flex-v-center">Season</div>
				<div class="w-15 no-shrink text-center mr-2 help--subtle" title="In hours. For example, to have the sun rise at 05:00, enter &quot;5&quot;.">Sunrise</div>
				<div class="w-15 no-shrink text-center mr-2 help--subtle" title="In hours. For example, to have the sun set at 22:00, enter &quot;22&quot;.">Sunset</div>
				<div class="w-15 no-shrink text-center mr-2 help--subtle" title="For example, to have a season start on the 1st day of the year, enter &quot;1&quot;.">Start</div>
				<div class="w-15 no-shrink text-center mr-2 help--subtle" title="For example, to have a season end on the 90th day of the year, enter &quot;90&quot;.">End</div>
				${metaSeasons.$btnAdd.addClass("no-shrink")}
			</div>
			${metaSeasons.$wrp}
			
			<hr class="hr-2 mt-1">
			<div class="flex w-100 mb-1">
				<div class="w-100 flex-v-center">Moon</div>
				<div class="w-25 no-shrink text-center mr-2 help--subtle" title="For example, to have a new moon appear on the third day of the first year, enter &quot;3&quot;.">Offset</div>
				<div class="w-25 no-shrink text-center mr-2 help--subtle" title="Measured in days. Multiples of eight are recommended, as there are eight distinct moon phases.">Period</div>
				${metaMoons.$btnAdd.addClass("no-shrink")}
			</div>
			${metaMoons.$wrp}
		</div>`.appendTo($parent);
	}

	/**
	 * @param prop State property.
	 * @param Cls The component class to make instances of.
	 * @param name Name to show in the tooltip.
	 * @param fnGetGeneric Function which returns a fresh/generic data.
	 * @param [opts] Options object.
	 * @param [opts.fnSort] Sort function for item values.
	 * @param [opts.isEmptyMessage] Message to append if there are no entries to display.
	 */
	_render_getChildMeta (prop, Cls, name, fnGetGeneric, opts) {
		opts = opts || {};

		const $wrp = $(`<div class="flex-col w-100 relative"/>`);

		let lastState;
		const hook = () => {
			const nextState = Object.values(this._parent.get(prop))
				.filter(it => !it.isDeleted);

			if (opts.fnSort) {
				nextState.sort(opts.fnSort);
			} else {
				nextState.sort((a, b) => SortUtil.ascSort(a.pos, b.pos));
				nextState.forEach((it, i) => it.pos = i); // remove any holes in the pos continuity
			}

			if (CollectionUtil.deepEquals(lastState, nextState)) return;
			lastState = nextState;
			$wrp.empty();
			this._tmpComps[prop] = [];
			nextState.forEach(nxt => {
				const comp = new Cls(this._board);
				this._tmpComps[prop].push(comp);
				comp.setStateFrom({state: nxt});
				comp._addHookAll("state", () => this._parent.set(prop, (this._tmpComps[prop] || []).map(c => c.getState()).filter(it => !it.isDeleted).map(it => ({[it.id]: it})).reduce((a, b) => Object.assign(a, b), {})));
				comp.render($wrp, this._tmpComps, prop);
			});

			if (!nextState.length && opts.isEmptyMessage) $wrp.append(opts.isEmptyMessage);
		};
		this._parent.addHook(prop, hook);
		hook();

		const $btnAdd = $(`<button class="btn btn-xs btn-primary" title="Add ${name}"><span class="glyphicon glyphicon-plus"/></button>`)
			.click(() => {
				const dataList = Object.values(this._parent.get(prop));
				const hasPos = dataList.some(it => it.pos != null);
				if (hasPos) {
					const existing = dataList.filter(it => !it.isDeleted).map(it => it.pos);
					const maxPos = existing.length ? Math.max(...existing) : -1;
					const nxt = fnGetGeneric(maxPos + 1);
					this._parent.set(prop, {...this._parent.get(prop), [nxt.id]: nxt});
				} else {
					const nxt = fnGetGeneric(dataList.length);
					this._parent.set(prop, {...this._parent.get(prop), [nxt.id]: nxt});
				}
			});

		return {$wrp, $btnAdd}
	}
}

class TimeTrackerBase_Settings_Day extends TimeTrackerComponent {
	constructor (tracker) {
		super(tracker);

		this._$rendered = null;
	}

	render ($parent, componentsParent, componentsProp) {
		const $iptName = $(`<input class="form-control input-xs form-control--minimal mr-2">`)
			.change(() => this._state.name = $iptName.val().trim());
		const hookName = () => $iptName.val(this._state.name);
		this._addHookBase("name", hookName);
		hookName();

		const $padDrag = DragReorderUiUtil.$getDragPad({
			$parent,
			componentsParent,
			componentsProp,
			componentId: this._state.id,
			marginSide: "r"
		});

		const $btnRemove = $(`<button class="btn btn-xs btn-danger no-shrink" title="Delete Day"><span class="glyphicon glyphicon-trash"/></button>`)
			.click(() => this._state.isDeleted = true);

		this._$rendered = $$`<div class="flex my-1 dm-time__row-delete">
			${$iptName}
			${$padDrag}
			${$btnRemove} 
			<div class="dm-time__spc-button"/>
		</div>`.appendTo($parent);
	}

	get id () { return this._state.id; }
	set pos (pos) { this._state.pos = pos; }
	get pos () { return this._state.pos; }
	get height () { return this._$rendered ? this._$rendered.outerHeight(true) : 0; }

	getState () { return MiscUtil.copy(this._state); }

	_getDefaultState () { return {...TimeTrackerBase._DEFAULT_STATE__DAY}; }
}

class TimeTrackerBase_Settings_Month extends TimeTrackerComponent {
	constructor (tracker) {
		super(tracker);

		this._$rendered = null;
	}

	render ($parent, componentsParent, componentsProp) {
		const $iptName = $(`<input class="form-control input-xs form-control--minimal mr-2">`)
			.change(() => this._state.name = $iptName.val().trim());
		const hookName = () => $iptName.val(this._state.name);
		this._addHookBase("name", hookName);
		hookName();

		const $iptDays = $(`<input class="form-control input-xs form-control--minimal text-right mr-2 w-25 no-shrink">`)
			.change(() => this._state.days = UiUtil.strToInt($iptDays.val(), 1, {min: TimeTrackerBase._MIN_TIME, max: TimeTrackerBase._MAX_TIME}));
		const hookDays = () => $iptDays.val(this._state.days);
		this._addHookBase("days", hookDays);
		hookDays();

		const $padDrag = DragReorderUiUtil.$getDragPad({
			$parent,
			componentsParent,
			componentsProp,
			componentId: this._state.id,
			marginSide: "r"
		});

		const $btnRemove = $(`<button class="btn btn-xs btn-danger no-shrink" title="Delete Month"><span class="glyphicon glyphicon-trash"/></button>`)
			.click(() => this._state.isDeleted = true);

		this._$rendered = $$`<div class="flex my-1 dm-time__row-delete">
			${$iptName} 
			${$iptDays} 
			${$padDrag}
			${$btnRemove} 
			<div class="dm-time__spc-button"/>
		</div>`.appendTo($parent);
	}

	get id () { return this._state.id; }
	set pos (pos) { this._state.pos = pos; }
	get pos () { return this._state.pos; }
	get height () { return this._$rendered ? this._$rendered.outerHeight(true) : 0; }

	getState () { return MiscUtil.copy(this._state); }

	_getDefaultState () { return {...TimeTrackerBase._DEFAULT_STATE__MONTH}; }
}

class TimeTrackerBase_Settings_Event extends TimeTrackerComponent {
	render ($parent) {
		const doShowHideEntries = () => {
			const isShown = this._state.entries.length && !this._state.isHidden;
			$wrpEntries.toggleClass("hidden", !isShown);
		};

		const $dispEntries = $(`<div class="stats stats--book dm-time__wrp-event-entries"/>`);
		const hookEntries = () => {
			$dispEntries.html(Renderer.get().render({entries: MiscUtil.copy(this._state.entries)}));
			doShowHideEntries();
		};
		this._addHookBase("entries", hookEntries);

		const $wrpEntries = $$`<div class="flex">
			<div class="no-shrink dm-time__bar-entry"></div>
			${$dispEntries}
		</div>`;

		const $dispName = $(`<div class="mr-2 w-100"/>`);
		const hookName = () => $dispName.text(this._state.name || "(Unnamed event)");
		this._addHookBase("name", hookName);

		const $btnShowHide = $(`<button class="btn btn-xs btn-default mr-2 no-shrink"><span class="glyphicon glyphicon-eye-close"/></button>`)
			.click(() => this._state.isHidden = !this._state.isHidden);
		const hookShowHide = () => {
			$btnShowHide.toggleClass("active", !!this._state.isHidden);
			doShowHideEntries();
		};
		this._addHookBase("isHidden", hookShowHide);

		const $btnEdit = $(`<button class="btn btn-xs btn-default mr-2 no-shrink"><span class="glyphicon glyphicon-pencil" title="Edit Event"/></button>`)
			.click(() => this.doOpenEditModal());

		const $btnRemove = $(`<button class="btn btn-xs btn-danger no-shrink" title="Delete Event"><span class="glyphicon glyphicon-trash"/></button>`)
			.click(() => this._state.isDeleted = true);

		hookEntries();
		hookName();
		hookShowHide();

		$$`<div class="flex-col py-1 px-2 stripe-even">
			<div class="flex w-100">
				${$dispName}
				${$btnShowHide}
				${$btnEdit}
				${$btnRemove}
			</div>
			${$wrpEntries}
		</div>`.appendTo($parent);
	}

	doOpenEditModal () {
		const {$modalInner, doClose} = UiUtil.getShowModal({
			title: "Edit Event",
			overlayColor: "transparent"
		});

		const $iptName = $(`<input class="form-control input-xs form-control--minimal mb-2 no-shrink">`)
			.change(() => this._state.name = $iptName.val().trim());
		const hookName = () => $iptName.val(this._state.name);
		hookName();

		const $iptEntries = $(`<textarea class="form-control input-xs form-control--minimal resize-none mb-2 h-100"/>`)
			.change(() => this._state.entries = UiUtil.getTextAsEntries($iptEntries.val().trim()));
		const hookEntries = () => $iptEntries.val(UiUtil.getEntriesAsText(this._state.entries));
		hookEntries();

		const $btnOk = $(`<button class="btn btn-default">OK</button>`)
			.click(() => doClose());

		$$`<div class="flex-col h-100">
			${$iptName} 
			${$iptEntries} 
			<div class="flex-h-right no-shrink">${$btnOk}</div>
		</div>`.appendTo($modalInner);
	}

	getState () { return MiscUtil.copy(this._state); }

	_getDefaultState () { return {...TimeTrackerBase._DEFAULT_STATE__EVENT}; }
}

class TimeTrackerBase_Settings_Season extends TimeTrackerComponent {
	render ($parent) {
		const $iptName = $(`<input class="form-control input-xs form-control--minimal mr-2">`)
			.change(() => this._state.name = $iptName.val().trim());
		const hookName = () => $iptName.val(this._state.name);
		this._addHookBase("name", hookName);
		hookName();

		const $getIptHours = (prop) => {
			const $ipt = $(`<input class="form-control input-xs form-control--minimal text-right mr-2 w-15 no-shrink">`)
				.change(() => this._state[prop] = UiUtil.strToInt($ipt.val(), 0, {min: 0}));
			const hook = () => $ipt.val(this._state[prop]);
			this._addHookBase(prop, hook);
			hook();
			return $ipt;
		};

		const $getIptDays = (prop) => {
			// offset display values by 1, so the first day is "1" instead of "0"
			const $ipt = $(`<input class="form-control input-xs form-control--minimal text-right mr-2 w-15 no-shrink">`)
				.change(() => this._state[prop] = UiUtil.strToInt($ipt.val(), 1, {min: 1}) - 1);
			const hook = () => $ipt.val(this._state[prop] + 1);
			this._addHookBase(prop, hook);
			hook();
			return $ipt;
		};

		const $iptSunrise = $getIptHours("sunriseHour");
		const $iptSunset = $getIptHours("sunsetHour");

		const $iptDaysStart = $getIptDays("startDay");
		const $iptDaysEnd = $getIptDays("endDay");

		const $btnRemove = $(`<button class="btn btn-xs btn-danger no-shrink" title="Delete Season"><span class="glyphicon glyphicon-trash"/></button>`)
			.click(() => this._state.isDeleted = true);

		$$`<div class="flex my-1">
			${$iptName} 
			${$iptSunrise}
			${$iptSunset}
			${$iptDaysStart} 
			${$iptDaysEnd} 
			${$btnRemove} 
		</div>`.appendTo($parent);
	}

	getState () { return MiscUtil.copy(this._state); }

	_getDefaultState () { return {...TimeTrackerBase._DEFAULT_STATE__SEASON}; }
}

class TimeTrackerBase_Settings_Moon extends TimeTrackerComponent {
	render ($parent) {
		const $iptName = $(`<input class="form-control input-xs form-control--minimal mr-2">`)
			.change(() => this._state.name = $iptName.val().trim());
		const hookName = () => $iptName.val(this._state.name);
		this._addHookBase("name", hookName);
		hookName();

		const $iptColor = $(`<input class="form-control input-xs form-control--minimal mr-2 no-shrink dm-time__ipt-color-moon" type="color" title="Moon Color">`)
			.change(() => this._state.color = $iptColor.val());
		const hookColor = () => $iptColor.val(this._state.color);
		this._addHookBase("color", hookColor);
		hookColor();

		const $iptPhaseOffset = $(`<input class="form-control input-xs form-control--minimal text-right mr-2 w-25 no-shrink">`)
			.change(() => this._state.phaseOffset = UiUtil.strToInt($iptPhaseOffset.val(), 0));
		const hookPhase = () => $iptPhaseOffset.val(this._state.phaseOffset);
		this._addHookBase("phaseOffset", hookPhase);
		hookPhase();

		const $iptPeriod = $(`<input class="form-control input-xs form-control--minimal text-right mr-2 w-25 no-shrink">`)
			.change(() => this._state.period = UiUtil.strToInt($iptPeriod.val(), 1, {min: TimeTrackerBase._MIN_TIME, max: TimeTrackerBase._MAX_TIME}));
		const hookPeriod = () => $iptPeriod.val(this._state.period);
		this._addHookBase("period", hookPeriod);
		hookPeriod();

		const $btnRemove = $(`<button class="btn btn-xs btn-danger no-shrink" title="Delete Moon"><span class="glyphicon glyphicon-trash"/></button>`)
			.click(() => this._state.isDeleted = true);

		$$`<div class="flex my-1">
			${$iptName} 
			${$iptColor}
			${$iptPhaseOffset} 
			${$iptPeriod}
			${$btnRemove} 
		</div>`.appendTo($parent);
	}

	getState () { return MiscUtil.copy(this._state); }

	_getDefaultState () { return {...TimeTrackerBase._DEFAULT_STATE__MOON}; }
}
