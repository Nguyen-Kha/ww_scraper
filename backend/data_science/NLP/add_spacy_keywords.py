import spacy
import pymongo
from pymongo import MongoClient
import warnings
import os
from dotenv import load_dotenv
from datetime import datetime
import sys

nlp = spacy.load('backend/data_science/NLP/models/tech_iteration_1')
load_dotenv()
mongo_connection = os.getenv('ATLAS_URI')

client = MongoClient(mongo_connection)
db = client['WW']
NLP_jobs_collection = db['NLPJobs']
NLP_jobs_dev_collection = db['NLPJobs_Dev']

# TODO: Search for existing jobIDs
viewed_dict = {}
for already_added_job in NLP_jobs_dev_collection.find({}, {'_id': 0, 'jobID': 1}):
    viewed_dict[already_added_job['jobID']] = True

# TODO: If jobIDs are already in the NLP Dev, ignore
for nlp_jobs in NLP_jobs_collection.find({}, {'_id': 0}):
    if(nlp_jobs['jobID'] not in viewed_dict):
        keyword_array = []
        doc = nlp(nlp_jobs['skills'])
        for ent in doc.ents:
            if(ent.label_ == 'TECHNOLOGY'):
                keyword_array.append(str(ent.text))
        
        doc = nlp(nlp_jobs['responsibilities'])
        for ent in doc.ents:
            if(ent.label_ == 'TECHNOLOGY'):
                keyword_array.append(str(ent.text))

        # Remove duplicate words
        list(set(keyword_array))

        try:
            nlp_jobs['keywords'] = keyword_array
            NLP_jobs_dev_collection.insert_one(nlp_jobs)
        except:
            with open('logs/errors.txt', 'a+') as log_file:
                log_file.write(str(datetime.now()) + ' - Error: ' + str(nlp_jobs['jobID']) + ' ' + str(sys.exc_info()[0]))
