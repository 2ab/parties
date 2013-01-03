/*
  owner: user id
  x,y: Number (screen coordiantes)
  title, description: String
  attending: Number (count)
  public: boolean
  canSee: list of user id's that it's shared with (ignored if public)
*/

Parties = new Meteor.Collection("parties");

Parties.allow({
  insert: function(){},
  update: function(){},
  remove: function(){}
});

Parties.deny({
  remove: function(){}
});

/*
  user
  party
  rsvp: String ("yes", "no", "maybe")
*/

Rsvps = new Meteor.Collection("rsvps");

Meteor.methods({
  createParty:function(){},
  rsvp: function(){}
});