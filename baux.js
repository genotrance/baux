// Globals
var baux_dirty = false;
var baux_dbox = "https://genotrance.github.io/baux/";
var baux_couch = "http://gt.iriscouch.com/";
var baux_jquery = "https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js";
var baux_aes = "https://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/aes.js";
var baux_sha1 = "https://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/sha1.js";
var baux_cookie = "https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js";
var baux_keyhelp = "Pick a unique key for this note";
var baux_key = "";
var baux_hash = "";
var baux_rev = "";
var baux_note = null;
var baux_deps = [baux_jquery, baux_aes, baux_sha1, baux_cookie];
var baux_mobile = window.matchMedia("only screen and (max-width: 760px)");

// HTML
var baux_gui =
	'<div id="baux_popup" name="baux_popup">' +
		'<textarea id="baux_note_data" name="baux_note_data"></textarea><br/>' +
		'<a class="baux_a" href="#" onclick="$(\'#baux_popup\').remove();return false;">Close</a> ' +
		'<a class="baux_a" href="#" onclick="$(\'#baux_note_data\').select().focus();return false;">Select All</a> ' +
		'<a class="baux_a" href="#" onclick="baux_load();return false;">Reload</a> ' +
		'<a class="baux_a" id="baux_perm" href="#" onclick="return false;">Permalink</a> ' +
		'<input type="text" name="baux_key" id="baux_key"></input> ' +
		'<div id="baux_message" name="baux_message"></div>' +
	'</div>';

// Load javascript
function baux_load_scripts()
{
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
	var callback = baux_load_scripts;
 
	script.type = 'text/javascript';
    script.src = baux_deps.shift();
	
	if (baux_deps.length == 0) {
		callback = baux_initialize;
	}

    script.onreadystatechange = callback;
    script.onload = callback;

    head.appendChild(script);
}

// Initialization routine
function baux_initialize() {
	baux_setup_gui();
	baux_bind_events();
	baux_setup_couch();
	baux_save();
}

// Add elements
function baux_setup_gui() {
	$('head').append('<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">');
	
	$("body").append($(baux_gui));
	
	$("#baux_popup").css({
		"font-family": "Arial",
		"font-size": "11",
		"position": "absolute",
		"z-index": "2147483638",
		"top": "10px",
		"left": "10px",
		"width": $(window).width()-30,
		"height": $(window).height()-30,
		"border": "1px solid black",
		"padding": "5px",
		"text-align": "left",
		"background-color": "white",
		"opacity": 1,
		"filter": "alpha(opacity=100)",
		"-moz-opacity": 1, 
	});
	
	$("#baux_message").css({
		"display": "inline",
		"font-family": "Arial",
		"font-size": "11",
		"color": "white",
		"background-color": "red"
	});
	
	$("#baux_key").css({
		"font-family": "Arial",
		"font-size": "10",
		"width": "30%",
		"padding": "0px",
		"margin": "5px"
	});
	
	$(".baux_a").css({
		"font-family": "Arial",
		"font-size": "10",
		"color": "blue",
		"text-decoration": "underline",
	});

	baux_note = $("#baux_note_data");
	baux_note.css({
		"font-family": "Arial",
		"font-size": "10",
		"width": "100%",
		"height": "95%",
		
		"-webkit-box-sizing": "border-box",
		"-moz-box-sizing": "border-box",
		"box-sizing": "border-box",
	});
	baux_note.focus();
}

// Bind events
function baux_bind_events() {
	$(document).bind('beforeunload', baux_save);
	$(window).bind('resize', baux_resize);
	$(document).bind('resize', baux_resize);
	$("#baux_key").bind("change", baux_key_change);
	baux_note.bind("input propertychange", baux_mark);
}

// Resize window
function baux_resize() {
	$("#baux_popup").css({
		"width": $(window).width()-30,
		"height": $(window).height()-30,
	});
}

// Note data has changed
function baux_mark(inst) {
	$('#baux_message').html("Saving...");
	$('#baux_message').show();
	baux_dirty = true;
};

// Key has changed
function baux_key_change() {
	var val = $("#baux_key").val();
	if (val == baux_keyhelp || val == "") {
		baux_note.prop("readonly", true);
		return;
	}
	
	$(location).attr("hash", "#" + $("#baux_key").val());
	$.cookie("baux_key", $("#baux_key").val(), {expires: 365, path: "/"});
	
	baux_setup_couch();
}

// Setup CouchDB backend
function baux_setup_couch() {
	// URL or Input
	baux_key = decodeURIComponent($(location).attr("hash"));
	
	// Cookie
	if (baux_key == "") {
		baux_key = $.cookie("baux_key");
	} else {
		baux_key = baux_key.replace("#", "");
	}
	
	if (baux_key == undefined || baux_key == "") {
		$("#baux_key").val(baux_keyhelp);
		baux_note.prop("readonly", true);
		return;
	} else {
		baux_note.prop("readonly", false);
	}

	if (baux_mobile.matches) {
		baux_note.prop("readonly", true);
	}
	
	$("#baux_perm").attr("href", baux_dbox + "#" + encodeURIComponent(baux_key));
	$("#baux_key").val(baux_key);
	baux_hash = CryptoJS.SHA1(baux_key);
	
	baux_load();
}

// Load from CouchDB
function baux_load() {
	$('#baux_message').html("Loading...");
	$('#baux_message').show();

	$.ajax({
		url: baux_couch + "baux/" + baux_hash,
		dataType: "json",
		success: function(data) {
			var content = CryptoJS.AES.decrypt(data.content, baux_key).toString(CryptoJS.enc.Utf8);
			baux_note.val(content);
			baux_rev = data._rev;
			$("#baux_message").hide(500);
		},
		error: function(data) {
			baux_note.val("");
			$("#baux_message").hide(500);
		}
	});
}

// Save contents to CouchDB
function baux_save() {
    if (baux_dirty == true) {
		var data = {"content": CryptoJS.AES.encrypt(baux_note.val(), baux_key).toString()};
		if (baux_rev != "") {
			data["_rev"] = baux_rev;
		}
		$.ajax({
			url: baux_couch + "baux/" + baux_hash,
			type: "PUT",
			data: JSON.stringify(data),
			contentType: "application/json",
			success: function(data) {
				$("#baux_message").hide(500);
				baux_dirty = false;
				$.getJSON(baux_couch + "baux/" + baux_hash, function(data) {
					baux_rev = data._rev;
				});
			}
		});
    }

    // Auto save after 10 seconds
    setTimeout(baux_save, 10000);
}

// Load dependencies
baux_load_scripts();