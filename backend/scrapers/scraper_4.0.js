////////    SET UP VARIABLES HERE   ////////

const YOUR_EMAIL = '@uwaterloo.ca';
const YOUR_PASSWORD = '';
const startPageNumber = 3;
const FILE_NAME = '2021-MM-DD.json';

////////////////////////////////////////////

const puppeteer = require('puppeteer');
const scraper = require('./scraperModules.js');
const fs = require('fs');

async function getJobInfo(page){
    
    // Get total amount of jobs
    let numberOfJobs = await scraper.getTotalAmountOfJobs(page);

    const totalPages = Math.ceil(numberOfJobs/100);

    testArray = [];

    // First for loop - accounts if there are less than 3 pages
    for(let a = startPageNumber; a < Math.min(startPageNumber + 3, totalPages + 3); a++){

        // If scraper is not on the first page, it will need to click to the new page
        if(a != 3){
            // Click to new page
            await page.bringToFront();
            let pageNav = '';
            const startNav = '#postingsTablePlaceholder > div:nth-child(4) > div > ul > li:nth-child(';
            const endNav = ') > a';
            pageNav = pageNav.concat(startNav, a, endNav);
            await page.click(pageNav);
            await page.waitFor(2000);
        }

        let jobsOnPage = await scraper.getAmountOfJobsOnPage(page);

        // Execute regular scrape
        for(let i = 1; i <= jobsOnPage; i++){
                
            let testObject = {};
            let today = new Date();
            let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
            testObject.scrapeDate = date;
    
            // Get ID of job
            let jobIDValue = await scraper.getBasicJobID(i, page);
            testObject.jobID = jobIDValue;

            // Get Job Title
            let jobTitleValue = await scraper.getBasicJobTitle(i, page);
            if(jobTitleValue.includes('NEW ')){
                jobTitleValue = jobTitleValue.replace('NEW ', '');
            }
            testObject.title = jobTitleValue;

            // Get Company Name
            let companyNameValue = await scraper.getBasicCompanyName(i, page);
            testObject.companyName = companyNameValue;

            // Get Amount of Openings
            let openingsValue = await scraper.getBasicJobOpenings(i, page);
            testObject.openings = openingsValue;
            
            const starting = '#postingsTable > tbody > tr:nth-child('

            let dropdown = ''
            const dropdownEnding = ') > td:nth-child(1) > div > a';
            dropdown = dropdown.concat(starting, i, dropdownEnding);
    
            const newTabEnding = ') > td:nth-child(1) > div > ul > li:nth-child(2) > a';
            let newTab = ''
            newTab = newTab.concat(starting, i, newTabEnding);

            await page.click(dropdown);
            const newPagePromise = new Promise(x => page.once('popup', x));
            await page.click(newTab);
            
            // Switch to new Page
            
            const newPage = await newPagePromise;   
            await newPage.waitFor(700); 
    
            // For loop for Job Posting Information
            // #postingDiv > div:nth-child(1) > div.panel-body > table > tbody > tr:nth-child(   i   ) > td:nth-child(   1 or 2   )
            let jobPostInfoRowsElement = await newPage.$('#postingDiv > div:nth-child(1) > div.panel-body > table > tbody');
            let jobPostInfoRows = await newPage.evaluate(el => el.childElementCount, jobPostInfoRowsElement);
    
            const jobPostInfoStarting = '#postingDiv > div:nth-child(1) > div.panel-body > table > tbody > tr:nth-child(';
            const jobPostInfoHeadEnd = ') > td:nth-child(1)';
            const jobPostInfoValueEnd = ') > td:nth-child(2)';
    
            for(var b = 1; b < jobPostInfoRows + 1; b++){
                let jobPostInfoHeaderElementSelector = '';
                let jobPostInfoValueElementSelector = '';
    
                jobPostInfoHeaderElementSelector = jobPostInfoHeaderElementSelector.concat(jobPostInfoStarting, b, jobPostInfoHeadEnd);
                jobPostInfoValueElementSelector = jobPostInfoValueElementSelector.concat(jobPostInfoStarting, b, jobPostInfoValueEnd);
    
                // Check Header
                let jobPostInfoHeader = await scraper.getInnerText(newPage, jobPostInfoHeaderElementSelector);
                let jobPostInfoValue = await scraper.getInnerText(newPage, jobPostInfoValueElementSelector);
                
                testObject = scraper.assignJobInfoValues(testObject, jobPostInfoHeader, jobPostInfoValue);
            }
    
    
            // For loop for Application Information
            // #postingDiv > div:nth-child(2) > div.panel-body > table > tbody > tr:nth-child(   i   ) > td:nth-child(   1 or 2   )
            let jobAppInfoRowsElement = await newPage.$('#postingDiv > div:nth-child(2) > div.panel-body > table > tbody');
            let jobAppInfoRows = await newPage.evaluate(el => el.childElementCount, jobAppInfoRowsElement);
    
            const jobAppInfoStarting = '#postingDiv > div:nth-child(2) > div.panel-body > table > tbody > tr:nth-child(';
            const jobAppInfoHeadEnd = ') > td:nth-child(1)';
            const jobAppInfoValueEnd = ') > td:nth-child(2)';
    
            for(var c = 1; c < jobAppInfoRows + 1; c++){
                let jobAppInfoHeaderElementSelector = '';
                let jobAppInfoValueElementSelector = '';
    
                jobAppInfoHeaderElementSelector = jobAppInfoHeaderElementSelector.concat(jobAppInfoStarting, c, jobAppInfoHeadEnd);
                jobAppInfoValueElementSelector = jobAppInfoValueElementSelector.concat(jobAppInfoStarting, c, jobAppInfoValueEnd);
    
                // Check Header
                let jobAppInfoHeader = await scraper.getInnerText(newPage, jobAppInfoHeaderElementSelector);
                let jobAppInfoValue = await scraper.getInnerText(newPage, jobAppInfoValueElementSelector);
                
                testObject = scraper.assignJobAppValues(testObject, jobAppInfoHeader, jobAppInfoValue);
            }

            // TODO: Work Term Ratings
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

                // Questions
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

            } catch(e){}
    
            await newPage.close();
            await page.bringToFront();
            
            await page.waitFor(100);
            testArray.push(testObject);
        }

    }

    await scraper.reLogin(YOUR_EMAIL, YOUR_PASSWORD, page);

    // Second for loop
    for(let a = startPageNumber + 3, z = 1; a < totalPages + 3; a++, z++){
        // Click to new page
        try{
            await page.bringToFront();
        } catch(e){}
        let pageNav = '';
        const startNav = '#postingsTablePlaceholder > div:nth-child(4) > div > ul > li:nth-child(';
        const endNav = ') > a';
        pageNav = pageNav.concat(startNav, a, endNav);
        await page.click(pageNav);
        await page.waitFor(2000);

        let jobsOnPage = await scraper.getAmountOfJobsOnPage(page);

        // Execute regular scrape
        for(let i = 1; i <= jobsOnPage; i++){
                
            let testObject = {};
            let today = new Date();
            let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
            testObject.scrapeDate = date;
    
            // Get ID of job
            let jobIDValue = await scraper.getBasicJobID(i, page);
            testObject.jobID = jobIDValue;

            // Get Job Title
            let jobTitleValue = await scraper.getBasicJobTitle(i, page);
            testObject.title = jobTitleValue;

            // Get Company Name
            let companyNameValue = await scraper.getBasicCompanyName(i, page);
            testObject.companyName = companyNameValue;

            // Get Amount of Openings
            let openingsValue = await scraper.getBasicJobOpenings(i, page);
            testObject.openings = openingsValue;
            
            const starting = '#postingsTable > tbody > tr:nth-child('

            let dropdown = ''
            const dropdownEnding = ') > td:nth-child(1) > div > a';
            dropdown = dropdown.concat(starting, i, dropdownEnding);
    
            const newTabEnding = ') > td:nth-child(1) > div > ul > li:nth-child(2) > a';
            let newTab = ''
            newTab = newTab.concat(starting, i, newTabEnding);

            await page.click(dropdown);
            const newPagePromise = new Promise(x => page.once('popup', x));
            await page.click(newTab);
            
            // Switch to new Page
            const newPage = await newPagePromise;   
            await newPage.waitFor(700); 
    
            // For loop for Job Posting Information
            // #postingDiv > div:nth-child(1) > div.panel-body > table > tbody > tr:nth-child(   i   ) > td:nth-child(   1 or 2   )
            let jobPostInfoRowsElement = await newPage.$('#postingDiv > div:nth-child(1) > div.panel-body > table > tbody');
            let jobPostInfoRows = await newPage.evaluate(el => el.childElementCount, jobPostInfoRowsElement);
    
            const jobPostInfoStarting = '#postingDiv > div:nth-child(1) > div.panel-body > table > tbody > tr:nth-child(';
            const jobPostInfoHeadEnd = ') > td:nth-child(1)';
            const jobPostInfoValueEnd = ') > td:nth-child(2)';
    
            for(var b = 1; b < jobPostInfoRows + 1; b++){
                let jobPostInfoHeaderElementSelector = '';
                let jobPostInfoValueElementSelector = '';
    
                jobPostInfoHeaderElementSelector = jobPostInfoHeaderElementSelector.concat(jobPostInfoStarting, b, jobPostInfoHeadEnd);
                jobPostInfoValueElementSelector = jobPostInfoValueElementSelector.concat(jobPostInfoStarting, b, jobPostInfoValueEnd);
    
                // Check Header
                let jobPostInfoHeader = await scraper.getInnerText(newPage, jobPostInfoHeaderElementSelector);
                let jobPostInfoValue = await scraper.getInnerText(newPage, jobPostInfoValueElementSelector);
                
                testObject = scraper.assignJobInfoValues(testObject, jobPostInfoHeader, jobPostInfoValue);
            }

            // For loop for Application Information
            // #postingDiv > div:nth-child(2) > div.panel-body > table > tbody > tr:nth-child(   i   ) > td:nth-child(   1 or 2   )
            let jobAppInfoRowsElement = await newPage.$('#postingDiv > div:nth-child(2) > div.panel-body > table > tbody');
            let jobAppInfoRows = await newPage.evaluate(el => el.childElementCount, jobAppInfoRowsElement);
    
            const jobAppInfoStarting = '#postingDiv > div:nth-child(2) > div.panel-body > table > tbody > tr:nth-child(';
            const jobAppInfoHeadEnd = ') > td:nth-child(1)';
            const jobAppInfoValueEnd = ') > td:nth-child(2)';
    
            for(var c = 1; c < jobAppInfoRows + 1; c++){
                let jobAppInfoHeaderElementSelector = '';
                let jobAppInfoValueElementSelector = '';
    
                jobAppInfoHeaderElementSelector = jobAppInfoHeaderElementSelector.concat(jobAppInfoStarting, c, jobAppInfoHeadEnd);
                jobAppInfoValueElementSelector = jobAppInfoValueElementSelector.concat(jobAppInfoStarting, c, jobAppInfoValueEnd);
    
                // Check Header
                let jobAppInfoHeader = await scraper.getInnerText(newPage, jobAppInfoHeaderElementSelector);
                let jobAppInfoValue = await scraper.getInnerText(newPage, jobAppInfoValueElementSelector);
                
                testObject = scraper.assignJobAppValues(testObject, jobAppInfoHeader, jobAppInfoValue);
            }
    
            await newPage.close();
            await page.bringToFront();
            
            await page.waitFor(100);
            testArray.push(testObject);
        }

        if(z % 3 == 0){
            await scraper.reLogin(YOUR_EMAIL, YOUR_PASSWORD, page);
        }
    }

    testArrayJSON = JSON.stringify(testArray);
    fs.writeFile(FILE_NAME, testArrayJSON, function(err) {
        if (err) {
            console.log(err);
        }
    });

    // Add to MongoDB

}

async function scrape(email, password){
    const browser = await puppeteer.launch({
        headless: false,
    });
    const page = await browser.newPage();
    await scraper.setup(email, password, page);
    await getJobInfo(page);

    browser.close();
}

scrape(YOUR_EMAIL, YOUR_PASSWORD).catch(console.error);
