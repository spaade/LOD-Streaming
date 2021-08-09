const AWS = require('aws-sdk');

let currentRegion = 'us-east-1';

if (process.env.TABLE_REGION) currentRegion = process.env.TABLE_REGION;

AWS.config.update({region: currentRegion});

const dynamodb = new AWS.DynamoDB.DocumentClient();

let envStuff = '-main';

var authData = {userId: '', userName: ''};

if (process.env.ENV && process.env.ENV !== 'NONE') {

  envStuff = '-' + process.env.ENV;
}

function loadAuthData(evtObj) {

  console.log('CHECK AUTH', evtObj.requestContext)

  try {
    authData.userId = evtObj.requestContext.authorizer.claims.sub
  } catch (err) {
  }

  try {
    authData.userName = evtObj.requestContext.authorizer.claims.userName
  } catch (err) {
  }

  /*
  try {
    authData.profile = req.apiGateway.event.requestContext.authorizer.claims.profile
  } catch (err){}
  */
}

function routeResponse(event, context) {

  return new Promise((resolve, reject) => {

    // substr removes first /
    let paths = event.path.toLowerCase().substr(1).split('/');

    let handled = null;

    console.log('ROUTING', paths);

    if (event.httpMethod == 'GET') {

      if (paths.length == 2) {

        // GET /events/:companyId
        handled = getRoot(paths[1]).then((resp) => resolve(resp))
      }

      if (paths.length == 3) {

        // GET /events/:companyId/:eventId
        handled = getEventById(paths[1], paths[2]).then((resp) => resolve(resp));

      } else if (paths.length == 4) {

        // GET /events/details/:companyId/:eventId
        handled = getEventById(paths[2], paths[3]).then((resp) => resolve(resp));
      }
    }

    if (event.httpMethod == 'PUT') {

      if (paths.length == 1) {

        // PUT /events
        handled = putEvent(JSON.parse(event.body)).then((resp) => resolve(resp));
      }
    }

    if (!handled) {

      resolve({
        status: 404,
        body: 'Unresolved ' + event.httpMethod + ' route: ' + event.path,
        paths: JSON.stringify(paths)
      });
    }

  });
}

function getRoot(companyId) {

  return new Promise(async (resolve, reject) => {

    console.log('GET_ROOT');

    let queryParams = {
      TableName: 'lodEvents' + envStuff,
      KeyConditionExpression: '#groupName = :groupValue',
      ExpressionAttributeNames: {
        '#groupName': 'companyId'
      },
      ExpressionAttributeValues: {
        ':groupValue': companyId
      }
    }

    dynamodb.query(queryParams, async (err, data) => {

      if (!err) {

        for (let i = 0; i < data.Items.length; i++) {

          console.log('GETTING STREAMS for ' + data.Items[i].id);

          data.Items[i]['streams'] = await getStreamsByEventId(data.Items[i].id);
        }

        resolve({body: data.Items});

      } else {

        resolve({status: 500, error: 'Could not load events: ' + err});
      }
    });
  });
}

async function putEvent(eventObj) {

  console.log('PUT_EVENT', eventObj);

  return new Promise(async (resolve, reject) => {

    loadAuthData(eventObj);

    if (!eventObj.eventName || eventObj.eventName == '') {

      resolve({status: 400, error: 'eventName is required.'});
    }

    if (!eventObj.companyId || eventObj.companyId == '') {

      resolve({status: 400, error: 'companyId is required.'});
    }

    if (!eventObj.eventStatus || eventObj.eventStatus == '') {

      eventObj.eventStatus = 'active';
    }

    if (!eventObj.id || eventObj.id == '') {

      eventObj.id = eventObj.eventName.toLowerCase().latinize().replace(/ /gi, '-');
    }


    let putItemParams = {
      TableName: 'lodEvents' + envStuff,
      Item: {

        id: eventObj.id,
        companyId: eventObj.companyId,
        eventName: eventObj.eventName,
        eventDescription: eventObj.eventDescription,
        startDate: eventObj.startDate,
        endDate: eventObj.endDate,
        creationDate: eventObj.creationDate,
        updatedDate: eventObj.updatedDate,
        updatedUserName: eventObj.updatedUserName,

        logoImgUrl: eventObj.logoImgUrl,

        homeBgImgUrl: eventObj.homeBgImgUrl,
        loginImgUrl: eventObj.loginImgUrl,
        signUpImgUrl: eventObj.signUpImgUrl,

        homeColor: eventObj.homeColor,
        loginColor: eventObj.loginColor,
        signUpColor: eventObj.signUpColor,

        homeBgColor: eventObj.homeBgColor,
        loginBgColor: eventObj.loginBgColor,
        signUpBgColor: eventObj.signUpBgColor,

        streams: []

      }
    }

    dynamodb.put(putItemParams, async (err, data) => {

      console.log('PUT RESULT:', {err, data});

      if (!err) {

        let existingStreams = await getStreamsByEventId(eventObj.id)

        console.log(existingStreams)

        for (let i = 0; i < eventObj.streams.length; i++) {

          let itemIdx = existingStreams.findIndex(s => s.id == eventObj.streams[i].id);

          let flagNewStream = true;

          let stream = {
            id: eventObj.streams[i].id,
            companyId: eventObj.streams[i].companyId,
            eventId: eventObj.streams[i].eventId,

            createdUserId: eventObj.streams[i].createdUserId,

            streamName: eventObj.streams[i].streamName,
            streamStatus: eventObj.streams[i].streamStatus || 'active',

            enabledFromDate: eventObj.streams[i].enabledFromDate,
            enabledToDate: eventObj.streams[i].enabledToDate,

            runningFromDate: eventObj.streams[i].runningFromDate,
            runningToDate: eventObj.streams[i].runningToDate,

            requiresAgreement: (eventObj.streams[i].requiresAgreement),
            agreementUrl: eventObj.streams[i].agreementUrl || '',

            streamVimeoUrl: eventObj.streams[i].streamVimeoUrl || '',
            socialMediaUrl: eventObj.streams[i].socialMediaUrl || ''
          }

          if (itemIdx == -1) {

            // O item I é um nova streaming do evento

            stream.id = new Date().getTime();
            stream.eventId = eventObj.id;
            stream.createdUserId = authData.userId;

          } else {

            // O item já existe

            flagNewStream = false;

            stream.eventId = existingStreams[itemIdx].eventId;

            stream.createdUserId = existingStreams[itemIdx].createdUserId;
            stream.createdUserName = existingStreams[itemIdx].createdUserName;

            stream.updatedUserId = authData.userId;
            stream.updatedUserName = authData.userName;

            stream.updatedDate = new Date().getTime();

          }

          console.log('PUT SEND:', stream);

          let putResult = await putStream(stream);

          if (flagNewStream) {

            putItemParams.Item.streams.push(putResult);
          } else {

            let itemPosition = putItemParams.Item.streams.findIndex(si => si.id == putResult.id);

            putItemParams.Item.streams[itemPosition] = putResult;
          }

          console.log('PUT RESULT:', putResult);
        }

        for (let i = 0; i < existingStreams.length; i++) {

          let itemToDelete = eventObj.streams.findIndex(s => s.id == existingStreams[i].id);

          if (itemToDelete == -1) {

            console.log('MUST DELETE', existingStreams[i].id)

            await deleteStreamById(existingStreams[i].id, existingStreams[i].eventId)
          }

        }

        resolve({body: putItemParams.Item});

      } else {

        resolve({status: 500, error: err, putObj: putItemParams});

      }
    });

  });
}

function putStream(newItem) {

  return new Promise((resolve, reject) => {

    let putItemParams = {
      TableName: 'lodStreams' + envStuff,
      Item: newItem
    }

    console.log('PUT SEND:', newItem);

    dynamodb.put(putItemParams, (err, data) => {

      if (!err) {

        resolve(newItem);
      } else {

        reject(err);
      }
    })
  })
}

function deleteStreamById(id, eventId) {

  return new Promise((resolve, reject) => {

    let deleteItemParams = {
      TableName: 'lodStreams' + envStuff,
      Key: {
        id: id,
        eventId: eventId
      }
    }

    console.log('DELETE SEND:', deleteItemParams);

    dynamodb.delete(deleteItemParams, (err, data) => {

      if (!err) {

        resolve(data);
      } else {

        reject(err);
      }
    })

  })
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

function getEventById(companyId, eventId) {

  return new Promise((resolve, reject) => {

    let queryParams = {
      TableName: 'lodEvents' + envStuff,
      KeyConditionExpression: '#companyIdName = :companyIdValue AND #eventIdName = :eventIdValue',
      ExpressionAttributeNames: {
        '#companyIdName': 'companyId',
        '#eventIdName': 'id'
      },
      ExpressionAttributeValues: {
        ':companyIdValue': companyId,
        ':eventIdValue': eventId
      }
    }

    dynamodb.query(queryParams, async (err, data) => {

      if (!err) {

        if (data.Items.length > 0) {

          let item = data.Items[0];

          item.streams = await getStreamsByEventId(item.id)

          resolve({body: data.Items.length > 0 ? data.Items[0] : null});

        } else {

          resolve({statusCode: 400, error: 'Event not found: ' + eventId})

        }

      } else {

        resolve({statusCode: 500, error: 'Could not load events: ' + err});

      }
    });

  });
}

function getEventDetailsById(companyId, eventId) {

  return new Promise((resolve, reject) => {

    console.log('getEventDetailsById ' + companyId + ', ' + eventId);

    let queryParams = {
      TableName: 'lodEvents' + envStuff,
      KeyConditionExpression: '#groupName = :groupValue AND #idName = :idValue',
      ExpressionAttributeNames: {
        '#groupName': 'companyId',
        '#idName': 'id'
      },
      ExpressionAttributeValues: {
        ':groupValue': companyId,
        ':idValue': eventId
      }
    }

    dynamodb.query(queryParams, (err, data) => {

      if (err) {

        resolve({status: 500, error: 'Could not load event: ' + err});

      } else {

        resolve({body: data.Items[0]});
      }
    });
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


var Latinise = {};
Latinise.latin_map = {
  "Á": "A",
  "Ă": "A",
  "Ắ": "A",
  "Ặ": "A",
  "Ằ": "A",
  "Ẳ": "A",
  "Ẵ": "A",
  "Ǎ": "A",
  "Â": "A",
  "Ấ": "A",
  "Ậ": "A",
  "Ầ": "A",
  "Ẩ": "A",
  "Ẫ": "A",
  "Ä": "A",
  "Ǟ": "A",
  "Ȧ": "A",
  "Ǡ": "A",
  "Ạ": "A",
  "Ȁ": "A",
  "À": "A",
  "Ả": "A",
  "Ȃ": "A",
  "Ā": "A",
  "Ą": "A",
  "Å": "A",
  "Ǻ": "A",
  "Ḁ": "A",
  "Ⱥ": "A",
  "Ã": "A",
  "Ꜳ": "AA",
  "Æ": "AE",
  "Ǽ": "AE",
  "Ǣ": "AE",
  "Ꜵ": "AO",
  "Ꜷ": "AU",
  "Ꜹ": "AV",
  "Ꜻ": "AV",
  "Ꜽ": "AY",
  "Ḃ": "B",
  "Ḅ": "B",
  "Ɓ": "B",
  "Ḇ": "B",
  "Ƀ": "B",
  "Ƃ": "B",
  "Ć": "C",
  "Č": "C",
  "Ç": "C",
  "Ḉ": "C",
  "Ĉ": "C",
  "Ċ": "C",
  "Ƈ": "C",
  "Ȼ": "C",
  "Ď": "D",
  "Ḑ": "D",
  "Ḓ": "D",
  "Ḋ": "D",
  "Ḍ": "D",
  "Ɗ": "D",
  "Ḏ": "D",
  "ǲ": "D",
  "ǅ": "D",
  "Đ": "D",
  "Ƌ": "D",
  "Ǳ": "DZ",
  "Ǆ": "DZ",
  "É": "E",
  "Ĕ": "E",
  "Ě": "E",
  "Ȩ": "E",
  "Ḝ": "E",
  "Ê": "E",
  "Ế": "E",
  "Ệ": "E",
  "Ề": "E",
  "Ể": "E",
  "Ễ": "E",
  "Ḙ": "E",
  "Ë": "E",
  "Ė": "E",
  "Ẹ": "E",
  "Ȅ": "E",
  "È": "E",
  "Ẻ": "E",
  "Ȇ": "E",
  "Ē": "E",
  "Ḗ": "E",
  "Ḕ": "E",
  "Ę": "E",
  "Ɇ": "E",
  "Ẽ": "E",
  "Ḛ": "E",
  "Ꝫ": "ET",
  "Ḟ": "F",
  "Ƒ": "F",
  "Ǵ": "G",
  "Ğ": "G",
  "Ǧ": "G",
  "Ģ": "G",
  "Ĝ": "G",
  "Ġ": "G",
  "Ɠ": "G",
  "Ḡ": "G",
  "Ǥ": "G",
  "Ḫ": "H",
  "Ȟ": "H",
  "Ḩ": "H",
  "Ĥ": "H",
  "Ⱨ": "H",
  "Ḧ": "H",
  "Ḣ": "H",
  "Ḥ": "H",
  "Ħ": "H",
  "Í": "I",
  "Ĭ": "I",
  "Ǐ": "I",
  "Î": "I",
  "Ï": "I",
  "Ḯ": "I",
  "İ": "I",
  "Ị": "I",
  "Ȉ": "I",
  "Ì": "I",
  "Ỉ": "I",
  "Ȋ": "I",
  "Ī": "I",
  "Į": "I",
  "Ɨ": "I",
  "Ĩ": "I",
  "Ḭ": "I",
  "Ꝺ": "D",
  "Ꝼ": "F",
  "Ᵹ": "G",
  "Ꞃ": "R",
  "Ꞅ": "S",
  "Ꞇ": "T",
  "Ꝭ": "IS",
  "Ĵ": "J",
  "Ɉ": "J",
  "Ḱ": "K",
  "Ǩ": "K",
  "Ķ": "K",
  "Ⱪ": "K",
  "Ꝃ": "K",
  "Ḳ": "K",
  "Ƙ": "K",
  "Ḵ": "K",
  "Ꝁ": "K",
  "Ꝅ": "K",
  "Ĺ": "L",
  "Ƚ": "L",
  "Ľ": "L",
  "Ļ": "L",
  "Ḽ": "L",
  "Ḷ": "L",
  "Ḹ": "L",
  "Ⱡ": "L",
  "Ꝉ": "L",
  "Ḻ": "L",
  "Ŀ": "L",
  "Ɫ": "L",
  "ǈ": "L",
  "Ł": "L",
  "Ǉ": "LJ",
  "Ḿ": "M",
  "Ṁ": "M",
  "Ṃ": "M",
  "Ɱ": "M",
  "Ń": "N",
  "Ň": "N",
  "Ņ": "N",
  "Ṋ": "N",
  "Ṅ": "N",
  "Ṇ": "N",
  "Ǹ": "N",
  "Ɲ": "N",
  "Ṉ": "N",
  "Ƞ": "N",
  "ǋ": "N",
  "Ñ": "N",
  "Ǌ": "NJ",
  "Ó": "O",
  "Ŏ": "O",
  "Ǒ": "O",
  "Ô": "O",
  "Ố": "O",
  "Ộ": "O",
  "Ồ": "O",
  "Ổ": "O",
  "Ỗ": "O",
  "Ö": "O",
  "Ȫ": "O",
  "Ȯ": "O",
  "Ȱ": "O",
  "Ọ": "O",
  "Ő": "O",
  "Ȍ": "O",
  "Ò": "O",
  "Ỏ": "O",
  "Ơ": "O",
  "Ớ": "O",
  "Ợ": "O",
  "Ờ": "O",
  "Ở": "O",
  "Ỡ": "O",
  "Ȏ": "O",
  "Ꝋ": "O",
  "Ꝍ": "O",
  "Ō": "O",
  "Ṓ": "O",
  "Ṑ": "O",
  "Ɵ": "O",
  "Ǫ": "O",
  "Ǭ": "O",
  "Ø": "O",
  "Ǿ": "O",
  "Õ": "O",
  "Ṍ": "O",
  "Ṏ": "O",
  "Ȭ": "O",
  "Ƣ": "OI",
  "Ꝏ": "OO",
  "Ɛ": "E",
  "Ɔ": "O",
  "Ȣ": "OU",
  "Ṕ": "P",
  "Ṗ": "P",
  "Ꝓ": "P",
  "Ƥ": "P",
  "Ꝕ": "P",
  "Ᵽ": "P",
  "Ꝑ": "P",
  "Ꝙ": "Q",
  "Ꝗ": "Q",
  "Ŕ": "R",
  "Ř": "R",
  "Ŗ": "R",
  "Ṙ": "R",
  "Ṛ": "R",
  "Ṝ": "R",
  "Ȑ": "R",
  "Ȓ": "R",
  "Ṟ": "R",
  "Ɍ": "R",
  "Ɽ": "R",
  "Ꜿ": "C",
  "Ǝ": "E",
  "Ś": "S",
  "Ṥ": "S",
  "Š": "S",
  "Ṧ": "S",
  "Ş": "S",
  "Ŝ": "S",
  "Ș": "S",
  "Ṡ": "S",
  "Ṣ": "S",
  "Ṩ": "S",
  "Ť": "T",
  "Ţ": "T",
  "Ṱ": "T",
  "Ț": "T",
  "Ⱦ": "T",
  "Ṫ": "T",
  "Ṭ": "T",
  "Ƭ": "T",
  "Ṯ": "T",
  "Ʈ": "T",
  "Ŧ": "T",
  "Ɐ": "A",
  "Ꞁ": "L",
  "Ɯ": "M",
  "Ʌ": "V",
  "Ꜩ": "TZ",
  "Ú": "U",
  "Ŭ": "U",
  "Ǔ": "U",
  "Û": "U",
  "Ṷ": "U",
  "Ü": "U",
  "Ǘ": "U",
  "Ǚ": "U",
  "Ǜ": "U",
  "Ǖ": "U",
  "Ṳ": "U",
  "Ụ": "U",
  "Ű": "U",
  "Ȕ": "U",
  "Ù": "U",
  "Ủ": "U",
  "Ư": "U",
  "Ứ": "U",
  "Ự": "U",
  "Ừ": "U",
  "Ử": "U",
  "Ữ": "U",
  "Ȗ": "U",
  "Ū": "U",
  "Ṻ": "U",
  "Ų": "U",
  "Ů": "U",
  "Ũ": "U",
  "Ṹ": "U",
  "Ṵ": "U",
  "Ꝟ": "V",
  "Ṿ": "V",
  "Ʋ": "V",
  "Ṽ": "V",
  "Ꝡ": "VY",
  "Ẃ": "W",
  "Ŵ": "W",
  "Ẅ": "W",
  "Ẇ": "W",
  "Ẉ": "W",
  "Ẁ": "W",
  "Ⱳ": "W",
  "Ẍ": "X",
  "Ẋ": "X",
  "Ý": "Y",
  "Ŷ": "Y",
  "Ÿ": "Y",
  "Ẏ": "Y",
  "Ỵ": "Y",
  "Ỳ": "Y",
  "Ƴ": "Y",
  "Ỷ": "Y",
  "Ỿ": "Y",
  "Ȳ": "Y",
  "Ɏ": "Y",
  "Ỹ": "Y",
  "Ź": "Z",
  "Ž": "Z",
  "Ẑ": "Z",
  "Ⱬ": "Z",
  "Ż": "Z",
  "Ẓ": "Z",
  "Ȥ": "Z",
  "Ẕ": "Z",
  "Ƶ": "Z",
  "Ĳ": "IJ",
  "Œ": "OE",
  "ᴀ": "A",
  "ᴁ": "AE",
  "ʙ": "B",
  "ᴃ": "B",
  "ᴄ": "C",
  "ᴅ": "D",
  "ᴇ": "E",
  "ꜰ": "F",
  "ɢ": "G",
  "ʛ": "G",
  "ʜ": "H",
  "ɪ": "I",
  "ʁ": "R",
  "ᴊ": "J",
  "ᴋ": "K",
  "ʟ": "L",
  "ᴌ": "L",
  "ᴍ": "M",
  "ɴ": "N",
  "ᴏ": "O",
  "ɶ": "OE",
  "ᴐ": "O",
  "ᴕ": "OU",
  "ᴘ": "P",
  "ʀ": "R",
  "ᴎ": "N",
  "ᴙ": "R",
  "ꜱ": "S",
  "ᴛ": "T",
  "ⱻ": "E",
  "ᴚ": "R",
  "ᴜ": "U",
  "ᴠ": "V",
  "ᴡ": "W",
  "ʏ": "Y",
  "ᴢ": "Z",
  "á": "a",
  "ă": "a",
  "ắ": "a",
  "ặ": "a",
  "ằ": "a",
  "ẳ": "a",
  "ẵ": "a",
  "ǎ": "a",
  "â": "a",
  "ấ": "a",
  "ậ": "a",
  "ầ": "a",
  "ẩ": "a",
  "ẫ": "a",
  "ä": "a",
  "ǟ": "a",
  "ȧ": "a",
  "ǡ": "a",
  "ạ": "a",
  "ȁ": "a",
  "à": "a",
  "ả": "a",
  "ȃ": "a",
  "ā": "a",
  "ą": "a",
  "ᶏ": "a",
  "ẚ": "a",
  "å": "a",
  "ǻ": "a",
  "ḁ": "a",
  "ⱥ": "a",
  "ã": "a",
  "ꜳ": "aa",
  "æ": "ae",
  "ǽ": "ae",
  "ǣ": "ae",
  "ꜵ": "ao",
  "ꜷ": "au",
  "ꜹ": "av",
  "ꜻ": "av",
  "ꜽ": "ay",
  "ḃ": "b",
  "ḅ": "b",
  "ɓ": "b",
  "ḇ": "b",
  "ᵬ": "b",
  "ᶀ": "b",
  "ƀ": "b",
  "ƃ": "b",
  "ɵ": "o",
  "ć": "c",
  "č": "c",
  "ç": "c",
  "ḉ": "c",
  "ĉ": "c",
  "ɕ": "c",
  "ċ": "c",
  "ƈ": "c",
  "ȼ": "c",
  "ď": "d",
  "ḑ": "d",
  "ḓ": "d",
  "ȡ": "d",
  "ḋ": "d",
  "ḍ": "d",
  "ɗ": "d",
  "ᶑ": "d",
  "ḏ": "d",
  "ᵭ": "d",
  "ᶁ": "d",
  "đ": "d",
  "ɖ": "d",
  "ƌ": "d",
  "ı": "i",
  "ȷ": "j",
  "ɟ": "j",
  "ʄ": "j",
  "ǳ": "dz",
  "ǆ": "dz",
  "é": "e",
  "ĕ": "e",
  "ě": "e",
  "ȩ": "e",
  "ḝ": "e",
  "ê": "e",
  "ế": "e",
  "ệ": "e",
  "ề": "e",
  "ể": "e",
  "ễ": "e",
  "ḙ": "e",
  "ë": "e",
  "ė": "e",
  "ẹ": "e",
  "ȅ": "e",
  "è": "e",
  "ẻ": "e",
  "ȇ": "e",
  "ē": "e",
  "ḗ": "e",
  "ḕ": "e",
  "ⱸ": "e",
  "ę": "e",
  "ᶒ": "e",
  "ɇ": "e",
  "ẽ": "e",
  "ḛ": "e",
  "ꝫ": "et",
  "ḟ": "f",
  "ƒ": "f",
  "ᵮ": "f",
  "ᶂ": "f",
  "ǵ": "g",
  "ğ": "g",
  "ǧ": "g",
  "ģ": "g",
  "ĝ": "g",
  "ġ": "g",
  "ɠ": "g",
  "ḡ": "g",
  "ᶃ": "g",
  "ǥ": "g",
  "ḫ": "h",
  "ȟ": "h",
  "ḩ": "h",
  "ĥ": "h",
  "ⱨ": "h",
  "ḧ": "h",
  "ḣ": "h",
  "ḥ": "h",
  "ɦ": "h",
  "ẖ": "h",
  "ħ": "h",
  "ƕ": "hv",
  "í": "i",
  "ĭ": "i",
  "ǐ": "i",
  "î": "i",
  "ï": "i",
  "ḯ": "i",
  "ị": "i",
  "ȉ": "i",
  "ì": "i",
  "ỉ": "i",
  "ȋ": "i",
  "ī": "i",
  "į": "i",
  "ᶖ": "i",
  "ɨ": "i",
  "ĩ": "i",
  "ḭ": "i",
  "ꝺ": "d",
  "ꝼ": "f",
  "ᵹ": "g",
  "ꞃ": "r",
  "ꞅ": "s",
  "ꞇ": "t",
  "ꝭ": "is",
  "ǰ": "j",
  "ĵ": "j",
  "ʝ": "j",
  "ɉ": "j",
  "ḱ": "k",
  "ǩ": "k",
  "ķ": "k",
  "ⱪ": "k",
  "ꝃ": "k",
  "ḳ": "k",
  "ƙ": "k",
  "ḵ": "k",
  "ᶄ": "k",
  "ꝁ": "k",
  "ꝅ": "k",
  "ĺ": "l",
  "ƚ": "l",
  "ɬ": "l",
  "ľ": "l",
  "ļ": "l",
  "ḽ": "l",
  "ȴ": "l",
  "ḷ": "l",
  "ḹ": "l",
  "ⱡ": "l",
  "ꝉ": "l",
  "ḻ": "l",
  "ŀ": "l",
  "ɫ": "l",
  "ᶅ": "l",
  "ɭ": "l",
  "ł": "l",
  "ǉ": "lj",
  "ſ": "s",
  "ẜ": "s",
  "ẛ": "s",
  "ẝ": "s",
  "ḿ": "m",
  "ṁ": "m",
  "ṃ": "m",
  "ɱ": "m",
  "ᵯ": "m",
  "ᶆ": "m",
  "ń": "n",
  "ň": "n",
  "ņ": "n",
  "ṋ": "n",
  "ȵ": "n",
  "ṅ": "n",
  "ṇ": "n",
  "ǹ": "n",
  "ɲ": "n",
  "ṉ": "n",
  "ƞ": "n",
  "ᵰ": "n",
  "ᶇ": "n",
  "ɳ": "n",
  "ñ": "n",
  "ǌ": "nj",
  "ó": "o",
  "ŏ": "o",
  "ǒ": "o",
  "ô": "o",
  "ố": "o",
  "ộ": "o",
  "ồ": "o",
  "ổ": "o",
  "ỗ": "o",
  "ö": "o",
  "ȫ": "o",
  "ȯ": "o",
  "ȱ": "o",
  "ọ": "o",
  "ő": "o",
  "ȍ": "o",
  "ò": "o",
  "ỏ": "o",
  "ơ": "o",
  "ớ": "o",
  "ợ": "o",
  "ờ": "o",
  "ở": "o",
  "ỡ": "o",
  "ȏ": "o",
  "ꝋ": "o",
  "ꝍ": "o",
  "ⱺ": "o",
  "ō": "o",
  "ṓ": "o",
  "ṑ": "o",
  "ǫ": "o",
  "ǭ": "o",
  "ø": "o",
  "ǿ": "o",
  "õ": "o",
  "ṍ": "o",
  "ṏ": "o",
  "ȭ": "o",
  "ƣ": "oi",
  "ꝏ": "oo",
  "ɛ": "e",
  "ᶓ": "e",
  "ɔ": "o",
  "ᶗ": "o",
  "ȣ": "ou",
  "ṕ": "p",
  "ṗ": "p",
  "ꝓ": "p",
  "ƥ": "p",
  "ᵱ": "p",
  "ᶈ": "p",
  "ꝕ": "p",
  "ᵽ": "p",
  "ꝑ": "p",
  "ꝙ": "q",
  "ʠ": "q",
  "ɋ": "q",
  "ꝗ": "q",
  "ŕ": "r",
  "ř": "r",
  "ŗ": "r",
  "ṙ": "r",
  "ṛ": "r",
  "ṝ": "r",
  "ȑ": "r",
  "ɾ": "r",
  "ᵳ": "r",
  "ȓ": "r",
  "ṟ": "r",
  "ɼ": "r",
  "ᵲ": "r",
  "ᶉ": "r",
  "ɍ": "r",
  "ɽ": "r",
  "ↄ": "c",
  "ꜿ": "c",
  "ɘ": "e",
  "ɿ": "r",
  "ś": "s",
  "ṥ": "s",
  "š": "s",
  "ṧ": "s",
  "ş": "s",
  "ŝ": "s",
  "ș": "s",
  "ṡ": "s",
  "ṣ": "s",
  "ṩ": "s",
  "ʂ": "s",
  "ᵴ": "s",
  "ᶊ": "s",
  "ȿ": "s",
  "ɡ": "g",
  "ᴑ": "o",
  "ᴓ": "o",
  "ᴝ": "u",
  "ť": "t",
  "ţ": "t",
  "ṱ": "t",
  "ț": "t",
  "ȶ": "t",
  "ẗ": "t",
  "ⱦ": "t",
  "ṫ": "t",
  "ṭ": "t",
  "ƭ": "t",
  "ṯ": "t",
  "ᵵ": "t",
  "ƫ": "t",
  "ʈ": "t",
  "ŧ": "t",
  "ᵺ": "th",
  "ɐ": "a",
  "ᴂ": "ae",
  "ǝ": "e",
  "ᵷ": "g",
  "ɥ": "h",
  "ʮ": "h",
  "ʯ": "h",
  "ᴉ": "i",
  "ʞ": "k",
  "ꞁ": "l",
  "ɯ": "m",
  "ɰ": "m",
  "ᴔ": "oe",
  "ɹ": "r",
  "ɻ": "r",
  "ɺ": "r",
  "ⱹ": "r",
  "ʇ": "t",
  "ʌ": "v",
  "ʍ": "w",
  "ʎ": "y",
  "ꜩ": "tz",
  "ú": "u",
  "ŭ": "u",
  "ǔ": "u",
  "û": "u",
  "ṷ": "u",
  "ü": "u",
  "ǘ": "u",
  "ǚ": "u",
  "ǜ": "u",
  "ǖ": "u",
  "ṳ": "u",
  "ụ": "u",
  "ű": "u",
  "ȕ": "u",
  "ù": "u",
  "ủ": "u",
  "ư": "u",
  "ứ": "u",
  "ự": "u",
  "ừ": "u",
  "ử": "u",
  "ữ": "u",
  "ȗ": "u",
  "ū": "u",
  "ṻ": "u",
  "ų": "u",
  "ᶙ": "u",
  "ů": "u",
  "ũ": "u",
  "ṹ": "u",
  "ṵ": "u",
  "ᵫ": "ue",
  "ꝸ": "um",
  "ⱴ": "v",
  "ꝟ": "v",
  "ṿ": "v",
  "ʋ": "v",
  "ᶌ": "v",
  "ⱱ": "v",
  "ṽ": "v",
  "ꝡ": "vy",
  "ẃ": "w",
  "ŵ": "w",
  "ẅ": "w",
  "ẇ": "w",
  "ẉ": "w",
  "ẁ": "w",
  "ⱳ": "w",
  "ẘ": "w",
  "ẍ": "x",
  "ẋ": "x",
  "ᶍ": "x",
  "ý": "y",
  "ŷ": "y",
  "ÿ": "y",
  "ẏ": "y",
  "ỵ": "y",
  "ỳ": "y",
  "ƴ": "y",
  "ỷ": "y",
  "ỿ": "y",
  "ȳ": "y",
  "ẙ": "y",
  "ɏ": "y",
  "ỹ": "y",
  "ź": "z",
  "ž": "z",
  "ẑ": "z",
  "ʑ": "z",
  "ⱬ": "z",
  "ż": "z",
  "ẓ": "z",
  "ȥ": "z",
  "ẕ": "z",
  "ᵶ": "z",
  "ᶎ": "z",
  "ʐ": "z",
  "ƶ": "z",
  "ɀ": "z",
  "ﬀ": "ff",
  "ﬃ": "ffi",
  "ﬄ": "ffl",
  "ﬁ": "fi",
  "ﬂ": "fl",
  "ĳ": "ij",
  "œ": "oe",
  "ﬆ": "st",
  "ₐ": "a",
  "ₑ": "e",
  "ᵢ": "i",
  "ⱼ": "j",
  "ₒ": "o",
  "ᵣ": "r",
  "ᵤ": "u",
  "ᵥ": "v",
  "ₓ": "x"
};
String.prototype.latinise = function () {
  return this.replace(/[^A-Za-z0-9\[\] ]/g, function (a) {
    return Latinise.latin_map[a] || a
  })
};
String.prototype.latinize = String.prototype.latinise;
String.prototype.isLatin = function () {
  return this == this.latinise()
}
