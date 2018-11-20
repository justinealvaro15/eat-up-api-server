const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const api = express();
const cors = require('cors');
const moment = require('moment');

// create connection to database
const dbUsername = 'admin';
const dbPassword = 'admin123';
let database;
const databaseUrl = `mongodb://${dbUsername}:${dbPassword}@ds255403.mlab.com:55403/eatup`;


MongoClient.connect(databaseUrl, {useNewUrlParser: true}, function (err, client) {
  if (err) throw err;
  
  database = client.db('eatup');
});

// configure  server
const serverPort = 3000;

api.use(cors())
api.use(function (req, res, next) {
  console.log(`[${moment().format('MMMM Do YYYY, h:mm:ss a')}]: ${req.url}`);

  next();
})

// configure routes for api
api.get('/api/shops', (request, response) => {
  database.collection('shops').find().toArray((err, result) => {
    if (err) throw err;

    response.send(result);
  })
});

api.get('/api/shops/topten', (request, response) => {
  database.collection('shops').find().sort({ fe_avg_rating: -1 }).limit(10).toArray((err, result) => {
    if (err) throw err;

    // result.sort((shopA, shopB) => {
    //   shopA.fe_avg_rating = shopA.fe_avg_rating || 0;
    //   shopB.fe_avg_rating = shopB.fe_avg_rating || 0;

    //   if (shopA.fe_avg_rating > shopB.fe_avg_rating) {
    //     return -1;
    //   }
    //   if (shopA.fe_avg_rating < shopB.fe_avg_rating) {
    //     return 1;
    //   }

    //   return 0;
    // });

    response.send(result);
  })
});

api.get('/api/shops/newest', (request, response) => {
  database.collection('shops').find().sort({ fe_id: -1 }).collation({locale: "en_US", numericOrdering: true}).limit(10).toArray((err, result) => {
    if (err) throw err;

    response.send(result);
  })
});

api.get('/api/shops/:shopId', (request, response) => {
  const query = {
    fe_id: request.params.shopId
  }
  database.collection('shops').find(query).toArray((err, result) => {
    if (err) throw err;

    response.send(result);
  })
});

api.get('/api/shops/:shopId/consumables', (request, response) => {
  const query = {
    shopId: request.params.shopId
  }
  database.collection('consumables').find(query).toArray((err, result) => {
    if (err) throw err;

    response.send(result);
  })
});



// start server

api.listen(serverPort, '0.0.0.0');
console.log(`Server listening at port ${serverPort}`);


// NOTES
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