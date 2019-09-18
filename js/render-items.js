class RenderItems {
	static $getRenderedItem (item) {
		const [damage, damageType, propertiesTxt] = Renderer.item.getDamageAndPropertiesText(item);

		const renderedText = Renderer.item.getRenderedEntries(item);

		return $$`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getNameTr(item)}
			<tr><td class="rd-item__type-rarity-attunement" colspan="6">${Renderer.item.getTypeRarityAndAttunementText(item)}</td></tr>
			<tr>
				<td colspan="2">${[Parser.itemValueToFull(item), Parser.itemWeightToFull(item)].filter(Boolean).join(", ").uppercaseFirst()}</td>
				<td class="text-right" colspan="4"><span>${damage}</span> <span>${damageType}</span> <span>${propertiesTxt}</span></td>
			</tr>
			${renderedText ? `<tr><td class="divider" colspan="6"><div/></td></tr>
			<tr class="text"><td colspan="6">${renderedText}</td></tr>` : ""}
			${Renderer.utils.getPageTr(item)}
			${Renderer.utils.getBorderTr()}
		`;
	}
}
