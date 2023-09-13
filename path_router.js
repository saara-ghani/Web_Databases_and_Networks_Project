const express = require('express');
const pool = require('./db');
const router = express.Router();

// Adding the Multer middle-ware
const multer = require('multer');
const upload = multer({dest: 'public/images'});

// Adding an HTML body-parser
const bodyParser = require('body-parser')
router.use(bodyParser.text({ type: 'text/html',  }));

// Saving the Picture
const fs = require('fs');
const path = require('path');

// File Upload Middleware
const fileUpload = require('express-fileupload');
router.use(fileUpload({limits: { fileSize: 50 * 1024 * 1024 }}));


router.get('/', async (req, res) => {
    res.redirect('/birds/')
});

// BIRDS ROUTER
router.get('/birds/', async (req, res) => {
    conservation_status_data = []

    /* conservation status from mysql */
    const db = pool.promise();
    const status_query = `SELECT * FROM ConservationStatus;`
    try {
        const [rows, fields] = await db.query(status_query);
        conservation_status_data = rows;
    } catch (err) {
        console.error("You havent set up the database yet!");
    }

    const db_bird = pool.promise();
    const status_query_bird =  `SELECT * 
                                FROM Bird 
                                LEFT JOIN Photos 
                                ON Bird.bird_id=Photos.bird_id
                                LEFT JOIN ConservationStatus
                                ON Bird.status_id=ConservationStatus.Status_id
                                ORDER BY Bird.bird_id DESC;`
    try {
        const [rows, fields] = await db_bird.query(status_query_bird);
        bird_data = rows;
    } catch (err) {
        console.error("You havent set up the database yet!");
    }

    res.render('index', { title: 'Birds of Aotearoa', birds: bird_data, status: conservation_status_data });


});

// CREATE BIRD - GET
router.get('/birds/create/', async (req, res) => {
    conservation_status_data = []

    /* conservation status from mysql */
    const db = pool.promise();
    const status_query = `SELECT * FROM ConservationStatus;`
    try {
        const [rows, fields] = await db.query(status_query);
        conservation_status_data = rows;
    } catch (err) {
        console.error("You havent set up the database yet!");
        res.render('404-page');
    }

    res.render('create', {title: 'Birds of Aotearoa', status: conservation_status_data })
});

// CREATE BIRD - POST
router.post('/birds/create/', async (req, res) => {
    const db = pool.promise();

    const photo_filename = req.files.bird_picture.name;
    let uploadPath = path.join(__dirname, 'public', 'images', photo_filename);

    try {
        fs.writeFile(uploadPath, req.files.bird_picture.data, (err) => {
            if (err) {console.error('Error while saving image:', err);
            res.render('404-page');}
        });
    } catch (error) {console.error('Error while saving image:', error);
    res.render('404-page');}

    var new_file_name = "";
    let counter = 1;

    while (fs.existsSync(uploadPath)) {
        const ext = photo_filename.split('.').pop();
        new_file_name = photo_filename.replace(".", "").replace(ext, "");
        new_file_name = `${new_file_name}(${counter}).${ext}`;
        uploadPath = path.join(__dirname, 'public', 'images', new_file_name);
        counter ++;
    }


    const { primary_name, english_name, scientific_name, order_name, family, 
        length, weight, photographer, status_name} = req.body;

    const bird_query =
    `SELECT status_id 
    FROM ConservationStatus
    WHERE status_name = ? 
    INTO @status_id;

    SELECT MAX(bird_id) + 1 
    INTO @new_bird_id
    FROM Bird;

    INSERT INTO Bird (bird_id, primary_name, english_name, scientific_name, order_name, family, 
        weight, length, status_id)
    VALUES (@new_bird_id, ?, ?, ?, ?, ?, ?, ?, @status_id);
    
    INSERT INTO Photos (bird_id, filename, photographer) 
    VALUES (@new_bird_id, ?, ?);`

    await db.query(bird_query, [status_name, primary_name, english_name, 
    scientific_name, order_name, family, weight, length, photo_filename, photographer]);

    res.redirect('/birds')
});

// VIEW BIRD
router.get('/:id/', async (req, res) => {
    console.log("404 error entered")
        conservation_status_data = []
    
        /* conservation status from mysql */
        const db = pool.promise();
        const status_query = `SELECT * FROM ConservationStatus;`
        try {
            const [rows, fields] = await db.query(status_query);
            conservation_status_data = rows;
        } catch (err) {
            console.error("You havent set up the database yet!");
        }

        const db_bird = pool.promise();
        const id = req.params.id;

        const status_query_bird =  
        `SELECT * 
        FROM Bird 
        LEFT JOIN Photos 
        ON Photos.bird_id = ?
        LEFT JOIN ConservationStatus
        ON Bird.status_id=ConservationStatus.Status_id
        WHERE Bird.bird_id = ?;`
        try {
            const [rows, fields] = await db_bird.query(status_query_bird, [id, id]);
            bird_data = rows;
            if (bird_data.length < 1) {
                res.render('404-page');
            }
        } catch (err) {
            console.error("You havent set up the database yet!");
            res.render('404-page');
        }

        res.render('index', { title: 'Birds of Aotearoa', birds: bird_data, status: conservation_status_data });
    
});

// UPDATE BIRD - GET
router.get('/birds/:id/update/', async (req, res) => {
    conservation_status_data = []

    /* conservation status from mysql */
    const db = pool.promise();
    const status_query = `SELECT * FROM ConservationStatus;`
    try {
        const [rows, fields] = await db.query(status_query);
        conservation_status_data = rows;
    } catch (err) {
        console.error("You havent set up the database yet!");
        res.render('404-page');
    }
    
    // Upload MYSQL Database
    const db_bird = pool.promise();
    const id = req.params.id;

    const status_query_bird =  
    `SELECT * 
    FROM Bird 
    LEFT JOIN Photos 
    ON Photos.bird_id = ?
    LEFT JOIN ConservationStatus
    ON Bird.status_id=ConservationStatus.Status_id
    WHERE Bird.bird_id = ?;`
    try {
        const [rows, fields] = await db_bird.query(status_query_bird, [id, id]);
        bird_data = rows;
    } catch (err) {
        console.error("You havent set up the database yet!");
        res.render('404-page');
    }
    //
    
    /* bind data to the view (index.ejs) */
    res.render('edit-index', { title: 'Birds of Aotearoa', birds: bird_data, status: conservation_status_data });

});

// UPDATE BIRD - POST
router.post('/birds/:id/update/', async (req, res) => {
    const db = pool.promise();

    let photo_filename = ""

    if (req.files !== null) {
        photo_filename = req.files.bird_picture.name;
        let uploadPath = path.join(__dirname, 'public', 'images', photo_filename);

        var new_file_name = "";
        let counter = 1;

        while (fs.existsSync(uploadPath)) {
            const ext = photo_filename.split('.').pop();
            new_file_name = photo_filename.replace(".", "").replace(ext, "");
            new_file_name = `${new_file_name}(${counter}).${ext}`;
            uploadPath = path.join(__dirname, 'public', 'images', new_file_name);
            counter ++;
          }

        try {
            fs.writeFile(uploadPath, req.files.bird_picture.data, (err) => {
                if (err) {console.error('Error while saving image:', err);
                res.render('404-page');}
            });
        } catch (error) {console.error('Error while saving image:', error);
        res.render('404-page');}

    } else {
        photo_filename = req.body.photo_source_original;

        var new_file_name = "";
        let counter = 1;

        while (fs.existsSync(uploadPath)) {
            const ext = photo_filename.split('.').pop();
            new_file_name = photo_filename.replace(".", "").replace(ext, "");
            new_file_name = `${new_file_name}(${counter}).${ext}`;
            uploadPath = path.join(__dirname, 'public', 'images', new_file_name);
            counter ++;
        }
    }

    const { bird_id, primary_name, english_name, scientific_name, order_name, family, 
    length, weight, photographer, status_name} = req.body;


    const bird_query =
    `SELECT status_id 
    FROM ConservationStatus
    WHERE status_name = ? 
    INTO @status_id;

    UPDATE Photos
    SET filename = ?, photographer = ?
    WHERE bird_id = ?;

    UPDATE Bird
    SET primary_name = ?, 
        english_name = ?, 
        scientific_name = ?, 
        order_name = ?, 
        family = ?, 
        weight = ?, 
        length = ?, 
        status_id=@status_id
    WHERE bird_id = ?;`
    

    await db.query(bird_query, [status_name, photo_filename, photographer, bird_id,
        primary_name, english_name, scientific_name, order_name, family, weight, length, bird_id]);

    res.redirect('/birds')
});

// DELETE BIRD
router.get('/birds/:id/delete/', async (req, res) => {
    const id = req.params.id;
    const db = pool.promise();

    const deletePhotoQuery = 'DELETE FROM Photos WHERE bird_id = ?';
    const deleteBirdQuery = 'DELETE FROM Bird WHERE bird_id = ?';

    try {
        await db.query(deletePhotoQuery, [id]);
        await db.query(deleteBirdQuery, [id]);
        res.redirect('/birds')
        
    } catch (err) {
        console.error("Something went wrong when deleting the bird.");
        res.render('404-page');
    }

});

module.exports = router;