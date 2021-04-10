# Following this guide - https://www.machinelearningplus.com/nlp/training-custom-ner-model-in-spacy

import spacy
import pymongo
from pymongo import MongoClient
import random
from spacy.util import minibatch, compounding
from spacy.training import Example
import warnings
import os
from dotenv import load_dotenv
import csv

nlp = spacy.load('en_core_web_sm')
load_dotenv()
mongo_connection = os.getenv('ATLAS_URI')

client = MongoClient(mongo_connection)
db = client['WW']
NLP_jobs_collection = db['NLPJobs']

ner = nlp.get_pipe('ner')

TRAIN_DATA = [
    ("Experience in the following is a strong asset: Java, J2EE, Spring, SOAP REST web services, XML, JSON HTML, CSS SCSS, Javascript, jQuery, React.js A focused, detail oriented approach to completing tasks", 
         {"entities": [
             (47, 51, "TECHNOLOGY"),
             (53, 57, "TECHNOLOGY"),
             (59, 65, "TECHNOLOGY"),
             (67, 71, "TECHNOLOGY"),
             (72, 76, "TECHNOLOGY"),
             (91, 94, "TECHNOLOGY"),
             (96, 100, "TECHNOLOGY"),
             (101, 105, "TECHNOLOGY"),
             (107, 110, "TECHNOLOGY"),
             (111, 115, "TECHNOLOGY"),
             (117, 127, "TECHNOLOGY"),
             (129, 135, "TECHNOLOGY"),
             (137, 145, "TECHNOLOGY"),
         ]}),
    ("Experience in scripting programming (Python, R, VB, C, Java, HTML, JavaScript, PHP) - Experience working with Linux UNIX - Knowledge and experience utilizing virtual environments - Experience creating, managing, querying and manipulating data using a RDBMS (MySQL, PostgreSQL, or other)",
         {"entities": [
             (37, 43, "TECHNOLOGY"),
             (45, 46, "TECHNOLOGY"),
             (48, 50, "TECHNOLOGY"),
             (52, 53, "TECHNOLOGY"),
             (55, 59, "TECHNOLOGY"),
             (61, 65, "TECHNOLOGY"),
             (67, 77, "TECHNOLOGY"),
             (79, 82, "TECHNOLOGY"),
             (110, 115, "TECHNOLOGY"),
             (116, 120, "TECHNOLOGY"),
             (258, 263, "TECHNOLOGY"),
             (265, 274, "TECHNOLOGY")
         ]}),
    ("Required skills: Front End: - Angular, HTML5, CSS3, JavaScript, TypeScript, Bootstrap, ExtJS Front End Testing; - Jasmine, Karma, PostMan Backend: - Java, Spring, SpringBoot, RESTapi, Nodejs, SQL, MongoDB, Postgres Backend testing: - Junit, PowerMock - AWS is a plus.", 
         {"entities": [
             (30, 37, "TECHNOLOGY"),
             (39, 44, "TECHNOLOGY"),
             (46, 50, "TECHNOLOGY"),
             (52, 62, "TECHNOLOGY"),
             (64, 74, "TECHNOLOGY"),
             (76, 85, "TECHNOLOGY"),
             (87, 92, "TECHNOLOGY"),
             (114, 121, "TECHNOLOGY"),
             (123, 128, "TECHNOLOGY"),
             (130, 137, "TECHNOLOGY"),
             (149, 153, "TECHNOLOGY"),
             (155, 161, "TECHNOLOGY"),
             (163, 172, "TECHNOLOGY"),
             (175, 179, "TECHNOLOGY"),
             (184, 190, "TECHNOLOGY"),
             (192, 195, "TECHNOLOGY"),
             (197, 204, "TECHNOLOGY"),
             (206, 214, "TECHNOLOGY"),
             (234, 239, "TECHNOLOGY"),
             (241, 250, "TECHNOLOGY"),
             (253, 256, "TECHNOLOGY")
         ]}),
    ("Experience with SQL and NoSQL systems - Knowledge of Hadoop, Spark, Kafka or other equivalent technologies - Proficiency in some of the following languages: Scala, Java, Python, Bash - Experience with automated testing systems - Mentorship, collaboration, and communication skills - Knowledge of data modelling, data warehousing, ETL processes, and business intelligence reporting tools - Experience working with CI CD, containerization, and virtualization tools such as Gitlab, Jenkins, Kubernetes, Docker - Experience with tools like Databricks, Snowflake or PowerBI", 
         {"entities": [
             (16, 19, "TECHNOLOGY"),
             (24, 29, "TECHNOLOGY"),
             (53, 59, "TECHNOLOGY"),
             (61, 66, "TECHNOLOGY"),
             (68, 73, "TECHNOLOGY"),
             (157, 162, "TECHNOLOGY"),
             (164, 168, "TECHNOLOGY"),
             (170, 176, "TECHNOLOGY"),
             (178, 182, "TECHNOLOGY"),
             (471, 477, "TECHNOLOGY"),
             (479, 486, "TECHNOLOGY"),
             (488, 498, "TECHNOLOGY"),
             (500, 506, "TECHNOLOGY"),
             (536, 546, "TECHNOLOGY"),
             (548, 557, "TECHNOLOGY"),
             (561, 568, "TECHNOLOGY")
         ]}),
    ("Accountabilities Under the supervision of a technical lead or manager, build, enhance and troubleshoot applications designed with one or more of the following technologies:  C#.NET, SQL, VB, Microsoft Access Learn and configure low-code tools to automate business processes, including:  Server and desktop robotics tools, Sharepoint, Power BI, Unqork, DUCO", 
         {"entities": [
             (177, 180, "TECHNOLOGY"),
             (182, 185, "TECHNOLOGY"),
             (187, 189, "TECHNOLOGY"),
             (334, 342, "TECHNOLOGY"),
             (344, 350, "TECHNOLOGY"),
             (352, 356, "TECHNOLOGY"),
         ]}),
    ("Our current technical stack includes: Ruby on Rails 5.0, HTML5, Bootstrap 3, JQuery and Less. Leveraging MySQL and Redis for data. We deploy to AWS on Linux backed by RDS. Build an HTML5 experience for mobile users React, JQuery, Bootstrap3, D3.js, MySQL and Redis .Kubernetes, Docker, NodeJS or Kotlin", 
         {"entities": [
             (38, 51, "TECHNOLOGY"),
             (57, 62, "TECHNOLOGY"),
             (64, 73, "TECHNOLOGY"),
             (77, 83, "TECHNOLOGY"),
             (105, 110, "TECHNOLOGY"),
             (115, 120, "TECHNOLOGY"),
             (144, 147, "TECHNOLOGY"),
             (151, 156, "TECHNOLOGY"),
             (181, 186, "TECHNOLOGY"),
             (215, 220, "TECHNOLOGY"),
             (222, 228, "TECHNOLOGY"),
             (230, 240, "TECHNOLOGY"),
             (242, 247, "TECHNOLOGY"),
             (249, 254, "TECHNOLOGY"),
             (259, 264, "TECHNOLOGY"),
             (266, 276, "TECHNOLOGY"),
             (278, 284, "TECHNOLOGY"),
             (286, 292, "TECHNOLOGY"),
             (296, 302, "TECHNOLOGY")
         ]}),
    ("Experience with any of the following is an asset: HTML CSS, Javascript, AngularJS, JQuery, React, Java, C# Node.js, JEE, Apache, PHP, .Net, Spring SQL, PL SQL, Oracle, MySQL, MongoDB, NoSQL Web Services (RESTful SOAP), XML, JSON, AJAX AWS, Google GCP, Azure, Heroku, Cloud Foundry Docker, Kubernetes Git Gitlab", 
         {"entities": [
             (55, 58, "TECHNOLOGY"),
             (60, 70, "TECHNOLOGY"),
             (72, 81, "TECHNOLOGY"),
             (83, 89, "TECHNOLOGY"),
             (91, 96, "TECHNOLOGY"),
             (98, 102, "TECHNOLOGY"),
             (104, 106, "TECHNOLOGY"),
             (107, 114, "TECHNOLOGY"),
             (116, 119, "TECHNOLOGY"),
             (121, 127, "TECHNOLOGY"),
             (129, 132, "TECHNOLOGY"),
             (134, 138, "TECHNOLOGY"),
             (140, 146, "TECHNOLOGY"),
             (147, 150, "TECHNOLOGY"),
             (152, 158, "TECHNOLOGY"),
             (160, 166, "TECHNOLOGY"),
             (168, 173, "TECHNOLOGY"),
             (175, 182, "TECHNOLOGY"),
             (184, 189, "TECHNOLOGY"),
             (204, 208, "TECHNOLOGY"),
             (212, 216, "TECHNOLOGY"),
             (219, 222, "TECHNOLOGY"),
             (224, 228, "TECHNOLOGY"),
             (230, 234, "TECHNOLOGY"),
             (235, 238, "TECHNOLOGY"),
             (247, 250, "TECHNOLOGY"),
             (252, 257, "TECHNOLOGY"),
             (259, 265, "TECHNOLOGY"),
             (281, 287, "TECHNOLOGY"),
             (289, 299, "TECHNOLOGY"),
             (300, 303, "TECHNOLOGY"),
             (304, 310, "TECHNOLOGY")
         ]}),
    ("Working experience developing with PHP, Laravel, VueJS, REST API, jQuery, Bootstrap, MySQL and Python Flask.", 
         {"entities": [
             (35, 38, "TECHNOLOGY"),
             (40, 47, "TECHNOLOGY"),
             (49, 52, "TECHNOLOGY"),
             (56, 60, "TECHNOLOGY"),
             (66, 72, "TECHNOLOGY"),
             (74, 83, "TECHNOLOGY"),
             (85, 90, "TECHNOLOGY"),
             (95, 101, "TECHNOLOGY"),
             (102, 107, "TECHNOLOGY")
         ]}),
    ("Experience with hybrid   native mobile application development (Cordova, Flutter, React Native) -Experience with machine learning platform (Anaconda, Tensorflow, Keras)  -Experience with machine learning libraries (OpenCV, Scikit-learn, Pandas)", 
         {"entities": [
             (64, 71, "TECHNOLOGY"),
             (73, 80, "TECHNOLOGY"),
             (82, 94, "TECHNOLOGY"),
             (140, 148, "TECHNOLOGY"),
             (150, 160, "TECHNOLOGY"),
             (162, 167, "TECHNOLOGY"),
             (215, 221, "TECHNOLOGY"),
             (223, 229, "TECHNOLOGY"),
             (237, 243, "TECHNOLOGY")
         ]}),
    ("Android, Java, Kotlin experience - iOS, Swift experience - Google Cloud or AWS experience - Unit testing and UI testing experience - C#, JavaScript, TypeScript, Postgres experience is a bonus", 
         {"entities": [
             (0, 7, "TECHNOLOGY"),
             (9, 13, "TECHNOLOGY"),
             (15, 21, "TECHNOLOGY"),
             (35, 38, "TECHNOLOGY"),
             (40, 45, "TECHNOLOGY"),
             (59, 70, "TECHNOLOGY"),
             (75, 78, "TECHNOLOGY"),
             (133, 135, "TECHNOLOGY"),
             (137, 147, "TECHNOLOGY"),
             (149, 159, "TECHNOLOGY"),
             (161, 169, "TECHNOLOGY")
         ]}),
    ("Strong ability to develop and debug in Python, Java, C or C++, Proficient in git version control. Strong experience with machine learning APIs and computational packages (TensorFlow, Theano, PyTorch, Keras, Scikit-Learn, NumPy, SciPy, Pandas). Experience with big-data technologies such as Hadoop, Spark, SparkML, etc. Experience with public cloud and services (AWS, Azure) Familiarity with basic data table operations (SQL, Hive, PostGres etc.).", 
         {"entities": [
             (39, 45, "TECHNOLOGY"),
             (47, 51, "TECHNOLOGY"),
             (53, 54, "TECHNOLOGY"),
             (58, 61, "TECHNOLOGY"),
             (77, 80, "TECHNOLOGY"),
             (171, 181, "TECHNOLOGY"),
             (183, 189, "TECHNOLOGY"),
             (191, 198, "TECHNOLOGY"),
             (200, 205, "TECHNOLOGY"),
             (207, 213, "TECHNOLOGY"),
             (221, 226, "TECHNOLOGY"),
             (228, 233, "TECHNOLOGY"),
             (235, 241, "TECHNOLOGY"),
             (290, 296, "TECHNOLOGY"),
             (298, 303, "TECHNOLOGY"),
             (305, 312, "TECHNOLOGY"),
             (362, 365, "TECHNOLOGY"),
             (367, 372, "TECHNOLOGY"),
             (420, 423, "TECHNOLOGY"),
             (425, 429, "TECHNOLOGY"),
             (431, 439, "TECHNOLOGY")
         ]}),
    ("Working with our preferred technology stack (Primarily Elixir Phoenix, Ruby on Rails, modern JavaScript). Develop, scale, and optimize amazing GraphQL & RESTful APIs.", 
         {"entities": [
             (55, 61, "TECHNOLOGY"),
             (62, 69, "TECHNOLOGY"),
             (71, 84, "TECHNOLOGY"),
             (93, 103, "TECHNOLOGY"),
             (143, 150, "TECHNOLOGY"),
             (153, 157, "TECHNOLOGY"),
         ]})
]


temp_list = []
for text, annotations in TRAIN_DATA:
    temp_text = text.lower()
    temp_tuple = (temp_text, annotations)
    temp_list.append(temp_tuple)

# TRAIN_DATA = TRAIN_DATA + temp_list
TRAIN_DATA = temp_list

for text, annotations in TRAIN_DATA:
    for ent in annotations.get("entities"):
        ner.add_label(ent[2])
        
pipe_exceptions = ['ner', 'trf_wordpiecer', 'trf_tok2vec']
unaffected_pipes = [pipe for pipe in nlp.pipe_names if pipe not in pipe_exceptions]

# optimizer = nlp.begin_training()
optimizer = nlp.initialize()

with nlp.disable_pipes(*unaffected_pipes), warnings.catch_warnings():
    warnings.filterwarnings('once', category=UserWarning, module='spacy')
    for iteration in range(50):
        random.shuffle(TRAIN_DATA)
        losses = {}
        
        for text, annotations in TRAIN_DATA:
            example = Example.from_dict(nlp.make_doc(text), annotations)
            nlp.update(
                [example],
                drop = 0.5,
                sgd = optimizer,
                losses = losses
            )
        print(losses)

def output_sample_csv(nlp):
    with open('backend/data_science/csv/model_sample.csv', 'w+') as csv_file:
        # (NLP_jobs_collection.find_one({}))['responsibilities']
        writer = csv.writer(csv_file)
        writer.writerow(['jobID', 'skills', 'keywords'])
        for i in range(0, 100):
            mongo_x = NLP_jobs_collection.aggregate([
                    { "$sample": { "size": 1 } }
                ])
            
            x = list(mongo_x)[0]
            
            keywords_nlp = nlp(x['skills'])
            keywords = ""
            for ent in keywords_nlp.ents:
                if(ent.label_ == 'TECHNOLOGY'):
                    keywords = keywords + ', ' + str(ent.text)
            
            writer.writerow([x['jobID'], x['skills'], keywords])

output_directory = 'backend/data_science/NLP/models'
nlp.to_disk(output_directory)