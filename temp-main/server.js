

const fs = require('fs');

const path = require('path');

const WebSocket = require('ws');

const GeoTIFF = require('geotiff');

const turf = require('@turf/turf');
const { send } = require('process');



const PORT = 8080;

const wss = new WebSocket.Server({ port: PORT });

console.log(`🚀 WebSocket server running on port ${PORT}`);



// ====== Globals ======

let image = null, rasters = null, bbox = null;

let pixelWidth = 0, pixelHeight = 0;





let jeep = {

  coordinates: { lng: 34.7818, lat: 32.0853 },

  heading: 0,

};



let jeepPosition = { lat: 31.9832731, lng: 34.9395936 };

let jeepHeading = 45;

let losParams = { rangeKm: 3, angleDeg: 90, elevationAngleDeg: 5 };



const STEP_DISTANCE_KM = 0.01; // = 10 מטר

const MIN_BLOCK_ANGLE_DEG = 1; // רק אם נדרש להתרומם מעל 1°, נחשב חסימה



// ====== Load DTM ======

async function loadDTM() {

  const tiffPath = path.join(__dirname, 'data', 'SRTM.tif');

  const tiff = await GeoTIFF.fromFile(tiffPath);

  image = await tiff.getImage();

  rasters = await image.readRasters();

  bbox = image.getBoundingBox();

  const width = image.getWidth();

  const height = image.getHeight();

  pixelWidth = (bbox[2] - bbox[0]) / width;

  pixelHeight = (bbox[3] - bbox[1]) / height;

  console.log("✅ DTM loaded:", width, "x", height);

}



function getElevation(lng, lat) {

  if (!image || !rasters) return null;

  const [minX, minY] = bbox;

  const xPix = Math.floor((lng - minX) / pixelWidth);

  const yPix = Math.floor((lat - minY) / pixelHeight);

  const width = image.getWidth();

  const height = image.getHeight();

  if (xPix < 0 || yPix < 0 || xPix >= width || yPix >= height) return null;

  return rasters[0][yPix * width + xPix];

}

function computeLOS(origin, heading, rangeKm, angleDeg, maxElevationAngleDeg, minBlockAngleDeg = 2) {

  const rays = [];

  const STEP_KM = STEP_DISTANCE_KM || 0.01;

  const MIN_DIST_KM = 0.05;

  const baseElevation = getElevation(origin.lng, origin.lat) || 0;



  for (let a = -angleDeg / 2; a <= angleDeg / 2; a++) {

    const absoluteAngle = (heading + a + 360) % 360;



    let currentSeverity = null;

    let segmentStart = null;



    for (let d = MIN_DIST_KM; d <= rangeKm; d += STEP_KM) {

      const [lng, lat] = turf.destination(

        turf.point([origin.lng, origin.lat]),

        d,

        absoluteAngle,

        { units: 'kilometers' }

      ).geometry.coordinates;



      const elevation = getElevation(lng, lat);

      if (elevation === null) continue;



      const distanceMeters = d * 1000;

      const actualAngleDeg = Math.atan2(elevation - baseElevation, distanceMeters) * 180 / Math.PI;



      if (actualAngleDeg < minBlockAngleDeg) continue;



      // חומרת חסימה

      let severity = null;

      if (actualAngleDeg > maxElevationAngleDeg) {

        severity = 'high';

      } else {

        const ratio = (actualAngleDeg - minBlockAngleDeg) / (maxElevationAngleDeg - minBlockAngleDeg);

        if (ratio > 0.75) severity = 'medium';

        else severity = 'low';

      }



      if (!severity) continue;



      const severityRank = { low: 1, medium: 2, high: 3 };

      const isUpgrade = currentSeverity === null || severityRank[severity] > severityRank[currentSeverity];



      if (isUpgrade) {

        if (segmentStart && currentSeverity) {

          rays.push({

            angle: absoluteAngle,

            from: { lat: segmentStart[1], lng: segmentStart[0] },

            to: { lat, lng },

            severity: currentSeverity

          });

        }



        currentSeverity = severity;

        segmentStart = [lng, lat];



        if (severity === 'high') {

          const [toLng, toLat] = turf.destination(

            turf.point([origin.lng, origin.lat]),

            rangeKm,

            absoluteAngle,

            { units: 'kilometers' }

          ).geometry.coordinates;



          rays.push({

            angle: absoluteAngle,

            from: { lat: segmentStart[1], lng: segmentStart[0] },

            to: { lat: toLat, lng: toLng },

            severity: 'high'

          });

          break;

        }

      }

    }



    if (segmentStart && currentSeverity !== 'high') {

      const [toLng, toLat] = turf.destination(

        turf.point([origin.lng, origin.lat]),

        rangeKm,

        absoluteAngle,

        { units: 'kilometers' }

      ).geometry.coordinates;



      rays.push({

        angle: absoluteAngle,

        from: { lat: segmentStart[1], lng: segmentStart[0] },

        to: { lat: toLat, lng: toLng },

        severity: currentSeverity

      });

    }

  }



  return rays;

}







const radarStatuses = ['NO_COMM', 'FAIL', 'WARNING', 'WAITING', 'ACTIVE', "OFF", "INIT", "STANDBY"];

const radarModes = ['enabled', 'disabled'];



let radarState = {

  statusIndex: 0,

  modeIndex: 0,

  workRoom: 1,

  missionType: 1,

  faults: [],

};



function updateRadarStatus() {

  radarState.statusIndex = (radarState.statusIndex + 1) % radarStatuses.length;

  radarState.modeIndex = (radarState.modeIndex + 1) % radarModes.length;



  let faults = [];

  let faultSummary = '0 תקלות פעילות';



  const currentStatus = radarStatuses[radarState.statusIndex];

  if (currentStatus === 'FAULT') {

    faults = ['אנטנה 1 לא מגיבה', 'שגיאת ספק כוח'];

    faultSummary = '2 תקלות פעילות';

  } else if (currentStatus === 'WARNING') {

    faults = ['מתח לא יציב'];

    faultSummary = '1 תקלה פעילה';

  }



  radarState.workRoom = (radarState.workRoom % 10) + 1;

  radarState.missionType = (radarState.missionType % 5) + 1;



  const radarMessage = {

    header: { name: 'RADAR_STATUS' },

    data: {
      State: currentStatus,
      Mode: radarModes[radarState.modeIndex],
      WorkRoom: radarState.workRoom,
      MissionCategory: radarState.missionType,
      Radar1_status: "FAULT",
      Radar2_status: "NORMAL",
      Radar3_status: "FAULT",
      Radar4_status: "FAULT",
      Tx: "OFF",
      FreqIndex: 5,
      Hfl1_status: "FAULT",
      Hfl2_status: "NORMAL",
      Hfl3_status: "NORMAL",
      Hfl4_status: "FAULT",
      FaultSummary: "string",
      Frequency: 770,
    }
  };

  //   state = systemStatus.Data.Radar_State,
  // mission_category = systemStatus.Data.Mission_Category,
  // radar1_status = systemStatus.Data.Radar1_Status,
  // radar2_status = systemStatus.Data.Radar2_Status,
  // radar3_status = systemStatus.Data.Radar3_Status,
  // radar4_status = systemStatus.Data.Radar4_Status,
  // tx = systemStatus.Data.Radar_TX,
  // freq_index = systemStatus.Data.Freq_Index,
  // hfl1_status = systemStatus.Data.HFL1_Status,
  // hfl2_status = systemStatus.Data.HFL2_Status,
  // hfl3_status = systemStatus.Data.HFL3_Status,
  // hfl4_status = systemStatus.Data.HFL4_Status



  broadcast('RADAR_STATUS', radarMessage.data);

  // console.log('📡 RADAR Status Sent:', radarMessage.data);

}







function createSector(origin, heading, angleDeg, rangeKm, stepDeg = 1) {

  const points = [];



  const startAngle = heading - angleDeg / 2;

  const endAngle = heading + angleDeg / 2;



  points.push([origin.lng, origin.lat]);



  for (let a = startAngle; a <= endAngle; a += stepDeg) {

    const [lng, lat] = turf.destination(

      turf.point([origin.lng, origin.lat]),

      rangeKm,

      (a + 360) % 360,

      { units: 'kilometers' }

    ).geometry.coordinates;



    points.push([lng, lat]);

  }



  points.push([origin.lng, origin.lat]);



  return turf.polygon([points]);

}







const gunStatuses = ['OK', 'WARNING', 'FAIL', 'TRACKING', 'ARMED', 'NO_COME'];

const gunIds = ['GUN_01', 'GUN_02', 'GUN_03'];




let gunstatus;
function updateGunStatus() {

  const gunId = gunIds[Math.floor(Math.random() * gunIds.length)];

  gunstatus = Math.floor(Math.random() * gunStatuses.length - 1);



  // broadcast('GUN_STATUS', { gunId, gunstatus });

  console.log('🔫 GUN_STATUS sent:', { gunId, gunstatus });

}







let targets =

  [
    {
      "state":2,
      "id": 177050,
      "coordinates": {
        "lat": 31.983305360673815,
        "lng": 34.922027988057105,
        "alt": 500
      },
      "heading": 65.99901145918767,
      "platform": 1,
      "identity": true,
      "speed": 90,
      "range": 90,
      "isLocked": true,
      "risk_level": 150,
      "is_recommended_by_tera": false


    },
    {
      "state": 2,
      "id": 265460,
      "coordinates": {
        "lat": 31.98452944546917,
        "lng": 34.95409288330965,
        "alt": 2000
      },
      "heading": 269.9997925898467,
      "platform": 0,
      "identity": false,
      "speed": 200,
      "isLocked": true,
      "risk_level": 65,
      "is_recommended_by_tera": true

    },
    {
      "state": 3,
      "id": 35640,
      "coordinates": {
        "lat": 31.97331921615682,
        "lng": 34.938969383016663,
        "alt": 2000
      },
      "heading": 129.99838941620573,
      "platform": 2,
      "identity": false,
      "speed": 150,
      "isLocked": false,
      "risk_level": 200,
      "is_recommended_by_tera": false
    },
    {
      "state": 4,
      "id": 770452,
      "coordinates": {
        "lat": 31.99984351579605,
        "lng": 34.93537904319256,
        "alt": 2000
      },
      "heading": 129.99838941620573,
      "platform": 3,
      "identity": false,
      "speed": 150,
      "isLocked": true,
      "risk_level": 100,
      "is_recommended_by_tera": false

    },
  ]



// ====== Broadcast ======

function broadcast(name, data) {

  const msg = JSON.stringify({ header: { name }, data });

  wss.clients.forEach(client => {

    if (client.readyState === WebSocket.OPEN) {

      client.send(msg);

    }

  });

}

const position = {

  coordinates: jeepPosition,

  heading: 0,

  los: {

    rangeKm: 3,

    angleDeg: 90

  }

}

function updatePosition() {
  // position.coordinates.lng += 0.01 * Math.cos(position.heading);
  // position.coordinates.lat += 0.01 * Math.sin(position.heading);
  position.heading = (position.heading + 10) % 360;
  // broadcast('MY_POSITION', position);
}






// function updateTargets() {
//   // if (targets.length > 2) {
//   //   targets.splice(2, 1)
//   // }

//   targets.forEach(t => {

//     t.coordinates.lng += 0.0001 * Math.cos(t.heading);
//     // t.is_recommended_by_tera = !t.is_recommended_by_tera;

//     // t.coordinates.lat += 0.0001 * Math.sin(t.heading);

//     t.heading = (t.heading + 10) % 360;
//   });

//   broadcast('TARGETS_DATA', targets);

// }


function updateTargets() {
  const earthRadius = 6371000; // meters
  const metersPerDegree = 111139; // Approx. meters per degree of latitude

  targets.forEach(t => {
    if (t.state === 0) return; // Skip inactive targets

    const speedInMetersPerSecond = t.speed * 1000 / 3600; // Convert km/h to m/s
    const headingInRadians = t.heading * (Math.PI / 180); // Convert degrees to radians

    // Calculate the distance to move in one frame (e.g., 1 second)
    const distance = speedInMetersPerSecond * 1; // 1 second frame

    // Calculate new latitude and longitude
    const lat1 = t.coordinates.lat * (Math.PI / 180); // Convert to radians
    const lon1 = t.coordinates.lng * (Math.PI / 180);

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distance / earthRadius) +
      Math.cos(lat1) * Math.sin(distance / earthRadius) * Math.cos(headingInRadians)
    );

    const lon2 = lon1 + Math.atan2(
      Math.sin(headingInRadians) * Math.sin(distance / earthRadius) * Math.cos(lat1),
      Math.cos(distance / earthRadius) - Math.sin(lat1) * Math.sin(lat2)
    );

    // Convert back to degrees
    t.coordinates.lat = lat2 * (180 / Math.PI);
    t.coordinates.lng = lon2 * (180 / Math.PI);

    // Update heading (optional: simulate turning)
    t.heading = (t.heading + 10) % 360;
  });

  broadcast('TARGETS_DATA', targets);
}




// ====== WebSocket Handling ======

wss.on('connection', ws => {

  console.log('📡 Client connected');

  console.log(`🔌 Active connections: ${wss.clients.size}`);





  setTimeout(() => {

    console.log('🎯 Sending RECOMMEND_ASSIGNMENT for UAV_01');

    broadcast('RECOMMEND_ASSIGNMENT', {

      targetId: '1',

      reason: 'High priority target'

    });

  }, 10000);





  // שליחה ראשונית

  ws.send(JSON.stringify({

    header: { name: 'POSITION' }, data: {

      valid: jeepPosition,

      heading: jeepHeading,

    }

  }));

  setTimeout(() => {
    ws.send(JSON.stringify({

      header: { name: 'POSITION' }, data: {

        valid: jeepPosition,

        heading: jeepHeading + 1,

      }

    }));
  }, 10000);


  // broadcast('TARGETS_POSITION', []);



  ws.on('message', async msg => {

    try {

      const { header, data } = JSON.parse(msg);



      if (header.name === 'POSITION') {

        console.log(data);



        jeepPosition = data.valid;

        jeepHeading = data.heading || 0;

        console.log('📍 Jeep position updated:', jeepPosition, jeepHeading);



        // broadcast('MY_POSITION', {

        //   coordinates: jeepPosition,

        //   heading: jeepHeading,

        // });

      }



      if (header.name === 'SET_RADAR_PARAMS') {





        console.log(data);

      }

      if (header.name === 'SET_TARGET_INFO') {
        const { tgt_id } = data;

        const target = targets.find(t => t.id === tgt_id);

        if (target) {
          target.identity = !target.identity;
        }
        console.log(target);

      }



      if (header.name === "LOS_REQUEST") {
        console.log("sadjhsgadhgsad hgasfd hgasfd hgfasd ");
        console.log(data);
        const res = simulateLos(data);
        console.log(res);
        ws.send(JSON.stringify({
          header: { name: "LOS_RESULT" },
          data: res
        }));
      }

      if (header.name === "GET_MISSIONS_LIST") {
        console.log("GET_MISSIONS_LIST");

        ws.send(JSON.stringify({
          header: { name: "MISSIONS_LIST" },
          data: ["data", "data770"]
        }));
      }

      if (header.name === "LOAD_MISSION") {
        console.log(data);

        ws.send(JSON.stringify({
          header: { name: "MISSION_DATA" },
          data: {
            mission_name: "550550550", entities: `[
            {
              "id": "entity_1766394941090_yu7by1yk0",
              "type": "circle",
              "name": "6",
              "color": "#3b82f6",
              "transparency": 0.3,
              "category": "No-fly zone",
              "visible": true,
              "coordinates": [
                {
                  "lng": 34.962786841162625,
                  "lat": 31.67880668089292
                },
                {
                  "lng": 35.01153867221649,
                  "lat": 31.63146315694999
                }
              ],
              "geometry": {
                "type": "Polygon",
                "coordinates": [
                  [
                    [
                      35.03676604668593,
                      31.67880668089292
                    ],
                    [
                      35.03640981659076,
                      31.68497751706575
                    ],
                    [
                      35.03534455699581,
                      31.69108892471291
                    ],
                    [
                      35.0335805269333,
                      31.69708204763793
                    ],
                    [
                      35.03113471497706,
                      31.702899168790864
                    ],
                    [
                      35.028030675633225,
                      31.708484266115047
                    ],
                    [
                      35.02429830249754,
                      31.713783552070122
                    ],
                    [
                      35.019973540363615,
                      31.71874599163546
                    ],
                    [
                      35.01509803905495,
                      31.723323793805296
                    ],
                    [
                      35.00971875231438,
                      31.72747287184226
                    ],
                    [
                      35.00388748561382,
                      31.73115326785673
                    ],
                    [
                      34.997660397239294,
                      31.73432953762319
                    ],
                    [
                      34.99109745745593,
                      31.73697109192745
                    ],
                    [
                      34.984261870961504,
                      31.73905249115755
                    ],
                    [
                      34.97721946819067,
                      31.74055369030109
                    ],
                    [
                      34.97003807133187,
                      31.741460231989684
                    ],
                    [
                      34.962786841162625,
                      31.741763385731296
                    ],
                    [
                      34.95553561099338,
                      31.741460231989684
                    ],
                    [
                      34.94835421413458,
                      31.74055369030109
                    ],
                    [
                      34.94131181136375,
                      31.73905249115755
                    ],
                    [
                      34.93447622486932,
                      31.73697109192745
                    ],
                    [
                      34.92791328508596,
                      31.73432953762319
                    ],
                    [
                      34.921686196711434,
                      31.73115326785673
                    ],
                    [
                      34.91585493001087,
                      31.72747287184226
                    ],
                    [
                      34.9104756432703,
                      31.723323793805296
                    ],
                    [
                      34.905600141961635,
                      31.71874599163546
                    ],
                    [
                      34.90127537982771,
                      31.713783552070122
                    ],
                    [
                      34.897543006692025,
                      31.708484266115047
                    ],
                    [
                      34.894438967348194,
                      31.702899168790864
                    ],
                    [
                      34.89199315539195,
                      31.69708204763793
                    ],
                    [
                      34.89022912532944,
                      31.69108892471291
                    ],
                    [
                      34.88916386573449,
                      31.68497751706575
                    ],
                    [
                      34.88880763563932,
                      31.67880668089292
                    ],
                    [
                      34.88916386573449,
                      31.672635844720087
                    ],
                    [
                      34.89022912532944,
                      31.666524437072926
                    ],
                    [
                      34.89199315539195,
                      31.660531314147907
                    ],
                    [
                      34.894438967348194,
                      31.654714192994973
                    ],
                    [
                      34.897543006692025,
                      31.64912909567079
                    ],
                    [
                      34.90127537982771,
                      31.643829809715715
                    ],
                    [
                      34.905600141961635,
                      31.63886737015038
                    ],
                    [
                      34.9104756432703,
                      31.63428956798054
                    ],
                    [
                      34.91585493001087,
                      31.630140489943578
                    ],
                    [
                      34.921686196711434,
                      31.626460093929108
                    ],
                    [
                      34.92791328508596,
                      31.623283824162648
                    ],
                    [
                      34.93447622486932,
                      31.620642269858386
                    ],
                    [
                      34.94131181136375,
                      31.618560870628286
                    ],
                    [
                      34.94835421413458,
                      31.617059671484746
                    ],
                    [
                      34.95553561099338,
                      31.616153129796153
                    ],
                    [
                      34.962786841162625,
                      31.61584997605454
                    ],
                    [
                      34.97003807133187,
                      31.616153129796153
                    ],
                    [
                      34.97721946819067,
                      31.617059671484746
                    ],
                    [
                      34.984261870961504,
                      31.618560870628286
                    ],
                    [
                      34.99109745745593,
                      31.620642269858386
                    ],
                    [
                      34.997660397239294,
                      31.623283824162648
                    ],
                    [
                      35.00388748561382,
                      31.626460093929108
                    ],
                    [
                      35.00971875231438,
                      31.630140489943578
                    ],
                    [
                      35.01509803905495,
                      31.63428956798054
                    ],
                    [
                      35.019973540363615,
                      31.63886737015038
                    ],
                    [
                      35.02429830249754,
                      31.643829809715715
                    ],
                    [
                      35.028030675633225,
                      31.64912909567079
                    ],
                    [
                      35.03113471497706,
                      31.654714192994973
                    ],
                    [
                      35.0335805269333,
                      31.660531314147907
                    ],
                    [
                      35.03534455699581,
                      31.666524437072926
                    ],
                    [
                      35.03640981659076,
                      31.672635844720087
                    ],
                    [
                      35.03676604668593,
                      31.67880668089292
                    ]
                  ]
                ]
              },
              "createdAt": 1766394941090,
              "updatedAt": 1766394941090
            },
            {
              "id": "entity_1766397625038_9qw0y9t8y",
              "type": "polygon",
              "name": "rf",
              "color": "#3b82f6",
              "transparency": 0.3,
              "category": "No-fly zone",
              "visible": true,
              "coordinates": [
                {
                  "lng": 34.93257443881842,
                  "lat": 31.83819407017262
                },
                {
                  "lng": 34.853610205420296,
                  "lat": 31.786262772493586
                },
                {
                  "lng": 34.93394772983413,
                  "lat": 31.775756264399277
                },
                {
                  "lng": 35.0074187991693,
                  "lat": 31.79735168037952
                },
                {
                  "lng": 35.00123898959944,
                  "lat": 31.80727220714057
                },
                {
                  "lng": 34.93257443881842,
                  "lat": 31.83819407017262
                }
              ],
              "geometry": {
                "type": "Polygon",
                "coordinates": [
                  [
                    [
                      34.93257443881842,
                      31.83819407017262
                    ],
                    [
                      34.853610205420296,
                      31.786262772493586
                    ],
                    [
                      34.93394772983413,
                      31.775756264399277
                    ],
                    [
                      35.0074187991693,
                      31.79735168037952
                    ],
                    [
                      35.00123898959944,
                      31.80727220714057
                    ],
                    [
                      34.93257443881842,
                      31.83819407017262
                    ]
                  ]
                ]
              },
              "createdAt": 1766397625038,
              "updatedAt": 1766397625038
            }
          ]` }
        }));
      }


      if (header.name === 'ALLOCATE') {

        console.log(data);



        const { tgt_id } = data;

        const target = targets.find(t => t.id === tgt_id);


        const obj = targets.find(o => o.id === tgt_id);
        if (obj) {
          obj.state = 2;
        }

        console.log(targets);

        if (!target) {

          console.warn(`❗ Target not found: ${tgt_id}`);

          return;

        }

        setTimeout(() => {
          const obj1 = targets.find(o => o.id === tgt_id);
          if (obj1) {
            obj1.state = 3;
          }

          console.log(targets);

          if (!target) {

            console.warn(`❗ Target not found: ${tgt_id}`);

            return;

          }

        }, 10000);



        // שלב 1: שידור מטרה מוקצית

        // broadcast('TARGET_Assigned', {

        //   id: targetId,

        //   coordinates: [target.coordinates.lng, target.coordinates.lat]

        // });






        // שלב 2: לאחר 7 שניות – שידור נעילה אופטית

        setTimeout(() => {

          broadcast('TARGET_Assigned', {
            id: tgt_id,
          });



          console.log(`🔒 Target locked: ${tgt_id}`);

        }, 5000);



        // שלב 3: לאחר 13 שניות – סימון כמושמד






        //  setTimeout(() => {

        //  const index = targets.findIndex(item => item.id=== targetId);

        //  if(index !== -1){

        //   targets.splice(index,1)

        //  }

        // }, 17000);

      }

      if (header.name === 'CANCEL_ENGAGEMENT') {
        console.log(data);

        const { tgt_id } = data;
        const target = targets.find(t => t.id === tgt_id);

        if (!target) {
          console.warn(`❗ Target not found: ${tgt_id}`);
          return;
        }


        const obj = targets.find(o => o.id === tgt_id);
        if (obj) {
          obj.state = 0;
        }



      }

      if (header.name === 'SAVE_MISSION') {
        console.log(data);
      }



      if (header.name === 'SET_CONFIRM_LOCATION') {
        console.log(data);
      }

      if (header.name === 'SET_POSITION') {

        ws.send(JSON.stringify({

          header: { name: 'POSITION' }, data: {

            valid: { lat: data.lat, lng: data.lng },

            heading: jeepHeading,

          }

        }));
        console.log(data);
      }
    } catch (err) {

      console.error('❌ Failed to parse:', err.message);

    }

  });



  ws.on('close', () => {

    console.log("❌ Client disconnected");

    console.log(`🟡 Remaining connections: ${wss.clients.size}`);

  });

});

function moveMeters(center, distanceMeters, angleDeg) {
  const R = 111320; // מטר למעלה רוחב
  const rad = (angleDeg * Math.PI) / 180;

  const dx = Math.sin(rad) * distanceMeters;
  const dy = Math.cos(rad) * distanceMeters;

  const lat = center.lat + dy / R;
  const lng = center.lng + dx / (R * Math.cos((center.lat * Math.PI) / 180));

  return { lat, lng };
}

function generateLosFrame() {
  const center = { lat: 31.77, lng: 35.21 }; // נקודת ג'יפ לדוגמה
  const radiusMeters = 6000;

  // סקטור 140° שמסתובב לאט מסביב
  const baseAngle = Math.floor(Math.random() * 360);
  const angleStartDeg = baseAngle;
  const angleEndDeg = (baseAngle + 140) % 360;

  // קרניים חסומות רק *בתוך* הסקטור
  const rays = [];
  const rayCount = 25;

  for (let i = 0; i < rayCount; i++) {
    // זווית אקראית בתוך הסקטור
    let t = Math.random(); // 0..1
    let sweep =
      angleEndDeg >= angleStartDeg
        ? angleEndDeg - angleStartDeg
        : 360 - angleStartDeg + angleEndDeg;

    const angleDeg = (angleStartDeg + sweep * t) % 360;

    // מרחק התחלה וסוף
    const distanceStart = 500 + Math.random() * 2500; // חסימה לא מהמרכז
    const distanceEnd = distanceStart + 1000 + Math.random() * 2000;
    const clampedEnd = Math.min(distanceEnd, radiusMeters);

    rays.push({
      angleDeg,
      distanceStart,
      distanceEnd: clampedEnd,
      blocked: true
    });
  }

  return {
    header: { name: "LOS_RESULT" },
    data: {
      center,
      radiusMeters,
      angleStartDeg,
      angleEndDeg,
      rays
    }
  };
}

// שידור כל 20 שניות
setInterval(() => {
  const frame = generateLosFrame();
  const json = JSON.stringify(frame);

  console.log(
    "Sending LOS_RESULT, rays:",
    frame.data.rays.length,
    "angles from",
    frame.data.angleStartDeg,
    "to",
    frame.data.angleEndDeg
  );

  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  });
}, 20000);



// ====== Init ======

loadDTM().then(() => {

  setInterval(updateRadarStatus, 7000); // כל 7 שניות שולח עדכון RADAR

  setTimeout(() => {
    setInterval(updateTargets, 2000);
  }, 20000);

  setInterval(() => {
    broadcast('SYSTEM_STATUS', {
      radar_status: 4,
      gun_status: gunstatus,
      tmaps_status: gunstatus,
      radar_non_coverage: ["60-120"],
      radar_range: 1500
    });
  }, 5000);

  setInterval(() => {
    broadcast('RADAR_PARAMS', {
      radar_mode: 0,
      mission_category: 2,
      freq_index: 6,
    });
  }, 5000);


  // setInterval(() => {
  //   broadcast('RADAR_BIT_STATUS', [{
  //     code: 2,
  //     description: "test dana shlomo 770 ",
  //     severity: 1,
  //     state: 0
  //   },
  //  ]);
  // }, 5000);



  setTimeout(() => {
    broadcast('RADAR_BIT_STATUS', [{
      code: 2,
      description: "test dana shlomo 770 ",
      severity: 1,
      state: 1
    },
    ]);
  }, 15000);

  setTimeout(() => {
    // setInterval(() => {
    broadcast('CONFIRM_POSITION', { state: true });
    // }, 15000);
  }, 15000);

  setInterval(updatePosition, 5000);

  setInterval(updateGunStatus, 6000); // כל 6 שניות 

});