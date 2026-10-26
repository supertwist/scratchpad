# Humidity Monitoring for 3D Printer Room

## Requirements Summary

- Monitor relative humidity in a room containing 3D printers (filament storage is humidity-sensitive).
- Capture a data point every **15 minutes**.
- Output data as a **Markdown table**.
- The table must be **appended to automatically** as new readings come in (not manually re-generated).
- The table file must live **in this git repo**.

These requirements point toward a sensor with either:
1. A **local push API** (webhook/MQTT) that can trigger a script to append a row, or
2. A **polling-friendly local API** that a scheduled script (cron / Home Assistant automation) can query every 15 minutes.

Cloud-only, app-locked sensors (which hide history behind a subscription or a proprietary app with no export) are excluded, since the goal is an open, repo-stored Markdown log.

## Sensor Options

| Make | Model | Link | Price | Rating |
|---|---|---|---|---|
| Shelly | H&T Gen3 | [shelly.com](https://www.shelly.com/products/shelly-h-t-gen3) | ~$25 | ⭐⭐⭐⭐⭐ Local HTTP/MQTT/webhook API, no hub or cloud required, configurable report interval — best fit for this project |
| Govee | H5075 | [amazon.com](https://www.amazon.com/dp/B07D81CSD4) | ~$12–15 | ⭐⭐⭐⭐ Cheapest option; Bluetooth-only (needs an always-on BLE proxy/Home Assistant host near the room); unencrypted broadcast |
| Aqara | Temperature & Humidity Sensor | [aqara.com](https://www.aqara.com/en/product/temperature-humidity-sensor) | ~$15–20 | ⭐⭐⭐⭐ Reliable Zigbee sensor, but requires an Aqara or Zigbee2MQTT hub for integration |
| SensorPush | HT1 + WiFi Gateway | [sensorpush.com](https://sensorpush.com/products/ht1) | ~$55 sensor + $99 gateway | ⭐⭐⭐⭐⭐ Best accuracy (±1.5% RH, Sensirion SHT31), unlimited free cloud history with CSV export, but the priciest path |
| DIY (ESPHome) | ESP8266/ESP32 + SHT31/SHT40 | [esphome.io](https://esphome.io/components/sensor/sht3xd.html) | ~$10–15 (board + sensor) | ⭐⭐⭐⭐ Highest accuracy-per-dollar and fully local/native Home Assistant entity, but requires basic soldering/flashing |

**Most recommended: Shelly H&T Gen3.** It's inexpensive, has a genuine local API (no cloud dependency, no Bluetooth-proxy range issues like Govee, no extra hub purchase like Aqara/SensorPush), and its built-in reporting interval can be set to exactly 15 minutes, which it will push directly to a script via webhook or MQTT — a near-perfect match for "auto-append to a Markdown table in a repo."

## Step-by-Step Setup (Shelly H&T Gen3)

1. **Buy the sensor.** Order the Shelly H&T Gen3 (battery-powered humidity/temperature sensor, ~$25). It ships with a CR123A battery already installed.

2. **Connect it to Wi-Fi.** Hold the sensor's button to put it into setup mode, then use the Shelly app (or connect to its temporary Wi-Fi access point from a laptop) to join it to your home/shop Wi-Fi network. You do not need a Shelly cloud account — you can skip cloud login and use it purely locally.

3. **Set the reporting interval to 15 minutes.** In the Shelly web UI (reachable at the device's local IP address) or the Shelly app, find the "Update period" / "Sleep time" setting and set it to 900 seconds (15 minutes). The sensor will wake, take a reading, send it, and go back to sleep on that schedule to save battery.

4. **Choose a delivery method — either works, MQTT is simpler for this use case:**
   - **MQTT (recommended):** Enable MQTT in the device's settings and point it at a lightweight MQTT broker (e.g., Mosquitto running on a Raspberry Pi, NAS, or small always-on machine on the same network). The sensor will publish humidity/temperature to a topic every 15 minutes.
   - **Webhook:** Alternatively, enable the "report to URL" webhook option and point it at a small local script's HTTP endpoint instead of MQTT.

5. **Write a small logger script** on an always-on machine (Raspberry Pi, NAS, mini PC — anything that stays on) that:
   - Subscribes to the MQTT topic (or receives the webhook).
   - On each new reading, formats a Markdown table row: `| 2026-10-26 14:15 | 42.3% | 71.2°F |`.
   - Appends that row to the Markdown file in this repo (e.g., `Research/CSAD/humidity-log.md`), creating the table header if the file doesn't exist yet.
   - Commits the change to git (e.g., `git add humidity-log.md && git commit -m "humidity reading"`), so the history lives in the repo's commit log as well as the file itself.

   This can be a short Python script (using `paho-mqtt` for the MQTT subscription) run as a background service (systemd unit, cron @reboot, or a simple `while true` loop), since the sensor is already pushing a new value every 15 minutes — the script just needs to listen and append.

6. **Verify the loop end-to-end.** Confirm a new row lands in the Markdown table roughly every 15 minutes, and that `git log` on the file shows a matching commit cadence. Adjust the sensor's report interval or the script's formatting as needed.

7. **(Optional) Add retention/rotation.** If the table grows very large over months, consider archiving older rows into dated files (e.g., `humidity-log-2026-10.md`) so the live table stays a manageable size — this is a nice-to-have, not a requirement for getting started.

## Sources

- [Govee Bluetooth - Home Assistant integration](https://www.home-assistant.io/integrations/govee_ble/)
- [Recommendations for reliable air humidity sensors - Home Assistant Community](https://community.home-assistant.io/t/recommendations-for-reliable-air-humidity-sensors/953405)
- [Govee vs ThermoPro vs SensorPush Hygrometer comparison](https://indoorhumidity.com/indoor-humidity/govee-vs-thermopro-vs-sensorpush-hygrometer-comparison/)
- [ESPHome SHT3x-D sensor component](https://esphome.io/components/sensor/sht3xd.html)
- [Shelly H&T Gen3 product page](https://www.shelly.com/products/shelly-h-t-gen3)
