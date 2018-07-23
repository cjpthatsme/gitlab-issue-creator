// Simple Configuration options
var options = {
  // Create a Personal Access Token in the "User Settings/Access Tokens"
  // menu on Gitlab and set the scope to API.
  privateToken: 'YourPrivateToken',

  // THe project ID for the issues
  // This can be found at "Project Settings/General"
  // and Expand the "General Project Settings" section
  projectId: 12345678,

  // The API throws a 500 error when the calls come too fast.
  // This is a quick and dirty way to delay them by a .5 seconds for each post request.
  timeoutValue: 500,

  // When creating the CSV, it is easier to use nicknames for the assignees.
  // To accomodate this, I now define an object with the nicknames and their
  // associate user IDs. To get the your user ids, log in to gitlab and use the following link
  // https://gitlab.com/api/v4/users?username=YOUR_USER_NAME
  assigneeNicknames: {
    Chris: 1234567,
    Taylor: 1234567,
    Andy: 1234567,
    Rick: 1234567
  },
  args: process.argv
}

var gitlab = require('node-gitlab');
var json2csv = require('json2csv');
var fs = require('fs');

var client = gitlab.create({
  api: 'https://gitlab.com/api/v4',
  privateToken: options.privateToken
});

// A gross global to fix a scope issue... I got lazy
var loop = 0;

// Lets make an array to hold all failures for a retry
var failures = [];

// In this switch we are detecting the first custom parameter passed from the
// Command Line and doing the corrosponding action
switch (options.args[2]) {
  // Create a single issue
  case "-n":
    var issue = [{
      title: options.args[3],
      description: options.args[4],
      assignee: options.args[5],
      milestone: options.args[6],
      labels: options.args[7]
    }]
    getMilestones(issue);
    break;

    // Create a bunch of issues by passing a CSV
  case "-c":
    var columns = ["title", "description", "assignee", "milestone", "labels"];
    require("csv-to-array")({
      file: options.args[3],
      columns: columns
    }, function(err, array) {
      if (err) {
        console.log("CSV NOT LOADED! \n" + err + "\n for help type: node issues.js help")
      } else {
        array.shift(); // drop the headers
        getMilestones(array);
      }
    });
    break;

  case "-r":
    var columns = ["title", "description", "assignee", "milestone", "labels"];
    require("csv-to-array")({
      file: "retry.csv",
      columns: columns
    }, function(err, array) {
      if (err) {
        console.log("CSV NOT LOADED! \n" + err + "\n for help type: node issues.js help")
      } else {
        array.shift(); // drop the headers
        clearRetryFile(); // Delete the file
        getMilestones(array);
      }
    });
    break;

    // Simple help text
  default:
    console.log('To create a single issue use "-n [title] [description] [assignee] [milestone] [labels(comma separated)]"\n' +
      'To use a CSV to create bulk issues use "-c [file]"\n' +
      'To do another pass on failed posts use "-r"\n\n' +
      'To see how the CSV should be set up, download the example at INSERTLINKHERE')
    break;
}

function clearRetryFile() {
  var file = "retry.csv";
  fs.stat(file, function(err, stats) {
    if (err) {
      return console.error(err);
    }

    fs.unlink(file, function(err) {
      if (err) return console.log(err);
      console.log('Killed the retry file');
    });
  });
}

function createIssue(data) {
  client.issues.create({
    id: options.projectId,
    title: data.title,
    description: data.description,
    assignee_id: data.assignee,
    milestone_id: data.milestoneId,
    labels: data.labels
  }, function(err, success) {
    if (success) {
      console.log("Issue " + data.title + " created!");
    } else {
      console.log(data.title + " NOT CREATED! \n" +
        err + "\n Try upping the timeoutValue in the options object");

      failures.push(data);
      console.log(failures.length + ' failures so far');
      updateRetryFile(data.title);
    }
  });
}

function createIssues(data) {
  var length = data.length;
  // Shift the current issue out
  var temp = data.shift();
  if (length) {
    // If there was still at least one object create the issue.
    setTimeout(function() {
      // The timeout is there to prevent conflicts... Ugly but it works
      createIssue(temp);
    }, options.timeoutValue * loop);
    ++loop;
    // Recursivly call this function with the remaining issues
    createIssues(data);
  } else {}
}

function getMilestones(data) {
  var milestoneIds = {};
  // Get a list of the project's milestones
  client.milestones.list({
    id: options.projectId
  }, function(err, milestones) {
    if (err) {
      console.log(err);
    } else {
      for (var i = 0; i < milestones.length; i++) {
        // Once you have the list, standardize the titles and put it into the object
        milestones[i].title = removeChars(milestones[i].title);
        milestoneIds[milestones[i].title] = milestones[i].id;
      }
      // once we have the object lets send to the sanitize function
      sanitizeData(data, milestoneIds);
    }
  });
}

function removeChars(str) {
  // Replace special characters and spaces with underscores
  var newString = str.replace(/[^A-Z0-9]+/ig, "_");
  // Return the name in all lower case
  return newString.toLowerCase();
}

function sanitizeData(data, mIds) {
  var nicknames = {};
  // First lets prep the nickname object by sanitizing our object from options
  for (var key in options.assigneeNicknames) {
    if (options.assigneeNicknames.hasOwnProperty(key)) {
      var name = removeChars(key);
      nicknames[name] = options.assigneeNicknames[key];
    }
  }

  // Now lets loop through the issues
  for (var i = 0; i < data.length; i++) {
    // Sanitize the issue's assignee
    var issueAssignee = removeChars(data[i].assignee);
    // Now lets replace the issue assignee with the ID
    data[i].assignee = nicknames[issueAssignee];
    // Clean the milestones provided by the CSV
    data[i].milestone = removeChars(data[i].milestone);
    // Assign that milestone's associated ID
    data[i].milestoneId = mIds[data[i].milestone];
  }
  // // Send all the issues to a timed loop.
  createIssues(data);
}

function updateRetryFile(title) {
  var columns = ["title", "description", "assignee", "milestone", "labels"];
  var csv = json2csv({
    data: failures,
    fields: columns
  });
  fs.writeFile('retry.csv', csv, function(err) {
    if (err) throw err;
    console.log(title + " added to retry file");
  });
}
