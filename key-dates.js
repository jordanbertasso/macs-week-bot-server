const xpath = require('xpath')
    , dom = require('xmldom').DOMParser
    , fetch = require('node-fetch');

const l = require("luxon");

const waitEval = (ev) => {
    return new Promise((resolve, reject) => {
        eval(ev);
    });
};

class KeyDates
{
    data;

    async getMqImportantDates() {
        if (KeyDates.data == null) {
            var rawData = await fetch("https://www.mq.edu.au/study/calendar-of-dates").then((d) => d.text());
            var htmlData = (new dom()).parseFromString(rawData, 'text/html');
            var select = xpath.useNamespaces({ h: 'http://www.w3.org/1999/xhtml' });

            var mqDataJs = select("//h:section[(contains(@class, 'main-content'))]/h:script[1]/text()", htmlData)[0].textContent + "; resolve(important_dates);";
            
            var important_dates = await waitEval(mqDataJs);
            
            KeyDates.data = important_dates.filter((e) => e.location == "North Ryde" && e.parent_calendar == "Macquarie University");
        }

        return KeyDates.data;
    }

    async getSemesterStarts() {
        var importantDates = await this.getMqImportantDates();

        var split;
        var sessionStarts = importantDates.filter((e) => e.date_name == "Study Period Start" && e.study_period.includes("Session")).map(e => ({ "date": l.DateTime.local(parseInt((split = e.date.split('/'))[2]), parseInt(split[1]), parseInt(split[0])).setZone("Australia/Sydney"), "year": split[2], "session": /Session ([1-3])/.exec(e.study_period)[1] }));

        return sessionStarts;
    }

    async getDateFromSem(date_name, semester, year) {
        var rec = (await this.getMqImportantDates())
            .filter((e) => e.date_name == date_name && /Session ([1-3])/.exec(e.study_period)[1] == semester && e.date.split('/')[2] == year);

        if (rec == [])
            return false;

        var split = rec[0].date.split('/');

        return l.DateTime.local(parseInt(split[2]), parseInt(split[1]), parseInt(split[0]));
    }

    async getCurrentSem(date) {
        var data = await this.getSemesterStarts();

        for (var i = 1; i < data.length; i++) {
            if (date <= data[i].date) {
                return data[i - 1];
            }
        }

        return null;
    }
}

module.exports = {
    KeyDates: KeyDates
};