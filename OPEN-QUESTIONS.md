# Open questions — needs Brother Greg's answer before launch

Nothing in this list is invented or guessed at on the site. Where a fact is
unconfirmed, the page either stays silent or says "ask the shop". These are
carried over from `shop-config.json` (now retired) plus what this pass turned
up.

## 1. Written consent for the nude back-piece set

Four photos (`orig-ig-193804`, `orig-ig-193806`, `orig-ig-193809`,
`r2-brian-brian-01`) show the same adult woman, fully nude from behind, with a
bodysuit covering her back, buttocks and thighs. They are grouped as one
project, `set-goddess-bodysuit`, credited to Brian Taylor.

**Presentation: decided.** The shop asked for these shown like any other card,
so the tap-to-reveal cover is gone and nothing on the site is gated.

**Still open: written consent to publish.** These were posted to Instagram, but
an Instagram post is not a model release for the shop's own website. Confirm
the shop holds written permission from the subject. If it does not, deleting
that one project block in `data/site.js` removes the set.

If a future photo does need gating, add `sensitive: true` to its project and it
goes behind a blurred "Nudity — tap to view" cover. The mechanism is still in
the code and still tested, it is just not in use.

## 2. Hours

Published as noon to 8 pm, seven days, which is what Yelp and the
Google-style listings say. The old site said "noon to 7–8pm" and MapQuest says
12–7. Confirm 8 pm is right, and say whether there are holiday closures or
early closes — the site will show "Open now" until 8 pm every day until told
otherwise.

## 3. Email address

The site publishes `brogreg777@yahoo.com`, which is the address already in
public listings. If `info@sanclementetattoo.com` is wanted instead, stand the
mailbox up first, then change `shop.email` in `data/site.js`.

## 4. Deposit

The site says appointments are held with a deposit and to ask the shop for the
amount and how to pay. No number and no payment method are published. Supply
them and they can go on the page.

## 5. Prices

Nothing is published — no shop minimum, no hourly rate. Say if a minimum
should be listed.

## 6. Parking

The old copy pointed at Yelp for street parking and a private lot. Nothing
about parking is on the new site because the lot access was never confirmed.
Confirm it and it can go in the FAQ.

## 7. Who is actually on the wall

Five artists are credited for their work: Brother Greg, James Whelan, Brian Taylor,
Chas Byassee, Thadius Gardner. The page says "work credit only — for who is on
the wall today, call the shop", because current roster status was never
confirmed. Confirm who is currently working and the wording can be firmer.

There are also 29 projects with no artist credit at all, including photos
previously attributed to John Ondo. They show as uncredited rather than
guessed at. Confirm any that should carry a name.

## 8. Instagram as the gallery source

The archive is a one-time export. Adding new work means running the steps in
the README's photo-ops runbook. Wiring the Instagram Graph API so new posts
appear automatically is a separate job and needs a Creator or Business
account; nobody has asked for it yet.

## 9. Photo quality backlog

Much of the archive is Instagram screenshots rather than original files:
rounded corners, black letterbox bars, carousel counters ("3/10"), mute icons
and avatars baked into the pixels. `orig-ig-194025` carries a third-party
"PICFRAME" watermark. `orig-ig-194049` is a screenshot of a phone screen
showing the photo. None of this can be cleaned up without cropping into the
tattoos, so it was left alone. Re-exporting the originals from the
"Download Your Information" archive, or reshooting, is the real fix.
