## Synopsis

Boiller controller - script to manage temperature of heating boiller. Designed to Raspberry Pi.

## Installation

* you need to have installed Node.js (tested version 9.11.1) 
* running local or remote MongoDB database.
* Raspberry Pi with connected servomotor to PIN 18

### Configurations needed before first use:

 - MongoDB database link, you can run MongoDB local or remote - provide link to variable 'urlLink' in 'kotol.js' file
 - run 'npm install' to install dependencies

### How to run:

 - to start script run 'sudo nodejs kotol.js' - do not forget sudo


### Project structure:

* models folder - Mongoose schematic database models
* node_modules - installed dependencies after 'npm install'
* kotol.js - main configuration of app
* package.json - project npm setup and dependencies


## License

Copyright 2018 Viktor Lehotský

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.