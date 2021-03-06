const l = require("luxon");
const { createCanvas, loadImage } = require("canvas");
const express = require("express");
const app = express();
const port = process.env.PORT || 8080;

let random = "";

app.get("/week.png", (req, res) => {
    random = Math.random().toString(36).substring(7);
    res.redirect(`/image/${random}.png`);
});

app.get("/image/:random.png", (req, res) => {
    const canvas = createCanvas(50, 50);
    const ctx = canvas.getContext("2d");

    const sem_start = l.DateTime.local(2021, 2, 22).setZone("Australia/Sydney");
    const now = l.DateTime.local().setZone("Australia/Sydney")
    const sem_millis = now.diff(sem_start).milliseconds;
    const week = Math.ceil(sem_millis / (7 * 24 * 60 * 60 * 1000)).toString();

    console.log(week);

    ctx.font = "34px Roboto";
    ctx.fillStyle = "white";

    if (Number(week) < 13) {
        ctx.fillText(week, 15, 35);
    } else {
        ctx.fillText("no", 5, 35);
    }

    res.set("Cache-Control", "no-store");
    res.set("Expires", "0");
    res.end(canvas.toBuffer(), "binary");
});

app.listen(port, "0.0.0.0", () => {
    console.log(`listening on http://localhost:${port}`)
});

