import tensorflow as tf
import numpy as np
import pymongo
import json
#import dnspython

from pymongo import MongoClient
from bson.objectid import ObjectId

username = "nicole"
password = "nicole-daddy"
db = "user"
collection = "users"

def connect_mongo(username, password, db, collection):
    #TODO: make sure parameters are valid
    conn = pymongo.MongoClient(r"mongodb+srv://" + username + ":" + password +
    "@2018-calhacks-jkqiz.gcp.mongodb.net/test?retryWrites=true")
    database = conn[db]
    col = database[collection]
    print("hello world")
    test = col.find_one()
    #\test = col.find_one({'_id': ObjectId("5bde9dcf9d414b2dd85f463b")})
    #post = posts.find_one({"_id": "5bde9dcf9d414b2dd85f463b"})
    #print(database.collection_names)
    print(test)

#connect_mongo(username, password, db, collection)

def build_model(train_data, train_labels, test_data, test_labels):
    #shuffle the training set
    order = np.argsort(np.random.random(train_labels.shape))
    train_data = train_data[order]
    train_labels = train_labels[order]

    #normalize data
    mean = train_data.mean(axis = 0)
    std = train_data.std(axis = 0)
    train_data = (train_data - mean) / std
    test_data = (test_data - mean) / test_data

    #create create_model
    model = keras.Sequential([
    keras.layers.Dense(64, activation=tf.nn.relu,
                       input_shape=(train_data.shape[1],)),
    keras.layers.Dense(64, activation=tf.nn.relu),
    keras.layers.Dense(1)
    ])

    optimizer = tf.train.RMSPropOptimizer(0.001)

    model.compile(loss='mse', optimizer=optimizer, metrics=['mae'])
    return model
