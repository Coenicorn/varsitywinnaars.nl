import express from "npm:express@5.0.1";
import path from "node:path";
import fs, { createWriteStream, read } from "node:fs";
import { title } from "node:process";

const app = express();

const varsitySourcesURL = "https://raw.githubusercontent.com/Coenicorn/varsity-winners/refs/tags/v1.0.1/varsity_winners_sources.json", varsityDataURL = "https://raw.githubusercontent.com/Coenicorn/varsity-winners/refs/tags/v1.0.1/varsity_winners.json";
const varsitySourcesURLFallback = "localhost:8000/assets/varsity_winners_sources.json", varsityDataURLFallback = "localhost:8000/assets/varsity_winners.json";
let varsitySources, varsityData;
let dataFetchFail = false;
let htmlContent = fs.readFileSync(path.join(import.meta.dirname, "../html/index.html"), "utf-8");

await (async () => {
    try {
        varsitySources = await (await fetch(varsitySourcesURL)).json();
        varsityData = await (await fetch(varsityDataURL)).json();
    } catch (e) {
        varsitySources = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "../html/assets/varsity_winners_sources.json")));
        varsityData = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "../html/assets/varsity_winners.json")));
    
        dataFetchFail = true;
        
    }
})();

app.use("/assets", express.static(path.join(import.meta.dirname, "../html/assets")));

app.get("/", (req, res) => {

    const events = varsityData.events;

    let event_links = "";

    for (let i = 0; i < events.length; i++) {
        event_links += `
        <div draggable="false" class="event-link soft-shadow" onclick="window.location.href='/${events[i].event_id}'">
            <img src="assets/varsity.png" alt="varsity-logo" class="selector-img">
            <p class="event-name">${events[i].event_name}</p>
            <p class="event-details">${events[i].data.length}</p>
        </div>
        `;
    }

    let events_wrapper = `<div id="event-selector">${event_links}</div>`

    let replace_content = `
        ${ dataFetchFail ? `
            <p id="fetch-error">Failed to reach resources online, results might be outdated. Contact administrator when this problem persists</p>
        ` : ""
        }
        ${events_wrapper}
    `;

    const modifiedContent = htmlContent.replace("{{RENDERED_CONTENT}}", replace_content);

    res.send(modifiedContent);
});

app.get("/:event_id", (req, res, next) => {

    const eventid = req.params.event_id;

    const event = varsityData.events.find(elm => elm.event_id == eventid);

    if (!event) {
        next();
        return;
    }

    let races = "";

    for (let i = 0,l = event.data.length; i < l; i++) {
        const n = l - i;
        const year = event.data[i].date.split("-")[2];

        races += `
            <div class="item item-bg-${n % 2 == 0 ? "00" : "01"}" onclick="window.location.href='/${eventid}/${l - i}'">
                <p class="race-number"># ${n}</p>
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

app.get("/:event_id/:race_index", (req, res, next) => {

    const event_id = req.params.event_id;
    const race_index = Number(req.params.race_index);

    const event = varsityData.events.find(elm => elm.event_id == event_id);
    if (!event || race_index < 1 || race_index > event.data.length) { next(); return; }
    const race = event.data[event.data.length - race_index];

    let info_wrapper = `
        <div id="race-information-wrapper">
            <p id="back-to-selection" onclick="window.location.href='/${event_id}'">< back</p>
            <div id="race-information">
                <div class="info-item info-item-title">
                    <p class="info-title"># ${race_index}</p>
                    <p class="info-value">${race.date.split("-")[2]}</p>
                </div>
                {{INFO_ITEMS}}
            </div>
        </div>
    `;

    let info_items = "";

    // date
    info_items += `
        <div class="info-item info-item-bg-00">
            <p class="info-title">datum</p>
            <p class="info-value">${race.date}</p>
        </div>
    `;
    // location
    info_items += `
        <div class="info-item info-item-bg-01">
            <p class="info-title">locatie</p>
            <p class="info-value">${race.location}</p>
        </div>
    `;
    // club
    info_items += `
        <div class="info-item info-item-bg-00">
            <p class="info-title">winnende club</p>
            <p class="info-value">${race.club}</p>
        </div>
    `;
    // tijd
    info_items += `
        <div class="info-item info-item-bg-01">
            <p class="info-title">finishtijd</p>
            <p class="info-value">${race.time}</p>
        </div>
    `;
    // margin
    info_items += `
        <div class="info-item info-item-bg-00 info-item-bottom">
            <p class="info-title">winstmarge</p>
            <p class="info-value">${race.alt_margin.length == 0 ? race.margin : race.alt_margin}</p>
        </div>
    `;


    // crew
    
    // crew title
    info_items += `
    <div class="info-item info-item-title info-item-crew">
        <p class="info-title">bemanning</p>
        <p class="info-value">${race.crew.length}</p>
    </div>
    `;

    if (race.crew.length % 2 == 0) {
        // ongestuurd

        for (let i = 0; i < race.crew.length; i++) {
            let crew_type = "";
            if (i == 0) crew_type = "boeg";
            else if (i == race.crew.length - 1) crew_type = "slag";

            info_items += `
                <div class="info-item info-item-bg-${i % 2 == 0 ? "07" : "06"} ${i == race.crew.length - 1 ? "info-item-bottom" : ""}">
                    <p class="info-title">${crew_type.length == 0 ? `${i}` : `${crew_type}`}</p>
                    <p class="info-value">${race.crew[i].name}</p>
                </div>
            `;
        }
    } else {
        // gestuurd

        for (let i = 0; i < race.crew.length; i++) {
            let crew_type = "";
            if (i == 0) crew_type = "boeg";
            else if (i == race.crew.length - 2) crew_type = "slag";
            else if (i == race.crew.length - 1) crew_type = "stuur";

            info_items += `
                <div class="info-item info-item-bg-${i % 2 == 0 ? "07" : "06"} ${i == race.crew.length - 1 ? "info-item-bottom" : ""}">
                    <p class="info-title">${crew_type.length == 0 ? `${i}` : `${crew_type}`}</p>
                    <p class="info-value">${race.crew[i].name}</p>
                </div>
            `;
        }
    }

    // notes
    
    // notes title
    info_items += `
        <div class="info-item info-item-title ${race.notes.length == 0 ? "info-item-bottom" : ""} info-item-crew">
            <p class="info-title wrapper-title">notes</p>
            <p class="info-value">${race.notes.length}</p>
        </div>
    `;
    
    for (let i = 0; i < race.notes.length; i++) {
        info_items += `
            <div class="info-item info-item-bg-02 ${i == race.notes.length - 1 ? "info-item-bottom" : ""}">
                <p class="">${race.notes[i]}</p>
            </div>
        `;
    }

    // sources
    
    // sources title
    info_items += `
    <div class="info-item info-item-title ${race.sources.length == 0 ? "info-item-bottom" : ""} info-item-crew">
        <p class="info-title wrapper-title">sources</p>
        <p class="info-value">${race.sources.length}</p>
    </div>
    `;
    
    for (let i = 0; i < race.sources.length; i++) {
        info_items += `
            <div class="info-item info-item-bg-${i % 2 == 0 ? "04" : "05"} ${i == race.sources.length - 1 ? "info-item-bottom" : ""}">
                <p class="info-source" ><a href="${varsitySources[race.sources[i]]}" target="_blank">${new URL(varsitySources[race.sources[i]]).host}→</a></p>
            </div>
        `;
    }

    info_wrapper = info_wrapper.replace("{{INFO_ITEMS}}", info_items);

    const modifiedContent = htmlContent.replace("{{RENDERED_CONTENT}}", info_wrapper);

    res.send(modifiedContent);

});

app.get("/raw", (req, res) => {
    res.send(varsityData);
})

app.use((req, res, next) => {
    const filePath = path.join(import.meta.dirname, "../html/404.html");

    res.status(404).sendFile(filePath);
});

app.listen(8000);