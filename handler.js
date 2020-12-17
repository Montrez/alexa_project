'use strict';
const AWS = require('aws-sdk');
const Alexa = require("alexa-sdk");
const lambda = new AWS.Lambda();
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');
exports.handler = function(event, context, callback) {
    const alexa = Alexa.handler(event, context);
    alexa.appId = "amzn1.ask.skill.b5221e79-611e-444e-b29c-e8033e52619f";
    alexa.registerHandlers(handlers);
    alexa.execute();
};
const handlers = {
    'LaunchRequest': function() {
        this.emit('Prompt');
    },
    'Unhandled': function() {
        this.emit('AMAZON.HelpIntent');
    },
    'AddExpense': function() {
        var amount = this.event.request.intent.slots.Amount.value;
        var category = this.event.request.intent.slots.Category.value;
        var timestamp = new Date().getTime();
        var userId = this.event.context.System.user.userId;
        if ((typeof(amount) != "undefined") || (typeof(category) != "undefined")) {
            console.log("\n\nLoading handler\n\n");
            const dynamodbParams = {
                TableName: process.env.DYNAMODB_TABLE_EXPENSES,
                Item: {
                    id: uuid.v4(),
                    userId: userId,
                    amount: amount,
                    category: category,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                },
            };
            const params = {
                TableName: process.env.DYNAMODB_TABLE_EXPENSES,
                FilterExpression: 'category = :this_category',
                ExpressionAttributeValues: {
                    ':this_category': category
                }
            };
            console.log('Attempting to get expense', params);
            dynamoDb.scan(params).promise()
                .then(data => {
                    console.log('Got expense: ' + JSON.stringify(data), params);
                    const self = this;
                    const item = data.Items[0];
                    if (!item) {
                        dynamoDb.put(dynamodbParams).promise()
                            .then(data => {
                                console.log('Expense added: ', dynamodbParams);
                                this.emit(':ask', 'Added $' + amount + ' for ' + category + '. You can check an expense, delete an expense or update one. You choose.');
                            })
                            .catch(err => {
                                console.error(err);
                                this.emit(':tell', 'Hey, hey, hey, we have a problem.');
                            });
                    } else {
                        this.emit(':ask', 'An expense already exists for ' + category + ' .Perhaps you would like to update the expense?')
                    }
                })
        }
    },
    'GetExpense': function() {
        var category = this.event.request.intent.slots.Category.value;
        if ((typeof(category) != "undefined")) {
            console.log("\n\nLoading handler\n\n");
            const params = {
                TableName: process.env.DYNAMODB_TABLE_EXPENSES,
                FilterExpression: 'category = :this_category',
                ExpressionAttributeValues: {
                    ':this_category': category
                }
            };
            console.log('Attempting to get expense', params);
            const self = this;
            dynamoDb.scan(params, function(err, data) {
                const item = data.Items[0];
                if (!item) {
                    self.emit(':ask', 'Sorry, We cant find that expense. Try again with another expense or add a new one.');
                }
                if (item) {
                    console.log("DEBUG:  Getitem worked. ");
                    self.emit(':ask', 'You put down $' + data.Items[0].amount + ' for ' + data.Items[0].category + '. Is there anything else I can help with?');
                }
            });
        } else {
            this.emit('NoMatch')
        }
    },
    'DeleteExpense': function() {
        var category = this.event.request.intent.slots.Category.value;
        const {
            userId
        } = this.event.session.user;
        console.log(userId)
        console.log(category)
        if ((typeof(category) != "undefined")) {
            console.log("\n\nLoading handler\n\n");
            const params = {
                TableName: process.env.DYNAMODB_TABLE_EXPENSES,
                FilterExpression: 'category = :this_category',
                ExpressionAttributeValues: {
                    ':this_category': category
                }
            };
            console.log('Attempting to get expense', params);
            dynamoDb.scan(params).promise()
                .then(data => {
                    console.log('Got expense: ' + JSON.stringify(data), params);
                    const self = this;
                    const item = data.Items[0];
                    if (!item) {
                        self.emit(':ask', 'Sorry, We cant delete that expense because it does not exist. Try again with another expense or add a new one.');
                    }
                    if (item) {
                        console.log('Attempting to delete data', data);
                        const newparams = {
                            TableName: process.env.DYNAMODB_TABLE_EXPENSES,
                            Key: {
                                id: data.Items[0].id,
                                createdAt: data.Items[0].createdAt
                            }
                        };
                        console.log(newparams)
                        dynamoDb.delete(newparams, function(err, data) {
                            if (err) {
                                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                                self.emit(':tell', 'Oopsy daisy, something went wrong.');
                            } else {
                                console.log("DEBUG:  deleteItem worked. ");
                                self.emit(':ask', 'So, i have deleted the expense with category ' + category + ' . Wanna do anything else?');
                            }
                        });
                    }
                })
        }
    },
    'ScheduleAppointment': function(){
        var note = this.event.request.intent.slots.note.value;
        var timestamp = new Date().getTime();
        var userId = this.event.context.System.device.deviceId;
        if ((typeof(note) != "undefined")) {
            console.log("\n\nLoading handler\n\n");
            const dynamodbParams = {
                TableName: process.env.DYNAMODB_TABLE_EXPENSES,
                Item: {
                    id: uuid.v4(),
                    userId: userId,
                    note: note,
                    startDate: timestamp,
                    endDate: timestamp,
                    createdAt: timestamp,
                },
            };
            const params = {
                TableName: process.env.DYNAMODB_TABLE_EXPENSES,
                FilterExpression: 'note = :this_note',
                ExpressionAttributeValues: {
                    ':this_note': note
                }
            };
            console.log('Attempting to get expense', params);
            dynamoDb.scan(params).promise()
                .then(data => {
                    console.log('Got appoitment: ' + JSON.stringify(data), params);
                    const self = this;
                    const item = data.Items[0];
                    if (!item) {
                        dynamoDb.put(dynamodbParams).promise()
                            .then(data => {
                                console.log('Scheduled Appointment for: ', dynamodbParams);
                                this.emit(':ask', 'Created appointment  for ' + note + '. You can check an appointment, delete an appointment or update one. You choose.');
                            })
                            .catch(err => {
                                console.error(err);
                                this.emit(':tell', 'Hey, hey, hey, we have a problem.');
                            });
                    } else {
                        this.emit(':ask', 'An appointment already exists for ' + note + ' .Perhaps you would like to update the appointment?')
                    }
                })
        }
    },
    'UpdateExpense': function() {
        var category = this.event.request.intent.slots.Category.value;
        var amount = this.event.request.intent.slots.Amount.value;
        console.log(category)
        console.log(amount)
        if ((typeof(category) != "undefined") || (typeof(amount) != "undefined")) {
            console.log("\n\nLoading handler\n\n");
            const params = {
                TableName: process.env.DYNAMODB_TABLE_EXPENSES,
                FilterExpression: 'category = :this_category',
                ExpressionAttributeValues: {
                    ':this_category': category
                }
            };
            console.log('Attempting to get expense', params);
            dynamoDb.scan(params).promise()
                .then(data => {
                    console.log('Got expense: ' + JSON.stringify(data), params);
                    const self = this;
                    let newamount;
                    const item = data.Items[0];
                    if (!item) {
                        self.emit(':ask', 'Sorry, we cant update that expense because it does not exist. Try again with another expense or add a new one.');
                    }
                    if (item) {
                        console.log('Attempting to update data', data);
                        newamount = parseInt(amount, 10) + parseInt(data.Items[0].amount, 10)
                        console.log(newamount)
                        const newparams = {
                            TableName: process.env.DYNAMODB_TABLE_EXPENSES,
                            Key: {
                                id: data.Items[0].id,
                                createdAt: data.Items[0].createdAt
                            },
                            UpdateExpression: "set amount = :newamount",
                            ExpressionAttributeValues: {
                                ":newamount": newamount,
                            },
                            ReturnValues: "UPDATED_NEW"
                        };
                        console.log(newparams)
                        dynamoDb.update(newparams, function(err, data) {
                            if (err) {
                                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                                self.emit(':tell', 'Oopsy daisy, something went wrong.');
                            } else {
                                console.log("DEBUG:  updateItem worked. ");
                                self.emit(':ask', 'Expense for category ' + category + ' has been updated to $' + newamount + ' . Wanna do anything else?');
                            }
                        });
                    }
                })
        }
    },
    'AMAZON.YesIntent': function() {
        this.emit('Prompt');
    },
    'AMAZON.NoIntent': function() {
        this.emit('AMAZON.StopIntent');
    },
    'Prompt': function() {
        this.emit(':ask', 'Hey there and Welcome to Attorney Go. I can do a couple of things: Add an appointment, delete an appointment, get an appointment and update an appointment. Let me know how I can help', 'Please say that again?');
    },
    'PromptGet': function() {
        this.emit(':ask', 'Please tell me what appointment you would like to check', 'Please say that again?');
    },
    'NoMatch': function() {
        this.emit(':ask', 'Sorry, I couldn\'t understand.', 'Please say that again?');
    },
    'AMAZON.HelpIntent': function() {
        const speechOutput = 'You need to mention expense amount and a category';
        const reprompt = 'Say hello, to hear me speak.';
        this.response.speak(speechOutput).listen(reprompt);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function() {
        this.response.speak('Goodbye!');
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function() {
        this.response.speak('See you later!');
        this.emit(':responseReady');
    }
};