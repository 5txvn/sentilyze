# Wikilyze
**What is Wikilyze?** - Wikilyze is a program that I created with the intention of being able to leverage social momentum for stock trading. This is primarily done through the usage of the Wikipedia API, which provides page view data for practically any Wikipedia page, which includes corporate Wikipedia pages as well. Wikilyze analyzes the available Wikipedia pages for each stock ticker on the market and allows for in-depth analysis to be performed in order to better enable one to draw conclusions about the movement of a particular stock based on its social momentum.
### Commands
The following is a list of all available commands that are currently on Wikilyze along with their respective flags that can be used:
* **wiki viewdate** - allows one to fetch the number of page views on a corporate Wikipedia page for a given date
    * **-t**: specifies the ticker to find page view information for (ie. -t AAPL)
    * **-d**: specifies the date to grab ticker information for
    * ***Example***: <u>wiki viewdate -t AAPL -d 9-13</u>