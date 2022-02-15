class RenderOrganizations {
	static $getRenderedOrganization (it) {
		return $$`${Renderer.organization.getCompactRenderedString(it)}`;
	}
}
