async function getInnerText(context, selectorString){
    let selector = await context.waitForSelector(selectorString);
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
    let element = await context.waitForSelector(selector);
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

    let element = await context.waitForSelector(selector);
    let value = await context.evaluate(el => el.innerHTML, element);
    value = value.trim();
    return value;
}

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
}