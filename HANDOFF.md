# Handoff — how Greg runs the site without a developer

The site is a single page (`index.html`) plus one facts file (`shop-config.json`).  
v1 does **not** need a build step to change copy. Production Instagram sync does.

---

## Change hours

Open `shop-config.json` → `hours`.

- `display` is the sentence on the page (“Noon to 8 pm, seven days”).
- `weekly` is what the open/closed light uses. Times are 24-hour, Pacific.

Example — close at 7 on Sunday:

```json
{ "day": "Sunday", "open": "12:00", "close": "19:00" }
```

Then paste the same values into the `SHOP` object at the top of `index.html` (search for `const SHOP =`).  
Until we add a tiny build step, **both files must match**.

Holiday closures: set `open` and `close` to `null` for that day and add a note in `hours.holidayNote`. Confirm with Greg first. The old site and the listings still disagree (7 vs 8). Do not guess.

---

## Add or remove an artist

In `shop-config.json` → `artists`, and the same array in `index.html`.

**Remove:** set `"active": false`. The card, the filter chip, the footer Instagram, and the booking dropdown all hide. Do not delete the record — you may want them back.

**Add:**

```json
{
  "id": "newid",
  "name": "Name on the wall",
  "fullName": "Legal or preferred full name",
  "handle": "instagramhandle",
  "instagram": "https://www.instagram.com/instagramhandle/",
  "role": "Artist",
  "styles": ["Traditional"],
  "active": true,
  "confirmActive": false,
  "bio": "One or two sentences they approved.",
  "years": "whatever they want public"
}
```

`id` must be unique and lowercase, no spaces. That id is the gallery filter.

Pulling work from a **personal** Instagram requires that artist’s OK. Shop account posts are fair game.

---

## Add photos (the real job)

Priority, best to worst:

1. **Live Instagram** — switch @san_clemente_tattoo to Creator or Business. Instagram Login + Graph API. Store a long-lived token. Refresh it on a schedule before the ~60-day expiry. This is the production path. A developer sets it up once; Greg does not touch tokens.
2. **Export** — Instagram → Accounts Center → Download your information. Drop the unzipped media into `/gallery/export/`. A small script (to be added at launch) reads the export, tags artists from @handles in captions, and writes `gallery.json`. Greg can override a tag in that file.
3. **Manual** — last resort. Add an object to `gallery.items`:

```json
{
  "id": "2026-09-10-rose-greg",
  "src": "gallery/2026-09-10-rose-greg.jpg",
  "artistId": "greg",
  "style": "Traditional",
  "caption": "Exact caption from the post, or a short shop caption.",
  "permalink": "https://www.instagram.com/p/SHORTCODE/",
  "alt": "Traditional rose tattoo by Brother Greg"
}
```

Do not screenshot unless the export and the API both fail. Screenshots are soft and cropped wrong.

v1 ships **sample flash plates** drawn in the page. They are marked SAMPLE. They are not the shop’s tattoos. Take them out the day the first real batch lands.

---

## Change phone, email, address

`shop-config.json` → `contact`. Mirror in `index.html`.

- Phone stays `(949) 498-8487` unless the shop line changes. Use the same digits in the footer, the sticky bar, the schema, and Google Business.
- Email: keep `brogreg777@yahoo.com` until `info@sanclementetattoo.com` exists. Flip `emailUse`.
- Address is **117 Avenida Granada** — never Granda. The old contact page had that typo.

---

## Booking form

The three-step form posts to whatever is in `booking.formEndpoint`.

On Netlify (recommended host):

- Keep `data-netlify="true"` and `name="booking"` on the form.
- Submissions appear under Site → Forms.
- Forward them to the shop email.

If the endpoint is unset, the page builds a pre-filled `mailto:` to the shop email so a request is not lost.

Deposit amount and payment method stay as CONFIRM until Greg writes the number and the method (cash, Venmo, card). Do not put a dollar figure on the site until he does.

---

## What Greg never has to do

- Touch CSS or the painted sign SVG.
- Manage SSL, DNS beyond pointing the existing domain at Netlify or Vercel.
- Write schema, sitemaps, or alt text patterns. Alt text is `"{style} by {artist}"` from the config.

---

## Launch checklist (developer + Greg)

- [ ] Confirm hours (12–8 vs the old 7–8 wording).
- [ ] Confirm who is still on the wall.
- [ ] Confirm deposit amount and how to pay it.
- [ ] Stand up `info@sanclementetattoo.com` and flip `emailUse`.
- [ ] Confirm parking / lot sentence.
- [ ] Confirm aftercare wording.
- [ ] Confirm geo pin against Google Business.
- [ ] Connect Instagram Creator/Business + token refresh.
- [ ] Replace sample flash with real posts.
- [ ] Point sanclementetattoo.com at the new host. Keep the domain.
- [ ] Verify Google Business NAP matches the site exactly.
- [ ] Send a test booking and a test call from a phone.
