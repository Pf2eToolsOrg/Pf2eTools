class RenderRewards {
	static $getRenderedReward (reward) {
		return $$`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getNameTr(reward)}
		<tr id="text"><td class="divider" colspan="6"><div></div></td></tr>
		${Renderer.reward.getRenderedString(reward)}
		${Renderer.utils.getPageTr(reward)}
		${Renderer.utils.getBorderTr()}`;
	}
}
