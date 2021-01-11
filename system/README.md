## CMS Development & Installation

### Prerequisites
- Node.js v12 or above
- yarn

### Install

```sh
$ git clone https://github.com/CromwellCMS/Cromwell
$ npm run startup
``` 
You don't need to run npm install, all installation handled by startup.js script in the root.

## Services

Cromwell CMS follows microservice architecture.  
Below listed core services with default settings (ports at localhost address can be configured in system/cmsconfig.json):

### 1. Server
- Path - system/server
- NPM Module - @cromwell/server
- Url - http://localhost:4032

API server. Implements REST API for internal usage and GraphQL API for data flow.

- Swagger - http://localhost:4032/api/v1/api-docs/
- GraphQL Playground / Schema: http://localhost:4032/api/v1/graphql

### 2. Renderer 
- Path - system/renderer
- NPM Module - @cromwell/renderer
- Url - http://localhost:4128

Next.js service, compiles and serves files of an active Theme and Plugins to end-users.
Supposed to be started after Server service up and running.

### 3. Admin Panel
- Path - system/admin-panel
- NPM Module - @cromwell/admin-panel
- Url - http://localhost:4064

Uses dedicated server to serve Admin Panel files and public media files. 

### 4. Cromwella
- Path - system/cromwella
- NPM Module - @cromwell/cromwella

Modules bundler / compiler / package manager with built-in cli
> https://github.com/CromwellCMS/Cromwell/tree/master/system/cromwella#readme
```sh
npx cromwella
```

### 5. Manager
- Path - system/manager
- NPM Module - @cromwell/cms

Cromwell CMS main module. Starts and controls other services


### 5. CLI
- Path - system/cli
- NPM Module - @cromwell/cli

Provides "cromwell" CLI.