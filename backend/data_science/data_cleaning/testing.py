import pymongo
import os
from pymongo import MongoClient
from dotenv import load_dotenv
import datetime

load_dotenv()
uri = os.getenv('ATLAS_URI')

client = MongoClient(uri)
db = client['WW']
rawjobs_collection = db['RawJobs']
# viewed_collection = db['ViewedAppAmount']
# jobs_collection = db['Jobs']

# app_amount_dict = {}
# for viewed_job in viewed_collection.find({}, {'_id': 0, 'jobID': 1, 'applications': 1}):
#     if(viewed_job['jobID'] not in app_amount_dict):
#         app_amount_dict[viewed_job['jobID']] = viewed_job['applications']
# print(app_amount_dict[172693])

# with open('dict.txt', 'a+') as test_file:
#     test_file.write(str(app_amount_dict))

# x = rawjobs_collection.find_one({'title': {'$regex': 'NEW.*'}})
# print(x['title'])
# if(x['title'].find('NEW ', 0, 4) == 0):
#     x['title'] = x['title'].replace('NEW ', '')
# print(x['title'])

# x = rawjobs_collection.find_one({'title': {'$regex': 'NEW.*'}})
# print(x)
# if(('\n' in x['summary']) or ('\n' in x['responsibilities']) or ('\n' in x['skills']) or ('\n' in x['housing']) or ('\n' in x['compensation'])):
#     try:
#         x['summary'] = x['summary'].replace('\n', ' ')
#     except: 
#         pass
    
#     try:
#         x['responsibilities'] = x['responsibilities'].replace('\n', ' ')
#     except: 
#         pass

#     try:
#         x['skills'] = x['skills'].replace('\n', ' ')
#     except: 
#         pass
    
#     try:
#         x['housing'] = x['housing'].replace('\n', ' ')
#     except: 
#         pass

#     try:
#         x['compensation'] = x['compensation'].replace('\n', ' ')
#     except: 
#         pass
# print(x)

x = rawjobs_collection.find_one({'title': {'$regex': 'NEW.*'}})
# print(x)
# Convert appDeadline to datetime keys
x['deadlineMonth'] = int((datetime.datetime.strptime(x['appDeadline'].split(' ')[0], '%B')).month)
x['deadlineDay'] = int((x['appDeadline'].split(' ')[1]).replace(',', ''))
deadline_time_value = x['appDeadline'].split(' ')[3] + x['appDeadline'].split(' ')[4]
temp_time = datetime.datetime.strptime(deadline_time_value, '%I:%M%p')
x['deadlineTime'] = datetime.datetime.strftime(temp_time, '%H:%M')

# Converting appDeadline to ISO
date_format = '%B %d, %Y %I:%M %p'
temp_datetime = datetime.datetime.strptime(x['appDeadline'], date_format)
x['appDeadline'] = temp_datetime.isoformat()

# Split into year, season, month - specific for the job posting
x['year'] = int(x['term'].split(' - ')[0])
x['season'] = x['term'].split(' - ')[1]
print(x)