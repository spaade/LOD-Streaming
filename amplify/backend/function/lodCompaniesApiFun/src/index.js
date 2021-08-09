
const AWS = require('aws-sdk');

let currentRegion = 'us-east-1';

if (process.env.TABLE_REGION) currentRegion = process.env.TABLE_REGION;

AWS.config.update({ region: currentRegion });

const dynamodb = new AWS.DynamoDB.DocumentClient();

let envStuff = '-main';

if (process.env.ENV && process.env.ENV !== 'NONE') {

  envStuff = '-' + process.env.ENV;
}

function routeResponse(event, context) {

  return new Promise((resolve, reject) => {

    let paths = event.path.toLowerCase().replace('/companies', '').split('/');

    let handled = null;
    
    console.log('ROUTING', paths);
  
    if (event.httpMethod == 'GET') {
      
      if (paths.length == 1) {

        // GET /companies
        handled = getRoot().then((resp) => resolve(resp));

      } else {

        if (paths[1] == 'details') {

          // GET /companies/details/:companyId
          handled = getCompanyDetailsById(paths[2]).then((resp) => resolve(resp));

        } else {

          // GET /companies/:companyId
          handled = getCompanyById(paths[1]).then((resp) => resolve(resp));
        }
      }

    }
    
    if (event.httpMethod == 'PUT') {
      
      if (paths.length == 1) {

        // PUT /companies
        handled = putCompany( JSON.parse(event.body) ).then((resp) => resolve(resp));
      }
    }
  
    if (!handled) {

      resolve({ status: 404, body: 'Unresolved ' + event.httpMethod + ' route: ' + event.path });
    }

  });
}

function getRoot() {

  return new Promise((resolve, reject) => {

    console.log('GET_ROOT');

    let queryParams = {
      TableName: 'lodCompanies' + envStuff,
      KeyConditionExpression: '#groupName = :groupValue',
      ExpressionAttributeNames:{
          '#groupName': 'groupId'
      },
      ExpressionAttributeValues: {
          ':groupValue': 'main-companies'
      }
    }
  
    dynamodb.query(queryParams, (err, data) => {
  
      if (err) {
  
        resolve({ status: 500, error: 'Could not load items: ' + err });
  
      } else {
  
        resolve({ body: data.Items });
      }
    });
  });
}

function putCompany(companyObj) {

  console.log('PUT_COMPANY', companyObj);

  return new Promise((resolve, reject) => {

    if (!companyObj.companyName || companyObj.companyName == '') {

      resolve({ status: 400, error: 'companyName is required.' });
    }

    if (!companyObj.id) {
  
      companyObj.id = companyObj.companyName.toLowerCase().split(' ').join('-');
    }
    
    companyObj.groupId = 'main-companies';
  
    let putItemParams = {
      TableName: 'lodCompanies' + envStuff,
      Item: companyObj
    }
  
    dynamodb.put(putItemParams, (err, data) => {
  
      console.log('PUT RESULT:', { err, data });

      if (err) {
    
        resolve({ status: 500, error: err, putObj: putItemParams });
  
      } else {
  
        resolve({ body: companyObj });
      }
    });
  });
}

function getCompanyById(companyId) {

  return new Promise((resolve, reject) => {

    let queryParams = {
      TableName: 'lodCompanies' + envStuff,
      KeyConditionExpression: '#groupName = :groupValue AND #idName = :idValue',
      ExpressionAttributeNames:{
        '#groupName': 'groupId',
        '#idName': 'id'
      },
      ExpressionAttributeValues: {
        ':groupValue': 'main-companies',
        ':idValue': companyId
      }
    }
  
    dynamodb.query(queryParams, (err, data) => {
  
      if (!err) {
  
        resolve({ body: data.Items[0] });

      } else {
  
        resolve({ status: 500, error: 'Could not load company: ' + err });
      }
    });
  });
}

function getStreamsByEventId(eventId) {

  return new Promise((resolve, reject) => {

    console.log('getStreamByEventId: ' + eventId);

    let queryParams = {
      TableName: 'lodStreams' + envStuff,
      KeyConditionExpression: '#groupName = :groupValue',
      ExpressionAttributeNames: {
        '#groupName': 'eventId'
      },
      ExpressionAttributeValues: {
        ':groupValue': eventId
      }
    }

    dynamodb.query(queryParams, (err, data) => {

      console.log('GET STREAM RESULT: ', {err: err, data: data})

      if (!err) {

        resolve(data.Items);

      } else {

        resolve({status: 500, error: 'Could not load streams by event Id: ' + err});

      }
    });
  });
}

function getCompanyDetailsById(companyId) {

  return new Promise(async (resolve, reject) => {

    let result = { company: {}, events: [] };

    console.log('GET Details: searching ' + companyId);

    let company = await getCompanyById(companyId);

    if (!company.error) {

      console.log('GET Details: found ', company);

      result.company = company.body;

      let queryParams = {
        TableName: 'lodEvents' + envStuff,
        KeyConditionExpression: '#groupName = :groupValue',
        ExpressionAttributeNames:{
          '#groupName': 'companyId'
        },
        ExpressionAttributeValues: {
          ':groupValue': companyId
        }
      }

      console.log('GET Details: searching events... ');

      dynamodb.query(queryParams, async (err, data) => {

        if (!err) {
          
          console.log('GET Details: found events:', data.Items);

          for (let i = 0; i < data.Items.length; i++) {

            console.log('GETTING STREAMS for ' + data.Items[i].id);
  
            data.Items[i]['streams'] = await getStreamsByEventId(data.Items[i].id);
          }

          result.events = data.Items;

          resolve({ body: result });

        } else {
    
          resolve({ status: 500, error: 'Could not load company events: ' + err, data: result });
        }
      });

    } else {

      resolve({ status: 500, error: 'Could not load company: ' + company.error, data: company });
    }
  });
}

exports.handler = async (event, context, callback) => {

  let response = {
    isBase64Encoded: true,
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*'
    }, 
    body: JSON.stringify({
      evt: event,
      ctx: context
    }),
  };

  console.log('EVENT ', event);

  let result = await routeResponse(event, context);

  if (result.status && result.status != 200) {
    response.statusCode = result.status;
  }

  console.log('RESULT ', result);

  response.body = JSON.stringify(result.body);

  return response;
};
