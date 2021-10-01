const xpath = require('xpath')
    , dom = require('xmldom').DOMParser
    , fetch = require('node-fetch')
    , fs = require('fs');

const l = require("luxon");

const waitEval = (ev) => {
    return new Promise((resolve, reject) => {
        eval(ev);
    });
};

const getWeekNum = async (keyDates) => {
    const now = l.DateTime.local().setZone("Australia/Sydney");
    const sem = await keyDates.getCurrentSem(now);
    const sem_start = sem.date;

    const recess_start = await keyDates.getDateFromSem("Recess Start", sem.session, sem.year);
    const recess_end = await keyDates.getDateFromSem("Recess End", sem.session, sem.year);
    
    // const second_half = sem.session == '2';

    // const sem_start = l.DateTime.local(2021, 2,  20).setZone("Australia/Sydney");
    const sem_millis = now.diff(sem_start).milliseconds;

    return { week: Math.ceil(sem_millis / (7 * 24 * 60 * 60 * 1000) - ((now > recess_end) ? 2 : 0)), is_break: (now > recess_start && now < recess_end) };
}

class KeyDates
{
    data;

    async getMqImportantDates() {
        if (this.data == null) {
            var file;
            try {
                file = JSON.parse(await fs.promises.readFile('cached-dates.json'));
                this.data = file.data;

                this.checkStale(file);
            } catch (e) {
                let newDates = await this.getMqImportantDatesFromInternet();
                this.writeDatesToFile(newDates);
                this.data = newDates;
            }
        }

        return this.data;
    }

    async checkStale(file) {
        if (l.DateTime.fromISO(file.stale) < l.DateTime.local().setZone('Australia/Sydney')) {
            let newDates = await this.getMqImportantDatesFromInternet();
            
            // Check Dates for whether they are valid
            let newKeyDates = new KeyDates();
            newKeyDates.data = newDates;

            const newWeek = (await getWeekNum(newKeyDates)).week;

            if (newWeek > 0) {
                this.writeDatesToFile(newDates);
                this.data = newDates;
            } else {
                this.writeDatesToFile(this.data);
            }
        }
    }

    async writeDatesToFile(dates) {
        var dataToWrite = {"stale": l.DateTime.local().setZone("Australia/Sydney").plus({ months: 1 }).toISO(), "data": dates};
        fs.promises.writeFile('cached-dates.json', JSON.stringify(dataToWrite));
    }

    async getMqImportantDatesFromInternet() {
        var rawData = await fetch("https://www.mq.edu.au/study/calendar-of-dates").then((d) => d.text());
        var htmlData = (new dom()).parseFromString(rawData, 'text/html');
        var select = xpath.useNamespaces({ h: 'http://www.w3.org/1999/xhtml' });

        var mqDataJs = select("//h:section[(contains(@class, 'main-content'))]/h:script[1]/text()", htmlData)[0].textContent + "; resolve(important_dates);";
        
        var important_dates = await waitEval(mqDataJs);
        
        return important_dates.filter((e) => e.location == "North Ryde" && e.parent_calendar == "Macquarie University");
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

        if (rec.length == 0)
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
    KeyDates: KeyDates,
    getWeekNum: getWeekNum
};