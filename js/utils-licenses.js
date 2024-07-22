"use strict";

class UtilsLicenses {
	static renderLicenses (sources) {
		const CUP = {
			name: "Community Use Policy",
			type: "pf2-red-box",
			entries: [
				"Pf2etools uses trademarks and/or copyrights owned by Paizo Inc., used under {@link Paizo's Community Use Policy|https://paizo.com/communityuse}. We are expressly prohibited from charging you to use or access this content. Pf2etools is not published, endorsed, or specifically approved by Paizo. For more information about Paizo Inc. and Paizo products, visit {@link paizo.com|https://paizo.com}.",
			],
		};
		const OGL = {
			name: "OPEN GAME LICENSE Version 1.0a",
			type: "pf2-h1",
			entries: [
				"The following text is the property of Wizards of the Coast, Inc. and is Copyright 2000 Wizards of the Coast, Inc (\"Wizards\"). All Rights Reserved.",
				{
					type: "list",
					style: "list-decimal",
					items: [
						"Definitions: (a) \"Contributors\" means the copyright and/or trademark owners who have contributed Open Game Content; (b) \"Derivative Material\" means copyrighted material including derivative works and translations (including into other computer languages), potation, modification, correction, addition, extension, upgrade, improvement, compilation, abridgment or other form in which an existing work may be recast, transformed or adapted; (c) \"Distribute\" means to reproduce, license, rent, lease, sell, broadcast, publicly display, transmit or otherwise distribute; (d) \"Open Game Content\" means the game mechanic and includes the methods, procedures, processes and routines to the extent such content does not embody the Product Identity and is an enhancement over the prior art and any additional content clearly identified as Open Game Content by the Contributor, and means any work covered by this License, including translations and derivative works under copyright law, but specifically excludes Product Identity. (e) \"Product Identity\" means product and product line names, logos and identifying marks including trade dress; artifacts; creatures characters; stories, storylines, plots, thematic elements, dialogue, incidents, language, artwork, symbols, designs, depictions, likenesses, formats, poses, concepts, themes and graphic, photographic and other visual or audio representations; names and descriptions of characters, spells, enchantments, personalities, teams, personas, likenesses and special abilities; places, locations, environments, creatures, equipment, magical or supernatural abilities or effects, logos, symbols, or graphic designs; and any other trademark or registered trademark clearly identified as Product identity by the owner of the Product Identity, and which specifically excludes the Open Game Content; (f) \"Trademark\" means the logos, names, mark, sign, motto, designs that are used by a Contributor to identify itself or its products or the associated products contributed to the Open Game License by the Contributor (g) \"Use\", \"Used\" or \"Using\" means to use, Distribute, copy, edit, format, modify, translate and otherwise create Derivative Material of Open Game Content. (h) \"You\" or \"Your\" means the licensee in terms of this agreement.",
						"The License: This License applies to any Open Game Content that contains a notice indicating that the Open Game Content may only be Used under and in terms of this License. You must affix such a notice to any Open Game Content that you Use. No terms may be added to or subtracted from this License except as described by the License itself. No other terms or conditions may be applied to any Open Game Content distributed using this License.",
						"Offer and Acceptance: By Using the Open Game Content You indicate Your acceptance of the terms of this License.",
						"Grant and Consideration: In consideration for agreeing to use this License, the Contributors grant You a perpetual, worldwide, royalty-free, non-exclusive license with the exact terms of this License to Use, the Open Game Content.",
						"Representation of Authority to Contribute: If You are contributing original material as Open Game Content, You represent that Your Contributions are Your original creation and/or You have sufficient rights to grant the rights conveyed by this License.",
						"Notice of License Copyright: You must update the COPYRIGHT NOTICE portion of this License to include the exact text of the COPYRIGHT NOTICE of any Open Game Content You are copying, modifying or distributing, and You must add the title, the copyright date, and the copyright holder's name to the COPYRIGHT NOTICE of any original Open Game Content you Distribute.",
						"Use of Product Identity: You agree not to Use any Product Identity, including as an indication as to compatibility, except as expressly licensed in another, independent Agreement with the owner of each element of that Product Identity. You agree not to indicate compatibility or co-adaptability with any Trademark or Registered Trademark in conjunction with a work containing Open Game Content except as expressly licensed in another, independent Agreement with the owner of such Trademark or Registered Trademark. The use of any Product Identity in Open Game Content does not constitute a challenge to the ownership of that Product Identity. The owner of any Product Identity used in Open Game Content shall retain all rights, title and interest in and to that Product Identity.",
						"Identification: If you distribute Open Game Content You must clearly indicate which portions of the work that you are distributing are Open Game Content.",
						"Updating the License: Wizards or its designated Agents may publish updated versions of this License. You may use any authorized version of this License to copy, modify and distribute any Open Game Content originally distributed under any version of this License.",
						"Copy of this License: You MUST include a copy of this License with every copy of the Open Game Content You Distribute.",
						"Use of Contributor Credits: You may not market or advertise the Open Game Content using the name of any Contributor unless You have written permission from the Contributor to do so.",
						"Inability to Comply: If it is impossible for You to comply with any of the terms of this License with respect to some or all of the Open Game Content due to statute, judicial order, or governmental regulation then You may not Use any Open Game Material so affected.",
						"Termination: This License will terminate automatically if You fail to comply with all terms herein and fail to cure such breach within 30 days of becoming aware of the breach. All sublicenses shall survive the termination of this License.",
						"Reformation: If any provision of this License is held to be unenforceable, such provision shall be reformed only to the extent necessary to make it enforceable.",
						{
							type: "item",
							entries: [
								"COPYRIGHT NOTICE",
								"{@b Open Game License v 1.0a} © 2000, Wizards of the Coast, Inc.",
								"{@b System Reference Document} © 2000, Wizards of the Coast, Inc.; Authors: Jonathan Tweet, Monte Cook, Skip Williams, based on material by E. Gary Gygax and Dave Arneson.",
								...sources.filter((source) => source.license === "OGL" && !source.unreleased).map((source) => {
									source.entries[source.entries.length - 1] = source.entries[source.entries.length - 1].replace(/\{@b \{@i ([^{}]+)\}\}/, `{@b {@i {@link $1|${source.store}}}}`);
									if (source.entries.length > 1) {
										source.entries[0] = source.entries[0].replace("Pathfinder Core Rulebook (Second Edition)", "{@link Pathfinder Core Rulebook (Second Edition)|https://paizo.com/products/btq01zp3}");
										source.entries[source.entries.length - 2] = source.entries[source.entries.length - 2].replace("Pathfinder Core Rulebook (Second Edition)", "{@link Pathfinder Core Rulebook (Second Edition)|https://paizo.com/products/btq01zp3}");
									}
									return {
										type: "pf2-h4",
										name: source.name,
										entries: source.entries,
									}
								}),
							],
						},
					],
				},
			],
		};
		const ORC = {
			name: "ORC Notice",
			type: "pf2-h1",
			entries: [
				"This product is licensed under the ORC License held in the Library of Congress at TX 9-307-067 and available online at various locations including {@link www.azoralaw.com/orclicense}, {@link www.gencon.com/orclicense} and others. All warranties are disclaimed as set forth therein.",
				{
					type: "pf2-h3",
					name: "Reserved Material",
					entries: [
						"Reserved Material elements in this product include all elements designated as Reserved Material under the ORC License.",
					],
				},
				{
					type: "pf2-h3",
					name: "Expressly Designated Licensed Material",
					entries: [
						"This product contains no Expressly Designated Licensed Material.",
					],
				},
				{
					type: "pf2-h3",
					name: "Attribution",
					entries: [
						"This product is based on the following Licensed Material:",
						...sources.filter((source) => source.license === "ORC" && !source.unreleased).map((source) => {
							source.entries[source.entries.length - 1] = source.entries[source.entries.length - 1].replace(/\{@b \{@i ([^{}]+)\}\}/, `{@b {@i {@link $1|${source.store}}}}`);
							return {
								type: "pf2-h4",
								name: source.name,
								entries: source.entries,
							}
						}),
					],
				},
			],
		};
		const $wrp = $(`#wrp-licenses`).empty();
		const renderer = Renderer.get();
		const licenses = renderer.render([
			CUP,
			{
				type: "hr",
			},
			OGL,
			{
				type: "hr",
			},
			ORC,
		]);
		$(licenses).appendTo($wrp);
	}
}
