import json
import win32com.client as win32

SOURCE_JSON = "CRB"
PAGE = 0
PARSED = []


def RGB_to_color_number(R, G, B):
	return R + G * 256 + B * 65536


def color_number_to_RGB(num):
	R = num % 256
	G = (num // 256) % 256
	B = (num // 65536) % 256
	return R, G, B


class Style:
	def __init__(self, factory, options):
		self.name = options.get('name')
		self.font_names = options.get('font_names')
		self.sizes = options.get('sizes')
		self.color = options.get('color') or 0
		self.bold = options.get('bold') or False
		self.italic = options.get('italic') or False
		self.allow_wrong_bold = options.get('allow_wrong_bold') or False
		self.allow_wrong_italic = options.get('allow_wrong_italic') or False
		self.handle_tags = options.get('handle_tags') or False
		self.is_numeric = options.get('is_numeric') or False
		self.children = options.get('children') or []
		self.json_key = options.get('json_key')
		self.disconnected = options.get('disconnected') or False
		if factory:
			self.factory = factory.__get__(self)

	def is_paragraph_style(self, paragraph_range):
		font = paragraph_range.Font
		if not Style.colors_are_equal(self.color, font.Color):
			return False
		if font.Size not in self.sizes:
			return False
		if font.Name == '':
			for word in paragraph_range.Words:
				if word.Font.Name not in self.font_names:
					return False
		else:
			if font.Name not in self.font_names:
				return False
		if not self.allow_wrong_bold:
			if not Style.compare_num_bool(font.Bold, self.bold):
				return False
		if not self.allow_wrong_italic:
			if not Style.compare_num_bool(font.Italic, self.italic):
				return False
		if self.is_numeric:
			if not paragraph_range.Text.strip().isnumeric():
				return False
		return True

	def add_to_entry(self, paragraph_range, tag_stack, active_object):
		entry = ""
		if self.handle_tags:
			if len(tag_stack) == 0 and not bool(paragraph_range.Font.Bold) and not bool(paragraph_range.Font.Italic):
				entry += paragraph_range.Text
			else:
				for word in paragraph_range.Words:
					temp_stack = []
					if word.Font.Bold:
						temp_stack.append("{@b ")
					if word.Font.Italic:
						temp_stack.append("{@i ")
					while not set(tag_stack).issubset(set(temp_stack)):
						# if the word has too many tags, close tags & remove from stack until we have too few tags
						tag_stack.pop()
						entry += "}"
					for tag in set(temp_stack) - set(tag_stack):
						# if we have too few tags, open needed tags and push tag to stack
						tag_stack.append(tag)
						entry += tag
					# when tags match, add the word
					entry += word.Text
		else:
			entry += paragraph_range.Text

		entry = entry.replace("\r", "\n")
		entry = entry.replace(r" }", r"} ")
		entry = entry.replace(r" }", r"} ")

		if type(active_object) == list:
			active_object.append(entry)
		elif self.json_key == "name":
			active_object.name += entry
		elif self.json_key == "entries":
			if len(active_object.entries):
				if type(active_object.entries[-1]) == str:
					active_object.entries[-1] += entry
				else:
					active_object.entries.append(entry)
			else:
				active_object.entries.append(entry)

	@staticmethod
	def get_style(styles, paragraph_range):
		for style in styles:
			if style.is_paragraph_style(paragraph_range):
				return style
		return None

	@staticmethod
	def colors_are_equal(num1, num2):
		tolerance = 10
		R1, G1, B1 = color_number_to_RGB(num1)
		R2, G2, B2 = color_number_to_RGB(num2)
		if abs(R1 - R2) + abs(G1 - G2) + abs(B1 - B2) <= tolerance:
			return True
		else:
			return False

	@staticmethod
	def compare_num_bool(num, b):
		if num == 9999999:
			return False
		else:
			return bool(num) == b


class JsonObject:
	def __init__(self, style, parent):
		self.parent = parent
		self.style = style
		self.page = PAGE
		self.entries = []
		self.name = ""

	def __dict__(self):
		out = {"type": self.style.name, "source": SOURCE_JSON, "page": self.page}
		if self.name:
			out["name"] = self.name.strip(" \n")
		if self.entries:
			out["entries"] = [e if type(e) == str else e.__dict__() for e in self.entries]
		return out


def get_document(path):
	word_app = win32.gencache.EnsureDispatch("Word.Application")
	word_app.Visible = True
	word_app.Documents.Open(path)
	docx_filename = path.split('/')[-1]
	document = win32.gencache.EnsureDispatch(word_app.Documents(docx_filename))
	return document


def get_ancestor(active_style, active_object):
	ancestor = active_object

	def do_loop(a):
		if a is None or type(a) == list:
			return False
		if active_style in a.style.children:
			return False
		return True

	while do_loop(ancestor):
		ancestor = ancestor.parent
	return ancestor


def handle_disconnected(paragraph_style, active_object, cache):
	if paragraph_style.disconnected:
		if active_object is None or paragraph_style not in active_object.style.children:
			if cache[paragraph_style.name]:
				cache["main"] = active_object
				active_object = cache[paragraph_style.name]
		else:
			cache[paragraph_style.name] = active_object
	else:
		if cache["main"]:
			active_object = cache["main"]
			cache["main"] = None
	return active_object, cache


def dump(outpath):
	print(f"Dumping to file '{outpath}'...")
	with open(outpath, "w", encoding="utf-8") as f:
		out = {"data": [e if type(e) == str else e.__dict__() for e in PARSED]}
		json.dump(out, f, indent=2, separators=(',', ': '), ensure_ascii=False)


def do_convert(styles, inpath, outpath=None):
	document = get_document(inpath)

	active_style = None
	active_object = None
	tag_stack = []
	disconnected_cache = {"main": None}
	paragraph_count = document.Paragraphs.Count
	for idx, paragraph in enumerate(document.Paragraphs):
		print(f"\rConverting line {idx + 1} of {paragraph_count}...", end="")
		paragraph_range = paragraph.Range
		paragraph_text = paragraph_range.Text
		paragraph_style = Style.get_style(styles, paragraph_range)
		if paragraph_style is not None:
			if hasattr(paragraph_style, "handle_pagenumber"):
				paragraph_style.handle_pagenumber(paragraph_text)
			elif active_style == paragraph_style:
				paragraph_style.add_to_entry(paragraph_range, tag_stack, active_object)
			else:
				active_object, disconnected_cache = handle_disconnected(paragraph_style, active_object, disconnected_cache)
				ancestor = get_ancestor(paragraph_style, active_object)
				active_object = paragraph_style.factory(ancestor)
				tag_stack = []
				paragraph_style.add_to_entry(paragraph_range, tag_stack, active_object)
				active_style = paragraph_style
	print("")
	if outpath:
		dump(outpath)
	print("Done.")
	return document, PARSED


if __name__ == "__main__":

	# region CRB Styles ################################################################################################

	page_number = Style(None, {
		"font_names": ["Gin-Regular"],
		"sizes": [10],
		"color": 94,
		"is_numeric": True,
	})


	def handle_pagenumber(self, text):
		global PAGE
		try:
			PAGE = int(text) + 1
		except ValueError:
			pass


	page_number.handle_pagenumber = handle_pagenumber.__get__(page_number, None)


	def heading_factory(style, ancestor):
		new_object = JsonObject(style, ancestor)
		if ancestor is None or type(ancestor) == list:
			PARSED.append(new_object)
		else:
			ancestor.entries.append(new_object)
		return new_object


	def text_factory(style, ancestor):
		if ancestor is None:
			return PARSED
		return ancestor


	h1 = Style(heading_factory, {
		"name": "pf2-h1",
		"sizes": [23],
		"font_names": ["Taroca"],
		"color": 94,
		"json_key": "name"
	})

	h1_flavor = Style(heading_factory, {
		"name": "pf2-h1-flavor",
		"font_names": ["SabonLTStd-Italic"],
		"sizes": [12],
		"color": 93,
		"italic": True,
		"json_key": "entries"
	})

	h2 = Style(heading_factory, {
		"name": "pf2-h2",
		"sizes": [16],
		"font_names": ["Taroca"],
		"color": RGB_to_color_number(0, 38, 101),
		"json_key": "name"
	})

	h3 = Style(heading_factory, {
		"name": "pf2-h3",
		"sizes": [12, 8.5, 9999999],  # smallcaps
		"font_names": ["Gin-Regular", "Gin-Regular-SC700", "Gin-Round"],
		"color": 94,
		"json_key": "name"
	})

	h4 = Style(heading_factory, {
		"name": "pf2-h4",
		"sizes": [12, 8.5, 9999999],  # smallcaps
		"font_names": ["Gin-Regular", "Gin-Regular-SC700"],
		"color": RGB_to_color_number(168, 103, 83),
		"json_key": "name"
	})

	p = Style(text_factory, {
		"name": "pf2-p",
		"sizes": [9],
		"font_names": ['SabonLTStd-Roman', 'Sabon-Bold', 'SabonLTStd-Italic', 'SabonLTStd-Bold', 'Pathfinder-Icons',
					   'Sabon-Roman', "TimesNewRomanPS-BoldMT"],
		"json_key": "entries",
		"handle_tags": True,
		"allow_wrong_bold": True,
		"allow_wrong_italic": True
	})

	side_bar = Style(heading_factory, {
		"name": "pf2-sidebar",
		"sizes": [11],
		"font_names": ['GoodOT-Bold', 'GoodOT-CondBold'],
		"color": 94,
		"bold": True,
		"json_key": "name"
	})

	side_bar_text = Style(text_factory, {
		"name": "pf2-sidebar-text",
		"sizes": [9],
		"color": 94,
		"font_names": ["GoodOT"],
		"json_key": "entries"
	})

	box_heading = Style(heading_factory, {
		"name": "pf2-brown-box",
		"sizes": [11, 12],
		"font_names": ["GoodOT-Bold", "GoodOT-CondBold"],
		"bold": True,
		"json_key": "name"
	})

	box_text = Style(text_factory, {
		"name": "pf2-sidebar-text",
		"sizes": [10],
		"bold": True,
		"font_names": ["GoodOT-Bold"],
		"json_key": "entries"
	})

	box_text_alt = Style(text_factory, {
		"name": "pf2-sidebar-text-alt",
		"sizes": [9, 8.5],
		"bold": True,
		"font_names": ['GoodOT', 'GoodOT-Italic', 'GoodOT-Bold'],
		"allow_wrong_bold": True,
		"allow_wrong_italic": True,
		"json_key": "entries"
	})

	table_heading = Style(heading_factory, {
		"name": "pf2-table",
		"sizes": [12],
		"bold": True,
		"font_names": ['GoodOT-CondBold'],
		"json_key": "name"
	})

	table_heading_alt = Style(heading_factory, {
		"name": "pf2-table-alt",
		"sizes": [12],
		"bold": True,
		"color": RGB_to_color_number(255, 255, 255),
		"font_names": ['GoodOT-Bold'],
		"json_key": "name"
	})

	h1.children = [h1_flavor, h2, h3, h4, p, side_bar, box_heading, table_heading, table_heading_alt]
	h2.children = [h3, h4, p, side_bar, box_heading, table_heading, table_heading_alt]
	h3.children = [h4, p, table_heading, table_heading_alt]
	h4.children = [p]
	side_bar.children = [side_bar_text]
	box_heading.children = [box_text, box_text_alt]
	table_heading.children = [table_heading_alt, box_text_alt]
	table_heading_alt.children = [box_text_alt]

	# endregion

	# region GMG Styles ################################################################################################
	h1_alt = Style(heading_factory, {
		"name": "pf2-h1",
		"sizes": [24],
		"font_names": ["Taroca"],
		"color": RGB_to_color_number(0, 38, 101),
		"json_key": "name"
	})
	h1_alt.children = [h1_flavor, h2, h3, h4, p, side_bar, box_heading, table_heading, table_heading_alt]

	# h4.color = RGB_to_color_number(127, 51, 51)
	# endregion

	# region LOWG Styles ###############################################################################################
	lowg_page_nr = Style(None, {
		"font_names": ["Gin-Regular"],
		"sizes": [10],
		"color": RGB_to_color_number(255, 255, 255),
		"is_numeric": True,
	})

	lowg_page_nr.handle_pagenumber = handle_pagenumber.__get__(lowg_page_nr, None)

	lowg_h1 = Style(heading_factory, {
		"name": "pf2-h1",
		"sizes": [29],
		"font_names": ["Taroca"],
		"color": RGB_to_color_number(218, 197, 133),
		"json_key": "name"
	})

	lowg_side_bar = Style(heading_factory, {
		"name": "pf2-sidebar",
		"sizes": [10, 11, 12],
		"font_names": ["Gin-Regular"],
		"color": RGB_to_color_number(107, 84, 63),
		"json_key": "name"
	})

	lowg_side_bar_text = Style(text_factory, {
		"name": "pf2-sidebar-text",
		"sizes": [9],
		"color": RGB_to_color_number(107, 84, 63),
		"font_names": ["GoodOT"],
		"json_key": "entries",
		"handle_tags": True,
		"allow_wrong_bold": True,
		"allow_wrong_italic": True,
		"disconnected": True,
	})

	lowg_h1.children = [h2, h3, h4, p, lowg_side_bar]
	lowg_side_bar.children = [lowg_side_bar_text]
	h2.children.append(lowg_side_bar)
	# endregion

	# STYLES = [page_number, h1, h1_alt, h1_flavor, h2, h3, h4, p, side_bar, side_bar_text, box_heading, box_text,
	# 		  box_text_alt, table_heading, table_heading_alt]

	STYLES = [lowg_page_nr, lowg_h1, h2, h3, h4, p, lowg_side_bar, lowg_side_bar_text]

	SOURCE_JSON = "LOWG"
	path_docx = r"D:\Stuff\Programming\Pathfinder 2e tools\docx\LOWG.docx"
	filename = path_docx.split('\\')[-1]
	path_dump = f"D:/Stuff/Programming/Pathfinder 2e tools/Pf2eTools.github.io/trash/{filename.replace('docx', 'json')}"

	DOCX, PARSED = do_convert(STYLES, path_docx, path_dump)
