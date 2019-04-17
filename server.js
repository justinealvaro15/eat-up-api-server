const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const api = express();
const cors = require('cors');
const moment = require('moment');
const bodyParser = require('body-parser');
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
api.use(bodyParser.json({limit: '50mb', extended: true}));

// configure routes for api

//// GET USERS 
api.get('/api/users', (request, response) => {
  database.collection('users').find().toArray((err, result) => {
    if (err) throw err;

    response.send(result);
  })
});

//// ADD SHOP
api.post('/api/add_shop', (request, response) => {
  database.collection('shops').insertOne(request.body, (err, result) => {
    if(err) throw err;
  });
});

//// GET ALL SHOPS
api.get('/api/shops', (request, response) => {
  database.collection('shops').find().toArray((err, result) => {
    if (err) throw err;

    response.send(result);
  })
});

//// GET SHOPS SORTED BY RATINGS
api.get('/api/shops/topten', (request, response) => {
  database.collection('shops').find().sort({ fe_avg_rating: -1 }).limit(10).toArray((err, result) => {
    if (err) throw err;

    response.send(result);
  })
});

//// GET SHOPS SORTED BY SHOP ID
api.get('/api/shops/newest', (request, response) => {
  database.collection('shops').find().sort({ fe_id: -1 }).collation({locale: "en_US", numericOrdering: true}).limit(10).toArray((err, result) => {
    if (err) throw err;

    response.send(result);
  })
});

//// GET SHOP WITH HIGHEST SHOP ID
api.get('/api/shops/highest', (request, response) => {
  database.collection('shops').find().sort({ fe_id: -1 }).collation({locale: "en_US", numericOrdering: true}).limit(1).toArray((err, result) => {
    if (err) throw err;
    // console.log(result);
    response.send(result);
  })
});

//// GET INFORMATION OF SHOP
api.get('/api/shops/:shopId', (request, response) => {
  const query = {
    fe_id: request.params.shopId
  }
  database.collection('shops').find(query).toArray((err, result) => {
    if (err) throw err;

    response.send(result);
  })
});

//// GET SHOPS BY LOCATION
api.get('/api/location/:bldgId', (request, response) => {
  const query = {
    id: request.params.bldgId
  }
  database.collection('location-search').find(query).toArray((err, result) => {
    if (err) throw err;
    console.log(result);

    response.send(result);
  })
});

//// EDIT MENU ITEM
api.put('/api/shops/:shopId/food', (request, response) => {
  console.log(request.params);
  console.log(request.body);

  if (!request.body.updatedMenu) {
    response.err('Invalid query, missing updatedMenu object');
  }

  const group = request.body.updatedMenu.group;
  const type = request.body.updatedMenu.type;
  const updatedMenu = request.body.value || [];
  if (!group) {
    response.err('Invalid query, missing updatedMenu.group');
  }
  if (!type) {
    response.err('Invalid query, missing updatedMenu.type');
  }

  const query = {
    fe_id: request.params.shopId
  }

  const update = {};

  update[`${group}.${type}`] = updatedMenu;

  database.collection('shops').updateOne(
    query,
    {
      $set: update
    },
    (result) => {
      response.send(result);
    }
  )
});

//// ADD MENU ITEM
api.post('/api/shops/:shopId/food', (request, response) => {
  const query = {
    fe_id: request.params.shopId
  }
  database.collection('shops').find(query).toArray((err, _result) => {
    if (err) throw err;

    if (_result.length > 0) {
      const result = _result[0];
      // console.log(result)
      const group = request.body.addedMenu.group;
      const type =  request.body.addedMenu.type;
      const menuTypeList = result[group][type];

      if (!menuTypeList) {
        result[group][type] = []; 
      }

      const newMenu = {
        c_name: request.body.addedMenu.name,
        price: request.body.addedMenu.price,
        c_avg_rating: 0,
        username: request.body.user.name
      }

      if (request.body.addedMenu.amount) {
        newMenu.amount = request.body.addedMenu.amount;
      }

      result[group][type].push(newMenu);

      database.collection('shops').updateOne(
        { fe_id: request.params.shopId },
        {
          $set: result
        }, () => {
          response.send(result);
        }
      )
      
    } else {
      response.err(`No shop with id ${request.params.shopId} was found`);
    }
  })
});

//// GET REVIEWS
api.get('/api/reviews/:shopId', (request, response) => {
  const query = {
    fe_id: request.params.shopId
  }
  database.collection('reviews').find(query).sort({ date: -1 }).toArray((err, result) => {
    if (err) throw err;

    response.send(result);
  })
});

function updateShopRating(shopId) {
  const query = {
    fe_id: shopId
  }
  database.collection('reviews').find(query).toArray((err, result) => {
    if (err) throw err;

    let sum = 0;
    
    result.forEach((review) => {
      sum += review.rating;
    });
    
    const average = sum/result.length;

    database.collection('shops').updateOne(
      query,
      {
        $set: {
          fe_avg_rating: average
        }
      },
      (result) => {
        // response.send(result);
      }
    );
  })
};

//// ADD REVIEW
api.post('/api/reviews/:shopId', (request, response) => {

  const newReview = {
    user_id: request.body.user.id,
    fe_id: request.params.shopId,
    firstName: request.body.user.firstName,
    lastName: request.body.user.lastName,
    photoUrl: request.body.user.photoUrl,
    rating: request.body.addedReview.rating,
    review: request.body.addedReview.review,
    date: moment().format('lll')
  }

  console.log(newReview);
  database.collection('reviews').insertOne(newReview, (err, result) => {
    if(err) throw err;

    updateShopRating(request.params.shopId);
  });
});

//// EDIT REVIEW
api.put('/api/reviews/:shopId', (request, response) => {
  // console.log(request.params);
  console.log(request.body);

  const rating = request.body.rating;
  const review = request.body.review;
  if(!rating) {
    response.err('Invalid query, missing rating');
  }
  if(!review) {
    response.err('Invalid query, missing review');
  }

  const query = {
    fe_id: request.params.shopId,
    user_id: request.body.user.id
  }

  console.log(query);
  database.collection('reviews').updateOne(
    query,
    {
      $set: {
        rating: request.body.rating,
        review: request.body.review,
        date: moment().format('lll')
      }
    },
    (result) => {
      updateShopRating(request.params.shopId);
      response.send(result);
    }
  )
});

//// GET ADMIN
api.get('/api/admin', (request, response) => {
  database.collection('admin').find().toArray((err, result) => {
    if (err) throw err;

    response.send(result);
  })
});

//// ADD ADMIN
api.post('/api/admin', (request,response)=> {
  const newAdmin = {
    email: request.body.email,
    name: request.body.name,
    //photo: ,
    admin_since: {
      year: request.body.admin_since.year,
      month: request.body.admin_since.month,
      day: request.body.admin_since.day,
      hour: request.body.admin_since.hour,
      minute: request.body.admin_since.minute,
      second: request.body.admin_since.second
    }
  }
  console.log("newAdmin: " + newAdmin);
  database.collection('admin').insertOne(newAdmin, (err,result)=>{
      if (err) throw err;
  });
});

//// EDIT USER



// start server

api.listen(serverPort, '0.0.0.0');
console.log(`Server listening at port ${serverPort}`);
