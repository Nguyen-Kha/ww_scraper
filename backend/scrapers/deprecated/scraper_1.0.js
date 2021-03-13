////////    SET UP VARIABLES HERE   ////////

const YOUR_EMAIL = '@uwaterloo.ca';
const YOUR_PASSWORD = '';
const startPageNumber = 3;
const endPageNumber = 15;
const FILE_NAME = '2021-MM-DD.json';

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
    await page.click('#widgetSearch > div > input');
    await page.waitFor(3000);
}

async function getJobInfo(page){
    // const startPageNumber = 3;
    // const endPageNumber = 15;

    // Get total amount of jobs
    await page.waitForSelector('.badge-info');
    let jobsElement = await page.$('.badge-info')
    let numberOfJobs = await page.evaluate(el => el.textContent, jobsElement);
    numberOfJobs = numberOfJobs.trim();
    numberOfJobs = parseInt(numberOfJobs);

    const totalPages = Math.ceil(numberOfJobs/100);

    testArray = [];

    // for(var a = 3; a < endPageNumber + 3; a++){ //endPageNumber
    for(var a = startPageNumber; a < totalPages + 3; a++){ 

        // // Not sure why I put this here
        // Get total amount of jobs
        await page.waitForSelector('.badge-info');
        let jobsElement = await page.$('.badge-info')
        let numberOfJobs = await page.evaluate(el => el.textContent, jobsElement);
        numberOfJobs = numberOfJobs.trim();
        numberOfJobs = parseInt(numberOfJobs);

        let jobsOnPageElement = await page.$('#postingsTable > tbody');
        let jobsOnPage = await page.evaluate((el) => {
            let temp = el.childElementCount;
            return temp;
        }, jobsOnPageElement);

        if(a == 3){
            // Don't click the the new page first

            // run one iteration of the for loop
            for(var i = 1; i <= jobsOnPage; i++){
                try{
                    let continueSession = await page.$('#timeoutMessage > a');
                    await page.click(continueSession);
                    await page.waitFor(2000);
                }
                catch(err){

                }
                
                let testObject = {};
                var today = new Date();
                var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
                testObject.scrapeDate = date;
        
                const starting = '#postingsTable > tbody > tr:nth-child('
        
                let dropdown = ''
                const dropdownEnding = ') > td:nth-child(1) > div > a';
                dropdown = dropdown.concat(starting, i, dropdownEnding);
        
                const newTabEnding = ') > td:nth-child(1) > div > ul > li:nth-child(2) > a';
                let newTab = ''
                newTab = newTab.concat(starting, i, newTabEnding);
        
                // Get ID of job
                let jobID = '';
                const jobIDEnding = ') > td:nth-child(3)';
                jobID = jobID.concat(starting, i, jobIDEnding);
                let jobIDSelector = await page.waitForSelector(jobID);
                let jobIDValue = await page.evaluate(el => el.innerText, jobIDSelector);
                jobIDValue = jobIDValue.trim();
                jobIDValue = parseInt(jobIDValue);
                testObject.jobID = jobIDValue;

                // Get Job Title
                let jobTitle = '';
                const jobTitleEnding = ') > td:nth-child(4)';
                jobTitle = jobTitle.concat(starting, i, jobTitleEnding);
                let jobTitleSelector = await page.waitForSelector(jobTitle);
                let jobTitleValue = await page.evaluate(el => el.innerText, jobTitleSelector);
                jobTitleValue = jobTitleValue.trim();
                testObject.title = jobTitleValue;

                // Get Company Name
                let companyName = '';
                const companyNameEnding = ') > td:nth-child(5)';
                companyName = companyName.concat(starting, i, companyNameEnding);
                let companyNameSelector = await page.waitForSelector(companyName);
                let companyNameValue = await page.evaluate(el => el.innerText, companyNameSelector);
                companyNameValue = companyNameValue.trim();
                testObject.companyName = companyNameValue;

                // Get Amount of Openings
                let openings = '';
                const openingsEnding = ') > td:nth-child(7)';
                openings = openings.concat(starting, i, openingsEnding);
                let openingsSelector = await page.waitForSelector(openings);
                let openingsValue = await page.evaluate(el => el.innerText, openingsSelector);
                openingsValue = openingsValue.trim();
                openingsValue = parseInt(openingsValue);
                testObject.openings = openingsValue;
        
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

                try{
                    let continueSession = await newPage.$('#timeoutMessage > a');
                    await newPage.click(continueSession);
                    await newPage.waitFor(2000);
                }
                catch(err){
                    
                }
        
                const jobPostInfoStarting = '#postingDiv > div:nth-child(1) > div.panel-body > table > tbody > tr:nth-child(';
                const jobPostInfoHeadEnd = ') > td:nth-child(1)';
                const jobPostInfoValueEnd = ') > td:nth-child(2)';
        
                for(var b = 1; b < jobPostInfoRows + 1; b++){
                    let jobPostInfoHeaderElementSelector = '';
                    let jobPostInfoValueElementSelector = '';
        
                    jobPostInfoHeaderElementSelector = jobPostInfoHeaderElementSelector.concat(jobPostInfoStarting, b, jobPostInfoHeadEnd);
                    jobPostInfoValueElementSelector = jobPostInfoValueElementSelector.concat(jobPostInfoStarting, b, jobPostInfoValueEnd);
        
                    // Check Header
                    let jobPostInfoHeaderElement = await newPage.waitForSelector(jobPostInfoHeaderElementSelector);
                    let jobPostInfoHeader = await newPage.evaluate(el => el.innerText, jobPostInfoHeaderElement);
                    jobPostInfoHeader = jobPostInfoHeader.trim();
        
                    let jobPostInfoValueElement = await newPage.waitForSelector(jobPostInfoValueElementSelector);
                    let jobPostInfoValue = await newPage.evaluate(el => el.innerText, jobPostInfoValueElement);
                    jobPostInfoValue = jobPostInfoValue.trim();
                    
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
                    let jobAppInfoHeaderElement = await newPage.waitForSelector(jobAppInfoHeaderElementSelector);
                    let jobAppInfoHeader = await newPage.evaluate(el => el.innerText, jobAppInfoHeaderElement);
                    jobAppInfoHeader = jobAppInfoHeader.trim();
        
                    let jobAppInfoValueElement = await newPage.waitForSelector(jobAppInfoValueElementSelector);
                    let jobAppInfoValue = await newPage.evaluate(el => el.innerText, jobAppInfoValueElement);
                    jobAppInfoValue = jobAppInfoValue.trim();
                    
                    temp = '';
                    switch(jobAppInfoHeader){
                        case 'Application Deadline:':
                            testObject.appDeadline = jobAppInfoValue;
                            break;
                        case 'Application Documents Required:':
                            temp = jobAppInfoValue.split(',');
                            testObject.appDocs = temp;
                            break;
                        case 'Additional Application Information:':
                            testObject.appInfo = jobAppInfoValue;
                            break;
                        case 'Application Method:':
                            testObject.appMethods = jobAppInfoValue;
                            break;
                    }
                }
        
        
                // For loop for Company Information 
                // #postingDiv > div:nth-child(3) > div.panel-body > table > tbody > tr:nth-child(   i   ) > td:nth-child(   1 or 2   )
                // let jobCompanyInfoRowsElement = await newPage.$('#postingDiv > div:nth-child(3) > div.panel-body > table > tbody');
                // let jobCompanyInfoRows = await newPage.evaluate(el => el.childElementCount, jobCompanyInfoRowsElement);
                
                // const jobCompanyInfoStarting = '#postingDiv > div:nth-child(3) > div.panel-body > table > tbody > tr:nth-child(';
                // const jobCompanyInfoHeadEnd = ') > td:nth-child(1)';
                // const jobCompanyInfoValueEnd = ') > td:nth-child(2)';

                // for(var d = 1; d < jobCompanyInfoRows + 1; d++){
                //     let jobCompanyInfoHeaderElementSelector = '';
                //     let jobCompanyInfoValueElementSelector = '';
        
                //     jobCompanyInfoHeaderElementSelector = jobCompanyInfoHeaderElementSelector.concat(jobCompanyInfoStarting, d, jobCompanyInfoHeadEnd);
                //     jobCompanyInfoValueElementSelector = jobCompanyInfoValueElementSelector.concat(jobCompanyInfoStarting, d, jobCompanyInfoValueEnd);
        
                //     // Check Header
                //     let jobCompanyInfoHeaderElement = await newPage.waitForSelector(jobCompanyInfoHeaderElementSelector);
                //     let jobCompanyInfoHeader = await newPage.evaluate(el => el.innerText, jobCompanyInfoHeaderElement);
                //     jobCompanyInfoHeader = jobCompanyInfoHeader.trim();
        
                //     let jobCompanyInfoValueElement = await newPage.waitForSelector(jobCompanyInfoValueElementSelector);
                //     let jobCompanyInfoValue = await newPage.evaluate(el => el.innerText, jobCompanyInfoValueElement);
                //     jobCompanyInfoValue = jobCompanyInfoValue.trim();
                    
                //     temp = '';
                //     if(jobCompanyInfoHeader == 'Organization:'){
                //         testObject.companyName = jobCompanyInfoValue;
                //     }
                // }
        
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
            let jobsOnPageElement = await page.$('#postingsTable > tbody');
            let jobsOnPage = await page.evaluate((el) => {
                let temp = el.childElementCount;
                return temp;
            }, jobsOnPageElement);
            // console.log(jobsOnPage);
            console.log(jobsOnPage);

            for(var i = 1; i <= jobsOnPage; i++){
            // for(var i = 1; i <= 4; i++){
                try{
                    let continueSession = await page.$('#timeoutMessage > a');
                    await page.click(continueSession);
                    await page.waitFor(100);
                    try{
                        let relogin = await page.$('body > div.container-fluid > div > div > div.box.boxContent > div > div > div > a');
                        await page.click(relogin);
                        let studentRelogin = await page.$('body > div.container-fluid > div > div > div:nth-child(6) > div > div > a:nth-child(1)');
                        await page.click(studentRelogin);
                    }
                    catch(err){}
                }
                catch(err){}
                let testObject = {};
                var today = new Date();
                var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
                testObject.scrapeDate = date;
        
                const starting = '#postingsTable > tbody > tr:nth-child('
        
                let dropdown = ''
                const dropdownEnding = ') > td:nth-child(1) > div > a';
                dropdown = dropdown.concat(starting, i, dropdownEnding);
        
                const newTabEnding = ') > td:nth-child(1) > div > ul > li:nth-child(2) > a';
                let newTab = ''
                newTab = newTab.concat(starting, i, newTabEnding);
        
                // Get ID of job
                let jobID = '';
                const jobIDEnding = ') > td:nth-child(3)';
                jobID = jobID.concat(starting, i, jobIDEnding);
                let jobIDSelector = await page.waitForSelector(jobID);
                let jobIDValue = await page.evaluate(el => el.innerText, jobIDSelector);
                jobIDValue = jobIDValue.trim();
                jobIDValue = parseInt(jobIDValue);
                testObject.jobID = jobIDValue;

                // Get Job Title
                let jobTitle = '';
                const jobTitleEnding = ') > td:nth-child(4)';
                jobTitle = jobTitle.concat(starting, i, jobTitleEnding);
                let jobTitleSelector = await page.waitForSelector(jobTitle);
                let jobTitleValue = await page.evaluate(el => el.innerText, jobTitleSelector);
                jobTitleValue = jobTitleValue.trim();
                testObject.title = jobTitleValue;

                // Get Company Name
                let companyName = '';
                const companyNameEnding = ') > td:nth-child(5)';
                companyName = companyName.concat(starting, i, companyNameEnding);
                let companyNameSelector = await page.waitForSelector(companyName);
                let companyNameValue = await page.evaluate(el => el.innerText, companyNameSelector);
                companyNameValue = companyNameValue.trim();
                testObject.companyName = companyNameValue;

                // Get Amount of Openings
                let openings = '';
                const openingsEnding = ') > td:nth-child(7)';
                openings = openings.concat(starting, i, openingsEnding);
                let openingsSelector = await page.waitForSelector(openings);
                let openingsValue = await page.evaluate(el => el.innerText, openingsSelector);
                openingsValue = openingsValue.trim();
                openingsValue = parseInt(openingsValue);
                testObject.openings = openingsValue;
        
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

                try{
                    let continueSession = await newPage.$('#timeoutMessage > a');
                    await newPage.click(continueSession);
                    await newPage.waitFor(2000);
                }
                catch(err){
                    
                }
        
                const jobPostInfoStarting = '#postingDiv > div:nth-child(1) > div.panel-body > table > tbody > tr:nth-child(';
                const jobPostInfoHeadEnd = ') > td:nth-child(1)';
                const jobPostInfoValueEnd = ') > td:nth-child(2)';

                for(var b = 1; b < jobPostInfoRows + 1; b++){
                    let jobPostInfoHeaderElementSelector = '';
                    let jobPostInfoValueElementSelector = '';
        
                    jobPostInfoHeaderElementSelector = jobPostInfoHeaderElementSelector.concat(jobPostInfoStarting, b, jobPostInfoHeadEnd);
                    jobPostInfoValueElementSelector = jobPostInfoValueElementSelector.concat(jobPostInfoStarting, b, jobPostInfoValueEnd);
        
                    // Check Header
                    let jobPostInfoHeaderElement = await newPage.waitForSelector(jobPostInfoHeaderElementSelector);
                    let jobPostInfoHeader = await newPage.evaluate(el => el.innerText, jobPostInfoHeaderElement);
                    jobPostInfoHeader = jobPostInfoHeader.trim();
        
                    let jobPostInfoValueElement = await newPage.waitForSelector(jobPostInfoValueElementSelector);
                    let jobPostInfoValue = await newPage.evaluate(el => el.innerText, jobPostInfoValueElement);
                    jobPostInfoValue = jobPostInfoValue.trim();
                    
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
                    let jobAppInfoHeaderElement = await newPage.waitForSelector(jobAppInfoHeaderElementSelector);
                    let jobAppInfoHeader = await newPage.evaluate(el => el.innerText, jobAppInfoHeaderElement);
                    jobAppInfoHeader = jobAppInfoHeader.trim();
        
                    let jobAppInfoValueElement = await newPage.waitForSelector(jobAppInfoValueElementSelector);
                    let jobAppInfoValue = await newPage.evaluate(el => el.innerText, jobAppInfoValueElement);
                    jobAppInfoValue = jobAppInfoValue.trim();
                    
                    temp = '';
                    switch(jobAppInfoHeader){
                        case 'Application Deadline:':
                            testObject.appDeadline = jobAppInfoValue;
                            break;
                        case 'Application Documents Required:':
                            temp = jobAppInfoValue.split(',');
                            testObject.appDocs = temp;
                            break;
                        case 'Additional Application Information:':
                            testObject.appInfo = jobAppInfoValue;
                            break;
                        case 'Application Method:':
                            testObject.appMethods = jobAppInfoValue;
                            break;
                    }
                }
        
                // For loop for Company Information 
                // #postingDiv > div:nth-child(3) > div.panel-body > table > tbody > tr:nth-child(   i   ) > td:nth-child(   1 or 2   )
                let jobCompanyInfoRowsElement = await newPage.$('#postingDiv > div:nth-child(3) > div.panel-body > table > tbody');
                let jobCompanyInfoRows = await newPage.evaluate(el => el.childElementCount, jobCompanyInfoRowsElement);
                // console.log(jobCompanyInfoRows);
                
                const jobCompanyInfoStarting = '#postingDiv > div:nth-child(3) > div.panel-body > table > tbody > tr:nth-child(';
                const jobCompanyInfoHeadEnd = ') > td:nth-child(1)';
                const jobCompanyInfoValueEnd = ') > td:nth-child(2)';

                // for(var d = 1; d < jobCompanyInfoRows + 1; d++){
                //     let jobCompanyInfoHeaderElementSelector = '';
                //     let jobCompanyInfoValueElementSelector = '';
        
                //     jobCompanyInfoHeaderElementSelector = jobCompanyInfoHeaderElementSelector.concat(jobCompanyInfoStarting, d, jobCompanyInfoHeadEnd);
                //     jobCompanyInfoValueElementSelector = jobCompanyInfoValueElementSelector.concat(jobCompanyInfoStarting, d, jobCompanyInfoValueEnd);
        
                //     // Check Header
                //     let jobCompanyInfoHeaderElement = await newPage.waitForSelector(jobCompanyInfoHeaderElementSelector);
                //     let jobCompanyInfoHeader = await newPage.evaluate(el => el.innerText, jobCompanyInfoHeaderElement);
                //     jobCompanyInfoHeader = jobCompanyInfoHeader.trim();
        
                //     let jobCompanyInfoValueElement = await newPage.waitForSelector(jobCompanyInfoValueElementSelector);
                //     let jobCompanyInfoValue = await newPage.evaluate(el => el.innerText, jobCompanyInfoValueElement);
                //     jobCompanyInfoValue = jobCompanyInfoValue.trim();
                //     console.log(jobCompanyInfoHeader);
                //     console.log(jobCompanyInfoValue);
                    
                //     temp = '';
                //     if(jobCompanyInfoHeader == 'Organization:'){
                //         testObject.companyName = jobCompanyInfoValue;
                //     }
                // }
        
                await newPage.close();
                await page.bringToFront();
                
                await page.waitFor(100);
                testArray.push(testObject);
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
    await getJobInfo(page);


    browser.close();
}

// Get email
// Get password
scrape(YOUR_EMAIL, YOUR_PASSWORD).catch(console.error);