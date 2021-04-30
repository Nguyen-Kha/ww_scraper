////////    SET UP VARIABLES HERE   ////////

const YOUR_EMAIL = '@uwaterloo.ca';
const YOUR_PASSWORD = '';
const startPageNumber = 3;
const FILE_NAME = '2021-MM-DD.json';

////////////////////////////////////////////

const puppeteer = require('puppeteer');
const scraper = require('../scraperModules.js');
const fs = require('fs');

////////////////////////////////////////////

async function scrape(email, password){
    const browser = await puppeteer.launch({
        headless: false,
    });
    const page = await browser.newPage();
    // await scraper.setup(email, password, page);
    await page.goto('https://waterlooworks.uwaterloo.ca/waterloo.htm?action=login');
    try{
        await page.click('#userNameInput');
        await page.keyboard.type(email);
        await page.click('#nextButton');
        await page.click('#passwordInput');
        await page.keyboard.type(password);
        await page.click('#submitButton');
        await page.waitForNavigation();
        await page.waitFor(30000);
    } catch(e) {}
    await getJobInfo(page);

    browser.close();
}

async function getJobInfo(page){
    await page.click('#displayStudentMyCoop > a');
    await page.waitFor(3000);
    await page.click('#mainContentDiv > div.orbisTabContainer > div.tab-content > div > div.orbis-posting-actions > div:nth-child(2) > div.sequenceTableContainer > table > tbody > tr:nth-child(4) > td:nth-child(10) > a');
    await page.waitFor(3000);

    const newPagePromise = new Promise(x => page.once('popup', x));
    await page.click('#mainContentDiv > div.box.boxContent > table > tbody > tr:nth-child(12) > td:nth-child(2) > strong > a');
    const newPage = await newPagePromise;   
    await newPage.waitFor(3000); 


    let testObject = {};
    try{
        // Click Work Term Ratings if Present
        // Iterate through ul and find an li with a with text 'Work Term Ratings'
        const navPostingOptions = '.nav-pills';
        const navPostingOptionsCount = await scraper.getchildElementCount(newPage, navPostingOptions);
        for(let i = 1; i < navPostingOptionsCount + 1; i++){
            let navPostingOptionSelector;
            let navPostingOptionValue;
            try{
                navPostingOptionSelector = navPostingOptions + ' > li:nth-child(' + i + ') > a';
                navPostingOptionValue = await scraper.getInnerText(newPage, navPostingOptionSelector);
            } catch(e){}
            
            if(navPostingOptionValue.includes('Work Term Ratings')){
                await newPage.click(navPostingOptionSelector);
                break;
            }

        }
        await newPage.waitFor(2000);

        const overallWTRStart = 'div.tab-content > div > div > div.boxContent > ';

        // Hired Table
        let WTRHiringTableSelector = '';
        WTRHiringTableSelector = WTRHiringTableSelector.concat(overallWTRStart, 'div:nth-child(3) > div > div:nth-child(5) > table');

        // TODO: Refactor cell extraction
        let hiringKeys = [];
        const WTRHiringTableHeaderSelector = WTRHiringTableSelector + ' >  thead > tr';
        const WTRHiringTableColumnCount = await scraper.getchildElementCount(newPage, WTRHiringTableHeaderSelector);
        // the nth child starts on 3 for all job postings
        for(let i = 3; i < WTRHiringTableColumnCount + 1; i++){
            let tempWTRHiringHeaderCellSelector = '';
            tempWTRHiringHeaderCellSelector = tempWTRHiringHeaderCellSelector.concat(WTRHiringTableHeaderSelector, ' > th:nth-child(', i, ')');
            let headerValue = await scraper.getInnerText(newPage, tempWTRHiringHeaderCellSelector); 
            hiringKeys.push(headerValue);
        }

        let hiredValues = [];
        // TODO: need to scrape the bottom one
        const WTRHiringTableValuerSelector = WTRHiringTableSelector + ' >  tbody > tr:nth-child(2)';
        for(let i = 3; i < WTRHiringTableColumnCount + 1; i++){
            let tempWTRHiringValueCellSelector = '';
            tempWTRHiringValueCellSelector = tempWTRHiringValueCellSelector.concat(WTRHiringTableValuerSelector, ' > td:nth-child(', i, ')');
            let cellValue = parseInt(await scraper.getInnerText(newPage, tempWTRHiringValueCellSelector));
            hiredValues.push(cellValue);
        }

        // Construct JSON Object
        let hiredTableObject = {};
        hiringKeys.forEach((key, value) => {
            hiredTableObject[key] = hiredValues[value];
        });

        testObject.hiredPerTerm = hiredTableObject;

        // Hires By Faculty Chart
        /*
        document.querySelector('div.tab-content > div > div > div.boxContent > div:nth-child(4) > div > div > div > svg > 
        g.highcharts-tracker > g:nth-child(3) > text > tspan:nth-child(1)').innerHTML

        g:nth-child() has 2x of the total slices in the pie. the latter half contains the info 
        ex 4 slices - g has children: path path path path g g g g. the g's will have child text. text has the two tspans that have the info
        */
        const hiresByFaculty = overallWTRStart + 'div:nth-child(4) > div:nth-child(1) > div > div > svg > g.highcharts-tracker';
        const facultyPieSections = await scraper.getchildElementCount(newPage, hiresByFaculty);
        let facultyHiresObject = {};
        for(let i = (facultyPieSections / 2) + 1; i < facultyPieSections + 1; i++){
            let facultyHiresKeySelector = hiresByFaculty + ' > g:nth-child(' + String(i) + ') > text > tspan:nth-child(1)';
            let facultyHiresValueSelector = hiresByFaculty + ' > g:nth-child(' + String(i) + ') > text > tspan:nth-child(2)';
            let facultyHiresKey = await scraper.getinnerHTML(newPage, facultyHiresKeySelector);
            let facultyHiresValue = (await scraper.getinnerHTML(newPage, facultyHiresValueSelector)).replace(': ', '');

            facultyHiresObject[facultyHiresKey] = facultyHiresValue;
        }
        testObject.facultyHires = facultyHiresObject;

        // Hires by Student Work Term Number Chart
        // This works the same as the Hires per Faculty chart. Refactor into a function that takes in the hiresBy___ selector
        const hiresByStudentWT = overallWTRStart + 'div:nth-child(4) > div:nth-child(2) > div > div > svg > g.highcharts-tracker';
        const studentWTPieSections = await scraper.getchildElementCount(newPage, hiresByStudentWT);
        let studentWTHiresObject = {};
        for(let i = (studentWTPieSections / 2) + 1; i < studentWTPieSections + 1; i++){
            let studentWTHiresKeySelector = hiresByStudentWT + ' > g:nth-child(' + String(i) + ') > text > tspan:nth-child(1)';
            let studentWTHiresValueSelector = hiresByStudentWT + ' > g:nth-child(' + String(i) + ') > text > tspan:nth-child(2)';
            let studentWTHiresKey = await scraper.getinnerHTML(newPage, studentWTHiresKeySelector);
            if(studentWTHiresKey.includes('+')){
                studentWTHiresKey = studentWTHiresKey.replace(' +', '');
            }
            let studentWTHiresValue = (await scraper.getinnerHTML(newPage, studentWTHiresValueSelector)).replace(': ' , '');

            studentWTHiresObject[studentWTHiresKey] = studentWTHiresValue;
        }
        testObject.studentWorkTermHires = studentWTHiresObject;

        // Hired Programs
        const hiredProgramsSelector = overallWTRStart + 'div:nth-child(5) > div > div > div > svg';
        const hiredProgramsKeyStart = hiredProgramsSelector + ' > g.highcharts-xaxis-labels';
        const hiredProgramsValueStart = hiredProgramsSelector + ' > g.highcharts-tracker';

        const hiredProgramsKeyCount = await scraper.getchildElementCount(newPage, hiredProgramsKeyStart);
        const hiredProgramsValueCount = await scraper.getchildElementCount(newPage, hiredProgramsValueStart);

        let hiredProgramsObject = {};
        for(let i = 1; (i < hiredProgramsKeyCount + 1) && (hiredProgramsKeyCount == hiredProgramsValueCount); i++){
            let hiredProgramsKeySelector = hiredProgramsKeyStart + ' > text:nth-child(' + i + ') > tspan';
            let hiredProgramsValueSelector = hiredProgramsValueStart + ' > g:nth-child(' + i + ') > text > tspan';

            let hiredProgramsKey = await scraper.getinnerHTML(newPage, hiredProgramsKeySelector);
            let hiredProgramsValue = parseInt(await scraper.getinnerHTML(newPage, hiredProgramsValueSelector));
            hiredProgramsObject[hiredProgramsKey] = hiredProgramsValue;
        }
        testObject.hiredPrograms = hiredProgramsObject;

        // Work Term Rating - it's the second one
        const ratingSelector = overallWTRStart + 'div:nth-child(6) > div > div:nth-child(5) > table > tbody > tr:nth-child(2) > td:nth-child(3)';
        let ratingValue = parseFloat(await scraper.getInnerText(newPage, ratingSelector));
        testObject.rating = ratingValue;

        // Work Term Satisfaction Distribution
        const WTSatisfactionSelector = overallWTRStart + 'div:nth-child(7) > div > div > div > svg';
        const WTSatisfactionKeyStart = WTSatisfactionSelector + ' > g.highcharts-xaxis-labels';
        const WTSatisfactionValueStart = WTSatisfactionSelector + ' > g.highcharts-tracker';

        const WTSatisfactionKeyCount = await scraper.getchildElementCount(newPage, WTSatisfactionKeyStart);
        const WTSatisfactionValueCount = await scraper.getchildElementCount(newPage, WTSatisfactionValueStart);

        let WTSatisfactionObject = {};
        for(let i = 1; (i < WTSatisfactionKeyCount + 1) && (WTSatisfactionKeyCount == WTSatisfactionValueCount); i++){
            let WTSatisfactionKeySelector = WTSatisfactionKeyStart + ' > text:nth-child(' + i + ')';
            let WTSatisfactionValueSelector = WTSatisfactionValueStart + ' > g:nth-child(' + i + ') > text > tspan';

            let WTSatisfactionKey = await scraper.getinnerHTML(newPage, WTSatisfactionKeySelector);
            let WTSatisfactionValue = await scraper.getinnerHTML(newPage, WTSatisfactionValueSelector);
            WTSatisfactionObject[WTSatisfactionKey] = WTSatisfactionValue;
        }
        testObject.workTermSatisfaction = WTSatisfactionObject;

        // Questions TODO: which bar graph to do
        const questionRatingSelector = overallWTRStart + 'div:nth-child(8) > div > div > div > svg';
        const questionRatingKeyStart = questionRatingSelector + ' > g.highcharts-xaxis-labels';
        const questionRatingValueStart = questionRatingSelector + ' > g.highcharts-tracker';

        const questionRatingKeyCount = await scraper.getchildElementCount(newPage, questionRatingKeyStart);
        const questionRatingValueCount = await scraper.getchildElementCount(newPage, questionRatingValueStart);

        let questionRatingObject = {};
        for(let i = 1; (i < questionRatingKeyCount + 1) && (questionRatingKeyCount == questionRatingValueCount); i++){
            let questionRatingKeySelector = questionRatingKeyStart + ' > text:nth-child(' + i + ') > tspan';
            let questionRatingValueSelector = questionRatingValueStart + ' > g:nth-child(' + i + ') > text > tspan';

            let questionRatingKey = await scraper.getinnerHTML(newPage, questionRatingKeySelector);
            let questionRatingValue = parseFloat(await scraper.getinnerHTML(newPage, questionRatingValueSelector));

            questionRatingKey = questionRatingKey.slice(0, 2);
            questionRatingObject[questionRatingKey] = questionRatingValue;
        }
        testObject.questionRating = questionRatingObject;
        console.log(testObject);

    } catch(e){
        console.log(e);
    }
}

scrape(YOUR_EMAIL, YOUR_PASSWORD).catch(console.error);