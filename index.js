const l = require("luxon");
const { createCanvas, loadImage } = require("canvas");
const { KeyDates, getWeekNum } = require('./key-dates');
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

    const data = await getWeekNum(keyDates);

    const week = data.week.toString();
    const is_break = data.is_break;

    ctx.font = "34px Roboto";
    ctx.fillStyle = "white";

    if (Number(week) > 0) {
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
    } else {
        ctx.fillText("no", 5, 35);
        console.error("Error in loading dates.");
    }

    res.set("Cache-Control", "no-store");
    res.set("Expires", "0");
    res.end(canvas.toBuffer(), "binary");
});

app.listen(port, "0.0.0.0", () => {
    console.log(`listening on http://localhost:${port}`)
});

