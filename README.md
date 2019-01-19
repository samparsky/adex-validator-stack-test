Integration test implementation for Adex Validator Network

### Configuration

- MONGODB_URL (for docker default =(MONGODB_URL=mongodb://localhost:28000))
- LEADER_DATABASE (default = "adexValidator")
- FOLLOWER_DATABASE (default= "adexValidatorFollower")
- LEADER_PORT (default=8005)
- FOLLOWER_PORT (default=8006)

## RUN TEST (Docker)

Run tests against docker validator stack setup
```bash
$ cd adex-validator-stack-js
$ npm install
$ docker-compose up
```
Run tests
```bash
$ npm run test-docker
```

### RUN TEST (Local machine)
Run tests against local machine validator stack setup

```bash
$ npm run test-local
```