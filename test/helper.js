const fetch = require("node-fetch");
const { MongoClient } = require('mongodb')

let mongoClient = null

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function get(port, url) {
    url =  `http://localhost:${port}/${url}`
    const response = await fetch(url, {
        headers: {
            "content-type": "application/json"
        },
        method: "GET"
    });
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

    return response.json()
}

async function sendEvents(ports=[], publisher="myAwesomePublisher", channel="awesomeTestChannel", ){
    ports.forEach(async (port) => {
        const url = `http://localhost:${port}/channel/${channel}/events`

        const body = JSON.stringify({"events": [{"type": "IMPRESSION", "publisher": publisher}]})
        // send to leader
        await fetch(url, {
            headers: {
                "authorization": "Bearer x8c9v1b2",
                "content-type": "application/json"
            },
            body,
            method: "POST"
        });    
    })
}

async function drop(id, drop=false){
    if(!mongoClient) return
    // const mongoClient = await connectDB()
    const db = mongoClient.db(id)

    await db.dropDatabase();
    // drop mongodb connection for test to exit
    if(drop) {
        mongoClient.close(true)
        mongoClient = null
    }
    
}

async function seedChannel(id, channel="awesomeTestChannel") {
    const mongoClient = await connectDB()

    const db = mongoClient.db(id)

    let uri = "host.docker.internal"
    if(process.env.NOT_DOCKER) uri = "localhost"

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
                { id: 'awesomeLeader', url: `http://${uri}:8005` },
                { id: 'awesomeFollower', url: `http://${uri}:8006` },
            ]
        }
    })
}

async function connectDB(){
    if(mongoClient){
        return mongoClient
    }

    const uri = process.env.MONGODB_URL || 'mongodb://localhost:27017'

    mongoClient = await MongoClient.connect(uri, { 
        useNewUrlParser: true,
    })
    return mongoClient;
}

async function seedDatabase(id){
    const mongoClient = await connectDB()
    const db = mongoClient.db(id)

    await db.collection("sessions").update({ _id: 'x8c9v1b2'}, { _id: 'x8c9v1b2', uid: 'awesomeTestUser' },  {upsert: true})

    await db.collection("sessions").update({ _id: 'AUTH_awesomeLeader'}, { _id: 'AUTH_awesomeLeader', uid: 'awesomeLeader' }, {upsert: true})
    await db.collection("sessions").update({ _id: 'AUTH_awesomeFollower'}, { _id: 'AUTH_awesomeFollower', uid: 'awesomeFollower' }, {upsert: true})

    return mongoClient;
}

const randString = () => Math.random().toString(36).substring(2, 15) 


module.exports = { 
    post,
    get,
    sendEvents,
    seedChannel,
    seedDatabase,
    sleep,
    randString,
    drop,
}
