function readMultipleFiles(evt) {
    //Retrieve all the files from the FileList object
    var files = evt.target.files;

    if (files) {
        for (var i = 0, f; f = files[i]; i++) {
            console.log("Entrou loop");
            var r = new FileReader();
            r.onload = (function(f) {
                return function(e) {

                    var contents = JSON.parse(e.target.result);
                    var page = new Page();

                    page.parseStories(contents);

                };
            })(f);

            r.readAsText(f);
            console.log("loop");
        }
        console.log("saiu loop");
    } else {
        alert("Failed to load files");
    }
}

document.getElementById('fileinput').addEventListener('change', readMultipleFiles, false);
