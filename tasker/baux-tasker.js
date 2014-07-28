// Globals
var baux_couch = "https://gt.iriscouch.com/";
var baux_jquery = "https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js";
var baux_aes = "https://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/aes.js";
var baux_sha1 = "https://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/sha1.js";
var baux_deps = [baux_jquery, baux_aes, baux_sha1];

// Load javascript
function baux_load_scripts()
{
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
	var callback = baux_load_scripts;
 
	script.type = 'text/javascript';
    script.src = baux_deps.shift();
	
	if (baux_deps.length == 0) {
		callback = baux_load;
	}

    script.onreadystatechange = callback;
    script.onload = callback;

    head.appendChild(script);
}

// Load from CouchDB
function baux_load() {
	var baux_hash = CryptoJS.SHA1(baux_key);

	$.ajax({
		url: baux_couch + "baux/" + baux_hash,
		dataType: "json",
		success: function(data) {
			content = CryptoJS.AES.decrypt(data.content, baux_key).toString(CryptoJS.enc.Utf8);
			tk.setGlobal("BauxNote", content);
			tk.flash("Baux copied to clipboard");
			tk.exit();
		},
		error: function(data) {
			tk.flash("Baux failed");
			tk.exit();
		}
	});
}

// Load dependencies
baux_load_scripts();