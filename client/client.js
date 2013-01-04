Meteor.subscribe("directory");
Meteor.subscribe("parties");

Template.page.showCreateDialog = function(){
  return Session.get("showCreateDialog");
};

Template.page.showInviteDialog = function () {
  return Session.get("showInviteDialog");
};

///////////////////////////////////////////////////////////////////////////////
// Party detials sidebar
///////////////////////////////////////////////////////////////////////////////

Template.details.party = function(){
  return Parties.findOne(Session.get("selected"));
};

Template.details.creatorName = function () {
  var owner = Meteor.users.findOne(this.owner);
  if (! owner)
    return "unknown";
  if (owner._id === Meteor.userId())
    return "me";
  return owner.emails[0].address;
};

// RSVP subdocument looks like {user: userId, rsvp: "yes"}
Template.details.rsvpEmail = function () {
  var user = Meteor.users.findOne(this.user);
  return user.emails[0].address;
};

Template.details.rsvpStatus = function () {
  if (this.rsvp === "yes") return "Going";
  if (this.rsvp === "maybe") return "Maybe";
  return "No";
};



Template.details.outstandingInvitations = function () {
  var party = Parties.findOne(this._id);
  // take out the people that already rsvp'd
  var people = _.difference(party.invited, _.pluck(party.rsvps, 'user'));
  return Meteor.users.find({_id: {$in: people}});
};

Template.details.invitationEmail = function () {
  return this.emails[0].address;
};
Template.details.canInvite = function () {
  return ! this.public && this.owner === Meteor.userId();
};

Template.details.canRemove = function () {
  return this.owner === Meteor.userId() && attending(this) === 0;
};

Template.details.events({
  'click .rsvp_yes': function(){
    Meteor.call("rsvp", Session.get("selected"), "yes");
    return false;
  },
  'click .rsvp_maybe': function(){
    Meteor.call("rsvp", Session.get("selected"), "maybe")
      return false;
  },
  'click .rsvp_no': function(){
    Meteor.call("rsvp", Session.get("selected"), "no")
    return false;
  },
  'click .invite': function () {
    Session.set("showInviteDialog", true);
  },
  'click .remove': function () {
    Parties.remove(this._id)
    return false;
  }
});

//////////////////////////////
// Map Display
/////////////////////////////

function relMouseCoords (element, event) {
  var totalOffsetX = 0;
  var totalOffsetY = 0;
  var canvasX = 0;
  var canvasY = 0;
  var currentElement = element;
  
  do{
    totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
    totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
  }
  while (currentElement = currentElement.offsetParent)
  
  canvasX = event.pageX - totalOffsetX;
  canvasY = event.pageY - totalOffsetY;
  
  return {x: canvasX, y: canvasY}
}

Template.map.events = {
  'mousedown circle, mousedown text': function(event, template){
    Session.set("selected", event.currentTarget.id);
  },
  'dblclick svg': function(event, template){
    // must be logged in
    if (! Meteor.userId())
      return;
    var coords = relMouseCoords(event.currentTarget, event);
    Session.set("createCoords", {
      x: coords.x / 500, 
      y: coords.y / 500});
    Session.set("showCreateDialog", true);
  }
};


Template.map.rendered = function(){
  var self = this;
  self.node = this.find("svg");
  if (! self.handle) {
    self.handle = Meteor.autorun(function(){
      var selected = Session.get('selected');
      var marker = d3.select(self.node).select(".circles").selectAll("circle")
        .data(Parties.find().fetch(),
          function(party) { return party._id });
          
      var labels = d3.select(self.node).select(".labels").selectAll("text")
        .data(Parties.find().fetch(),
          function(party){ return party._id });
    
      marker.enter().append("circle")
        .attr("id", function(party){ return party._id })
        .attr("cx", function(party){ return party.x * 500})
        .attr("cy", function(party){ return party.y * 500})
        .arrt("r", function(party){ return 10 + attending(party) * 10})
        .style("fill", function(party){ return party.public ? "red" : "blue"})
        .style('opacity', function (party) { return selected === party._id ? 1 : 0.4; });
        
      marker.transition()
        .duration(250)
        .attr("cx", function(party){ return party.x * 500 })
        .attr("cy", function(party){ return party.y * 500 })
        .attr("r", function(party){ return 10 + attending(party) *10 })
        .style("fill", function(party){ return party.public ? "red" : "blue"})
        .style('opacity', function () {return selected === party._id ? 1 : 0.4;})
        .ease("cubic-out");
        
      mark.exit().remove();
      
      labels.enter().append("text")
        .attr("id", function(party){ return party._id })
        .attr("x", function(party){ return party.x * 500 })
        .attr("y", function(party){ return party.y * 500 })
        .text(function(party){ return attending(party)});
        
      labels.transition().duration(250)
        .attr("x", function(party){ return party.x * 500 })
        .attr("y", function(party){ return party.y * 500 })
        .text(function(party){ return attending(party)});
        
      labels.exit().remove();
    });
  }
}

Template.map.destroyed = function(){
  this.handle && this.handle.stop();
};

////////////////////////////////////
// Create Party Dialog
///////////////////////////////////

Template.createDialog.events = {
  'click .save': function (event, template) {
    var title = template.find(".title").value;
    var description = template.find(".description").value;
    var public = !template.find(".private").checked;
    if (title.length && description.length) {
      var coords = Session.get("createCoords");
      Meteor.call('createParty', {
        title: title,
        description: description,
        x: coords.x,
        y: coords.y,
        public: public
      }, function (error, party) {
        if (!error)
          Session.set("selected", party);
      });
      Session.set("showCreateDialog", false);
    } else {
      // TODO show validation error
    }
  },
  'click .cancel': function () {
    Session.set("showCreateDialog", false);
  }
};

//////////////////////////////////////
// Invite dialog
///////////////////////////////////////

Template.inviteDialog.events = {
  'click .invite': function (event, template) {
    Meteor.call('invite', Session.get("selected"), this._id);
  },
  'click .close': function (event, template) {
    Session.set("showInviteDialog", false);
  }
};

Template.inviteDialog.uninvited = function () {
  var party = Parties.findOne(Session.get("selected"));
  var invited = _.clone(party.invited);
  invited.push(party.owner);
  return Meteor.users.find({_id: {$nin: invited}});
};

Template.inviteDialog.email = function () {
  return this.emails[0].address;
};












