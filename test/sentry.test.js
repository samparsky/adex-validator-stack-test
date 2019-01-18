const request = require("supertest");
const {
    randString,
    seedChannel,
    get,
    post,
    seedDatabase,
    sendEvents,
    connectDB,
    drop,
} = require('./helper')

const assert = require("assert")

const leader   = "adexValidator"
const follower = "adexValidatorFollower"

let channel = randString()

before(async () => {
    await seedDatabase("adexValidator")
    await seedDatabase("adexValidatorFollower")

    await seedChannel("adexValidator", channel)
    await seedChannel("adexValidatorFollower", channel)

    console.log("befoe worldd")
    console.log({channel})

})

after(async () => {
    console.log("waiting on working")
    await drop("adexValidator")
    console.log("waiting on working1")
    await drop("adexValidatorFollower", true)
})

describe("Sentry", () => {

    it("Should get channel info", async() => {
        const followerList = await get(8005, "channel/list")
        const leaderList = await get(8006, "channel/list")

        assert.deepEqual(followerList, leaderList, "Incorrect channel info")
    })

    it("Should get channel status", async() => {
        const followerStatus = await get(8005, `channel/${channel}/status`)
        const leaderStatus   = await get(8006, `channel/${channel}/status`)

        assert.deepEqual(followerStatus, leaderStatus, "Incorrect channel status")
    })

    it("Should get channel tree", async() => {
        const follower = await get(8005, `channel/${channel}/tree`)
        const leader   = await get(8006, `channel/${channel}/tree`)

        assert.deepEqual(follower, leader, "Incorrect channel tree")
    })

    it("Should post events", async() => {
        const publisher = "a1"
    
        await sendEvents([8005, 8006], publisher, channel)
    })

    it("Should post validator messages", async() => {
        const state = {
            "messages": [{ 
                "type" : "NewState", 
                "balances" : { 
                    "a1" : "5000"
                }, 
                "lastEvAggr" : "2019-01-16T08:48:01.547Z", 
                "stateRoot" : "cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4", 
                "signature" : "Dummy adapter signature for cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4 by awesomeLeader" 
            }]
        }
    
        // propagate to follower
        const followerPropagate = await post(
            8006, 
            `channel/${channel}/validator-messages`, 
            state, 
            "Bearer AUTH_awesomeLeader")
    
        assert.equal(followerPropagate['success'], true, "Failed to propagate message")
    })

})