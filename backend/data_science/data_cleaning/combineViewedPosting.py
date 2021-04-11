# TODO: Set up Mongo, Mongo Connection, Mongo Table Creation
import pymongo
import os
from pymongo import MongoClient
import datetime
from dotenv import load_dotenv

load_dotenv()
uri = os.getenv('ATLAS_URI')

client = MongoClient(uri)
db = client['WW']
rawjobs_collection = db['RawJobs']
viewed_collection = db['ViewedAppAmount']
NLP_jobs_collection = db['NLPJobs']

# Create dictionary for {jobID: applications}
app_amount_dict = {}
for viewed_job in viewed_collection.find({}, {'_id': 0, 'jobID': 1, 'applications': 1}):
    if(viewed_job['jobID'] not in app_amount_dict):
        app_amount_dict[viewed_job['jobID']] = viewed_job['applications']

for raw_job in rawjobs_collection.find():
    try:
        # Add the application amount to the job
        if('applications' not in raw_job):
            try:
                raw_job['applications'] = app_amount_dict[raw_job['jobID']]
            except:
                pass

        # Remove the NEW
        if(raw_job['title'].find('NEW ', 0, 4) == 0):
            raw_job['title'] = raw_job['title'].replace('NEW ', '')

        # Convert the \n to \\n for web version
        # Convert the \n to space for NLP version
        # Add appInfo, specialRequirements
        if(('\n' in raw_job['summary']) or 
            ('\n' in raw_job['responsibilities']) or 
            ('\n' in raw_job['skills']) or 
            ('\n' in raw_job['housing']) or 
            ('\n' in raw_job['compensation']) or
            ('\n' in raw_job['appInfo']) or
            ('\n' in raw_job['specialRequirements'])
            ):
            try:
                raw_job['summary'] = raw_job['summary'].replace('\n', ' ')
            except: 
                pass
            
            try:
                raw_job['responsibilities'] = raw_job['responsibilities'].replace('\n', ' ')
            except: 
                pass

            try:
                raw_job['skills'] = raw_job['skills'].replace('\n', ' ')
            except: 
                pass
            
            try:
                raw_job['housing'] = raw_job['housing'].replace('\n', ' ')
            except: 
                pass

            try:
                raw_job['compensation'] = raw_job['compensation'].replace('\n', ' ')
            except: 
                pass
            
            try:
                raw_job['appInfo'] = raw_job['appInfo'].replace('\n', ' ')
            except: 
                pass

            try:
                raw_job['specialRequirements'] = raw_job['specialRequirements'].replace('\n', ' ')
            except: 
                pass

        # Convert appDeadline to datetime keys
        raw_job['deadlineMonth'] = int((datetime.datetime.strptime(raw_job['appDeadline'].split(' ')[0], '%B')).month)
        raw_job['deadlineDay'] = int((raw_job['appDeadline'].split(' ')[1]).replace(',', ''))

        # Get deadline time in 24 hour mode from appDeadline
        deadline_time_value = raw_job['appDeadline'].split(' ')[3] + raw_job['appDeadline'].split(' ')[4]
        temp_time = datetime.datetime.strptime(deadline_time_value, '%I:%M%p')
        raw_job['deadlineTime'] = datetime.datetime.strftime(temp_time, '%H:%M')

        # Converting appDeadline to ISO 8601
        date_format = '%B %d, %Y %I:%M %p'
        temp_datetime = datetime.datetime.strptime(raw_job['appDeadline'], date_format)
        raw_job['appDeadline'] = temp_datetime.isoformat()

        # Split into year, season, month - specific for the job posting
        raw_job['year'] = int(raw_job['term'].split(' - ')[0])
        raw_job['season'] = raw_job['term'].split(' - ')[1]

        # Append to MongoDB table
        try:
            NLP_jobs_collection.insert_one(raw_job)
        except:
            print('Error: ' + raw_job['jobID'])
    except:
        print('Error: ' + str(raw_job))