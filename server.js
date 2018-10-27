const MongoClient = require('mongodb').MongoClient;
const express = require('express')
const api = express();
const cors = require('cors')


// create connection to database
const dbUsername = 'admin';
const dbPassword = 'admin123';
let database;
const databaseUrl = `mongodb://${dbUsername}:${dbPassword}@ds231643.mlab.com:31643/food-hunter-poc`;

MongoClient.connect(databaseUrl, function (err, client) {
  if (err) throw err

  database = client.db('food-hunter-poc');

  console.log(`Connection to database successful!`);
  // const query = {
  //   shopId: '0001'
  // }
  // database.collection('consumables').find(query).toArray((err, result) => {
  //   if (err) throw err

  //   console.log(result);
  // })
  // database.collection('shops').find().toArray((err, result) => {
  //   if (err) throw err

  //   console.log(result);
  // })
});

// configure  server
const serverPort = 3000;

api.use(cors())
api.use(function (req, res, next) {
  console.log(`[${Date.now()}]: ${req.url}`)
  next()
})
// api.options('*', cors())


// configure routes for api
api.get('/shops', (requst, respose) => {
  database.collection('shops').find().toArray((err, result) => {
    if (err) throw err

    respose.send(result);
  })
});

api.get('/shops/:shopId', (requst, respose) => {
  const query = {
    shopId: requst.params.shopId
  }
  database.collection('shops').find(query).toArray((err, result) => {
    if (err) throw err

    respose.send(result);
  })
});

api.get('/shops/:shopId/consumables', (requst, respose) => {
  const query = {
    shopId: requst.params.shopId
  }
  database.collection('consumables').find(query).toArray((err, result) => {
    if (err) throw err

    respose.send(result);
  })
});


// start server

api.listen(serverPort, '0.0.0.0');
console.log(`Server listening at port ${serverPort}`);
