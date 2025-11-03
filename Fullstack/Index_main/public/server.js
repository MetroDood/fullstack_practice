    var http = require('http');
    var express = require('express');

    var app = express();

    // Serve files from the "public" directory
    app.use(express.static('./public'));

    // Create and start the server
    var server = http.createServer(app);
    server.listen(3000);

    console.log('Server running at http://localhost:3000');
