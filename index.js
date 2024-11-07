#!/usr/bin/env node
const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const wikipediaTickers = require("./wikipediaTickers.json");

let validTickerCount = 0;
Object.keys(wikipediaTickers).forEach(ticker => {
    if(wikipediaTickers[ticker] != "") {
        validTickerCount++;
    }
})

//process all the cli flags
let flags = {}
process.argv.forEach((arg, i) => {
    if(arg.startsWith("-")) {
        if (i+1<process.argv.length) {
            flags[arg.replace("-", "")] = process.argv[i+1];
        } else {
            flags[arg.replace("-", "")] = "";
        }
    }
})


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
    let response;
    switch(process.argv[2]) {
        //get help for sentilyze
        case "help":
            console.log(`${chalk.bold.red("\nSentilyze Commands (for more specifics view documentation)")}\n`);
            //console.log(`${chalk.bold("☆")}${chalk.green.bold(" help")} - List the available commands for Sentilyze`);
            //console.log("------------------------------");
            console.log(`${chalk.bold("☆")}${chalk.green.bold(" wiki viewdate")} - Get the corporate Wikipedia page views for a particular ticker on a particular date`);
            console.log(`${chalk.bold("☆")}${chalk.green.bold(" wiki weekend-gainers")} - Fetches the top page view gainers for the past week from Friday to Sunday inclusive`);
            console.log(""); process.exit();
            break;
        //get views for a ticker for a particular date
        case "dateviews":
            if(!flags["t"]) {
                console.log(chalk.red.bold("No ticker entered, please use the -t flag to provide a ticker"));
            } else {
                response = await wikipedia(flags["t"]);
                if (!response) {
                    console.log(chalk.red.bold("Invalid ticker entered, please try again"));
                } else {
                    if(!flags["d"]) {
                        console.log(chalk.red.bold("No date entered, please use the -d flag to provide a date"));
                    } else {
                        if(!response[processDateString(flags["d"])]) {
                            console.log(chalk.red.bold("Invalid date entered (must be within the last 60 days), please try again"));
                        } else {
                            console.log(`Page views for ticker ${chalk.bold(flags["t"].toUpperCase())} on date ${chalk.bold(processDateString(flags["d"]))}: ${chalk.bold.magenta(response[processDateString(flags["d"])])}`);
                        }
                    }
                }
            }
            console.log(""); process.exit();
            break;
        
        case "maxviews":
            if(!flags["t"]) {
                console.log(chalk.red.bold("\nNo ticker provided, please use the -t flag to provide a ticker\n")); process.exit();
            } else {
                response = await wikipedia(flags["t"]);
                if(!response) {
                    console.log(chalk.red.bold("Invalid ticker provided, please provide a different ticker\n")); process.exit();
                } else {
                    let maxViews = 0;
                    let maxViewsDate = "";
                    let index = 0;
                    for(const date of Object.keys(response).reverse()) {
                        if(flags["q"]) {
                            if(index < parseInt(flags["q"])) {
                                if(response[date] > maxViews) {
                                    maxViews = response[date];
                                    maxViewsDate = date;
                                }
                            }
                            index++;
                        } else {
                            if(response[date] > maxViews) {
                                maxViews = response[date];
                                maxViewsDate = date;
                            }
                        }
                    }
                    console.log(`Maximum views for ticker ${chalk.bold(flags["t"].toUpperCase())} in the last ${chalk.bold(flags["q"] ? flags["q"] : 60)} days: ${chalk.bold.magenta(maxViews)} on ${chalk.bold.magenta(maxViewsDate)}\n`); process.exit();
                }
            }
            break;
        
        case "minviews":
            if(!flags["t"]) {
                console.log(chalk.red.bold("\nNo ticker provided, please use the -t flag to provide a ticker\n")); process.exit();
            } else {
                response = await wikipedia(flags["t"]);
                if(!response) {
                    console.log(chalk.red.bold("Invalid ticker provided, please provide a different ticker\n")); process.exit();
                } else {
                    let minViews = response[Object.keys(response).reverse()[0]];
                    let minViewsDate = "";
                    let index = 0;
                    for(const date of Object.keys(response).reverse()) {
                        if(flags["q"]) {
                            if(index < parseInt(flags["q"])) {
                                if(response[date] < minViews) {
                                    minViews = response[date];
                                    minViewsDate = date;
                                }
                            }
                            index++;
                        } else {
                            if(response[date] < minViews) {
                                minViews = response[date];
                                minViewsDate = date;
                            }
                        }
                    }
                    console.log(`Minimum views for ticker ${chalk.bold(flags["t"].toUpperCase())} in the last ${chalk.bold(flags["q"] ? flags["q"] : 60)} days: ${chalk.bold.magenta(minViews)} on ${chalk.bold.magenta(minViewsDate)}\n`); process.exit();
                }
            }
            break;

        //gets top n weekend gainers
        case "weekend-gainers":
            if(fs.readdirSync("local").length == 0) {
                console.log(chalk.red.bold("You haven't localized ticker data, to do so please type \"wiki localize\" in the terminal"));
            } else {
                const stocks = [];
                for(const tickerFile of fs.readdirSync("local")) {
                    const tickerData = JSON.parse(fs.readFileSync(`./local/${tickerFile}`, 'utf8'));
                    let index = 0;
                    for (const date of Object.keys(tickerData).reverse()) {
                        const d = new Date(date);
                        if (d.getUTCDay() == 0) {
                            const change = Math.floor(tickerData[Object.keys(tickerData).reverse()[index]] / tickerData[Object.keys(tickerData).reverse()[index + 2]]*10000-10000) / 100;
                            if(flags["t"]) {
                                if(parseInt(flags["t"]) <= tickerData[Object.keys(tickerData).reverse()[index + 1]]) {
                                    stocks.push({ticker: tickerFile.replace(".json", ""), gain: change});
                                }
                            } else {
                                stocks.push({ticker: tickerFile.replace(".json", ""), gain: change});
                            }
                            break;
                        }
                        index++;
                    }
                }
                stocks.sort((a, b) => b.gain - a.gain);
                let topGainers;
                if(flags["q"]) {
                    topGainers = stocks.slice(0, parseInt(flags["q"]));
                } else {
                    topGainers = stocks.slice(0, 10);
                }
                console.log(chalk.bold.bgMagenta(`\nTop Weekend Gainers (first ${flags["q"] ? flags["q"] : 10} entries)\n`));
                let countIndex = 1;
                for(const stock of topGainers) {
                    console.log(`${chalk.bold(countIndex)}. ${chalk.bold.magenta(stock.ticker)}: ${chalk.bold(stock.gain)}% gain`);
                    countIndex++;
                }
                console.log(""); process.exit();
            }
            break;

        //localize all ticker data
        case "localize":
            let count = 1;
            for(const ticker of Object.keys(wikipediaTickers)) {
                if (wikipediaTickers[ticker] != "") {
                    const result = await wikipedia(ticker);
                    fs.writeFileSync(`./local/${ticker}.json`, JSON.stringify(result, null, 2));
                    readline.clearLine(process.stdout, 0);
                    readline.cursorTo(process.stdout, 0);
                    process.stdout.write(chalk.bold.green(`Localized ticker data for ticker ${count}/${validTickerCount}`));  
                    count++;
                }
            }
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
            console.log(chalk.bold.bgGreen("All Wikipedia data has been localized!"));
            console.log(""); process.exit();
            break;
        default:
            console.log(chalk.bgRed.bold("Invalid command used, please type \"help\" for a list of accepted commands"));
            /*
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
                case "minviews":
                    //
                    break;
                //locallize all the file data
                case "localize":
                    let count = 1;
                    for(const ticker of Object.keys(wikipediaTickers)) {
                        if (wikipediaTickers[ticker] != "") {
                            const result = await wikipedia(ticker);
                            fs.writeFileSync(`./local/${ticker}.json`, JSON.stringify(result, null, 2));
                            readline.clearLine(process.stdout, 0);
                            readline.cursorTo(process.stdout, 0);
                            process.stdout.write(chalk.bold.green(`Localized ticker data for ticker ${count}/${validTickerCount}`));  
                            count++;
                        }
                    }
                    readline.clearLine(process.stdout, 0);
                    readline.cursorTo(process.stdout, 0);
                    console.log(chalk.bold.bgGreen("All Wikipedia data has been localized!"))
                    break;
                //get biggest recent change
                case "largestrecentchange":
                    let maxChange = 0;
                    let maxChangeTicker = "";
                    if(fs.readdirSync("local").length == 0) {
                        console.log(chalk.red.bold("Ticker data has not been localized, please type \"wiki localize\""));
                    } else {
                        fs.readdirSync("local").forEach(tickerFile => {
                            const results = JSON.parse(fs.readFileSync(`./local/${tickerFile}`));
                            const change = Math.floor(results[Object.keys(results)[Object.keys(results).length-1]] / results[Object.keys(results)[Object.keys(results).length-2]] * 10000 - 10000) / 100;
                            if(change > maxChange && results[Object.keys(results)[Object.keys(results).length-1]] > 100) {
                                //console.log(results[Object.keys(results)[Object.keys(results).length-1]], tickerFile.replace(".json", ""))
                                maxChange = change;
                                maxChangeTicker = tickerFile.replace(".json", "")
                            }
                        });
                        console.log(maxChange, maxChangeTicker);
                    }
                    break;
                default:
                    console.log(chalk.red.bold(`Invalid Wikipedia command entered, please try again or type ${chalk.underline("help")} for a list of valid commands`));
            }
        */
    }
}


main();
console.log("");
//process.exit();