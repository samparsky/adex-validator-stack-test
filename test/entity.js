const test = require("blue-tape");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient } = require('mongodb')

// const request = require("supertest");
// const sentry = require("../stack/bin/sentry")
// const worker = require("../stack/bin/validatorWorker")
const util = require("util")
const exec = util.promisify(require("child_process").exec)
const { spawn, fork } = require("child_process")
const fetch = require("node-fetch");

let pids = []

const exitHandler =  () => {
    console.log(`killing processes with id ${pids.join(" ,")}`)
    pids.map((id) => process.kill(parseInt(`-${id}`)))
    console.log("Success")
    // process.exit(0)
}

// process.on('exit', exitHandler)
// process.on('SIGINT', exitHandler)
// const request = require("request")

// const mongod = new MongoMemoryServer();
// let uri = mongod.getConnectionString();
// console.log({uri})

let dbUrl
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



async function setupDb(dbName){
    if(dbUrl) {
        return dbUrl
    }
    console.log("Setting up database");
    const mongod = new MongoMemoryServer();
    dbUrl = await mongod.getConnectionString();
    console.log({ dbUrl })
    return dbUrl
}



async function seedChannel(id, uri, channel="awesomeTestChannel") {
    const mongoClient = await MongoClient.connect(uri || 'mongodb://localhost:27017', { useNewUrlParser: true })
    const db = mongoClient.db(id)

    await db.collection("channels").insertOne({
        // @TODO: document schema
        _id: channel,
        id: channel,
        status: 'live',
        // @TODO: ERC20 addr
        depositAsset: 'DAI',
        depositAmount: 1000,
        validators: ['awesomeLeader', 'awesomeFollower'],
        spec: {
            validators: [
                { id: 'awesomeLeader', url: 'http://localhost:8005' },
                { id: 'awesomeFollower', url: 'http://localhost:8006' },
            ]
        }
    })
}

/**
 * Use random seeded channels for each test
 */

async function seedDatabase(id, uri){
    const mongoClient = await MongoClient.connect(uri || 'mongodb://localhost:27017', { useNewUrlParser: true })
    const db = mongoClient.db(id)

    await db.collection("sessions").insertOne({ _id: 'x8c9v1b2', uid: 'awesomeTestUser' })

    await db.collection("sessions").insertOne({ _id: 'AUTH_awesomeLeader', uid: 'awesomeLeader' })
    await db.collection("sessions").insertOne({ _id: 'AUTH_awesomeFollower', uid: 'awesomeFollower' })

    // await mongoClient.close()
}

async function drop(id, uri, collection="sessions"){
    const mongoClient = await MongoClient.connect(uri || 'mongodb://localhost:27017', { useNewUrlParser: true })
    const db = mongoClient.db(id)

    await db.collection(collection).drop()
    // await mongoClient.close()
}

async function sendEvents(ports=[], publisher="myAwesomePublisher", channel="awesomeTestChannel", ){
    Promise.all(
        ports.map(async (port) => {
            const url = `http://localhost:${port}/channel/${channel}/events`

            const body = JSON.stringify({"events": [{"type": "IMPRESSION", "publisher": publisher}]})
    
            // send to leader
            const response = await fetch(url, {
                headers: {
                    "authorization": "Bearer x8c9v1b2",
                    "content-type": "application/json"
                },
                body,
                method: "POST"
            });
        
            console.log({response})
        })
    )
}

async function get(port, url) {
    url =  `http://localhost:${port}/${url}`
    const response = await fetch(url, {
        headers: {
            "content-type": "application/json"
        },
        method: "GET"
    });
    // console.log({response})
    return response.json()
}

async function post(port, url, body, authorization="Bearer x8c9v1b2") {
    url =  `http://localhost:${port}/${url}`
    body = JSON.stringify(body)

    const response = await fetch(url, {
        headers: {
            authorization,
            "content-type": "application/json"
        },
        body,
        method: "POST"
    });

    console.log({response})
    return response.json()
}

async function _setupSentry(id, dbUrl, port){
    await seedDatabase(id, dbUrl)

    console.log("executing command")

    const cmd = `DB_MONGO_NAME=${id} DB_MONGO_URL=${dbUrl || ''} PORT=${port} nohup node /Users/Samparsky/Sites/nodejs/adex-validator-stack-test/stack/bin/sentry.js --adapter=dummy --dummyIdentity=${id} >> ${id}.out`
    console.log({cmd})
    const spawnR = spawn(cmd, {
        stdio: 'inherit',
        shell: true,
        detached: true
    })
    pids.push(spawnR.pid)
    // console.log({spawnR})

    console.log("hello world")
}

async function _setupWorker(id, dbUrl){
    const cmd = `DB_MONGO_NAME=${id} DB_MONGO_URL=${dbUrl || ''} nohup node /Users/Samparsky/Sites/nodejs/adex-validator-stack-test/stack/bin/validatorWorker.js --adapter=dummy --dummyIdentity=${id} >> ${id}.out`
    const spawnR = await spawn(cmd, {
        stdio: 'inherit',
        shell: true,
        detached: true
    })
    pids.push(spawnR.pid)
    // console.log({ spawnR })
    // console.log({ stderr })
}


async function setupLeader(){
    // setup db
    // const uri = await setupDb();
    const port = 8005
    // run sentry
    console.log("setup sentry") 

    // await _setupSentry("awesomeLeader", "", port)
    // console.log('Taking a break...');
    // await sleep(2000);
    // console.log('Two seconds later');
    // // setup work
    // await _setupWorker("awesomeLeader", "")
    // send messages


}

async function setupFollower(){
    const uri = await setupDb();
    const port = 8006

    // run sentry
    // await _setupSentry("awesomeFollower", "", port)
    // console.log('Taking a break...');
    // await sleep(2000);
    // console.log('Two seconds later');
    // // // setup work
    // await _setupWorker("awesomeFollower", "")
    console.log("send messages") 
}

// test("Leader signs a valid state, Followers should detect and sign", async(t) => {
//     const channel = Math.random().toString(36).substring(2, 15) 

//     // await seedDatabase("adexValidatorFollower")
//     // await seedDatabase("adexValidator")
//     await seedChannel("adexValidator", null, channel)
//     await seedChannel("adexValidatorFollower", null, channel)

//     const publishers = ["myAwesomePublisher", "myAwesomePublisher1", "myAwesomePublisher2"]

//     Promise.all(
//         publishers.map(
//             (publisher) => sendEvents([8005, 8006], publisher, channel)
//         )
//     )
//     // get the channel status
//     const leaderStatus  = await get(8005, `channel/${channel}/status`)
//     const followerStatus = await get(8006, `channel/${channel}/status`)
//     // console.log({leaderStatus})
//     // console.log({followerStatus})

//     // check deposit amount
//     await t.equal(leaderStatus.depositAmount, followerStatus.depositAmount)
//     // check tree

//     // sleep for 3 seconds 
//     // to allow validateworker to produce state
//     await sleep(30000)

//     const leaderTree = await get(8005, `channel/${channel}/tree`)
//     const followerTree = await get(8006, `channel/${channel}/tree`)
//     // t.equal(leaderTree.fo)
//     // console.log({leaderTree})
//     // console.log({followerTree})

//     // confirm the tree
//     Promise.all(
//         publishers.map(
//             (publisher) => t.equal(
//                             leaderTree['balances'][publisher], 
//                             '1', 
//                             "publisher balance"
//                         )
//         )
//     )

//     // confirm tree
//     Promise.all(
//         publishers.map(
//             (publisher) => t.equal(
//                             followerTree['balances'][publisher], 
//                             '1', 
//                             "publisher balance"
//                         )
//         )
//     )

//     // delete sessions details
//     // await drop("adexValidatorFollower")
//     // await drop("adexValidator")
// })
test("Leader sends an unhealthy new state, follower should mark channel unhealthy 1", async(t) => {
    const channel = Math.random().toString(36).substring(2, 15) 
    await seedDatabase("adexValidatorFollower")
    await seedDatabase("adexValidator")

    await seedChannel("adexValidator", null, channel)
    await seedChannel("adexValidatorFollower", null, channel)

    const publisher = "a1"

    await sendEvents([8005, 8006], publisher, channel)
    await sendEvents([8005, 8006], publisher, channel)
    
    await sendEvents([8006], publisher, channel)
    await sendEvents([8006], publisher, channel)
    await sendEvents([8006], publisher, channel)
    await sendEvents([8006], publisher, channel)
    await sendEvents([8006], publisher, channel)

    await sleep(50000)

    // get the last validator message from follower
    let followerMessage = await get(
        8006, 
        `channel/${channel}/validator-messages/awesomeFollower/ApproveState`
        )

    console.log({ followerMessage })
    t.equal(followerMessage['messages'][0]['msg']['health'], "UNHEALTHY", "Mark channel unhealthy")

})

// test("Leader sends an unhealthy new state, follower should mark channel unhealthy 2", async(t) => {
//     const channel = Math.random().toString(36).substring(2, 15) 
    
//     // await seedDatabase("adexValidatorFollower")
//     // await seedDatabase("adexValidator") 
    
//     await seedChannel("adexValidator", null, channel)
//     await seedChannel("adexValidatorFollower", null, channel)


//     const publisher = "a1"

//     // sendEvents([8005, 8006], publisher, channel)

//     // master message
//     let invalidState = {
//         "messages": [
//             { 
//                 "type" : "NewState", 
//                 "balances" : { 
//                     "a1" : 10,
//                 }, 
//                 "lastEvAggr" : "2019-01-16T08:48:01.547Z", 
//                 "stateRoot" : "cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4", 
//                 "signature" : "Dummy adapter signature for cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4 by awesomeLeader" 
//             }
//         ]
//     }

//     let followerPropagate = await post(
//                                 8006, 
//                                 `channel/${channel}/validator-messages`, 
//                                 invalidState,
//                                 "Bearer AUTH_awesomeLeader"
//                             )

//     console.log({ followerPropagate })

//     // sleep 3 seconds
//     await sleep(10000)

//     // should mark the state unhealhy 
//     let followerStatus = await get(8006, `channel/${channel}/status`)
//     console.log(JSON.stringify(followerStatus))
//     let followerTree = await get(8006, `channel/${channel}/tree`)
//     console.log(JSON.stringify(followerTree))

//     invalidState = {
//         "messages": [
//             { 
//                 "type" : "NewState", 
//                 "balances" : { 
//                     "a1" : 50,
//                 }, 
//                 "lastEvAggr" : "2019-01-16T08:48:01.547Z", 
//                 "stateRoot" : "cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4", 
//                 "signature" : "Dummy adapter signature for cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4 by awesomeLeader" 
//             }
//         ]
//     }

//     followerPropagate = await post(
//         8006, 
//         `channel/${channel}/validator-messages`, 
//         invalidState,
//         "Bearer AUTH_awesomeLeader"
//     )
//     console.log("2")
//     await sleep(10000)

//     // should mark the state unhealhy 
//     followerStatus = await get(8006, `channel/${channel}/status`)
//     console.log(JSON.stringify(followerStatus))
//     followerTree = await get(8006, `channel/${channel}/tree`)
//     console.log(JSON.stringify(followerTree))


//     invalidState = {
//         "messages": [
//             { 
//                 "type" : "NewState", 
//                 "balances" : { 
//                     "a1" : 5,
//                 }, 
//                 "lastEvAggr" : "2019-01-16T08:48:01.547Z", 
//                 "stateRoot" : "cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4", 
//                 "signature" : "Dummy adapter signature for cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4 by awesomeLeader" 
//             }
//         ]
//     }

//     followerPropagate = await post(
//         8006, 
//         `channel/${channel}/validator-messages`, 
//         invalidState,
//         "Bearer AUTH_awesomeLeader"
//     )

//     console.log("3")
//     await sleep(10000)

//     // should mark the state unhealhy 
//     followerStatus = await get(8006, `channel/${channel}/status`)
//     console.log(JSON.stringify(followerStatus))
//     followerTree = await get(8006, `channel/${channel}/tree`)
//     console.log(JSON.stringify(followerTree))




//     // validator-message
// })

// // Doesnt work as should
// test("Leader sends a new state with invalid signature, follower should reject", async(t) => {

// })

// // DOS attack vector
// test("Leader sends an incorrect type of state, follower should reject", async(t) => {
//     const channel = "awesomeTestChannel"
//     const publisher = "myAwesomePublisher"
//     sendEvents([8005, 8006], publisher)

//     const invalidState = { 
//         "type" : "PowerRun", 
//         "balances" : { 
//             "myAwesomePublisher" : "3", 
//             "myAwesomePublisher1" : "3", 
//             "myAwesomePublisher2" : "3" 
//         }, 
//         "lastEvAggr" : "2019-01-16T08:48:01.547Z", 
//         "stateRoot" : "cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4", 
//         "signature" : "Dummy adapter signature for cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4 by awesomeLeader" 
//     }

//     const followerPropagate = await post(8006, `channel/${channel}/validator-messages`, invalidState)
//     console.log({ followerPropagate })

// })

// // deposit amount is less than 
// test("Leader sends an invalid state, follower should reject", async(t) => {
//     const channel = "awesomeTestChannel"
//     const publisher = "myAwesomePublisher"
//     sendEvents([8005, 8006], publisher)

//     const invalidState = { 
//         "type" : "NewSstate", 
//         "balances" : { 
//             "myAwesomePublisher" : "1000", 
//             "myAwesomePublisher1" : "3", 
//             "myAwesomePublisher2" : "3" 
//         }, 
//         "lastEvAggr" : "2019-01-16T08:48:01.547Z", 
//         "stateRoot" : "cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4", 
//         "signature" : "Dummy adapter signature for cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4 by awesomeLeader" 
//     }

//     const followerPropagate = await post(8006, `channel/${channel}/validator-messages`, invalidState)
//     console.log({ followerPropagate })

// })