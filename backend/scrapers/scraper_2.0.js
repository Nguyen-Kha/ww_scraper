////////    SET UP VARIABLES HERE   ////////

const YOUR_EMAIL = '@uwaterloo.ca';
const YOUR_PASSWORD = '';
const startPageNumber = 3;
const endPageNumber = 15;
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

    // for(var a = 3; a < totalPages + 3; a++){ //endPageNumber replaced by totalPages
    for(var a = startPageNumber; a < totalPages + 3; a++){ 

        let jobsOnPage = await scraper.getAmountOfJobsOnPage(page);

        if(a == 3){
            // Don't click the the new page first

            // run one iteration of the for loop
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
                await newPage.waitFor(300); 
        
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
                    /*
                    let temp = '';
                    switch(jobPostInfoHeader) {
                        case 'Work Term:':
                            testObject.term = jobPostInfoValue;
                            break;
                        case 'Job Type:':
                            testObject.type = jobPostInfoValue;
                            break;
                        // case 'Job Title:':
                        //     testObject.title = jobPostInfoValue;
                        //     break;
                        // case 'Number of Job Openings:':
                        //     testObject.openings = parseInt(jobPostInfoValue);
                        //     break;
                        case 'Job Category (NOC):':
                            testObject.categories = jobPostInfoValue;
                            break;
                        case 'Level:':
                            temp = jobPostInfoValue.split('\n');
                            if(temp.length == 1){
                                testObject.level = jobPostInfoValue;
                            }
                            else {
                                testObject.level = temp;
                            }
                            break;
                        case 'Region:':
                            testObject.region = jobPostInfoValue;
                            break;
                        case 'Job - Address Line One:':
                            testObject.address = jobPostInfoValue;
                            break;
                        case 'Job - City:':
                            testObject.city = jobPostInfoValue;
                            break;
                        case 'Job - Province / State:':
                            testObject.province = jobPostInfoValue;
                            break;
                        case 'Job - Postal Code / Zip Code (X#X #X#):':
                            testObject.postalCode = jobPostInfoValue;
                            break;
                        case 'Job - Country:':
                            testObject.country = jobPostInfoValue;
                            break;
                        case 'Job Location (if exact address unknown or multiple locations):':
                            testObject.secondaryLocation = jobPostInfoValue;
                            break;
                        case 'Work Term Duration:':
                            testObject.duration = jobPostInfoValue;
                            break;
                        case 'Special Job Requirements:':
                            testObject.specialRequirements = jobPostInfoValue;
                            break;
                        case 'Job Summary:':
                            testObject.summary = jobPostInfoValue;
                            break;
                        case 'Job Responsibilities:':
                            testObject.responsibilities = jobPostInfoValue;
                            break;
                        case 'Required Skills:':
                            testObject.skills = jobPostInfoValue;
                            break;
                        case 'Transportation and Housing:':
                            testObject.housing = jobPostInfoValue;
                            break;
                        case 'Compensation and Benefits Information:':
                            testObject.compensation = jobPostInfoValue;
                            break;
                        case 'Targeted Degrees and Disciplines:':
                            temp = jobPostInfoValue.split('\n');
                            temp.shift();
                            testObject.degrees = temp;
                            break;                        
                    }
                    */
        
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
                    /*
                    */
                }
        
                await newPage.close();
                await page.bringToFront();
                
                await page.waitFor(100);
                testArray.push(testObject);
            }
        }
        else{
            // Click the new page
            await page.bringToFront();
            let pageNav = '';
            const startNav = '#postingsTablePlaceholder > div:nth-child(4) > div > ul > li:nth-child(';
            const endNav = ') > a';
            pageNav = pageNav.concat(startNav, a, endNav);
            await page.click(pageNav);
            await page.waitFor(2000);

            // run the for loop below here
            let jobsOnPage = await scraper.getAmountOfJobsOnPage(page);
            console.log(jobsOnPage);

            for(var i = 1; i <= jobsOnPage; i++){
            // for(var i = 1; i <= 4; i++){
                // try{
                //     let continueSession = await page.$('#timeoutMessage > a');
                //     await page.click(continueSession);
                //     await page.waitFor(100);
                //     try{
                //         let relogin = await page.$('body > div.container-fluid > div > div > div.box.boxContent > div > div > div > a');
                //         await page.click(relogin);
                //         let studentRelogin = await page.$('body > div.container-fluid > div > div > div:nth-child(6) > div > div > a:nth-child(1)');
                //         await page.click(studentRelogin);
                //     }
                //     catch(err){}
                // }
                // catch(err){}

                let testObject = {};
                var today = new Date();
                var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
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
                await newPage.waitFor(100);
        
                // For loop for Job Posting Information
                // #postingDiv > div:nth-child(1) > div.panel-body > table > tbody > tr:nth-child(   i   ) > td:nth-child(   1 or 2   )
                let jobPostInfoRowsElement = await newPage.$('#postingDiv > div:nth-child(1) > div.panel-body > table > tbody');
                let jobPostInfoRows = await newPage.evaluate(el => el.childElementCount, jobPostInfoRowsElement);
        
                const jobPostInfoStarting = '#postingDiv > div:nth-child(1) > div.panel-body > table > tbody > tr:nth-child(';
                const jobPostInfoHeadEnd = ') > td:nth-child(1)';
                const jobPostInfoValueEnd = ') > td:nth-child(2)';

                for(let b = 1; b < jobPostInfoRows + 1; b++){
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
            
        }
    }

    testArrayJSON = JSON.stringify(testArray);
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
    await scraper.setup(email, password, page);
    await getJobInfo(page);

    browser.close();
}

scrape(YOUR_EMAIL, YOUR_PASSWORD).catch(console.error);
