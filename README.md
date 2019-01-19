Integration test implementation for Adex Validator Network

## RUN TEST (Docker)

Run tests against docker setup validator stack
```bash
$ git clone https://github.com/AdExNetwork/adex-validator-stack-js.git
$ cd adex-validator-stack-js
$ docker-compose up
```

```bash
$ MONGODB_URL=mongodb://localhost:28000 npm test
```

### RUN TEST (Local machine)
Run tests against local setup validator stack

```bash
$ NOT_DOCKER=true npm test
```