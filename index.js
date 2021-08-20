const l = require("luxon");
const { createCanvas, loadImage } = require("canvas");
const KeyDates = require('./key-dates').KeyDates;
const express = require("express");
const app = express();
const port = process.env.PORT || 8080;

let random = "";

// const second_half = true;

app.get("/week.png", (req, res) => {
    random = Math.random().toString(36).substring(7);
    res.redirect(`/image/${random}.png`);
});

app.get("/image/:random.png", async (req, res) => {
    const canvas = createCanvas(50, 50);
    const ctx = canvas.getContext("2d");

    const keyDates = new KeyDates();

    const now = l.DateTime.local().setZone("Australia/Sydney");
    const sem = await keyDates.getCurrentSem(now);
    const sem_start = sem.date;

    const recess_start = await keyDates.getDateFromSem("Recess Start", sem.session, sem.year);
    const recess_end = await keyDates.getDateFromSem("Recess End", sem.session, sem.year);
    
    // const second_half = sem.session == '2';
    const is_break = (now > recess_start && now < recess_end);

    // const sem_start = l.DateTime.local(2021, 2,  20).setZone("Australia/Sydney");
    const sem_millis = now.diff(sem_start).milliseconds;
    const week = Math.ceil(sem_millis / (7 * 24 * 60 * 60 * 1000) - ((now > recess_end) ? 2 : 0)).toString();

    ctx.font = "34px Roboto";
    ctx.fillStyle = "white";

    if (!is_break) {
        if (Number(week) < 13) {
            if (Number(week) >= 10) {
                ctx.fillText(week, 5, 35);
            } else {
                ctx.fillText(week, 15, 35);
            }
        } else {
            ctx.fillText("no", 5, 35);
        }
    } else
        ctx.fillText("no", 5, 35);

    res.set("Cache-Control", "no-store");
    res.set("Expires", "0");
    res.end(canvas.toBuffer(), "binary");
});

app.listen(port, "0.0.0.0", () => {
    console.log(`listening on http://localhost:${port}`)
});

