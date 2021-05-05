const overallWTRStart = 'div.tab-content > div > div > div.boxContent > ';

////////////////////////////////////////////

async function getInnerText(context, selectorString){
    let selector = await context.waitForSelector(selectorString, {timeout: 5000});
    let selectorValue = await context.evaluate(el => el.innerText, selector);
    selectorValue = selectorValue.trim(); 
    return selectorValue;
}

async function getchildElementCount(context, selector){
    /*
    Gets the amount of child elements in the selector given
    INPUTS:
    context: the page that it is on
    selector: (str) - selector used in document.querySelector()

    RETURNS:
    count: (int)
    */

//    let element = await context.$(selector);
    let element = await context.waitForSelector(selector, {timeout: 5000});
    let count = await context.evaluate(el => el.childElementCount, element);
    count = parseInt(count);
    return count;
}

async function getinnerHTML(context, selector){
    /*
    Gets the innerHTML value of the selector given
    INPUTS:
    context: the page that it is on
    selector: (str) - selector used in document.querySelector()

    RETURNS:
    value: (str)
    */

    let element = await context.waitForSelector(selector, {timeout: 5000});
    let value = await context.evaluate(el => el.innerHTML, element);
    value = value.trim();
    return value;
}

////////////////////////////////////////////

async function setup(email, password, context){
    await context.goto('https://waterlooworks.uwaterloo.ca/waterloo.htm?action=login');
    try{
        await context.click('#userNameInput');
        await context.keyboard.type(email);
        await context.click('#nextButton');
        await context.click('#passwordInput');
        await context.keyboard.type(password);
        await context.click('#submitButton');
        await context.waitForNavigation();
        await context.waitFor(30000);
    }
    catch(e){
        console.log(e);
    }
    await context.goto('https://waterlooworks.uwaterloo.ca/myAccount/co-op/coop-postings.htm');
    await context.click('#widgetSearch > div > input');
    await context.waitFor(3000);
}

async function reLogin(email, password, context){
    await context.goto('https://waterlooworks.uwaterloo.ca/logout.htm');
    await context.waitFor(2000);
    await setup(email, password, context);
}

async function getTotalAmountOfJobs(context){
    await context.waitForSelector('.badge-info');
    let jobsElement = await context.$('.badge-info')
    let numberOfJobs = await context.evaluate(el => el.textContent, jobsElement);
    numberOfJobs = numberOfJobs.trim();
    numberOfJobs = parseInt(numberOfJobs);

    return numberOfJobs;
}

async function getAmountOfJobsOnPage(context){
    let jobsOnPageElement = await context.$('#postingsTable > tbody');
    let jobsOnPage = await context.evaluate((el) => {
        let temp = el.childElementCount;
        return temp;
    }, jobsOnPageElement);

    return jobsOnPage;
}

async function getBasicJobInfo(rowNumber, tableChildNumber, context){
    const starting = '#postingsTable > tbody > tr:nth-child('
    let selectorString = '';
    
    const selectorMiddle = ') > td:nth-child(';
    selectorString = selectorString.concat(starting, rowNumber, selectorMiddle, tableChildNumber, ')');
    let selectorValue = await getInnerText(context, selectorString);

    if(tableChildNumber == 3 || tableChildNumber == 7 || tableChildNumber == 11){
        selectorValue = parseInt(selectorValue);
    }
    
    return selectorValue;
}

async function getBasicJobID(rowNumber, context){
    let jobIDValue = await getBasicJobInfo(rowNumber, 3, context);
    return jobIDValue;
}

async function getBasicJobTitle(rowNumber, context){
    let jobTitleValue = await getBasicJobInfo(rowNumber, 4, context);
    return jobTitleValue;
}

async function getBasicCompanyName(rowNumber, context){
    let companyNameValue = await getBasicJobInfo(rowNumber, 5, context);
    return companyNameValue;
}

async function getBasicJobOpenings(rowNumber, context){
    let jobOpeningsValue = await getBasicJobInfo(rowNumber, 7, context);
    return jobOpeningsValue;
}

async function getBasicCity(rowNumber, context){
    let cityValue = await getBasicJobInfo(rowNumber, 9, context);
    return cityValue;
}

async function getBasicLevel(rowNumber, context){
    // 10
}

async function getApplicationAmount(rowNumber, context){
    let appAmountValue = await getBasicJobInfo(rowNumber, 11, context);
    return appAmountValue;
}

async function getBasicDeadline(rowNumber, context){
    let deadlineValue = await getBasicJobInfo(rowNumber, 12, context);
    return deadlineValue;
}

function assignJobInfoValues(testObject, jobPostInfoHeader, jobPostInfoValue){
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

    return testObject;
}

function assignJobAppValues(testObject, jobAppInfoHeader, jobAppInfoValue){
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

    return testObject;
}

////////////////////////////////////////////

async function toggleWorkTermRatings(context){
    /*
    Click Work Term Ratings if Present
    Iterate through ul and find an li with a with text 'Work Term Ratings'

    RETURNS:
    None
    */

    const navPostingOptions = '.nav-pills';
    const navPostingOptionsCount = await getchildElementCount(context, navPostingOptions);
    for(let i = 1; i < navPostingOptionsCount + 1; i++){
        let navPostingOptionSelector;
        let navPostingOptionValue;
        try{
            navPostingOptionSelector = navPostingOptions + ' > li:nth-child(' + i + ') > a';
            navPostingOptionValue = await getInnerText(context, navPostingOptionSelector);
        } catch(e){}
        
        if(navPostingOptionValue.includes('Work Term Ratings')){
            await context.click(navPostingOptionSelector);
            break;
        }

    }
    await context.waitFor(2000);
}

async function parseHiringTable(context){
    let WTRHiringTableSelector = overallWTRStart + 'div:nth-child(3) > div > div:nth-child(5) > table';

    // TODO: Refactor cell extraction
    let hiringKeys = [];
    const WTRHiringTableHeaderSelector = WTRHiringTableSelector + ' >  thead > tr';
    const WTRHiringTableColumnCount = await getchildElementCount(context, WTRHiringTableHeaderSelector);
    // the nth child starts on 3 for all job postings
    for(let i = 3; i < WTRHiringTableColumnCount + 1; i++){
        let tempWTRHiringHeaderCellSelector = '';
        tempWTRHiringHeaderCellSelector = tempWTRHiringHeaderCellSelector.concat(WTRHiringTableHeaderSelector, ' > th:nth-child(', i, ')');
        let headerValue = await getInnerText(context, tempWTRHiringHeaderCellSelector); 
        hiringKeys.push(headerValue);
    }

    let hiredValues = [];
    // TODO: need to scrape the bottom one
    const WTRHiringTableValueSelector = WTRHiringTableSelector + ' >  tbody > tr:nth-child(2)';
    for(let i = 3; i < WTRHiringTableColumnCount + 1; i++){
        let tempWTRHiringValueCellSelector = WTRHiringTableValueSelector + ' > td:nth-child(' + i + ')';
        let cellValue = parseInt(await getInnerText(context, tempWTRHiringValueCellSelector));
        hiredValues.push(cellValue);
    }

    // Construct JSON Object
    let hiredTableObject = {};
    hiringKeys.forEach((key, value) => {
        hiredTableObject[key] = hiredValues[value];
    });

    return hiredTableObject;
}

async function parsePieChart(context, selector){
    /*
    Parses the work term Pie Chart

    RETURNS:
    Object
    */

    const pieSections = await getchildElementCount(context, selector);
    let pieSectionsObject = {};
    for(let i = (pieSections / 2) + 1; i < pieSections + 1; i++){
        let keySelector = selector + ' > g:nth-child(' + String(i) + ') > text > tspan:nth-child(1)';
        let valueSelector = selector + ' > g:nth-child(' + String(i) + ') > text > tspan:nth-child(2)';
        let pieKey = await getinnerHTML(context, keySelector);
        if(pieKey.includes('+')){
            pieKey = pieKey.replace(' +', '');
        }
        let pieValue = (await getinnerHTML(context, valueSelector)).replace(': ' , '');

        pieSectionsObject[pieKey] = pieValue;
    }

    return pieSectionsObject;
}

async function parseFacultyPieChart(context){
    facultyPieSelector = 'div:nth-child(4) > div:nth-child(1) > div > div > svg > g.highcharts-tracker';
    let facultyPieSectionsObject = {};
    facultyPieSectionsObject = await parsePieChart(context, facultyPieSelector);

    return facultyPieSectionsObject;
}

async function parseStudentWTPieChart(context){
    studentWTPieSelector = 'div:nth-child(4) > div:nth-child(2) > div > div > svg > g.highcharts-tracker';
    let studentWTPieSectionsObject = {};
    studentWTPieSectionsObject = await parsePieChart(context, studentWTPieSelector);

    return studentWTPieSectionsObject;
}

async function parseBarChart(context, selector, satisfactionBar = false){
    // const selector = overallWTRStart + 'div:nth-child(5) > div > div > div > svg';
    const keyStart = selector + ' > g.highcharts-xaxis-labels';
    const valueStart = selector + ' > g.highcharts-tracker';

    const keyCount = await getchildElementCount(context, keyStart);
    const valueCount = await getchildElementCount(context, valueStart);

    let barObject = {};
    for(let i = 1; (i < keyCount + 1) && (keyCount == valueCount); i++){
        let keySelector = '';
        if(satisfactionBar){
            keySelector = keyStart + ' > text:nth-child(' + i + ')';
        }
        else{
            keySelector = keyStart + ' > text:nth-child(' + i + ') > tspan';
        }
        let valueSelector = valueStart + ' > g:nth-child(' + i + ') > text > tspan';

        let key = await getinnerHTML(context, keySelector);
        let value = await getinnerHTML(context, valueSelector);
        barObject[key] = value;
    }

    return barObject;
}

async function parseHiredProgramsBarChart(context){
    const hiredProgramsSelector = overallWTRStart + 'div:nth-child(5) > div > div > div > svg';
    let hiredProgramsObject = {};
    hiredProgramsObject = await parseBarChart(context, hiredProgramsSelector);

    // parseInt on values
    let objectKeys = Object.keys(hiredProgramsObject);
    let objectValues = Object.values(hiredProgramsObject);
    objectValues.forEach((el, i) => {
        objectValues[i] = parseInt(el);
    });
    hiredProgramsObject = {}; // Reset object
    objectKeys.forEach((key, i) =>{
        hiredProgramsObject[key] = objectValues[i];
    });

    return hiredProgramsObject;
}

async function parseWTSBarChart(context){
    const WTSatisfactionSelector = overallWTRStart + 'div:nth-child(7) > div > div > div > svg';
    let WTSObject = {};
    WTSObject = await parseBarChart(context, WTSatisfactionSelector, true);

    return WTSObject;
}

async function parseQuestionChart(context){
    const questionRatingSelector = overallWTRStart + 'div:nth-child(8) > div > div > div > svg';
    let questionObject  = {};
    questionObject = await parseBarChart(context, questionRatingSelector);

    // parseFloat on value
    let objectKeys = Object.keys(questionObject);
    let objectValues = Object.values(questionObject);
    objectValues.forEach((el, i) => {
        objectValues[i] = parseInt(el);
    });
    // slice Key
    objectKeys.forEach((el, i) => {
        objectKeys[i] = el.slice(0, 2);
    });
    questionObject = {};
    objectKeys.forEach((key, i) =>{
        questionObject[key] = objectValues[i];
    });

    return questionObject;
}

async function getWorkTermRatingScore(context){
    const ratingSelector = overallWTRStart + 'div:nth-child(6) > div > div:nth-child(5) > table > tbody > tr:nth-child(2) > td:nth-child(3)';
    let ratingValue = parseFloat(await getInnerText(context, ratingSelector));

    return ratingValue;
}

module.exports = {
    getInnerText,
    getchildElementCount,
    getinnerHTML,
    setup,
    reLogin,
    getTotalAmountOfJobs,
    getAmountOfJobsOnPage,
    getBasicJobInfo,
    getBasicJobID,
    getBasicJobTitle,
    getBasicCompanyName,
    getBasicJobOpenings,
    getBasicCity,
    // getBasicLevel,
    getApplicationAmount,
    getBasicDeadline,
    assignJobInfoValues,
    assignJobAppValues,
    toggleWorkTermRatings,
    parseHiringTable,
    parseFacultyPieChart,
    parseStudentWTPieChart,
    parseHiredProgramsBarChart,
    parseWTSBarChart,
    parseQuestionChart,
    getWorkTermRatingScore
}