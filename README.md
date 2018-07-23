# Gitlab Issue Creator

### NOTE
If you are seeing failures, use the -r command to retry the failed lines. For more info look at the "Use" section below.

---

## TLDR
A small node command line application for creating issues on GitLab from a CSV file.

To process a CSV
```sh
node issues.js -c "data.csv"
```

---

## Long winded documentation

### Why?

I recently needed a faster way to create issues on Gitlab. Doing them one by one when you have over a hundered to create is painful to say the least. I found a node package that communicates with the API and built this small program on it. 

### Getting Started

These instructions will get you a copy of the project up and running on your local machine.

#### Prerequisites

You are going to need Node/NPM installed. The easiest way to do so is to download the installer.
[Get NodeJS](https://nodejs.org/en/)

To confirm the install use these commands:

```sh
node -v
```
and
```sh
npm -v
```
If they both print a version number you are good to go.

#### Installing

Once Node is installed, get a copy of the of this repo. You can clone it or download it. Once you have a local copy, enter it's containing directory and install the required packages using NPM's install command

```sh
npm install
```
This will get you all ready to go!

#### Configuration

Now that you are all installed lets configure the issues.js file to use your project. You will need a couple of things from your Gitlab account.

##### Getting Your Gitlab Private Token

Create a Personal Access Token in the "User Settings/Access Tokens" menu on Gitlab and set the scope to API.

##### Getting Your Gitlab Project ID

This can be found at "Project Settings/General" and Expand the "General Project Settings" section.
**You Must be either an Owner or Master to get the ID**

##### Getting Your Gitlab User IDs

When creating the CSV, it is easier to use nicknames for the assignees. To accomodate this, I define an object with the nicknames and their associated user IDs. 
To get the your user IDs, log in to gitlab and use the following URL replacing "YOUR_USER_NAME" with the the username of the person you need an ID for
https://gitlab.com/api/v4/users?username=YOUR_USER_NAME

### Use

The issue creator comes with three built in commands ```sh -n ```, ```sh -c ```, and ```sh -r ```. Lets look at these individually.

#### -n

This command is used to create a single issue. 
```sh
node issues.js -n [title] [description] [assignee] [milestone] [labels(comma separated)]
```
Here is an example for one of my issues
```sh
node issues.js -n Zombies "Create the zombies with 5 variations" Chris Alpha Graphics,Assets
```

#### -c

This command is used to create a bunch issues from a CSV file. 
```sh
node issues.js -c [file]
```
There is an example CSV in the CSV folder to help keep the CSV in the required format. Simply edit it and run
```sh
node issues.js -c csv/data.csv
```

**Note on Newlines:**
Carriage returns and linefeeds cannot be processed by the a-csv library. To work around this, you can substitute newlines for 0x0A in the description field. 0x0A will be replaced with newlines in your issue description.

#### -r

This command will retry any failures from the CSV import.
```sh
node issues.js -r
```

As the CSV import command runs, there seems to always be failures. I am not 100% sure why but I added this command to help with that. As the importer runs, any failures are put into a new csv called retry.csv. All this command does it load that file and run it back trhough. I have had to run this command 3 times on really big lists. This could be easily automated so it automatically loads the file but I decided that since that would require more validation the csv to be sure that the errors were not caused there, I would just make it a separate command for now.

### Built With

* [node-gitlab](https://www.npmjs.com/package/node-gitlab) by [fengmk2](https://www.npmjs.com/~fengmk2)
* [json2csv](https://www.npmjs.com/package/json2csv) by [knownasilya](https://www.npmjs.com/~knownasilya)
* [csv-to-array](https://www.npmjs.com/package/csv-to-array) by [ionicabizau](https://www.npmjs.com/~ionicabizau)


---
Thanks for checking it out!
