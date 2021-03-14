/*
Script must be run on Tuesday after 9:00 AM, before looking at new jobs
*/

////////    SET UP VARIABLES HERE   ////////

const YOUR_EMAIL = '@uwaterloo.ca';
const YOUR_PASSWORD = '';
const FILE_NAME = '2021-MM-DD_viewed_app_amount.json';

////////////////////////////////////////////

const puppeteer = require('puppeteer');

async function setup(email, password, page){
    await page.goto('https://waterlooworks.uwaterloo.ca/waterloo.htm?action=login');
    await page.click('#userNameInput');
    await page.keyboard.type(email);
    await page.click('#nextButton');
    await page.click('#passwordInput');
    await page.keyboard.type(password);
    await page.click('#submitButton');
    await page.waitForNavigation();
    await page.waitFor(25000);
    await page.goto('https://waterlooworks.uwaterloo.ca/myAccount/co-op/coop-postings.htm');
    await page.waitFor(2000);
    await page.click('#quickSearchCountsContainer > table > tbody > tr:nth-child(4) > td.full > a');
    await page.waitFor(3000);
}

async function getAppAmount(page){
    const startPageNumber = 3;

    // async function getTotalJobCount(){}
    await page.waitForSelector('.badge-info');
    let jobsElement = await page.$('.badge-info')
    let numberOfJobs = await page.evaluate(el => el.textContent, jobsElement);
    numberOfJobs = numberOfJobs.trim();
    numberOfJobs = parseInt(numberOfJobs);

    const totalPages = Math.ceil(numberOfJobs/100);
    let testArray = [];

    for(var a = startPageNumber; a < totalPages + 3; a++){

        // async function getJobAmountOnPage(){}
        let jobsOnPageElement = await page.$('#postingsTable > tbody');
        let jobsOnPage = await page.evaluate((el) => {
            let temp = el.childElementCount;
            return temp;
        }, jobsOnPageElement);

        if(a == 3){
            // Don't click the next page

            // async function scrapeBasicJobList(){}
            for(var i = 1; i <= jobsOnPage; i++){
                let testObject = {};

                // async function getDate(){}
                var today = new Date();
                var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

                testObject.scrapeDate = date;

                const starting = '#postingsTable > tbody > tr:nth-child('

                // async function getBasicJobID(){}
                let jobID = '';
                const jobIDEnding = ') > td:nth-child(3)';
                jobID = jobID.concat(starting, i, jobIDEnding);
                let jobIDSelector = await page.waitForSelector(jobID);
                let jobIDValue = await page.evaluate(el => el.innerText, jobIDSelector);
                jobIDValue = jobIDValue.trim();
                jobIDValue = parseInt(jobIDValue);

                testObject.jobID = jobIDValue;

                // async function getBasicCompanyName(){}
                let companyName = '';
                const companyNameEnding = ') > td:nth-child(5)';
                companyName = companyName.concat(starting, i, companyNameEnding);
                let companyNameSelector = await page.waitForSelector(companyName);
                let companyNameValue = await page.evaluate(el => el.innerText, companyNameSelector);
                companyNameValue = companyNameValue.trim();

                testObject.companyName = companyNameValue;

                // async function getBasicJobOpenings(){}
                let openings = '';
                const openingsEnding = ') > td:nth-child(7)';
                openings = openings.concat(starting, i, openingsEnding);
                let openingsSelector = await page.waitForSelector(openings);
                let openingsValue = await page.evaluate(el => el.innerText, openingsSelector);
                openingsValue = openingsValue.trim();
                openingsValue = parseInt(openingsValue);

                testObject.openings = openingsValue;

                // async function getBasicCity(){}
                let city = '';
                const cityEnding = ') > td:nth-child(9)';
                city = city.concat(starting, i, cityEnding);
                let citySelector = await page.waitForSelector(city);
                let cityValue = await page.evaluate(el => el.innerText, citySelector);
                cityValue = cityValue.trim();

                testObject.city = cityValue;

                let level = '';
                const levelEnding = ') > td:nth-child(10)';
                level = level.concat(starting, i, levelEnding);
                let levelSelector = await page.waitForSelector(level);
                let levelValue = await page.evaluate(el => el.innerText, levelSelector);
                temp = levelValue.split(', ');
                if(temp.length == 1){
                    testObject.level = levelValue;
                }
                else {
                    testObject.level = temp;
                }

                // async function getApplicationAmount(){}
                let applications = '';
                const applicationsEnding = ') > td:nth-child(11)';
                applications = applications.concat(starting, i, applicationsEnding);
                let applicationsSelector = await page.waitForSelector(applications);
                let applicationsValue = await page.evaluate(el => el.innerText, applicationsSelector);
                applicationsValue = applicationsValue.trim();
                applicationsValue = parseInt(applicationsValue);

                testObject.applications = applicationsValue;

                // async function getBasicDeadline(){}
                let appBasicDeadline = '';
                const appBasicDeadlineEnding = ') > td:nth-child(12)';
                appBasicDeadline = appBasicDeadline.concat(starting, i, appBasicDeadlineEnding);
                let appBasicDeadlineSelector = await page.waitForSelector(appBasicDeadline);
                let appBasicDeadlineValue = await page.evaluate(el => el.innerText, appBasicDeadlineSelector);
                appBasicDeadlineValue = appBasicDeadlineValue.trim();

                testObject.appBasicDeadline = appBasicDeadlineValue;

                testArray.push(testObject);

                /*
                let ___ = '';
                const ___Ending = ') > td:nth-child(9)';
                ___ = ___.concat(starting, i, ___Ending);
                let ___Selector = await page.waitForSelector(___);
                let ___Value = await page.evaluate(el => el.innerText, ___Selector);
                ___Value = ___Value.trim();

                testObject.___ = ___Value;
                */
            
            }
        }

        else{
            let pageNav = '';
            const startNav = '#postingsTablePlaceholder > div:nth-child(4) > div > ul > li:nth-child(';
            const endNav = ') > a';
            pageNav = pageNav.concat(startNav, a, endNav);
            await page.click(pageNav);
            await page.waitFor(2000);

            // async function getJobAmountOnPage(){}
            let jobsOnPageElement = await page.$('#postingsTable > tbody');
            let jobsOnPage = await page.evaluate((el) => {
                let temp = el.childElementCount;
                return temp;
            }, jobsOnPageElement);

            for(var i = 1; i <= jobsOnPage; i++){
                let testObject = {};

                // async function getDate(){}
                var today = new Date();
                var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

                testObject.scrapeDate = date;

                const starting = '#postingsTable > tbody > tr:nth-child('

                // async function getBasicJobID(){}
                let jobID = '';
                const jobIDEnding = ') > td:nth-child(3)';
                jobID = jobID.concat(starting, i, jobIDEnding);
                let jobIDSelector = await page.waitForSelector(jobID);
                let jobIDValue = await page.evaluate(el => el.innerText, jobIDSelector);
                jobIDValue = jobIDValue.trim();
                jobIDValue = parseInt(jobIDValue);

                testObject.jobID = jobIDValue;

                // async function getBasicCompanyName(){}
                let companyName = '';
                const companyNameEnding = ') > td:nth-child(5)';
                companyName = companyName.concat(starting, i, companyNameEnding);
                let companyNameSelector = await page.waitForSelector(companyName);
                let companyNameValue = await page.evaluate(el => el.innerText, companyNameSelector);
                companyNameValue = companyNameValue.trim();

                testObject.companyName = companyNameValue;

                // async function getBasicJobOpenings(){}
                let openings = '';
                const openingsEnding = ') > td:nth-child(7)';
                openings = openings.concat(starting, i, openingsEnding);
                let openingsSelector = await page.waitForSelector(openings);
                let openingsValue = await page.evaluate(el => el.innerText, openingsSelector);
                openingsValue = openingsValue.trim();
                openingsValue = parseInt(openingsValue);

                testObject.openings = openingsValue;

                // async function getBasicCity(){}
                let city = '';
                const cityEnding = ') > td:nth-child(9)';
                city = city.concat(starting, i, cityEnding);
                let citySelector = await page.waitForSelector(city);
                let cityValue = await page.evaluate(el => el.innerText, citySelector);
                cityValue = cityValue.trim();

                testObject.city = cityValue;

                let level = '';
                const levelEnding = ') > td:nth-child(10)';
                level = level.concat(starting, i, levelEnding);
                let levelSelector = await page.waitForSelector(level);
                let levelValue = await page.evaluate(el => el.innerText, levelSelector);
                temp = levelValue.split(', ');
                if(temp.length == 1){
                    testObject.level = levelValue;
                }
                else {
                    testObject.level = temp;
                }

                // async function getApplicationAmount(){}
                let applications = '';
                const applicationsEnding = ') > td:nth-child(11)';
                applications = applications.concat(starting, i, applicationsEnding);
                let applicationsSelector = await page.waitForSelector(applications);
                let applicationsValue = await page.evaluate(el => el.innerText, applicationsSelector);
                applicationsValue = applicationsValue.trim();
                applicationsValue = parseInt(applicationsValue);

                testObject.applications = applicationsValue;

                // async function getBasicDeadline(){}
                let appBasicDeadline = '';
                const appBasicDeadlineEnding = ') > td:nth-child(12)';
                appBasicDeadline = appBasicDeadline.concat(starting, i, appBasicDeadlineEnding);
                let appBasicDeadlineSelector = await page.waitForSelector(appBasicDeadline);
                let appBasicDeadlineValue = await page.evaluate(el => el.innerText, appBasicDeadlineSelector);
                appBasicDeadlineValue = appBasicDeadlineValue.trim();

                testObject.appBasicDeadline = appBasicDeadlineValue;

                testArray.push(testObject);

                /*
                let ___ = '';
                const ___Ending = ') > td:nth-child(9)';
                ___ = ___.concat(starting, i, ___Ending);
                let ___Selector = await page.waitForSelector(___);
                let ___Value = await page.evaluate(el => el.innerText, ___Selector);
                ___Value = ___Value.trim();

                testObject.___ = ___Value;
                */
            }
        }
    }

    testArrayJSON = JSON.stringify(testArray);
    var fs = require('fs');
    fs.writeFile(FILE_NAME, testArrayJSON, function(err) {
        if (err) {
            console.log(err);
        }
    });
}

async function scrape(email, password){
    const browser = await puppeteer.launch({
        headless: false,
    });
    const page = await browser.newPage();
    await setup(email, password, page);
    await getAppAmount(page);


    browser.close();
}

// Get email
// Get password
scrape(YOUR_EMAIL, YOUR_PASSWORD).catch(console.error);