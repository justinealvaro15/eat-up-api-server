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

  // console.log(`Connection to database successful!`);
  // // GET DATA
  // const query1 = {
  //   _id: '0002'
  // };
  // database.collection('consumables').find().toArray((err, result) => {
  //   if (err) throw err;

  //   console.log(result);
  // });

  // database.collection('shops').find().toArray((err, result) => {
  //   if (err) throw err;

  //   console.log(result);
  // });

  // // // UPDATE DATA
  // // const query2 = {
  // //   _id: '0002'
  // // };

  // // const newval2 = {
  // //   $set: {
  // //     type: 'Food',
  // //     price: 30,
  // //     name: 'Dalandan',
  // //     amount: '300mL'
  // //   }
  // // };


  // // database.collection('consumables').updateOne(query2, newval2, (err, result) => {
  // //   if (err) throw err;

  // //   console.log('Updated successfully!');
  // // });

  // // DELETE DATA
  // const query3 = {
  //   _id: '0003'
  // };

  // database.collection('shops').deleteOne(query3, (err, result) => {
  //   if (err) throw err;

  //   console.log('Deleted successfully!');
  // });

  // // ADD DATA
  // const addval1 = {
  //   _id: '0003',
  //   name: 'Tita Carmen\'s',
  //   type: 'Stall',
  //   estimatedAddress: 'Magsaysay St., Diliman, Quezon City, Metro Manila',
  //   contact: {person: 'Carmen Olivares', number: '09921334412'},
  //   operation: {hour: null, days: null},
  //   consumables_id: ['0002', '0003']
  // };

  // database.collection('shops').insertOne(addval1, (err, result) => {
  //   if (err) throw err;

  //   console.log('Inserted successfully!!');
  // });

  // // database.collection('shops').find().toArray((err, result) => {
  // //   if (err) throw err;

  // //   console.log(result);
  // // });

  // database.collection('shops').find().toArray((err, result) => {
  //   if (err) throw err;

  //   console.log(result);
  // });
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
api.get('/api/shops', (requst, respose) => {
  database.collection('shops').find().toArray((err, result) => {
    if (err) throw err;

    respose.send(result);
  })
});

api.get('/api/shops/:shopId', (requst, respose) => {
  const query = {
    shopId: requst.params.shopId
  }
  database.collection('shops').find(query).toArray((err, result) => {
    if (err) throw err;

    respose.send(result);
  })
});

api.get('/api/shops/:shopId/consumables', (requst, respose) => {
  const query = {
    shopId: requst.params.shopId
  }
  database.collection('consumables').find(query).toArray((err, result) => {
    if (err) throw err;

    respose.send(result);
  })
});


// start server

api.listen(serverPort, '0.0.0.0');
console.log(`Server listening at port ${serverPort}`);
