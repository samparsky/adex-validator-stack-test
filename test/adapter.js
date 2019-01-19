const { readFileSync }  = require('fs')
const assert = require("assert")
const { ethereum: ethereumAdapter } = require("../stack/adapters");


describe("Ethereum Adapter", () => {

    it("Should init adapter", async() => { 
        const opts = {
            keystoreFile: `${__dirname}/resources/keystore.json`,
            keystorePwd: "adexvalidator"
        }

        // Shouldn't throw any error
        assert.doesNotReject(
            async() => await ethereumAdapter.init(opts),
            Error,
            "Failed to init adapter with proper params"
        )
    })
    
    it("Should fail to init adapter with empty opts", async() => {
        const opts = {}
        
        // should an throw error cos of invalid params
        assert.rejects(
            async () => await ethereumAdapter.init(opts), 
            Error, 
            "Should Fail to init adapter without proper params"
        )     
    })
    
    it("Should unlock keystore with right password", async() => {        
        const opts = {
            keystoreFile: `${__dirname}/resources/keystore.json`,
            keystorePwd: "adexvalidator"
        }

        assert.doesNotReject(
            async () => await ethereumAdapter.init(opts),
            Error,
            "Failed to init adapter with proper params"
        )
        
        // shouldn't throw any error
        // should successfully unlock wallet 
        // with right password
        assert.doesNotReject(
            async () => await ethereumAdapter.unlock(opts),
            Error,
            "Failed to unlock wallet"
        )
    })

    it("Should fail to unlock keystore with wrong password", async() => {        
        const opts = {
            keystoreFile: `${__dirname}/resources/keystore.json`,
            keystorePwd: "adexvalidator1"
        }

        assert.doesNotReject(
            async() => await ethereumAdapter.init(opts),
            Error,
            "Failed to init adapter with proper params"
        )

        // should throw error
        // should unsuccessfully unlock wallet 
        // with wrong password
        assert.rejects(
            async () => await ethereumAdapter.unlock(opts),
            Error,
            "Should Fail to unlock wallet with wrong password"
        )
    })
    
    it("Should get whoami", async() => {
        const opts = {
            keystoreFile: `${__dirname}/resources/keystore.json`,
            keystorePwd: "adexvalidator"
        }
    
        assert.doesNotReject(
            async() => await ethereumAdapter.init(opts),
            Error,
            "Failed to init adapter with proper params"
        )
    
        const expected = `0x${JSON.parse(readFileSync(opts.keystoreFile, "utf-8"))['address']}`.toLowerCase()
        const actual = ethereumAdapter.whoami().toLowerCase()
    
        assert.equal(actual, expected, "Failed to return the right address")
    })
    
    it("Should sign message", async() => {
        const opts = {
            keystoreFile: `${__dirname}/resources/keystore.json`,
            keystorePwd: "adexvalidator"
        }
    
        await ethereumAdapter.init(opts)
        await ethereumAdapter.unlock(opts)
    
        const message = "hello world"
        const actual = await ethereumAdapter.sign(message)
        const expected = 
            "0xb139c99dbc0ab504f55ba0aa1e0d5662b1cb32aa207e8bb9b6204cab78e234901bd7abcf0d7d303ed276de735c1459018e672c5bf183690e2a2796670099757e1b"
    
        assert.equal(actual, expected, "Failed to sign message appropiately")
    })
    
    it("Should getBalanceLeaf", async() => {
        const opts = {
            keystoreFile: `${__dirname}/resources/keystore.json`,
            keystorePwd: "adexvalidator"
        }
    
        await ethereumAdapter.init(opts)
    
        const address = JSON.parse(readFileSync(opts.keystoreFile, "utf8"))['address']
        
        const expected = "6ac67fa17ed2d5bfa565918c24b9d2b144a9eef26e46d3a5be2ec7c185077794"
    
        let actual = await ethereumAdapter.getBalanceLeaf(address, 0)
        actual = actual.toString("hex")

        assert.equal(actual, expected)
    })
})