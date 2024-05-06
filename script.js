let mousedown = false;
document.body.onmousedown = function(){mousedown = true;}
document.body.onmouseup = function(){mousedown = false;}

let neighborhoods = {
	adjacent: [
		[-1, -1],
		[-1, 0],
		[-1, 1],
		[0, -1],
		[0, 1],
		[1, -1],
		[1, 0],
		[1, 1]
	],
	above: [[-1, 0]],
	below: [[1, 0]],
	nearby: [
		[-2, -1], [-2, 0], [-2, 1],
		[-1, -2], [-1, -1], [-1, 0], [-1, 1], [-1, 2],
		[0, -2], [0, -1], [0, 1], [0, 2],
		[1, -2], [1, -1], [1, 0], [1, 1], [1, 2],
		[2, -1], [2, 0], [2, 1]
	]
};

let catalogue = {
	empty: {material_text: "remove", color: "#000"},
	circle: {material_text: "album", color: "#93E"},
	love: {material_text: "favorite", color: "#F3A"},
	flower: {material_text: "deceased", color: "#C24"},
	fire: {material_text: "local_fire_department", color: "#F72"},
	sun: {material_text: "sunny", color: "#FA3"},
	star: {material_text: "star", color: "#FD2"},
	electricity: {material_text: "bolt", color: "#FF4"},
	bug: {material_text: "bug_report", color: "#9F3"},
	tree: {material_text: "park", color: "#2B5"},
	globe: {material_text: "public", color: "#197"},
	water: {material_text: "waves", color: "#14D"},
	drop: {material_text: "water_drop", color: "#19E"},
	sphere: {material_text: "language", color: "#3CE"},
	snow: {material_text: "ac_unit", color: "#BEF"},
	moon: {material_text: "bedtime", color: "#EEF"},
	gear: {material_text: "settings", color: "#89A"}
};

for (label of Object.keys(catalogue)) catalogue[label].instructions = [];

catalogue.empty.instructions = [
	{type: "neighbor", neighborhood: "adjacent", seeking: ["tree"], matches: [1, 2, 3, 4, 5, 6, 7, 8], instructions: [
		{type: "random", probability: 0.05, instructions: [
			{type: "become", tile: "tree"}
		]}
	]}
];
catalogue.water.instructions = [
	{type: "neighbor", neighborhood: "adjacent", seeking: ["water"], matches: [0, 1, 2], instructions: [
		{type: "random", probability: 0.5, instructions: [
			{type: "become", tile: "tree"}
		]}
	]}
];
catalogue.tree.instructions = [
	{type: "neighbor", neighborhood: "adjacent", seeking: ["tree", "empty", "fire"], matches: [0, 1, 2], instructions: [
		{type: "random", probability: 0.5, instructions: [
			{type: "become", tile: "water"}
		]}
	]},
	{type: "neighbor", neighborhood: "adjacent", seeking: ["fire"], matches: [1, 2, 3, 4, 5, 6, 7, 8], instructions: [
		{type: "random", probability: 0.5, instructions: [
			{type: "become", tile: "fire"}
		]}
	]}
];
catalogue.fire.instructions = [
	{type: "become", tile: "empty"}
];
catalogue.star.instructions = [
	{type: "random", probability: 0.6, instructions: [
		{type: "become", tile: "tree"}
	]},
	{type: "become", tile: "water"}
]

//for (label of Object.keys(catalogue)) catalogue[label].instructions = [];

//make object selector for all the objects
let selected_celltype = null;
function make_object_selector(prefer = "empty") {
	let parent = document.querySelector("#selector");
	while (parent.firstChild) parent.firstChild.remove();
	for (label of Object.keys(catalogue)) {
		let div = parent.appendChild(document.createElement("div"));
		div.setAttribute("class", "open_instructions");
		div.setAttribute("label", label);
		div.setAttribute("has_rules", catalogue[label].instructions.length ? "true" : "false");
		div.setAttribute("title", label);
		div.style.color = catalogue[label].color;
		div.innerText = catalogue[label].material_text;
		div.setAttribute("onclick", "choose_celltype('"+label+"');");
	}
	choose_celltype(prefer);
}
function choose_celltype(t) {
	selected_celltype = t;
	for (div of document.querySelectorAll(".open_instructions")) {
		div.setAttribute("selected", div.getAttribute("label") == t ? "true" : "false");
	}
	make_instructions(t);
	document.querySelector("#input_brush_radius").style.accentColor = color_revise(catalogue[t].color);
	chips.brush_size.material_element.style.color = color_revise(catalogue[t].color);
}

function color_revise(color) {
	return color == "#000" ? "#444" : color;
}

function make_instructions(t) {
	let editor = document.querySelector("#instruction_editor");
	while (editor.firstChild) editor.firstChild.remove();
	let h2 = editor.appendChild(document.createElement("h2"));
	h2.style.color = color_revise(catalogue[t].color);
	h2.innerText = t;
	for (let i = 0; i < catalogue[t].instructions.length; i++) {
		let instruction = catalogue[t].instructions[i];
		let path = i;
		editor.appendChild(html_element_for_instruction(instruction, t, path));
	}
	if (!catalogue[t].instructions.length) {
		let p = editor.appendChild(document.createElement("p"));
		p.innerText = "no instructions...";
	}
	for (cat of ["neighbor", "random", "become"]) {
		editor.appendChild(html_element_for_add_instruction(t, [], cat));
	}
}

function get_instruction(node, path) { //path is list. fire,[1,0] means the second fire node's first child
	if (path.length && path[0] != "") {
		let i = path[0];
		path.shift();
		return get_instruction(node.instructions[i], path);
	} else {
		return node;
	}
}

function edit_instruction(label, path, property, val) {
	if (property == "matches") {
		//TODO: turn this into a more advanced parser for funny number strings
		val = val.split(",");
		for (let i = 0; i < val.length; i++) val[i] = parseInt(val[i]);
	}
	if (property == "seeking") {
		val = val.split(",");
	}
	get_instruction(catalogue[label], path)[property] = val;
	make_instructions(label);
}
function remove_instruction(label, path, superpath) {
	let parent = get_instruction(catalogue[label], path);
	parent.instructions = parent.instructions.filter(x => x != parent.instructions[superpath]);
	make_instructions(label);
	make_object_selector(label);
}
function add_instruction(label, path, category) { //category: neighbor random become
	let parent = get_instruction(catalogue[label], path);
	parent.instructions.push(new_instruction(category, label));
	make_instructions(label);
	make_object_selector(label);
}
function new_instruction(category, label = "empty") {
	let i = {type: category};
	switch (category) {
		case "neighbor":
			i.neighborhood = "adjacent";
			i.seeking = [label];
			i.matches = [1, 2, 3, 4, 5, 6, 7, 8];
			i.instructions = [];
			break;
		case "random":
			i.probability = 0.5;
			i.instructions = [];
			break;
		case "become":
			i.tile = label;
			break;
	}
	return i;
}

function html_element_for_instruction(instruction, label, path) {
	let div = document.createElement("div");
	div.setAttribute("label", label);
	div.setAttribute("path", path);
	div.setAttribute("instructiontype", instruction.type);
	let p = div.appendChild(document.createElement("p"));
	let material_span = p.appendChild(document.createElement("span"));
	material_span.innerText = {neighbor:"radar",become:"deployed_code",random:"casino"}[instruction.type];
	material_span.setAttribute("class", "instruction_type");
	switch (instruction.type) {
		case "neighbor":
			p.insertAdjacentHTML("beforeend", "Neighbor count");
			div.appendChild(property_chip("neighborhood", instruction.neighborhood, label, path));
			div.appendChild(property_chip("seeking", instruction.seeking, label, path));
			div.appendChild(property_chip("matches", instruction.matches, label, path));
			break;
		case "random":
			p.insertAdjacentHTML("beforeend", "Random chance");
			div.appendChild(property_chip("probability", instruction.probability, label, path));
			break;
		case "become":
			p.insertAdjacentHTML("beforeend", "Become");
			div.appendChild(property_chip("tile", instruction.tile, label, path));
			break;
	}
	let remove_button = p.appendChild(document.createElement("span"));
	remove_button.innerText = "remove";
	remove_button.setAttribute("class", "remove_button");
	remove_button.setAttribute("label", label);
	remove_button.setAttribute("path", path);
	remove_button.onclick = function() {
		[label, path] = [this.getAttribute("label"), this.getAttribute("path").split(",")];
		remove_instruction(label, path.slice(0, -1), path[path.length-1]);
	}
	if (instruction.instructions) {
		for (let i = 0; i < instruction.instructions.length; i++)
			div.appendChild(html_element_for_instruction(instruction.instructions[i], label, path+","+i));
	}
	if (instruction.type != "become") for (cat of ["neighbor", "random", "become"]) {
		div.appendChild(html_element_for_add_instruction(label, path, cat));
	}
	return div;
	function property_chip(key, val, label, path) {
		let span = document.createElement("span");
		span.setAttribute("class", "property_chip");
		span.innerHTML = "<span>" + key + "</span>";
		let input;
		if (key == "tile" && false) {
			input = span.appendChild(document.createElement("select"));
			for (let x of Object.keys(catalogue)) {
				let option = input.appendChild(document.createElement("option"));
				option.innerText = x;
			}
		} else {
			input = span.appendChild(document.createElement("input"));
		}
		input.setAttribute("key", key);
		input.setAttribute("value", val);
		input.setAttribute("label", label);
		input.setAttribute("path", path);
		input.onchange = function() {
			let [label, path, key] = [this.getAttribute("label"), this.getAttribute("path").split(","), this.getAttribute("key")];
			//TODO: switch statement for key? process different keys differently
			edit_instruction(label, path, key, this.value);
		}
		return span;
	}
}

function html_element_for_add_instruction(label, path, category) {
	let span = document.createElement("span");
	span.setAttribute("class", "add_instruction_button");
	span.innerText = "add"+{neighbor:"radar",become:"deployed_code",random:"casino"}[category];
	span.setAttribute("label", label);
	span.setAttribute("path", path);
	span.setAttribute("category", category);
	span.onclick = function() {
		add_instruction(this.getAttribute("label"), this.getAttribute("path").split(","), this.getAttribute("category"));
	}
	span.setAttribute("instructiontype", category);
	return span;
}

let board = [];
/*let canvas = document.querySelector("canvas");
let canvas_context = canvas.getContext("2d");*/
let table = document.querySelector("table");
let board_elements = [];

function initialize(height, width) {
	while (table.firstChild) table.firstChild.remove();
	//make the board
	generation_count = 0;
	board = [];
	for (let y = 0; y < height; y++) {
		board[y] = [];
		board_elements[y] = [];
		let tr = table.appendChild(document.createElement("tr"));
		for (let x = 0; x < width; x++) {
			board[y][x] = "empty";
			//board[y][x] = Object.keys(catalogue)[Math.floor(Math.random()*Object.keys(catalogue).length)];
			board_elements[y][x] = tr.appendChild(document.createElement("td"));
			board_elements[y][x].setAttribute("onmousedown", "click_cell("+y+","+x+");");
			board_elements[y][x].setAttribute("onmouseenter", "if (mousedown && brush_radius <= 3) click_cell("+y+","+x+");");
		}
	}
	board = JSON.parse(JSON.stringify(board));
	//do canvas things
	chips.dimensions.display_element.innerText = width+"x"+height;
	chips.generations.display_element.innerText = 0;
}

function in_bounds(y, x) {
	if (y < 0 || x < 0) return false;
	if (y >= board.length || x >= board[y].length) return false;
	return true;
}

let brush_radius = 1;

function click_cell(y, x) {
	if (!selected_celltype) return;
	for (let y2 = y - brush_radius; y2 <= y + brush_radius; y2++) {
		for (let x2 = x - brush_radius; x2 <= x + brush_radius; x2++) {
			if (!in_bounds(y2, x2)) continue;
			board[y2][x2] = selected_celltype;
			display_cell(y2, x2);
		}
	}
	track_stats();
}

let generation_count = 0;
function display_table() {
	for (let y = 0; y < board.length; y++)
		for (let x = 0; x < board[y].length; x++)
			display_cell(y, x);
	track_stats();
}
function display_cell(y, x) {
	board_elements[y][x].innerText = catalogue[board[y][x]].material_text;
	board_elements[y][x].style.color = catalogue[board[y][x]].color;
	//board_elements[y][x].style.transform = "translate("+Math.floor(Math.random()*3-1)+"px,"+Math.floor(Math.random()*3-1)+"px)";
}
function track_stats() {
	let counts = {};
	for (label of Object.keys(catalogue)) counts[label] = 0;
	for (let y = 0; y < board.length; y++) for (let x = 0; x < board[y].length; x++) {
		counts[board[y][x]]++;
	}
	for (label of Object.keys(catalogue)) {
		counts[label] /= board.length * board[0].length;
		catalogue[label].stat_bar.style.width = counts[label]*100+"%";
		catalogue[label].stat_bar.style.color = catalogue[label].stat_bar.offsetWidth < 32 ? "#00000000" : "#000";
	}
}

function generation() {
	let before_time = Date.now();
	let new_board = JSON.parse(JSON.stringify(board));
	//do calculations
	for (let y = 0; y < board.length; y++) for (let x = 0; x < board[y].length; x++) {
		let result = what_tile(y, x, catalogue[board[y][x]].instructions);
		if (result) new_board[y][x] = result; //if instructions ended up giving us a state, do that
	}
	//replace board
	board = new_board;
	generation_count++;
	chips.generations.display_element.innerText = generation_count;
	chips.mspt.display_element.innerText = Date.now() - before_time + "mspt";
	display_table();
}

function what_tile(y, x, instructions) { //what tile should (y, x) become (on board, following these instructions). possibly recursive
	for (instruction of instructions) {
		switch (instruction.type) {
			case "become":
				return instruction.tile;
				break;
			case "neighbor":
				let count = 0;
				for ([dy, dx] of neighborhoods[instruction.neighborhood]) {
					let [y2, x2] = [y + dy, x + dx];
					if (y2 < 0 || y2 >= board.length || x2 < 0 || x2 >= board[y2].length) continue;
					if (instruction.seeking.includes(board[y2][x2])) {
						count++;
					}
				}
				if (instruction.matches.includes(count)) {
					let result = what_tile(y, x, instruction.instructions);
					if (result) return result;
				}	
				break;
			case "random":
				if (Math.random() < instruction.probability) {
					let result = what_tile(y, x, instruction.instructions);
					if (result) return result;
				}
				break;
		}
	}
	return null;
}

//create the chips
let chips = {
	brush_size: {material_text: "format_paint", html_content: '<input type="range" min="0" max="4" value="1" id="input_brush_radius" oninput="brush_radius = this.value == 4 ? Math.max(board.length, board[0].length) : parseInt(this.value); this.parentElement.parentElement.querySelector(\'span.material\').innerText = this.value == 4 ? \'colors\' : \'format_paint\'">', color: color_revise("#000")},
	dimensions: {material_text: "grid_view", color: "#ec3"},
	generations: {material_text: "timer", color: "#c3e"},
	mspt: {material_text: "speed", hidden: true},
	nextframe: {tiny: true, material_text: "arrow_forward", onclick: "if (!running) generation();", color: "#4d6"},
	pause: {tiny: true, material_text: "pause", onclick: "running = !running; this.querySelector('span.material').innerText = running ? 'pause' : 'play_arrow'; document.querySelector('#display').style.outlineColor = running ? '#444' : '#333'", color: "#f25"},
	info: {tiny: true, material_text: "info", onclick: "window.open('info', '_blank');", color: "#3df"},
};
function make_chips() {
	for (chip_label of Object.keys(chips)) {
		let chip = chips[chip_label];
		let span = document.querySelector("#chips").appendChild(document.createElement("span"));
		span.setAttribute("class", "chip");
		if (chip.hidden) span.style.display = "none";
		let material = span.appendChild(document.createElement("span"));
		material.setAttribute("class", "material");
		material.innerText = chip.material_text;
		//material.style.color = chip.color ? chip.color : "#888";
		chip.material_element = material;
		if (chip.tiny) {
			chip.display_element = chip;
			span.setAttribute("class", "chip right");
			span.setAttribute("onclick", chip.onclick);
		} else {
			let span2 = span.appendChild(document.createElement("span"));
			chip.display_element = span2;
			if (chip.html_content) chip.display_element.innerHTML = chip.html_content
		}
	}
}

//make statistic bars
for (label of Object.keys(catalogue)) {
	catalogue[label].stat_bar = document.querySelector("#statistics").appendChild(document.createElement("span"));
	catalogue[label].stat_bar.style.backgroundColor = color_revise(catalogue[label].color);
	catalogue[label].stat_bar.innerHTML = label == "empty" ? "&nbsp;" : catalogue[label].material_text;
}

let running = true;
make_chips();
initialize(30, 40);
display_table();
make_object_selector();
for (input_range of document.querySelectorAll("input[type=\"range\"]")) input_range.value = input_range.getAttribute("value");
setInterval(function() {
	if (running) generation(); //actively_editing check could go here...
}, 150);