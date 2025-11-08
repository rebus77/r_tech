const puppeteer = require('puppeteer');
const { Feed } = require('feed');
const fs = require('fs');
const dayjs = require('dayjs');

const URL = 'https://www.reuters.com/technology/';

(async () => {
  try {
    // Launch headless browser
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    // Go to Reuters Technology page
    console.log("Loading Reuters Technology page...");
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Extract articles
    console.log("Extracting articles...");
    const articles = await page.$$eval('article', (nodes) =>
      nodes.slice(0, 15).map((node) => {
        const title = node.querySelector('h2, h3, h4')?.innerText?.trim() || '';
        const link = node.querySelector('a')?.href || '';
        const description = node.querySelector('p')?.innerText?.trim() || 'No description available.';
        const pubDate = node.querySelector('time')?.getAttribute('datetime') || new Date().toISOString();
        return { title, link, description, pubDate };
      })
    );

    // Close browser after scraping
    await browser.close();

    if (articles.length === 0) {
      console.error('⚠️ No articles found.');
      process.exit(1);
    }

    // Create the RSS feed
    const feed = new Feed({
      title: 'Reuters Technology RSS',
      description: 'Live Reuters Technology updates via Puppeteer scraper',
      link: URL,
      language: 'en',
      favicon: 'https://www.reuters.com/pf/resources/images/reuters/favicon/favicon.ico',
      updated: new Date(),
      feedLinks: {
        rss: 'https://rebus77.github.io/r_tech/feed.xml',
      },
    });

    // Add articles to the RSS feed
    articles.forEach((article) => {
      feed.addItem({
        title: article.title,
        id: article.link,
        link: article.link,
        description: article.description,
        date: dayjs(article.pubDate).toDate(),
      });
    });

    // Save the RSS feed to feed.xml
    fs.writeFileSync('feed.xml', feed.rss2());
    console.log(`✅ RSS feed generated successfully with ${articles.length} articles.`);
  } catch (error) {
    console.error('❌ Error generating RSS feed:', error);
    process.exit(1);
  }
})();
