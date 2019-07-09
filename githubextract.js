//Authored by Ven Iyer on 6/22 for VA/COMS/Cognosante
//Usage: $ node githubextract
//Extracts project information from GitHub for the user

//Setting up the environment
var fs = require('fs');
var await = require('await');
const util = require('util');
const jq = require('node-jq');
var fs = require('fs');
const homedir = require('os').homedir(); 
const eol = require('os').EOL; 

//Setting up the program
var configInfo;
var usernameS;
var passwordS;
//Config info is at ~/.gitHubExtract.config
var data = fs.readFileSync(homedir + '/.gitHubExtract.config','utf8')
var fileAsString = data.toString();
configInfo = fileAsString.split("\n");
usernameS=configInfo[0].split("=")[1];
passwordS=configInfo[1].split("=")[1];

const Octokit = require('@octokit/rest')

const octokit = new Octokit({
 auth: {
   username: usernameS,
   password: passwordS,
 }
})

//This function gets list of projects for the user in blocking form
const getProjects = async (usernameS) => {
	try {
	    const result = await octokit.projects.listForUser({
	username: usernameS})
	    if(result.status === 200) {
	        return {
	            status: true, 
	            data: result.data
	        }
	    } else {
	        return {
	            status: false,
	            data: data
	        }
	    }
	} catch (error) {
	    return {
	        status: false,
	        data: data
	    }
	}  
}

//This function gets all the columns in a project
const getColumnsInProject = async (projectID) => {
	try {
	    const result = await octokit.projects.listColumns({
	project_id: projectID})
	    if(result.status === 200) {
	        return {
	            status: true, 
	            data: result.data
	        }
	    } else {
	        return {
	            status: false,
	            data: data
	        }
	    }
	} catch (error) {
	    return {
	        status: false,
	        data: data
	    }
	}  
}

//This function gets all the cards in a column
const getCardsInColumn = async (columnID) => {
	try {
	    const result = await octokit.projects.listCards({
	column_id: columnID})
	    if(result.status === 200) {
	        return {
	            status: true, 
	            data: result.data
	        }
	    } else {
	        return {
	            status: false,
	            data: data
	        }
	    }
	} catch (error) {
	    return {
	        status: false,
	        data: data
	    }
	}  
}

//This function gets all the repos for a user
const getReposForUser = async () => {
	try {
	    const result = await octokit.repos.list()
	    if(result.status === 200) {
	        return {
	            status: true, 
	            data: result.data
	        }
	    } else {
	        return {
	            status: false,
	            data: data
	        }
	    }
	} catch (error) {
	    return {
	        status: false,
	        data: data
	    }
	}  
}

//This function gets all the repos for a user
const getIssuesInRepo = async (owner, repoName) => {
	try {
	    const result = await octokit.issues.listForRepo({owner: usernameS,repo: repoName})
	    if(result.status === 200) {
	    	
	        return {
	            status: true, 
	            data: result.data
	        }
	    } else {
	        return {
	            status: false,
	            data: data
	        }
	    }
	} catch (error) {
	    return {
	        status: false,
	        data: data
	    }
	}  
}

//Main of the program
const start = async function() {
  //First get the projects for the user
  const result = await getProjects(usernameS);
  var listOfProjects = util.inspect(result.data, {depth: null});
  //console.log(listOfProjects);

  //Setup the file with csv file column names
  var writeData = 'Type' + ',' + 'ID' + ',' + 'Name' + ',' + 'columnID' + ',' + 'columnName' + ',' + 'ContentType' + ',' + 'ContentID' + ',' + 'Content'; 	 
  fs.appendFile('myProjects.csv', writeData + eol, function (err) {
					if (err) {
					// append failed
					} else {
					// done
					}
				})

  //Loop through the list of projects retrieved
  for(var i = 0; i < result.data.length; i++) {
  	  //For each project do this
	  var projectName = await jq.run('.['+i+'].name', result.data, { input: 'json' });
	  var projectID = await jq.run('.['+i+'].id', result.data, { input: 'json' });
	  var projectState = await jq.run('.['+i+'].state', result.data, { input: 'json' });
	  
	  //console.log("Found" + projectName + projectID + projectState)

      //Prepare to get columns in a project
	  const getColumnsInProjectResult = await getColumnsInProject(projectID);
	  var listOfColumns = util.inspect(getColumnsInProjectResult.data, {depth: null});
	  //console.log(listOfColumns);

	  for(var j = 0; j < getColumnsInProjectResult.data.length; j++) {
	  	  //For each column do this
		  var columnName = await jq.run('.['+j+'].name', getColumnsInProjectResult.data, { input: 'json' });
		  var columnID = await jq.run('.['+j+'].id', getColumnsInProjectResult.data, { input: 'json' });
		  
		  //console.log("Found" + columnName + columnID)

		   //Prepare to get the cards in the project
		   const getCardsInColumnResult = await getCardsInColumn(columnID);
		   var listOfCards = util.inspect(getCardsInColumnResult.data, {depth: null});
		   //console.log(listOfCards);

		  for(var k = 0; k < getCardsInColumnResult.data.length; k++) {
		  	  //For each card in the column do this
			  var cardName = await jq.run('.['+k+'].note', getCardsInColumnResult.data, { input: 'json' });
			  var cardID = await jq.run('.['+k+'].id', getCardsInColumnResult.data, { input: 'json' });
			  
			  //Write the card data to the csv file
			  writeData = 'Project' + ',' + projectID + ',' + projectName + ',' + columnID + ',' + columnName + ',' + 'Note' + ',' + cardID + ',' + cardName;
		  	  console.log("Writing..." + writeData)
				fs.appendFile('myProjects.csv', writeData + eol, function (err) {
					if (err) {
					// append failed
					} else {
					// done
					}
				})
		  }

	  }
   }

	//Get started on extract of repos and issues
	//First get the projects for the user
	const getReposForUserResult = await getReposForUser();
	var listOfRepos = util.inspect(getReposForUserResult.data, {depth: null});
	//console.log(listOfRepos);
	//Setup the file with csv file column names
	//var writeIssuesData = 'repoID' + ',' + 'repoName' + ',' + 'issueID' + ',' + 'issueTitle' + ',' + 'issueBody';	 
	/*fs.appendFile('myIssues.csv', writeData + eol, function (err) {
					if (err) {
					// append failed
					} else {
					// done
					}
				})*/
	//Loop through the list of repos retrieved

  	for(var i = 0; i < getReposForUserResult.data.length; i++) {
  	  //For each repo do this
	  var repoName = await jq.run('.['+i+'].name', getReposForUserResult.data, { input: 'json' });
	  var repoID = await jq.run('.['+i+'].id', getReposForUserResult.data, { input: 'json' });
	  
	  //console.log("Found" + repoID + repoName.replace(/\"/g,'') )

      //Prepare to get issues in a repo
	  const getIssuesInRepoResult = await getIssuesInRepo(usernameS,repoName.replace(/\"/g,''));
	  var listOfIssues = util.inspect(getIssuesInRepoResult.data, {depth: null});
	  //console.log(listOfIssues);
	  
	  for(var j = 0; j < getIssuesInRepoResult.data.length; j++) {
	  	  //For each issue do this
		  var issueTitle = await jq.run('.['+j+'].title', getIssuesInRepoResult.data, { input: 'json' });
		  var issueBody = await jq.run('.['+j+'].body', getIssuesInRepoResult.data, { input: 'json' });
		  var issueID = await jq.run('.['+j+'].id', getIssuesInRepoResult.data, { input: 'json' });
		  //console.log("Found" + issueTitle + issueBody + issueID)

		  //Write the card data to the csv file
		  writeData = 'Repo'  + ','+ repoID + ',' + repoName + ',' + '' + ',' + issueTitle + ',' + 'Incident' + ',' + issueID + ',' + issueBody;
	  	  console.log("Writing..." + writeData)
			fs.appendFile('myProjects.csv', writeData + eol, function (err) {
				if (err) {
				// append failed
				} else {
				// done
				}
			})
		}
	}
}
//Starting the program here
start();
    