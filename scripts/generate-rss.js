const puppeteer = require('puppeteer');
const RSS = require('rss');
const fs = require('fs-extra');

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.goto('https://www.reuters.com/technology/', { waitUntil: 'domcontentloaded' });

    const articles = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('article'))
        .slice(0, 15) // get latest 15
        .map(a => {
          const titleEl = a.querySelector('h2, h3, h4');
          const linkEl = a.querySelector('a');
          const timeEl = a.querySelector('time');
          return {
            title: titleEl ? titleEl.innerText.trim() : 'No title',
            link: linkEl ? linkEl.href : '',
            pubDate: timeEl ? new Date(timeEl.getAttribute('datetime')).toUTCString() : new Date().toUTCString()
          };
        });
    });

    await browser.close();

    // Create RSS feed
    const feed = new RSS({
      title: 'Reuters Technology RSS',
      description: 'Latest Reuters Technology news',
      feed_url: 'https://rebus77.github.io/r_tech/feed.xml',
      site_url: 'https://rebus77.github.io/r_tech/',
      language: 'en',
      pubDate: new Date(),
    });

    articles.forEach(item => {
      feed.item(item);
    });

    // Write feed to repo
    await fs.outputFile('feed.xml', feed.xml({ indent: true }));

    console.log('RSS feed generated successfully.');
  } catch (err) {
    console.error('Error generating RSS feed:', err);
  }
})();
