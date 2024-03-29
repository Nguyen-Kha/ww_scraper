////////    SET UP VARIABLES HERE   ////////

const YOUR_EMAIL = 'kh8nguye@uwaterloo.ca';
const YOUR_PASSWORD = '';
const startPageNumber = 3; // proper page is 4 - (page you are on)

// Enables parsing of work term ratings
const FAST = true;

////////////////////////////////////////////

const puppeteer = require('puppeteer');
const scraper = require('./scraperModules.js');
const fs = require('fs');

const FILE_NAME = scraper.generateFileName();

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
            try{
                await page.bringToFront();
                let pageNav = '';
                const startNav = '#postingsTablePlaceholder > div:nth-child(4) > div > ul > li:nth-child(';
                const endNav = ') > a';
                pageNav = pageNav.concat(startNav, a, endNav);
                await page.click(pageNav);
                await page.waitFor(2000);
            } catch (e) {
                console.log(e);
            }
        }

        let jobsOnPage = await scraper.getAmountOfJobsOnPage(page);

        // Execute regular scrape
        for(let i = 1; i <= jobsOnPage; i++){
                
            let testObject = {};
            let today = new Date();
            let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
            testObject.scrapeDate = date;
            
            try{
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

                // Get Current Number of Apps
                let currentApplicationsValue = await scraper.getApplicationAmount(i, page);
                testObject.currentApplications = currentApplicationsValue;
                
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
                try{
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

                    // Work Term Ratings
                    if(FAST){
                        // pass
                    }
                    else{
                        try{
                            await scraper.toggleWorkTermRatings(newPage);
                            try{
                                testObject.hiredPerTerm = await scraper.parseHiringTable(newPage);
                            } catch(e){}
                            try{
                                testObject.facultyHires = await scraper.parseFacultyPieChart(newPage);
                            } catch(e){}
                            try{
                                testObject.studentWorkTermHires = await scraper.parseStudentWTPieChart(newPage);
                            } catch(e){}
                            try{
                                testObject.hiredPrograms = await scraper.parseHiredProgramsBarChart(newPage);
                            } catch(e){}
                            try{
                                testObject.rating = await scraper.getWorkTermRatingScore(newPage);
                            } catch(e){}
                            try{
                                testObject.workTermSatisfaction = await scraper.parseWTSBarChart(newPage);
                            } catch(e){}
                            try{
                                testObject.questionRating = await scraper.parseQuestionChart(newPage);
                            } catch(e){}
    
                        } 
                        catch(e){
                            console.log(e);
                        }
                    }
                    
                } catch (e) {
                    console.log(e);
                }
        
                await newPage.close();
                await page.bringToFront();
                
                await page.waitFor(100);
            } catch(e) {
                console.log(e);
            }
            testArray.push(testObject);
        }

    }

    await scraper.reLogin(YOUR_EMAIL, YOUR_PASSWORD, page);
    
    // Second for loop
    for(let a = startPageNumber + 3, z = 1; a < totalPages + 3; a++, z++){
        // Click to new page
        try{
            await page.waitFor(3000);
            try{
                await page.bringToFront();
            } catch(e){}
            let pageNav = '';
            const startNav = '#postingsTablePlaceholder > div:nth-child(4) > div > ul > li:nth-child(';
            const endNav = ') > a';
            pageNav = pageNav.concat(startNav, a, endNav);
            await page.click(pageNav);
            await page.waitFor(2000);
        } catch (e){
            await page.waitFor(3000);
            try{
                await page.bringToFront();
            } catch(e){}
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
            
            try{
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

                try{
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

                    if(FAST){
                        // pass
                    }
                    else{
                        try{
                            await scraper.toggleWorkTermRatings(newPage);
                            try{
                                testObject.hiredPerTerm = await scraper.parseHiringTable(newPage);
                            } catch(e){}
                            try{
                                testObject.facultyHires = await scraper.parseFacultyPieChart(newPage);
                            } catch(e){}
                            try{
                                testObject.studentWorkTermHires = await scraper.parseStudentWTPieChart(newPage);
                            } catch(e){}
                            try{
                                testObject.hiredPrograms = await scraper.parseHiredProgramsBarChart(newPage);
                            } catch(e){}
                            try{
                                testObject.rating = await scraper.getWorkTermRatingScore(newPage);
                            } catch(e){}
                            try{
                                testObject.workTermSatisfaction = await scraper.parseWTSBarChart(newPage);
                            } catch(e){}
                            try{
                                testObject.questionRating = await scraper.parseQuestionChart(newPage);
                            } catch(e){}
    
                        } 
                        catch(e){
                            console.log(e);
                        }
                    }
                    
                } catch (e) {
                    console.log(e);
                }
        
                await newPage.close();
                await page.bringToFront();
                
                await page.waitFor(100);
            } catch (e) {
                console.log(e);
            }
            testArray.push(testObject);
        }

        if(z % 2 == 0){
            await scraper.reLogin(YOUR_EMAIL, YOUR_PASSWORD, page);
        }
    }

    testArrayJSON = JSON.stringify(testArray);
    fs.writeFile('backend/data/jobs/' + FILE_NAME, testArrayJSON, function(err) {
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
