var express = require('express')
var app = express()
var mysql = require('mysql');


// Application initialization
var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'pwd'
    });


// Database setup
connection.query('CREATE DATABASE IF NOT EXISTS test', function (err) {
    if (err) throw err;
    connection.query('USE test', function (err) {
        if (err) throw err;
        connection.query('CREATE TABLE IF NOT EXISTS labels('
            + 'id INT NOT NULL AUTO_INCREMENT,'
            + 'PRIMARY KEY(id),'
            + 'timestamp BIGINT,'
            + 'app VARCHAR(200),'
            + 'version VARCHAR(20),'
            + 'host VARCHAR(200),'
            + 'path VARCHAR(500),'
            + 'unknown_classified VARCHAR(5000),'
            + 'partially_known_classified VARCHAR(5000),'
            + 'prev_labelled VARCHAR(5000)'
            +  ')', function (err) {
                if (err) throw err;
        });
        connection.query('CREATE TABLE IF NOT EXISTS purposes('
            + 'id INT NOT NULL AUTO_INCREMENT,'
            + 'PRIMARY KEY(id),'
            + 'timestamp BIGINT,'
            + 'app VARCHAR(200),'
            + 'version VARCHAR(20),'
            + 'host VARCHAR(200),'
            + 'path VARCHAR(500),'
            + 'purpose VARCHAR(5000)'
            +  ')', function (err) {
                if (err) throw err;
        });
        connection.query('CREATE TABLE IF NOT EXISTS rules(value VARCHAR(200), classifier VARCHAR(200), timestamp BIGINT)');
        connection.query('CREATE TABLE IF NOT EXISTS change_log(field VARCHAR(200), previous VARCHAR(200), new VARCHAR(200), timestamp BIGINT)');
        connection.query('CREATE TABLE IF NOT EXISTS already_classified(host VARCHAR(200), path VARCHAR(500), timestamp BIGINT)');
    });
});

// parse urlencoded request bodies into req.body
var bodyParser = require('body-parser');
// Add this line below
app.use(bodyParser.urlencoded({ extended: false })) 

app.use(bodyParser.json());

app.use(express.static('www'));


app.get("/rules", function(req, res) {
    connection.query('USE test', function (err) {
        if (err) throw err;
        connection.query("SELECT * FROM rules", function(err, rows){
            if(err) {
                throw err;
            } else {
                var obj = {
                    rules: rows
                };
                res.send(obj);
            }
        });
    });
});

app.get("/already_classified", function(req, res) {
    connection.query('USE test', function (err) {
        if (err) throw err;
        connection.query("SELECT * FROM already_classified", function(err, rows){
            if(err) {
                throw err;
            } else {
                var obj = {
                    al_classified: rows
                };
                res.send(obj);
            }
        });
    });
});

// Update MySQL database
app.post('/users', function (req, res) {
    console.log(req.body);
    var bool = req.body.skip;
    var app = req.body.app;
    var host = req.body.host;
    var path =  req.body.path;
    var version = req.body.version;
    var timestamp = req.body.timestamp;
    var purpose_dict = req.body.purposes;

    if (bool == 0){
        var unknown_classified = req.body.data_unknown_classified;
        var partially_known_classified = req.body.data_partially_known_classified;
        var prev_labelled = req.body.data_prev_labelled;
        var rules = req.body.rules_dict;
        var change_logs = req.body.data_change_log

        var sql = "INSERT INTO labels SET app='"+ app + "', version='" + version + "', host='"+ host + "', timestamp='"+ timestamp + "', path='" + path + "', unknown_classified='"+unknown_classified+ "', partially_known_classified='"+partially_known_classified+ "', prev_labelled='"+prev_labelled+"'";
        connection.query(sql, 
            function (err, result) {
                if (err) throw err;
            }
        );
        var sql = "INSERT INTO purposes SET app='"+ app + "', version='" + version + "', host='"+ host + "', timestamp='"+ timestamp + "', path='" + path + "', purpose='"+purpose_dict+"'";
        connection.query(sql, 
            function (err, result) {
                if (err) throw err;
            }
        );
        var sql = "INSERT INTO already_classified SET host='"+ host + "', timestamp='"+ timestamp + "', path='" + path + "'";
        connection.query(sql, 
            function (err, result) {
                if (err) throw err;
            }
        );

        for (key in rules) {
            var sql = "INSERT INTO rules SET value='"+ key + "', timestamp='" + timestamp + "', classifier='" + rules[key] + "'";
            connection.query(sql, 
                function (err, result) {
                    if (err) throw err;
                }
            );
        }
        for (row in change_logs) {
            var sql = "INSERT INTO change_log SET field='"+ change_logs[row][0] + "', timestamp='"+ timestamp + "', previous='" + change_logs[row][1] + "', new='" + change_logs[row][2] + "'";
            connection.query(sql, 
                function (err, result) {
                    if (err) throw err;
                }
            );
        }
    }
    
    res.send("success")
});

var server = app.listen(9000, function () {

    var host = server.address().address
    var port = server.address().port

    console.log('Express app listening at http://%s:%s', host, port)

})