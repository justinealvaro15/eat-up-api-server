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

//UPDATE TOTAL VIEWS OF SITE (added every load of studproj.up.edu.ph/eat-up)
api.put('/api/page_views:name',(request, response)=> {
  console.log("in increase")
  database.collection('page_views').updateOne(
    {name: request.body.name},
    {$inc: {count: 1} }
  )
});
//// GET TOTAL VIEWS OF HOME PAGE
api.get('/api/page_views', (request, response) => {
  console.log("in getting the page view");
  database.collection('page_views').find().toArray((err, result) => { 
    if (err) throw err;
    response.send(result);//RESULT EXISTS
  })
});


//// GET USERS 
api.get('/api/users', (request, response) => {
  database.collection('users').find().toArray((err, result) => {
    if (err) throw err;

    response.send(result);
  })
});

//// ADD SHOP
api.post('/api/admin/add/shop', (request, response) => {
  database.collection('shops').insertOne(request.body, (err, result) => {
    if(err) throw err;
    response.send(result);
  });
});

//// EDIT SHOP
api.put('/api/admin/edit/shop/:shopId', (request, response) => {
  const query = {
    fe_id: request.params.shopId
  }

  const update = request.body.updatedShop;
  console.log(update);

  database.collection('shops').updateOne(
    query,
    {
      $set: update
    },
    (result) => {
      response.send(result);
    }
  );
});

//// DEACTIVATE SHOP
api.put('/api/admin/deactivate/shop/:shopId', (request, response) => {
  const query = {
    fe_id: request.params.shopId
  }

  database.collection('shops').updateOne(
    query,
    {
      $set: {
        "active": request.body.active
      }
    },
    (result) => {
      response.send(result);
    }
  );
});

//// GET ALL SHOPS (admin)
api.get('/api/shops', (request, response) => {
  database.collection('shops').find().toArray((err, result) => {
    if (err) throw err;

    response.send(result);
  })
});

//// GET SHOPS DISPLAY
api.get('/api/shops/display', (request, response) => {
  const query = {
    active: true
  }
  database.collection('shops').find(query).toArray((err, result) => {
    if (err) throw err;

    response.send(result);
  })
});

//// GET SHOPS SORTED BY RATINGS
api.get('/api/shops/topten', (request, response) => {
  const query = {
    active: true
  }
  database.collection('shops').find(query).sort({ fe_avg_rating: -1 }).limit(10).toArray((err, result) => {
    if (err) throw err;

    response.send(result);
  })
});

//// GET SHOPS SORTED BY SHOP ID
api.get('/api/shops/newest', (request, response) => {
  const query = {
    active: true
  }
  database.collection('shops').find(query).sort({ fe_id: -1 }).collation({locale: "en_US", numericOrdering: true}).limit(10).toArray((err, result) => {
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
  );

  database.collection('shops').updateOne(
    query,
    {
      $set: {
        lastUpdatedMenu: moment().format('LL')
      }
    }
  );
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
      );
      
    } else {
      response.err(`No shop with id ${request.params.shopId} was found`);
    }

    database.collection('shops').updateOne(
      query,
      {
        $set: {
          lastUpdatedMenu: moment().format('LL')
        }
      }
    );
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
    user_id: request.body.user_id,
    first_name: request.body.first_name,
    last_name: request.body.last_name,
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
  database.collection('admin').insertOne(newAdmin, (err,result)=>{
      if (err) throw err;
  });
});
//DELETE ADMIN
api.delete('/api/admin/:user_id', (request,response)=> {
  database.collection('admin').deleteOne(
    {user_id: request.params.user_id}
  );
});

//ADD USER
api.post('/api/users', (request,response)=> {
  const newUser = {
    user_id: request.body.user_id,
    first_name: request.body.first_name,
    last_name: request.body.last_name,
    photoUrl: request.body.photoUrl,
    date_joined: {
      year: request.body.date_joined.year,
      month: request.body.date_joined.month,
      day: request.body.date_joined.day,
      hour: request.body.date_joined.hour,
      minute: request.body.date_joined.minute,
      second: request.body.date_joined.second
    },
    last_active: {
      year: request.body.last_active.year,
      month: request.body.last_active.month,
      day: request.body.last_active.day,
      hour: request.body.last_active.hour,
      minute: request.body.last_active.minute,
      second: request.body.last_active.second
    },
    removed: {
      removed_by: request.body.removed.removed_by,
      removed_on: {
        year: request.body.removed.removed_on.year,
        month: request.body.removed.removed_on.month,
        day: request.body.removed.removed_on.day,
        hour: request.body.removed.removed_on.hour,
        minute: request.body.removed.removed_on.minute,
        second: request.body.removed.removed_on.second
      }
    },
    reviews_made: request.body.reviews_made,
    active: request.body.active,
    isAdmin: request.body.isAdmin
  }

  database.collection('users').insertOne(newUser, (err,result)=>{
      if (err) throw err;
  });
});

//EDIT USER
  //active to inactive and vice versa
api.put('/api/users/:user_id', bodyParser.json(), (request,response)=> {
  const query = {
    user_id : request.params.user_id
  }
  
  if (request.body.active!=null) { //for deactivating or reactivating
    database.collection('users').updateOne(
      {user_id : request.params.user_id},
      {
        $set: {
          deactivated: {
            deactivated_by: request.body.deactivated.deactivated_by,
            deactivated_on: {
              year:request.body.deactivated.deactivated_on.year,
              month: request.body.deactivated.deactivated_on.month,
              day: request.body.deactivated.deactivated_on.day,
              hour: request.body.deactivated.deactivated_on.hour,
              minute: request.body.deactivated.deactivated_on.minute,
              second: request.body.deactivated.deactivated_on.second 
            }
          },
          active: request.body.active
        }
      }
    )
  }

  if (request.body.isAdmin!=null) { //for identifying whether a user is an admin
    database.collection('users').updateOne(
      {user_id : request.params.user_id},
      {
        $set: {
          isAdmin: request.body.isAdmin
        }
      }
    )
  }

  if (request.body.last_active!=null) {//to update when a user was last active

    database.collection('users').updateOne(
      {user_id : request.params.user_id},
      {
        $set: {
          last_active: {
            year: request.body.last_active.year,
            month: request.body.last_active.month,
            day: request.body.last_active.day, 
            hour: request.body.last_active.hour,
            minute: request.body.last_active.minute,
            day: request.body.last_active.day
          } 
        }
      }
    )

  }

});

// start server

api.listen(serverPort, '0.0.0.0');
console.log(`Server listening at port ${serverPort}`);
