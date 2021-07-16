const express = require("express");

const bodyParser = require("body-parser");

const mysql = require("mysql");

require("dotenv").config();

const app = express();

const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.set("view engine", "ejs");

const pool = mysql.createPool({
    multipleStatements: true,
    connectionLimit : 100,
    host            : process.env.DB_HOST,
    user            : process.env.DB_USER,
    password        : "",
    database        : process.env.DB_NAME
})

app.get("/",function(req,res){
    res.render("index");
});

app.get("/view-customers",function(req,res){
    pool.getConnection((err,connection)=>{
        if (err) throw err;
        // console.log("Connection to DB " + connection.threadId);
        connection.query('SELECT * FROM `customers`',(err,rows)=>{
            connection.release();

            if (!err){
                res.render("customers",{rows : rows});
            }
            else{
                console.log(err);
            }
        })
    })
});

app.get("/transfer-money",function(req,res){
    pool.getConnection((err,connection)=>{
        if (err) throw err;
        // console.log("Connection to DB " + connection.threadId);

        connection.query('SELECT * FROM `customers`',(err,rows)=>{
            connection.release();

            if (!err){
                res.render("transferMoney",{rows : rows});
            }
            else{
                console.log(err);
            }
        })
    })
});

app.get("/user-details/:id",function(req,res){
    var err = null;
    // var connection = mysql.createConnection({multipleStatements: true});
    pool.getConnection((err,connection)=>{
        if (err) throw err;
        // console.log("Connection to DB " + connection.threadId);
        connection.query('SELECT * FROM `customers` WHERE id = ? ; SELECT * FROM `customers` WHERE id != ?',[req.params.id , req.params.id],(err,results)=>{
            connection.release();

            if (!err){
                res.render("userDetails",{results : results , error : err});
            }
            else{
                console.log(err);
            }
        })
    })
});

app.post("/user-details/:id",function(req,res){
    // var err = null;
    const {receiver , amount , sender , amountS} = req.body;

    let amountS1 = parseInt(amountS) - parseInt(amount);

    if (amountS1 < -1){
        pool.getConnection((err,connection)=>{
            if (err) throw err;
            // console.log("Connection to DB " + connection.threadId);
            connection.query('SELECT * FROM `customers` WHERE id = ? ; SELECT * FROM `customers` WHERE id != ?',[req.params.id , req.params.id],async(err,results)=>{
                connection.release();
    
                if (!err){
                    var err = await new Error ("Insufficient Balance !");
                    res.render("userDetails",{results : results , error : err});
                }
                else{
                    console.log(err);
                }
            })
        })
    }

    else if (!amount){
        pool.getConnection((err,connection)=>{
            if (err) throw err;
            // console.log("Connection to DB " + connection.threadId);
            connection.query('SELECT * FROM `customers` WHERE id = ? ; SELECT * FROM `customers` WHERE id != ?',[req.params.id , req.params.id],async(err,results)=>{
                connection.release();
    
                if (!err){
                    var err = await new Error ("Please Enter The Amount.");
                    res.render("userDetails",{results : results , error : err});
                }
                else{
                    console.log(err);
                }
            })
        })
    }

    else if (parseInt(amount) == 0){
        pool.getConnection((err,connection)=>{
            if (err) throw err;
            // console.log("Connection to DB " + connection.threadId);
            connection.query('SELECT * FROM `customers` WHERE id = ? ; SELECT * FROM `customers` WHERE id != ?',[req.params.id , req.params.id],async(err,results)=>{
                connection.release();
    
                if (!err){
                    var err = await new Error ("Amount Cannot Be Zero.");
                    res.render("userDetails",{results : results , error : err});
                }
                else{
                    console.log(err);
                }
            })
        })
    }

    // var amountR1 = amountR + amount;

    else{
        // const {receiver , amount , sender , amountS} = req.body;

        // let amountS1 = amountS - amount;
        pool.getConnection((err,connection)=>{
            if (err) throw err;
            // console.log("Connection to DB " + connection.threadId);
            let sql = 'INSERT INTO transactions (sender, receiver, balance) VALUES("'+ sender +'" , "'+ receiver +'" , "'+ amountS1 +'")';
            connection.query(sql,(err,rows)=>{
                connection.release();
    
                if (!err){
                    pool.getConnection((err,connection)=>{
                        if (err) throw err;
                        // console.log("Connection to DB " + connection.threadId);
                
                        connection.query('SELECT * FROM `customers` WHERE name = ?',[receiver],(err,rows)=>{
                            connection.release();
                
                            if (!err){
                                console.log(rows[0]);
                                const {receiver , amount , sender , amountS} = req.body;
                                pool.getConnection((err,connection)=>{
                                    if (err) throw err;
                                    // console.log("Connection to DB " + connection.threadId);
                                    console.log(rows[0]);
                                    console.log(amount);
                                    connection.query('UPDATE `customers` SET balance = ? WHERE name = ? ; UPDATE `customers` SET balance = ? WHERE name = ?',[ rows[0].balance + parseInt(amount) , receiver , amountS1 , sender ],(err,rows)=>{
                                        connection.release();
                            
                                        if (!err){
                                            pool.getConnection((err,connection)=>{
                                                if (err) throw err;
                                                // console.log("Connected to DB " + connection.threadId);

                                                console.log(rows.balance);
                                        
                                                connection.query('SELECT * FROM `transactions`', (err,rows)=>{
                                                    connection.release();
                                        
                                                    if (!err){
                                                        res.render("test",{rows : rows});
                                                    }
                                                    else {
                                                        console.log(err);
                                                    }
                                                    // console.log("Data from mysql server is : \n" + rows[0].date.toString().substring(0,15));
                                                })
                                            });
                                        }
                                        else{
                                            console.log(err);
                                        }
                                    })
                                })
                            }
                            else{
                                console.log(err);
                            }
                        })
                    })
                }
                else{
                    console.log(err);
                }
            })
        })
    }
});

app.get("/transfer-history",function(req,res){
    pool.getConnection((err,connection)=>{
        if (err) throw err;
        console.log("Connected to DB " + connection.threadId);

        connection.query('SELECT * FROM `transactions`', (err,rows)=>{
            connection.release();

            if (!err){
                res.render("test",{rows : rows});
            }
            else {
                console.log(err);
            }
            // console.log("Data from mysql server is : \n" + rows[0].date.toString().substring(0,15));
        })
    });
})

app.listen(port || process.env.PORT, function(){
    console.log(`Server is running on port ${port}`);
})