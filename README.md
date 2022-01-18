# homecontrol deconz to homie
Publishes zigbee devices from deCONZ to mqtt using the homie convention.

[![works with MQTT Homie](https://homieiot.github.io/img/works-with-homie.png)](https://homieiot.github.io/)


__`hc-deconz2homie` is part of:__

[![homie-homecontrol](https://avatars.githubusercontent.com/u/96332925?s=28&v=4)](https://github.com/homie-homecontrol) <span style="font-size:32px; font-weight: 700;">homie-homecontrol</span>  &nbsp;[link](https://github.com/homie-homecontrol)

# Docker image
```
docker pull ghcr.io/homie-homecontrol/hc-deconz2homie:latest
```
See below for a usage example with docker compose.

# Configuration - Environment variables

All configuration is handled via environment variables.
## General config
`HCDC2H_CTRL_ID`

* id of homie device created for the controller .

`HCDC2H_CTRL_NAME`

* name of homie device created for the controller.

## MQTT Broker config

`HCDC2H_MQTT_URL`

* the connection address of the mqtt broker. This can be a `mqtt://` protocol address or `ws://` | `wss://` address depending on you scenario. If no port is specified defaults will be assumed. (mqtt: 1883, ws: 80, wss: 443)

`HCDC2H_MQTT_USERNAME`

* Username for the MQTT connection. If the MQTT broker is unsecured this can be left empty.

`HCDC2H_MQTT_PASSWORD`

* Password for the MQTT connection. If the MQTT broker is unsecured this can be left empty.

`HCDC2H_MQTT_TOPIC_ROOT`

* MQTT topic under which all homie devices are published. By convention this defaults to `homie`, however for your testing or developing reasons this can be changed here as not to disturb productive usage.


## deCONZ config

`HCDC2H_DECONZ_HOST`

* host or ip of deconz/phoscon

`HCDC2H_DECONZ_PORT`

* port of deconz/phoscon

`HCDC2H_DECONZ_WS_PORT`

* websocket port of deconz/phoscon

`HCDC2H_DECONZ_SECURE`

* true if a ssl (https) connection to deCONZ should be used (default: false)

`HCDC2H_DECONZ_API_TOKEN`

* API token provided by deCONZ

## How to obtain an API token?

You can obtain an API token following the information on the official [deCONZ API docs](https://dresden-elektronik.github.io/deconz-rest-doc/getting_started/#acquire-an-api-key) using a HTTP tool like [Advanced REST client](https://chrome.google.com/webstore/detail/advanced-rest-client/hgmloofddffdnphfgcellkdfbfbjeloo?hl=de).

Alternatively you can also use `hc-deconz2homie` to request an API key with the following steps:

1. Click on the 'Authenticate app' button in the deCONZ web admin page.
2. Before the 60 seconds run out start `hc-deconz2homie` without specifying an API key
3. `hc-deconz2homie` will request an API key and print it out to the console.
4. Configure the provided API key via environment variable and start `hc-deconz2homie`


# Example docker-compose config

You can use the ready made example in the `example` folder.
* clone this repo
* `cd hc-deconz2homie/examples`
* adjust your deCONZ connection info in the file `docker-compose.yaml`
* `docker-compose up`

```yaml
services:
    mqtt:
        image: eclipse-mosquitto:latest
        restart: "always"
        deploy:
            resources:
                limits:
                    memory: 125M
        hostname: mqtt
        ports: 
            - "1883:1883"
        volumes:
            - ./mqtt/config/mosquitto.conf:/mosquitto/config/mosquitto.conf
            - ./mqtt/data:/mosquitto/data
            - ./mqtt/log:/mosquitto/log
    deconz2homie:
        image: ghcr.io/homie-homecontrol/hc-deconz2homie:latest
        restart: "always"
        depends_on:
            - mqtt
        deploy:
            resources:
                limits:
                    memory: 125M
        environment: 
            HCDC2H_CTRL_ID: hc-deconz2homie-ctrl1
            HCDC2H_CTRL_NAME: deCONZ to homie interface controller
            HCDC2H_DECONZ_HOST: "<DECONZ HOST>"
            HCDC2H_DECONZ_PORT: "<DECONZ PORT>"
            HCDC2H_DECONZ_WS_PORT: "<DECONZ WS PORT>"
            HCDC2H_DECONZ_API_TOKEN: "<DECONZ TOKEN>"
            HCDC2H_DECONZ_SECURE: "false"
            HCDC2H_MQTT_URL: "mqtt://mqtt"
            HCDC2H_MQTT_TOPIC_ROOT: homie

```