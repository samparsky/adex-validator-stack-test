const request = require("supertest");

before(() => {
    await seedDatabase("adexValidator")
    await seedDatabase("adexValidatorFollower")
})

after(() => {
    await drop("adexValidator")
    await drop("adexValidatorFollower")
})

describe("Sentry Integration Tests", ()=> {

        // DB_MONGO_URL
    it("Sentry - Get Channel Info", async(t)=>{
        // set Mongo db  url
        request(app).get("/channel/list").end((err, res)=> {
            // console.log({ err })
            console.log(res.body)
        })
    })

    it("Sentry - Get channel status", async(t) => {
        request(app).get("/channel/awesomeTestChannel/status").end((err, res)=> {
            // console.log({ err })
            console.log("channle status")
            console.log(res.body)
        })
    })

    it("Sentry - Get channel tree", async(t) => {
        request(app).get("/channel/awesomeTestChannel/tree").end((err, res)=> {
            // console.log({ err })
            console.log("channle tree")
            console.log(res.body)
        })
    })

    it("Sentry - POST events", async(t) => {
        request(app).post("/channel/awesomeTestChannel/events")      
        .send({"events": [{"type": "IMPRESSION", "publisher": "myAwesomePublisher"}]})
        .end((err, res)=> {
            console.log( err)
            console.log("POST ")
            console.log(res.body)
        })
    })

    it("Sentry - POST validator messages", async(t) => {
        request(app).post("/channel/awesomeTestChannel/events")      
        // .send({"events": [{"type": "IMPRESSION", "publisher": "myAwesomePublisher"}]})
        .end((err, res)=> {
            console.log( err)
            console.log("POST validator messages")
            console.log(res.body)
        })
    })

})