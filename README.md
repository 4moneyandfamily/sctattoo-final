# San Clemente Tattoo — site rebuild

Static v1 of sanclementetattoo.com.

## Files

| File | Role |
|---|---|
| `index.html` | The site. Zero build. Open it, or drop the folder on Netlify / Vercel. |
| `shop-config.json` | Every shop fact. CONFIRM flags live here. Mirror changes into the `SHOP` object in `index.html` until a build step exists. |
| `AUDIT.md` | Current site + local competition. |
| `HANDOFF.md` | How Greg changes hours, artists, and photos without a developer. |
| `robots.txt` / `sitemap.xml` / `netlify.toml` | Launch extras. |

## Run locally

Open `index.html` in a browser, or:

```bash
npx --yes serve .
```

## Host

Keep the existing domain. Point DNS at Netlify or Vercel. Netlify Forms is already attributed on the booking form (`name="booking"` + `data-netlify="true"`).

## Before launch

Read every `CONFIRM` in `shop-config.json`. Replace the sample flash plates with Instagram posts. Flip the email to `info@sanclementetattoo.com` only after the mailbox exists.
