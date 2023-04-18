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
					if (x.category !== "Coda" && x.traits && Array.isArray(x.traits) && x.traits.filter(t => t.includes("coda")).length > 0) {
						console.log(`\tUpdating ${x.name} coda category in ${file}...`)
						x.category = "Coda"
					}
					if (x.entries && Array.isArray(x.entries) && x.entries.length) {
						x.entries = x.entries.map(e => {
							if (typeof e === "object") {
								if (e.variants) {
									console.log(`\tUpdating ${x.name} item variants being stuck in abilities in ${file}...`)
									if (!Array.isArray(x.variants)) {
										x.variants = e.variants
									} else {
										x.variants.push(...e.variants)
									}
									delete e.variants
									if (!x.generic) x.generic = "G"
								}
							}
							return e
						})
					}
					if (x.variants) {
						if (!x.generic) {
							console.log(`\tUpdating ${x.name} not having generic attribute in ${file}...`)
							x.generic = "G"
						}
						x.variants.map(v => {
							if (v.entries && Array.isArray(v.entries) && v.entries.length) {
								v.entries = v.entries.map(e => {
									if (typeof e === "object") {
										if (e.variants) {
											console.log(`\tUpdating ${x.name} item variants being stuck in abilities in ${file}...`)
											x.variants.push(...e.variants)
											delete e.variants
											if (!x.generic) x.generic = "G"
										}
									}
									return e
								})
							}
							if (!v.variantType) {
								console.log(`\tUpdating ${x.name} item variants in ${file}...`)
								if (!v.type && v.name) {
									v.variantType = v.name.length > x.name.length ? v.name.replace(x.name, "") : v.name
									delete v.name
								} else {
									v.variantType = v.type
									delete v.type
								}
							}
							if (v.craftReq && !Array.isArray(v.craftReq)) {
								console.log(`\tUpdating ${x.name} item variant craftReq to array in ${file}...`)
								v.craftReq = [v.craftReq]
							}
							return v
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
					}
					if (x.activate && x.activate.components && !Array.isArray(x.activate.components)) {
						console.log(`\tUpdating ${x.name} components to array in ${file}...`)
						x.activate.components = [x.activate.components]
					}
					if (x.activate && x.activate.components && x.activate.components.length) {
						x.activate.components.map(component => {
							if (component.toLowerCase() === "strike" || component.toLowerCase() === "interact" || component.toLowerCase() === "cast a spell") {
								console.log(`\tTagging ${x.name} components in ${file}...`)
								component = `{@action ${component}}`
							}
							return component
						})
					}
					if (x.activate != null && x.trigger != null) {
						x.activate.trigger = x.trigger
						delete x.trigger
					}
					if (x.activate != null && x.requirements != null) {
						x.activate.requirements = x.requirements
						delete x.requirements
					}
					if (x.activate != null && x.prerequisites != null) {
						x.activate.prerequisites = x.prerequisites
						delete x.prerequisites
					}
					if (x.type === "Equipment" && !(x.equipment === true)) {
						console.log(`\tUpdating ${x.name} types from Equipment to Item in ${file}...`)
						x.type = "Item"
					}
					return x
				})
			}
			if (json.baseitem) {
				json.baseitem = json.baseitem.map(x => {
					if (x.type === "Equipment" && !(x.equipment === true)) {
						console.log(`\tUpdating ${x.name} types from Equipment to Item in ${file}...`)
						x.type = "Item"
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
							duration = { ...duration, ...duration.duration };
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
					if (cr.isNpc === false) {
						delete cr.isNpc
					}
					if (cr.hasImages === false) {
						delete cr.hasImages
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
					if (cr.attacks && cr.attacks.length) {
						if (cr.attacks.find(k => k.activity && k.activity.unit && k.activity.unit === "action" && k.activity.number && k.activity.number === 1)) {
							console.log(`\tUpdating ${cr.name} attacks to remove vestigial data in ${file}...`)
							cr.attacks = cr.attacks.map(k => {
								delete k.activity
								return k
							})
						}
						cr.attacks = cr.attacks.map(k => {
							if (k.effects && k.effects.length === 0) {
								delete k.effects
							}
							return k
						})
					} else if (cr.attacks && cr.attacks.length === 0) {
						delete cr.attacks
					}
					if (cr.spellcasting && cr.spellcasting.length) {
						cr.spellcasting = cr.spellcasting.map(k => {
							if (k.type) {
								k.type = k.type.toTitleCase();
							}
							if (k.tradition) {
								k.tradition = k.tradition.toLowerCase();
							}
							if (k.name && k.type && k.tradition
								&& (k.name.localeCompare(`${k.type} ${k.tradition}`, { sensitivity: "base" })
									|| k.name.localeCompare(`${k.tradition} ${k.type}`, { sensitivity: "base" }))
							) {
								delete k.name;
							}

							const mapSpellLevel = (l) => {
								l.spells = l.spells.map(s => {
									if (s.note) {
										if (typeof s.note === "string") {
											s.notes = [s.note];
										} else {
											s.notes = s.note;
										}
										delete s.note;
									}
									return s;
								});
								return l;
							}

							if (k.entry) {
								for (let l = 0; l <= 10; l++) {
									const level = l.toString();
									if (k.entry[level]) {
										k.entry[level] = mapSpellLevel(k.entry[level]);
									}
									if (k.entry.constant && k.entry.constant[level]) {
										k.entry.constant[level] = mapSpellLevel(k.entry.constant[level]);
									}
								}
							}
							return k
						})
					}
					if (cr.rituals && cr.rituals.length) {
						cr.rituals = cr.rituals.map(k => {
							if (k.tradition) {
								k.tradition = k.tradition.toLowerCase();
							}
							if (k.note) {
								if (typeof k.note === "string") {
									k.notes = [k.note];
								} else {
									k.notes = k.note;
								}
								delete k.note;
							}
							return k
						})
					}
					if (cr.abilities) {
						const mapAbility = (a) => {
							if (a.entries && a.entries.length === 0) {
								delete a.entries;
							}
							return a;
						}

						if (cr.abilities.top) {
							cr.abilities.top = cr.abilities.top.map(mapAbility)
						}
						if (cr.abilities.mid) {
							cr.abilities.mid = cr.abilities.mid.map(mapAbility)
						}
						if (cr.abilities.bot) {
							cr.abilities.bot = cr.abilities.bot.map(mapAbility)
						}
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
					if (h.actions) h.actions.forEach(a => { if (a.type !== "affliction") { delete a.type } });
					if (h.attacks) h.attacks.forEach(a => { if (a.type !== "affliction") { delete a.type } });

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
									h.defenses.savingThrows[k] = { std: h.defenses.savingThrows[k] }
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
							duration = { ...duration, ...duration.duration };
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
			if (json.archetype) {
				json.archetype = json.archetype.map(a => {
					if (a.traits && Array.isArray(a.traits) && a.traits.length) {
						a.rarity = a.traits[0]
						delete a.traits;
					}
					return a
				})
			}
			if (json.background) {
				json.background = json.background.map(b => {
					if (b.feat) {
						if (Array.isArray(b.feat)) b.feats = b.feat
						else b.feats = [b.feat]
						delete b.feat
					}
					return b
				})
			}
			fs.writeFileSync(file, CleanUtil.getCleanJson(json), "utf-8");
		})
}

updateFolder(`./data`);
// updateFolder(`./homebrew/pf2e-homebrew`);
console.log("Updating complete.");
