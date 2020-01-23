"use strict";

class TableConverter extends BaseConverter {
	constructor (ui) {
		super(
			ui,
			{
				converterId: "Table",
				modes: ["html", "md"],
				prop: "table"
			}
		);
	}

	_renderSidebar (parent, $wrpSidebar) {
		$wrpSidebar.empty();
	}

	handleParse (input, cbOutput, cbWarning, isAppend) {
		const opts = {cbWarning, cbOutput, isAppend};

		switch (this._state.mode) {
			case "html": return this.doParseHtml(input, opts);
			case "md": return this.doParseMarkdown(input, opts);
			default: throw new Error(`Unimplemented!`);
		}
	}

	_getSample (format) {
		switch (format) {
			case "html": return TableConverter.SAMPLE_HTML;
			case "md": return TableConverter.SAMPLE_MARKDOWN;
			default: throw new Error(`Unknown format "${format}"`)
		}
	}

	/**
	 * Parses tables from HTML.
	 * @param inText Input text.
	 * @param options Options object.
	 * @param options.cbWarning Warning callback.
	 * @param options.cbOutput Output callback.
	 * @param options.isAppend Default output append mode.
	 */
	doParseHtml (inText, options) {
		if (!inText || !inText.trim()) return options.cbWarning("No input!");
		inText = this._getCleanInput(inText);

		const handleTable = ($table, caption) => {
			const tbl = {
				type: "table",
				caption,
				colLabels: [],
				colStyles: [],
				rows: []
			};

			const getCleanHeaderText = ($ele) => {
				let txt = $ele.text().trim();

				// if it's all-uppercase, title-case it
				if (txt.toUpperCase() === txt) txt = txt.toTitleCase();

				return txt;
			};

			// Caption
			if ($table.find(`caption`)) {
				tbl.caption = $table.find(`caption`).text().trim();
			}

			// Columns
			if ($table.find(`thead`)) {
				const $headerRows = $table.find(`thead tr`);
				if ($headerRows.length !== 1) options.cbWarning(`Table header had ${$headerRows.length} rows!`);
				$headerRows.each((i, r) => {
					const $r = $(r);
					if (i === 0) { // use first tr as column headers
						$r.find(`th, td`).each((i, h) => tbl.colLabels.push(getCleanHeaderText($(h))));
					} else { // use others as rows
						const row = [];
						$r.find(`th, td`).each((i, h) => row.push(getCleanHeaderText($(h))));
						if (row.length) tbl.rows.push(row);
					}
				});
				$table.find(`thead`).remove();
			} else if ($table.find(`th`)) {
				$table.find(`th`).each((i, h) => tbl.colLabels.push(getCleanHeaderText($(h))));
				$table.find(`th`).parent().remove();
			}

			// Rows
			const handleTableRow = (i, r) => {
				const $r = $(r);
				const row = [];
				$r.find(`td`).each((i, cell) => {
					const $cell = $(cell);
					row.push($cell.text().trim());
				});
				tbl.rows.push(row);
			};

			if ($table.find(`tbody`)) {
				$table.find(`tbody tr`).each(handleTableRow);
			} else {
				$table.find(`tr`).each(handleTableRow);
			}

			MarkdownConverter.postProcessTable(tbl);
			options.cbOutput(tbl, options.isAppend);
		};

		const $input = $(inText);
		if ($input.is("table")) {
			handleTable($input);
		} else {
			// TODO pull out any preceding text to use as the caption; pass this in
			const caption = "";
			$input.find("table").each((i, e) => {
				const $table = $(e);
				handleTable($table, caption);
			});
		}
	}

	/**
	 * Parses tables from Markdown.
	 * @param inText Input text.
	 * @param options Options object.
	 * @param options.cbWarning Warning callback.
	 * @param options.cbOutput Output callback.
	 * @param options.isAppend Default output append mode.
	 */
	doParseMarkdown (inText, options) {
		if (!inText || !inText.trim()) return options.cbWarning("No input!");
		inText = this._getCleanInput(inText);

		const lines = inText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split(/\n/g);
		const stack = [];
		let cur = null;
		lines.forEach(l => {
			if (l.trim().startsWith("##### ")) {
				if (cur && cur.lines.length) stack.push(cur);
				cur = {caption: l.trim().replace(/^##### /, ""), lines: []};
			} else {
				cur = cur || {lines: []};
				cur.lines.push(l);
			}
		});
		if (cur && cur.lines.length) stack.push(cur);

		const toOutput = stack.map(tbl => MarkdownConverter.getConvertedTable(tbl.lines, tbl.caption)).reverse();
		toOutput.forEach((out, i) => {
			if (options.isAppend) options.cbOutput(out, true);
			else {
				if (i === 0) options.cbOutput(out, false);
				else options.cbOutput(out, true);
			}
		});
	}
}
// region samples
TableConverter.SAMPLE_HTML =
	`<table>
  <thead>
    <tr>
      <td><p><strong>Character Level</strong></p></td>
      <td><p><strong>Low Magic Campaign</strong></p></td>
      <td><p><strong>Standard Campaign</strong></p></td>
      <td><p><strong>High Magic Campaign</strong></p></td>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><p>1st–4th</p></td>
      <td><p>Normal starting equipment</p></td>
      <td><p>Normal starting equipment</p></td>
      <td><p>Normal starting equipment</p></td>
    </tr>
    <tr>
      <td><p>5th–10th</p></td>
      <td><p>500 gp plus 1d10 × 25 gp, normal starting equipment</p></td>
      <td><p>500 gp plus 1d10 × 25 gp, normal starting equipment</p></td>
      <td><p>500 gp plus 1d10 × 25 gp, one uncommon magic item, normal starting equipment</p></td>
    </tr>
    <tr>
      <td><p>11th–16th</p></td>
      <td><p>5,000 gp plus 1d10 × 250 gp, one uncommon magic item, normal starting equipment</p></td>
      <td><p>5,000 gp plus 1d10 × 250 gp, two uncommon magic items, normal starting equipment</p></td>
      <td><p>5,000 gp plus 1d10 × 250 gp, three uncommon magic items, one rare item, normal starting equipment</p></td>
    </tr>
    <tr>
      <td><p>17th–20th</p></td>
      <td><p>20,000 gp plus 1d10 × 250 gp, two uncommon magic items, normal starting equipment</p></td>
      <td><p>20,000 gp plus 1d10 × 250 gp, two uncommon magic items, one rare item, normal starting equipment</p></td>
      <td><p>20,000 gp plus 1d10 × 250 gp, three uncommon magic items, two rare items, one very rare item, normal starting equipment</p></td>
    </tr>
  </tbody>
</table>`;
TableConverter.SAMPLE_MARKDOWN =
	`| Character Level | Low Magic Campaign                                                                | Standard Campaign                                                                                | High Magic Campaign                                                                                                     |
|-----------------|-----------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| 1st–4th         | Normal starting equipment                                                         | Normal starting equipment                                                                        | Normal starting equipment                                                                                               |
| 5th–10th        | 500 gp plus 1d10 × 25 gp, normal starting equipment                               | 500 gp plus 1d10 × 25 gp, normal starting equipment                                              | 500 gp plus 1d10 × 25 gp, one uncommon magic item, normal starting equipment                                            |
| 11th–16th       | 5,000 gp plus 1d10 × 250 gp, one uncommon magic item, normal starting equipment   | 5,000 gp plus 1d10 × 250 gp, two uncommon magic items, normal starting equipment                 | 5,000 gp plus 1d10 × 250 gp, three uncommon magic items, one rare item, normal starting equipment                       |
| 17th–20th       | 20,000 gp plus 1d10 × 250 gp, two uncommon magic items, normal starting equipment | 20,000 gp plus 1d10 × 250 gp, two uncommon magic items, one rare item, normal starting equipment | 20,000 gp plus 1d10 × 250 gp, three uncommon magic items, two rare items, one very rare item, normal starting equipment |`;
// endregion
