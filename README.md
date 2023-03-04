# Integration Testing using Selenium Javascript

This is the integration testing project. It's an in-house integration testing system that utilizes a system of helper methods and events to make writing integrations tests easy and very readable.
## Installation

Clone the repo and use [Yarn](https://yarnpkg.com/) or [NPM](https://www.npmjs.com/) to get started:

```
yarn
```
-or-
```
npm install
```

## Configuration
There are several configuration files to control testing environment and browser setup.

| File         | Description                                         |
|--------------|-----------------------------------------------------|
| browserstack.config.js | Browserstack-specific configurations |
| devices.js   | Environment/device/browser configurations for use with Browserstack |
| env.js       | Environment-specific configurations                 |
| user.config.js | User configurations and test data for Browserstack and local testing (**DO NOT CHECK-IN THIS FILE**) |
| testdata.js | Test data to use in all environments (defaults that can be overridden in env-specific testdata files) |
| testdata.dev.js | Test data to use only in the dev environment |
| testdata.stg.js | Test data to use only in the staging environment |
| testdata.prod.js | Test data to use only in the production environment |
| snippets.js  | Breakout file for reusable snippets                 |
| tests.js     | Write your tests here                               |

## Usage
To run a test on your local machine:
```js
yarn local
```
To run a test on Browserstack:
```js
yarn browserstack
```

## Flags
You can use several flags to control how tests run.

| Flag         | Description                                         | Example                        |
|--------------|-----------------------------------------------------|--------------------------------|
| `--browser=<browser name>` | Runs the test with the specified browser (Default is Chrome)           |
| `--browsers=<browser names>` | Runs the test with the specified browsers (comma-separated)          |
| `--device=<device name>` | [**Browserstack only**] Runs the test with the specified device (Default is to run on all configured devices) | `--device=iPhone12` |
| `--devtools` | Runs the test with dev tools open                   |                                |
| `--env=<env>`| Specifies the test environment to run from env.js   | `--env=stg`                    |
| `--headless` | Runs the test in headless mode                      |                                |
| `--local`    | Runs the test locally (assumed if you use `yarn local`) |                            |
| `--maximize` | Runs the test in a maximized browser                |                                |
| `--mobile`   | A shortcut to test on a mobile resolution (428x746) |                                |
| `--persist`  | Forces the browser to stay open after the test ends |                                |
| `--resolution=<widthxheight>` | Forces a browser resolution for all tests | `--resolution=480x860`  |
| `--test=<test name>` | Specifies a single test to run              | `--test="PLP Checkout"`        |# Selenium-JavaScript
