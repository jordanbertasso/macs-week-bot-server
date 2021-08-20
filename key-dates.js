const xpath = require('xpath')
  , dom = require('xmldom').DOMParser
  , fetch = require('node-fetch');

const l = require("luxon");

// x is your XQuery executor, for browsers this is '$x'
async function getMqImportantDates() {
    var rawData = await fetch("https://www.mq.edu.au/study/calendar-of-dates").then((d) => d.text());
    var htmlData = (new dom()).parseFromString(rawData, 'text/html');
    var select = xpath.useNamespaces({ h: 'http://www.w3.org/1999/xhtml' });

    eval(select("//h:section[(contains(@class, 'main-content'))]/h:script[1]/text()", htmlData)[0].textContent);
    return important_dates;
}

async function getParsedDates () {
    var importantDates = await getMqImportantDates();

    var sessionStarts = importantDates.filter((e) => e.date_name == "Study Period Start" && e.location == "North Ryde" && e.parent_calendar == "Macquarie University" && e.study_period.includes("Session")).map(e => ({"date": l.DateTime.local(parseInt((split = e.date.split('/'))[2]), parseInt(split[1]), parseInt(split[0])).setZone("Australia/Sydney"), "year": split[2], "session": /Session ([1-3])/.exec(e.study_period)[1]}));

    return sessionStarts;
}

async function getCurrentSem(date) {
  var data = await getParsedDates();

  for (var i = 1; i < data.length; i++) {
    if (date <= data[i].date) {
      return data[i-1];
    }
  }
  
  return null;
}



module.exports = {
  getCurrentSem: getCurrentSem,
  getParsedDates: getParsedDates,
  getMqImportantDates: getMqImportantDates
};