# Personal OutKick RSS feed

This project creates a normal RSS 2.0 feed from the public OutKick page on Fox News. It is intended for personal use in Feedly.

The workflow refreshes the feed approximately every two hours. GitHub Actions schedules can occasionally run late.

## Feed URL

After GitHub Pages is enabled, subscribe in Feedly with:

`https://ericstogsdill.github.io/outkick-personal-rss/rss.xml`

## Notes

- The feed includes headline links only; Feedly opens the original Fox News article.
- If Fox News changes the page structure, the workflow will fail rather than publish an empty feed. Check the Actions tab and update `scripts/generate-rss.mjs` if needed.
