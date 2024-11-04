import express from "npm:express@5.0.1";
import path from "node:path";
import fs from "node:fs";

const app = express();

const varsitySourcesURL = "https://raw.githubusercontent.com/Coenicorn/varsity-winners/refs/tags/v1.0.1/varsity_winners_sources.json", varsityDataURL = "https://raw.githubusercontent.com/Coenicorn/varsity-winners/refs/tags/v1.0.1/varsity_winners.json";
const varsitySources = await (await fetch(varsitySourcesURL)).json(), varsityData = await (await fetch(varsityDataURL)).json();

app.use("/assets", express.static(path.join(import.meta.dirname, "../html/assets")));

app.get("/", (req, res) => {

    const events = varsityData.events;

    const filePath = path.join(import.meta.dirname, "../html/index.html");
    fs.readFile(filePath, "utf-8", (err, htmlContent) => {

        let event_links = "";

        for (let i = 0; i < events.length; i++) {
            event_links += `
            <div draggable="false" class="event-link soft-shadow" onclick="window.location.href='/${events[i].event_id}'">
                <img src="assets/varsity.png" alt="varsity-logo" class="selector-img">
                <p class="event-name">${events[i].event_name}</p>
                <p class="event-details"># ${events[i].data.length}</p>
            </div>
            `;
        }

        let events_wrapper = `<div id="event-selector">${event_links}</div>`

        const modifiedContent = htmlContent.replace("{{RENDERED_CONTENT}}", events_wrapper);

        res.send(modifiedContent);

    });
});

app.get("/:event_id", (req, res, next) => {

    const eventid = req.params.event_id;

    const event = varsityData.events.find(elm => elm.event_id == eventid);

    if (!event) {
        next();
        return;
    }

    const filePath = path.join(import.meta.dirname, "../html/index.html");
    fs.readFile(filePath, "utf-8", (err, htmlContent) => {

        let races = "";

        for (let i = 0,l = event.data.length; i < l; i++) {
            const n = l - i;
            const year = event.data[i].date.split("-")[2];

            races += `
                <div class="item item-bg-${n % 2 == 0 ? "00" : "01"}" onclick="window.location.href='/${eventid}/${l - i}'">
                    <p class="race-number">${n}</p>
                    <p class="race-year">${year}</p>
                </div>
            `;
        }

        if (races.length == 0) races = `
            <div class="item item-bg-00" onclick="window.location.href='/'">
                <p>but noone showed up...</p>
            </div>
        `;

        const races_wrapper = `
            <div id="race-selector-wrapper" class="centered-info-wrapper">
                <p id="back-to-selection" onclick="window.location.href='/'">< back</p>
                <div id="race-selector" class="centered-info">
                    ${races}
                </div>
            </div>
        `;

        const modifiedContent = htmlContent.replace("{{RENDERED_CONTENT}}", races_wrapper);

        res.send(modifiedContent);

    });

});

app.get("/:event_id/:race_index", (req, res, next) => {

    const event_id = req.params.event_id;
    const race_index = Number(req.params.race_index);

    const event = varsityData.events.find(elm => elm.event_id == event_id);
    if (!event || race_index < 1 || race_index > event.data.length) { next(); return; }
    const race = event.data[event.data.length - race_index];

    const filePath = path.join(import.meta.dirname, "../html/index.html");
    fs.readFile(filePath, "utf-8", (err, htmlContent) => {

        let info_wrapper = `
            <div id="race-information-wrapper">
                <p id="back-to-selection" onclick="window.location.href='/${event_id}'">< back</p>
                <div id="race-information">
                    <div class="info-item item-bg-00">
                        <p>
                            <span class="info-item-emoji">b</span>
                            value
                        </p>
                    </div>
                </div>
            </div>
        `;

        const modifiedContent = htmlContent.replace("{{RENDERED_CONTENT}}", info_wrapper);

        res.send(modifiedContent);

    });

});

app.get("/raw", (req, res) => {
    res.send(varsityData);
})

app.use((req, res, next) => {
    const filePath = path.join(import.meta.dirname, "../html/404.html");

    res.status(404).sendFile(filePath);
});

app.listen(8000);