Meteor.publish("directory", function(){
  return Meteor.users.find({}, {fields: {"email.address": 1}});
});

Meteor.publish("parties", function (){
  return Parties.find({$or: [{"public": true}, {invited: this.userId}, {owner: this.userId}]});
});