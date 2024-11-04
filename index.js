const axios = require('axios');
const prompt = require('prompt-sync')();
const chalk = require('chalk');
const wikipediaTickers = require("./wikipediaTickers.json");

/*
axios.get(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageviews&titles=American_Airlines_Group`).then(result => {
    console.log("reached")
    console.log(result.data)
}).catch(err => {
    console.error(err)
})
    */

async function wikipedia(ticker) {
    if(wikipediaTickers[ticker.toUpperCase()] == undefined || wikipediaTickers[ticker.toUpperCase()] == "") {
        return false;
    } else {
        const response = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageviews&titles=${wikipediaTickers[ticker.toUpperCase()]}`)
        return response.data.query.pages[Object.keys(response.data.query.pages)[0]].pageviews;
    }
}

function processDateString(originalDateString) {
    let dateString = ""
    if(originalDateString.split("-").length != 3) {
        const date = new Date();
        if(parseInt(originalDateString.split("-")[0])-1 > date.getMonth()) {
            dateString += String(date.getFullYear() - 1) + "-";
        } else {
            dateString += String(date.getFullYear()) + "-";
        }
        if(originalDateString.split("-")[0].length == 1) {
            dateString += "0" + originalDateString.split("-")[0] + "-";
        } else {
            dateString += originalDateString.split("-")[0] + "-";
        }
        if(originalDateString.split("-")[1].length == 1) {
            dateString += "0" + originalDateString.split("-")[1];
        } else {
            dateString += originalDateString.split("-")[1];
        }
    } else {
        dateString = originalDateString;
    }
    return dateString;
}

async function main() {
    const input = prompt("Enter command: ").trim();

    switch(input.split(" ")[0]) {
        case "help":
            console.log(`\n${chalk.bold.red("Sentilyze Commands")}\n`);
            //general commands
            console.log(`${chalk.bold("☆")}${chalk.green.bold(" help")} - List the available commands for Sentilyze`);
            console.log("------------------------------");
            //wikipedia commands
            console.log(`${chalk.bold("☆")}${chalk.green.bold(" wiki viewdate [ticker] [YYYY-MM-DD]")} - Get the corporate Wikipedia page views for a particular ticker on a particular date (date can be shorthanded to mm-dd or even m-d)`);
            console.log(`${chalk.bold("☆")}${chalk.green.bold(" wiki viewchange [ticker] [YYYY-MM-DD] [YYYY-MM-DD]")} - Get the change in corporate Wikipedia page views for a particular ticker between two dates (date can be shorthanded to mm-dd or even m-d)`);
            console.log(`${chalk.bold("☆")}${chalk.green.bold(" wiki maxviews [ticker]")} - Get the max views of a corporate Wikipedia page for a particular ticker (only checks last 60 days)`);
            console.log("");
            break;
        case "wiki":
            let response;
            switch(input.split(" ")[1]) {
                //return wikipedia page views for a specific date
                case "viewdate":
                    response = await wikipedia(input.split(" ")[2]);
                    if(!response) {
                        console.log(chalk.red.bold("Invalid ticker entered, please try again!"));
                    } else {
                        if(!response[processDateString(input.split(" ")[3])]) {
                            console.log(chalk.red.bold("Invalid date entered (must be last 60 days), please try again!"));
                        } else {
                            console.log(`Page views for ticker ${chalk.bold(input.split(" ")[2])} on date ${chalk.bold(processDateString(input.split(" ")[3]))}: ${chalk.bold.magenta(response[processDateString(input.split(" ")[3])])}`);
                        }
                    }
                    break;
                //return change in wikipedia page views between two dates
                case "viewchange":
                    response = await wikipedia(input.split(" ")[2]);
                    if(!response) {
                        console.log(chalk.red.bold("Invalid ticker entered, please try again!"));
                    } else {
                        if(!response[processDateString(input.split(" ")[3])] || !response[processDateString(input.split(" ")[4])]) {
                            console.log(chalk.red.bold("Invalid date window entered, please check either one of your dates or both of them (must be last 60 days)"));
                        } else {
                            console.log(`Change in page views for ticker ${chalk.bold(input.split(" ")[2])} between date ${chalk.bold(processDateString(input.split(" ")[3]))} and date ${chalk.bold(processDateString(input.split(" ")[4]))}: ${chalk.bold.magenta(Math.floor(response[processDateString(input.split(" ")[4])]/response[processDateString(input.split(" ")[3])]*10000-10000)/100 + "%")}`);
                        }
                    }
                    break;
                case "maxviews":
                    response = await wikipedia(input.split(" ")[2]);
                    if(!response) {
                        console.log(chalk.red.bold("Invalid ticker entered, please try again!"));
                    } else {
                        let maxViews = 0;
                        let maxViewsString = "";
                        Object.keys(response).forEach(date => {
                            if(response[date] > maxViews) {
                                maxViews = response[date];
                                maxViewsString = processDateString(date);
                            }
                        });
                        console.log(`Max page views in past 60 days for ticker ${chalk.bold(input.split(" ")[2])}: ${chalk.bold.magenta(maxViews)} on date ${chalk.bold.magenta(maxViewsString)}`);
                    }
                    break;
                default:
                    console.log(chalk.red.bold(`Invalid Wikipedia command entered, please try again or type ${chalk.underline("help")} for a list of valid commands`));
            }
    }
    console.log("");
    main();
}

main();