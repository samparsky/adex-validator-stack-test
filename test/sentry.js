const {
    randString,
    seedChannel,
    get,
    post,
    seedDatabase,
    drop,
    leaderPort,
    followerPort,
    leaderDatabase,
    followerDatabase,
} = require('./helper')
const assert = require("assert")


let channel = randString()

before(async () => {
    await seedDatabase(leaderDatabase)
    await seedDatabase(followerDatabase)

    await seedChannel(leaderDatabase, channel)
    await seedChannel(followerDatabase, channel)
})

after(async () => {
    await drop(leaderDatabase)
    await drop(followerDatabase, true)
})

describe("Sentry", () => {

    it("Should get channel info", async() => {

        const followerList = await get(followerPort, "channel/list")
        const leaderList   = await get(leaderPort, "channel/list")

        assert.deepEqual(followerList, leaderList, "Incorrect channel info")
    })

    it("Should get channel status", async() => {

        const followerStatus = await get(followerPort, `channel/${channel}/status`)
        const leaderStatus   = await get(leaderPort, `channel/${channel}/status`)

        assert.deepEqual(followerStatus, leaderStatus, "Incorrect channel status")
    })

    it("Should get channel tree", async() => {

        const follower = await get(followerPort, `channel/${channel}/tree`)
        const leader   = await get(leaderPort, `channel/${channel}/tree`)

        assert.deepEqual(follower, leader, "Incorrect channel tree")
    })

    it("Should post events", async() => {
        const publisher = "a1"
        const body      = {
            "events": [
                {
                    "type": "IMPRESSION", 
                    "publisher": publisher
                }
            ]
        }

        const follower = await post(followerPort, `channel/${channel}/events`, body)
        const leader   = await post(leaderPort, `channel/${channel}/events`, body)

        assert.equal(follower['success'], true, "Failed to post event")
        assert.deepEqual(follower, leader, "Failed to post events")
    })

    it("Should post validator messages", async() => {
        const state = {
            "messages": [
                { 
                "type" : "NewState", 
                "balances" : { 
                    "a1" : "1"
                }, 
                "lastEvAggr": "2019-01-16T08:48:01.547Z", 
                "stateRoot" : "cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4", 
                "signature" : "Dummy adapter signature for cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4 by awesomeLeader" 
                }
            ]
        }
    
        // propagate to follower
        const followerPropagate = await post(
            followerPort, 
            `channel/${channel}/validator-messages`, 
            state, 
            "Bearer AUTH_awesomeLeader")
    
        assert.equal(followerPropagate['success'], true, "Failed to propagate message")
    })

    it("Should reject validator messages with invalid auth", async() =>{
        const state = {
            "messages": []
        }

        // propagate to follower
        const followerPropagate = await post(
            followerPort, 
            `channel/${channel}/validator-messages`, 
            state, 
            "Bearer Fake_AUTH" )
    
        assert.equal(followerPropagate.status, 401, "Failed to check auth")

        const leaderPropagate = await post(
            followerPort, 
            `channel/${channel}/validator-messages`, 
            state, 
            "Bearer Fake_AUTH" )
        
        assert.equal(leaderPropagate.status, 401, "Failed to check auth")
    })

})