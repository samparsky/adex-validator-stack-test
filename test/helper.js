const fetch = require("node-fetch");
const { MongoClient } = require('mongodb')
const childproc = require('child_process')

let mongoClient = null

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function exec(cmd) {
	return new Promise((resolve, reject) => {
		const proc = childproc.exec(cmd, err => (err ? reject(err) : resolve()))
		proc.stdout.pipe(process.stdout)
		proc.stderr.pipe(process.stderr)
	})
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

    if(response.status == 401) return response

    return response.json()
}

async function sendEvents(
    ports=[], 
    publisher="myAwesomePublisher", 
    channel="awesomeTestChannel") {
        
    for (const port of ports) {
        const url = `http://localhost:${port}/channel/${channel}/events`

        const body = JSON.stringify(
            {"events": [{"type": "IMPRESSION", "publisher": publisher}]}
        )
        // send to leader
        await fetch(url, {
            headers: {
                "authorization": "Bearer x8c9v1b2",
                "content-type": "application/json"
            },
            body,
            method: "POST"
        });    
    }
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
        validators: [`${leaderIdentity}`, `${followerIdentity}`],
        spec: {
            validators: [
                { id: `${leaderIdentity}`, url: `http://${uri}:${leaderPort}`, fee: '100' },
                { id: `${followerIdentity}`, url: `http://${uri}:${followerPort}`, fee: '100' },
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

    await db.collection("sessions").update(
        { _id: 'x8c9v1b2'}, 
        { _id: 'x8c9v1b2', uid: 'awesomeTestUser' },  
        {upsert: true}
    )

    await db.collection("sessions").update(
        { _id: `AUTH_${leaderIdentity}`}, 
        { _id: `AUTH_${leaderIdentity}`, uid: `${leaderIdentity}` }, 
        {upsert: true}
    )

    await db.collection("sessions").update(
        { _id: `AUTH_${followerIdentity}`}, 
        { _id: `AUTH_${followerIdentity}`, uid: `${followerIdentity}` }, 
        {upsert: true}
    )

    return mongoClient;
}

function aggrAndTick() {
	// If we need to run the production config with AGGR_THROTTLE, then we need to wait for cfg.AGGR_THROTTLE + 500
	// the reason is that in production we have a throttle for saving event aggregates
	if (process.env.NODE_ENV === 'production') {
		return sleep(1500).then(forceTick)
	}
	return forceTick()
}

function forceTick() {
	return Promise.all([
		exec(
			`DB_MONGO_NAME=${
				process.env.LEADER_DATABASE
			} ${process.cwd()}/../../bin/validatorWorker.js --single-tick --adapter=dummy --dummyIdentity=awesomeLeader`
		),
		exec(
			`DB_MONGO_NAME=${
				process.env.FOLLOWER_DATABASE
			} ${process.cwd()}/../../bin/validatorWorker.js --single-tick --adapter=dummy --dummyIdentity=awesomeFollower`
		)
	])
}


const randString       = () => Math.random().toString(36).substring(2, 15) 
const leaderPort       = process.env.LEADER_PORT || 8005
const followerPort     = process.env.FOLLOWER_PORT || 8006
const leaderDatabase   = process.env.LEADER_DATABASE || "adexValidator" 
const followerDatabase = process.env.FOLLOWER_DATABASE || "adexValidatorFollower"
const followerIdentity = process.env.FOLLOWER_IDENTITY || "awesomeFollower"
const leaderIdentity   = process.env.LEADER_IDENTITY || "awesomeLeader"
const waitTime         = process.env.WAIT_TIME || 13000

module.exports = { 
    post,
    get,
    sendEvents,
    seedChannel,
    seedDatabase,
    sleep,
    randString,
    drop,
    leaderPort,
    followerPort,
    leaderDatabase,
    followerDatabase,
    followerIdentity,
    leaderIdentity,
    waitTime,
    aggrAndTick,
    forceTick,
}
