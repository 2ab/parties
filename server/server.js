Meteor.publish("directory", function(){
  return Meteor.users.find({}, {field: {_id: 1, emails: 1}});
});