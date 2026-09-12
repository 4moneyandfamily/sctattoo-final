# San Clemente Tattoo

The shop's website. One page, no build step, no framework, no runtime
dependencies. Drop the folder on Netlify and it works.

**Live:** https://sanclementetattoo.com · **Preview:** https://sc-tattoo.netlify.app

## Layout

| Path | What it is |
|---|---|
| `index.html` | The page. Markup only — no inline styles, no inline scripts. |
| `data/site.js` | **The single source of truth.** Shop facts, hours, crew, FAQ and the entire gallery. Nothing is duplicated anywhere else. |
| `assets/css/app.css` | All styling. `fonts.css` holds the self-hosted @font-face rules. |
| `assets/js/app.js` | All behaviour. Hand-written, ~27 KB raw / ~9 KB gzipped. |
| `photos/` | Full-resolution masters. Archival — never served to a visitor. |
| `photos/_originals/` | Pre-rotation copies of the files this rebuild rotated. |
| `assets/g/` | Responsive WebP derivatives. **This** is what visitors load. Generated. |
| `assets/fonts/` | Self-hosted WOFF2. No third-party font requests. |
| `tools/` | Build and check scripts. See below. |
| `tests/` | Playwright suite, 70 tests across phone, tablet and desktop. |
| `netlify.toml` | Redirects, cache headers, CSP and the other security headers. |
| `AUDIT.md` | What this rebuild changed and why, with the image audit results. |
| `OPEN-QUESTIONS.md` | **Read this.** Things only Brother Greg can answer. |
| `LICENSES.md` | Font, icon and dependency licence audit. |

## Run it

```bash
npm install          # tools only; nothing ships to the browser
npm start            # http://127.0.0.1:8080
```

## Check it

```bash
npm run lint         # data/file integrity, EXIF, markup invariants, surname check
npm test             # Playwright: phone + tablet + desktop
npm run links        # status codes for every outbound URL (needs open network)
```

`npm run lint` is the one that catches the mistakes that would otherwise reach
production: a photo referenced but missing, dimensions in `data/site.js` that
no longer match the file, a derivative that was never built, EXIF that was not
stripped, a style chip with no work behind it, an `<img>` without
`width`/`height`, an inline style the CSP would block.

## Photo ops runbook

**This is the workflow for putting new work on the wall.** Follow it and the
site stays fast, stable and accessible. Skip it and you get layout jumps,
broken images or a 4 MB photo on someone's phone plan.

### Adding a new tattoo

1. **Get the real file, not a screenshot.** Export from the camera or phone,
   or from Instagram's "Download Your Information" archive. Do not screenshot
   an Instagram post — you get rounded corners, a carousel counter and a mute
   icon baked into the pixels, which is most of what is wrong with the older
   half of the current archive.

2. **Name it** `photos/<something>-NN.jpg`. Lowercase, hyphens, no spaces, no
   surnames, no client names. If the piece has several photos, number them
   `-01`, `-02` in the order they should be seen — the first is the cover.

3. **Copy it into `photos/`** and run:

   ```bash
   node tools/add-photos.mjs photos/panther-calf-01.jpg photos/panther-calf-02.jpg
   ```

   All the files you pass are treated as **one tattoo** — one card, first file
   as the cover. Run it once per tattoo. It strips every scrap of metadata
   (including GPS), bakes any camera rotation into the pixels, builds the
   360/540/720/1080 WebP derivatives, keeps a recoverable original in
   `photos/_originals/`, and prints a block to paste.

4. **Paste that block** into the `projects` array in `data/site.js`, then fill
   in the parts it cannot know:
   - `style` — must be one of the values in `SITE.styles`. The definitions are
     commented at the top of `data/site.js`; the short version is that
     **Black & grey means no colour ink at all**, Paintings means not on skin,
     and Lettering means the piece is mostly text. `npm run lint` fails if a
     title and a style contradict each other.
   - `artistId` — `greg`, `james`, `brian`, `chas`, `thad`, or `null` if you
     are not certain. **Never guess a credit.**
   - `title` — what the piece is. One short phrase; it is the card label.
   - `cap` — per photo. This becomes the alt text a screen reader reads, so
     describe what is actually in the frame ("dragon sleeve, inner arm"), not
     "photo 2".

5. **Look at it, then check it:**

   ```bash
   npm start        # open it, click the card, swipe the set
   npm run lint
   npm test
   ```

### Rules that matter

- **One card per tattoo.** Several angles, detail shots or healing progress of
  the same piece go in the same `photos[]` array, never as separate cards. Two
  cards of one tattoo is the single most common way this gallery goes wrong.
- **Do not edit the `w`/`h` numbers by hand.** They are what stops the page
  jumping while photos load (CLS is currently 0.0005). `add-photos.mjs` prints
  the right ones; `npm run lint` fails if they drift.
- **Never serve from `photos/`.** Always `assets/g/`. The app builds those
  paths itself, so this only goes wrong if someone hand-writes an `<img>`.
- **Do not retouch the tattoos.** No colour "improvement", no sharpening, no
  AI upscaling, no generated fill. Rotation, crop, resize and re-encode only.
  It is someone's tattoo and an artist's portfolio.
- **Check consent before publishing anything revealing.** An Instagram post is
  not a model release. If a photo needs gating, `sensitive: true` on its project
  puts it behind a blurred "tap to view" cover. Nothing uses it at the moment —
  the shop asked for the back-piece set shown like any other card — but the
  mechanism is there and tested.
- **Do not add an inline `style=` attribute or an inline `<script>`.** The
  Content-Security-Policy in `netlify.toml` blocks both outright. Put styles in
  `assets/css/app.css` and behaviour in `assets/js/app.js`. `npm run lint`
  catches this before deploy.

### Changing what leads the front page

The wall is curated, not archive-ordered. Two lists near the bottom of
`data/site.js` control it:

- **`featured`** pins projects, in exactly that order, to the top of the wall.
  24 entries fills the first page — 12 rows on a phone, 8 on a tablet, 6 on a
  desktop. This is the prime real estate: lead with full backs, full sleeves
  and clean, well-lit photographs of finished work.
- **`buried`** sinks projects to the very end. Used for the stencil-style
  design plates and unrendered paper designs — real work, but graphic design
  rather than tattooing, so they do not belong up front.

Anything in neither list keeps its archive position in between. To promote a
piece, add its `id` to `featured` where you want it and drop one off the
bottom. `npm run lint` fails if an id does not exist, is listed twice, or
appears in both lists, and warns if `featured` grows past 24.

**Picking the cover for a multi-photo card.** The first entry in a project's
`photos[]` is the cover. Choose the photograph that shows the *whole piece*
most clearly — a full-sleeve shot beats a detail crop, a straight-on back shot
beats a three-quarter angle, and anything without Instagram chrome (carousel
counter, mute icon, avatar) beats the same shot with it. Move that entry to
the top of the array. `tests/gallery.spec.js` pins the current choices, so if
you change one on purpose, update the expectation there too.

### Removing a photo or a tattoo

Delete the entry from `data/site.js`, then delete `photos/<file>.jpg` and its
`assets/g/<file>-*.webp` derivatives. Run `npm run lint` — it will tell you if
anything still points at the file. Leaving the master and removing the entry is
fine too; lint warns about the orphan rather than failing.

### Changing hours, crew, FAQ or contact details

All of it is at the top of `data/site.js`, commented. Change it and reload;
there is nothing to rebuild and nothing to keep in sync. The open/closed badge,
the hours table, the booking dropdown, the footer Instagram list and the
structured data all read from the same values.

One exception: the address, phone, geo and opening hours also appear in the
JSON-LD block at the bottom of `index.html`, because search engines need them
in the HTML itself. `tests/seo.spec.js` fails if the two ever disagree.

### Regenerating the generated things

```bash
npm run images       # missing/stale derivatives only
npm run images:force # all of them, e.g. after changing quality settings
npm run og           # the social card and icons
npm run fonts        # re-fetch the self-hosted fonts
```

## Deploying

Netlify, publish directory `.`, no build command. The booking form is wired to
Netlify Forms (`name="booking"` + `data-netlify="true"` + the hidden
`form-name` input); Netlify picks it up at deploy time.

**Booking form safety.** On any host that is not `sanclementetattoo.com` the
form runs in **dry-run** mode: it validates, logs the inquiry to the console
and posts nothing, so testing on a preview URL can never drop a fake booking in
the shop's inbox. Force it either way with `?dryrun=1` or `?dryrun=0`. A failed
send never shows a success message — it shows the phone number and a
pre-filled email instead, and shouts on the console. Set
`SITE.forms = { alert: 'https://…' }` in `data/site.js` to also fire a beacon
to a monitor.

**Preview deployments are `noindex`.** Netlify deploy-previews and branch
deploys get `X-Robots-Tag: noindex, nofollow` from `netlify.toml`, and
`app.js` adds a `noindex` robots meta on any hostname that is not the canonical
domain. That covers `sc-tattoo.netlify.app`, which is a production context as
far as Netlify is concerned and so cannot be handled by a context rule.

## Before launch

Work through `OPEN-QUESTIONS.md`. The blocking one is written consent for the
nude back-piece set.
