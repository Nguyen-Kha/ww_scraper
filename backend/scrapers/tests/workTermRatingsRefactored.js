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
        await scraper.toggleWorkTermRatings(newPage);

        // Hired Table
        testObject.hiredPerTerm = await scraper.parseHiringTable(newPage);

        // Hires By Faculty Chart
        testObject.facultyHires = await scraper.parseFacultyPieChart(newPage);

        // Hires by Student Work Term Number Chart
        testObject.studentWorkTermHires = await scraper.parseStudentWTPieChart(newPage);

        // Hired Programs
        testObject.hiredPrograms = await scraper.parseHiredProgramsBarChart(newPage);

        // Work Term Rating
        testObject.rating = await scraper.getWorkTermRatingScore(newPage);

        // Work Term Satisfaction Distribution
        testObject.workTermSatisfaction = await scraper.parseWTSBarChart(newPage);

        // Questions
        testObject.questionRating = await scraper.parseQuestionChart(newPage);
        console.log(testObject);

    } catch(e){
        console.log(e);
    }
}

scrape(YOUR_EMAIL, YOUR_PASSWORD).catch(console.error);