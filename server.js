const express = require('express');
const path = require('path');

/* create the server */
const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* host public/ directory to serve: images, css, js, etc. */
app.use(express.static('public'));



/* path routing and endpoints */
app.use('/', require('./path_router'));
app.use('/birds/', require('./path_router')); // I ADDED THIS


/* start the server */
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});

// 404 Error
app.get('*', (request, response) => {
    response.render('404-page')
    console.log("404 error section entered")
});

