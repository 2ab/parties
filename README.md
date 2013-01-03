# Meteor Parties Example Step by Step

## Step 1 parties.html and client/parties.css -- UI for our app
## Step 2 model.js -- Model for store data (RSVPs and Parties)
## Step 3 server/server.js and client/client.js -- Publish / Subcribe
  * `meteor add d3` because client.js use d3.v2 for plotting
  * `meteor remove autopublish` because we want to manual publish "directory"
  
  from now on do git add + commit by change git alias http://stackoverflow.com/questions/8956522/git-commit-auto-add-new-folders-or-files
  `git config --global alias.commitx '!git add . && git commit -a -m'`