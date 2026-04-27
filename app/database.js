const {Client} = require('pg')

const client = new Client ({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "password", //Use the password you used to set up pgAdmin
    database: "dss_DB"
})

client.connect();

client.query('Select * from users', (err, res)=>{
    if(!err){
        console.log(res.rows);
    } else{
        console.log(err.message);
    }
    client.end
    
})

//npm install pg