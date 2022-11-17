"use strict";

const fs = require("fs");
const ut = require("./util");
require("../js/utils");
require("../js/parser");

function updateFolder (folder) {
	console.log(`Updating directory ${folder}...`);
	const files = ut.listFiles({ dir: folder });
	files
		.filter(file => file.endsWith(".json"))
		.forEach(file => {
			let json = ut.readJson(file)
			// For targeted schema changes, like changing a name of an object key
			if (json.item) {
				json.item = json.item.map(x => {
					if (x.variants) {
						x.variants.map(v => {
							if (v.variantType) return v
							console.log(`\tUpdating ${x.name} item variants in ${file}...`)
							if (!v.type && v.name) {
								v.variantType = v.name
								delete v.name
								return v
							} else {
								v.variantType = v.type
								delete v.type
								return v
							}
						})
					}
					if (typeof (x.destruction || x.special || x.craftReq) === "string") {
						console.log(`\tUpdating ${x.name} destruction/special/craftReq to arrays in ${file}...`)
						if (typeof x.special === "string") {
							x.special = [x.special]
						}
						if (typeof x.destruction === "string") {
							x.destruction = [x.destruction]
						}
						if (typeof x.craftReq === "string") {
							x.craftReq = [x.craftReq]
						}
						return x
					}
					console.log(x.name, x.source)
					if (x.activate && !Array.isArray(x.activate.components)) {
						console.log(`\tUpdating ${x.name} components to array in ${file}...`)
						x.activate.components = [x.activate.components]
						return x
					}
					return x
				})
			}
			if (json.spell) {
				json.spell = json.spell.map(sp => {
					if (sp.heightened && sp.heightened.X && Array.isArray(sp.heightened.X)) {
						console.log(`\tUpdating ${sp.name} spell heightening in ${file}...`)
						let heightenedOld = sp.heightened.X
						sp.heightened.X = {}
						heightenedOld.forEach(v => {
							sp.heightened.X = { ...sp.heightened.X, [v.level]: v.entries }
						})
					}
					if (sp && sp.range && sp.range.type) {
						console.log(`\tUpdating ${sp.name} spell range in ${file}...`)
						sp.range.unit = sp.range.type
						delete sp.range.type
					}
					if (sp && sp.type) {
						console.log(`\tUpdating ${sp.name} type in ${file}...`)
						if (sp.type.toLowerCase() === "focus") sp.focus = true
						delete sp.type
					}
					if (sp && typeof sp.components === "object" && !Array.isArray(sp.components)) {
						console.log(`\tUpdating ${sp.name} spell components in ${file}...`)
						sp.components = [Object.keys(sp.components)]
					}
					if (sp && sp.traditions && sp.traditions.some(rx => rx.match(/[A-Z]/g))) {
						console.log(`\tUpdating ${sp.name} traditions in ${file}...`)
						sp.traditions = sp.traditions.map(t => t.toLowerCase())
					}
					if (sp && sp.subclass && sp.subclass["Cleric|Domain"]) {
						sp.domains = sp.subclass["Cleric|Domain"]
						delete sp.subclass["Cleric|Domain"]
						if (Object.keys(sp.subclass.length).length === 0) {
							delete sp.subclass
						}
					}
					if (sp && sp.duration) {
						let duration = sp.duration;
						if (duration.duration) {
							duration = {...duration, ...duration.duration};
						}
						delete duration.type;
						if (duration.sustain) {
							delete duration.sustain
							duration.sustained = true
						}
						if (duration.unit === "unlimited" || duration.unit === "special") {
							delete duration.number;
						}
						if (duration.entry) {
							const cpy = MiscUtil.copy(duration);
							delete cpy.entry;
							const renderedDuration = Parser.durationToFull(cpy);
							if (renderedDuration === duration.entry) delete duration.entry;
						}
						delete duration.duration;
						sp.duration = duration;
					}
					return sp
				})
			}
			if (json.ancestry) {
				json.ancestry = json.ancestry.map(x => {
					if (typeof x.size === "string" || x.size instanceof String) {
						console.log(`\tUpdating ${x.name} ancestry size in ${file}...`)
						x.size = x.size.split(/, or |, | or /g)
					}
					return x
				})
			}
			if (json.feat) {
				json.feat = json.feat.map(x => {
					if (typeof x.special === "string") {
						console.log(`\tUpdating ${x.name} special to arrays in ${file}...`)
						x.special = [x.special]
					}
					return x
				})
			}
			if (json.vehicle) {
				json.vehicle = json.vehicle.map(x => {
					if (typeof (x.destruction || x.special || x.craftReq) === "string") {
						console.log(`\tUpdating ${x.name} destruction/special/craftReq to arrays in ${file}...`)
						if (typeof x.special === "string") {
							x.special = [x.special]
						}
						if (typeof x.destruction === "string") {
							x.destruction = [x.destruction]
						}
						if (typeof x.craftReq === "string") {
							x.craftReq = [x.craftReq]
						}
						return x
					}
					return x
				})
			}
			if (json.creature) {
				json.creature = json.creature.map(cr => {
					if (cr.creatureType) {
						console.log(`\tUpdating ${cr.name} creature type in ${file}...`)
						cr.traits.push(cr.creatureType.map(t => t.toLowerCase()))
						delete cr.creatureType
						cr.traits = [...new Set(cr.traits.flat())]
					}
					if (cr.skills && Object.keys(cr.skills).find(k => k.match(/[A-Z]/g))) {
						// Stolen from https://bobbyhadz.com/blog/javascript-lowercase-object-keys
						console.log(`\tUpdating ${cr.name} skill to lowercase in ${file}...`)

						cr.skills = Object.keys(cr.skills).reduce((accumulator, key) => {
							accumulator[key.toLowerCase()] = cr.skills[key];
							return accumulator;
						}, {})
					}
					if (cr.ac || cr.savingThrows || cr.hardness || cr.hp || cr.bt || cr.immunities || cr.weaknesses || cr.resistances) {
						cr.defenses = cr.defenses || {};
						console.log(`\tUpdating ${cr.name} defenses in ${file}...`)
						for (let k of ["ac", "savingThrows", "hardness", "hp", "bt", "immunities", "weaknesses", "resistances"]) {
							if (cr[k]) {
								cr.defenses[k] = cr[k];
								delete cr[k];
							}
						}
					}
					if (cr.languages && cr.languages.languages && cr.languages.languages.length && cr.languages.languages.find(k => k.match(/[A-Z]/g))) {
						console.log(`\tUpdating ${cr.name} languages to lowercase in ${file}...`)
						cr.languages.languages = cr.languages.languages.map(k => k.toLowerCase())
					}
					if (cr.attacks && cr.attacks.length && cr.attacks.find(k => k.activity && k.activity.unit && k.activity.unit === "action" && k.activity.number && k.activity.number === 1)) {
						console.log(`\tUpdating ${cr.name} attacks to remove vestigial activity data in ${file}...`)
						cr.attacks = cr.attacks.map(k => {
							delete k.activity
							return k
						})
					}
					return cr;
				});
			}
			if (json.hazard) {
				json.hazard = json.hazard.map(h => {
					if (h.actions && h.actions.filter(a => a.type === "attack").length) {
						console.log(`\tUpdating ${h.name} actions in ${file}...`)
						h.attacks = h.actions.filter(a => a.type === "attack");
						h.actions = h.actions.filter(a => a.type !== "attack");
					}
					if (h.actions) h.actions.forEach(a => delete a.type);
					if (h.attacks) h.attacks.forEach(a => delete a.type);

					if (h.defenses) {
						for (let k of ["ac", "hardness", "hp", "bt"]) {
							if (h.defenses[k] && h.defenses[k].default) {
								h.defenses[k].std = h.defenses[k].default;
								delete h.defenses[k].default;
							}
						}
						if (h.defenses.savingThrows) {
							for (let k of ["fort", "ref", "will"]) {
								if (typeof h.defenses.savingThrows[k] === "number") {
									h.defenses.savingThrows[k] = {std: h.defenses.savingThrows[k]}
								} else if (h.defenses.savingThrows[k] && h.defenses.savingThrows[k].default) {
									h.defenses.savingThrows[k].std = h.defenses.savingThrows[k].default;
									delete h.defenses.savingThrows[k].default;
								}
							}
						}
						if (h.defenses.notes) {
							// :grimacing:
							if (h.defenses.notes.default) {
								h.defenses.notes.std = h.defenses.notes.default;
								delete h.defenses.notes.default;
							}
							// Old data assumed notes was only for hp
							h.defenses.hp.notes = h.defenses.notes
							delete h.defenses.notes
						}
						if (h.defenses && h.defenses.hp && h.defenses.hp.notes) {
							Object.keys(h.defenses.hp.notes).forEach(k => h.defenses.hp.notes[k] = h.defenses.hp.notes[k].trimAnyChar(".,;"))
						}
					}
					return h;
				});
			}
			if (json.ritual) {
				json.ritual = json.ritual.map(r => {
					if (r && r.duration) {
						let duration = r.duration;
						if (duration.duration) {
							duration = {...duration, ...duration.duration};
						}
						delete duration.type;
						if (duration.sustain) {
							delete duration.sustain
							duration.sustained = true
						}
						if (duration.unit === "unlimited" || duration.unit === "special") {
							delete duration.number;
						}
						if (duration.entry) {
							const cpy = MiscUtil.copy(duration);
							delete cpy.entry;
							const renderedDuration = Parser.durationToFull(cpy);
							if (renderedDuration === duration.entry) delete duration.entry;
						}
						delete duration.duration;
						r.duration = duration;
					}
					return r;
				});
			}
			fs.writeFileSync(file, CleanUtil.getCleanJson(json), "utf-8");
		})
}

updateFolder(`./data`);
// updateFolder(`./homebrew/pf2e-homebrew`);
console.log("Updating complete.");
