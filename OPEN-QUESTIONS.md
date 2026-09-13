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

## 2. Hours — answered, one part left

**Answered.** The shop confirmed 12:00 PM to 7:00 PM daily, and the site now
says exactly that: the hours line, the seven-day table, the footer, the social
card, the structured data and the open/closed badge all read from
`SITE.hours.weekly`.

**Still open: exceptions.** Holiday closures and early closes are not
modelled. The badge will say "Open now" until 7:00 PM every day of the year,
Christmas included. If there are regular exceptions, say which and they can go
in the data.

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

## 7. Who is actually working today

Five artists are credited for their work: Brother Greg, James Whelan, Brian
Taylor, Chas Byassee, Thadius Gardner. The page says "work credit only. To
find out who is tattooing today, call the shop", because current roster status
was never confirmed. Confirm who is currently working and the wording can be
firmer.

There are also 29 projects with no artist credit at all, including photos
previously attributed to John Ondo. They show as uncredited rather than
guessed at. Confirm any that should carry a name.

The September intake is credited to James Whelan on the shop's own word
("primarily all James Whelan"). If any of those 22 photos is somebody else's
work, say which and the credit moves.

## 8. Instagram as the gallery source

The archive is a one-time export. Adding new work means running the steps in
the README's photo-ops runbook. Wiring the Instagram Graph API so new posts
appear automatically is a separate job and needs a Creator or Business
account; nobody has asked for it yet.

## 9. Photo quality backlog — mostly closed

The Instagram chrome is gone. 139 masters were cropped to remove carousel
counters, mute and tagged-people icons, a scan icon, a PicFrame watermark, a
phone-mockup inset, letterbox bars and white gutters, and all 23 September
photos were cropped to remove the smeared corner where somebody had already
tried to erase a counter. Crop only, nothing painted. See AUDIT.md for the
per-file evidence.

Four things could not be fixed by cropping and are worth a decision:

1. **`orig-ig-193822`** ("Eagle and cross Memorial Day art"). Instagram's scan
   icon sat on top of the painting's bottom banner, so removing it clipped the
   bottom of the GOD FAMILY COUNTRY scroll. The chrome is gone; a slice of the
   painting went with it. A straight photograph of the painting would replace
   this outright.
2. **Collage posts.** `orig-ig-193947`, `orig-ig-194025`, `orig-ig-194118`,
   `orig-ig-194120`, `orig-ig-194134` and `r4-chas-chas-02/03/04/16/23` are two
   or three photos side by side inside one image, with white or black dividers
   down the middle. The outside edges are trimmed; the dividers are interior
   and cannot be cropped away. Splitting them into separate photos in one swipeable set
   is doable and is the right fix, but it is a judgement call about framing
   somebody else's photograph, so it waits for a yes.
3. **Rounded corners.** The `r4-chas-*` and `r4-thad-*` batch are photos inset
   in a square post frame with rounded corners. The frame is cropped off; the
   corner radius is part of the photo. Against a black page the leftover arcs
   are close to invisible, which is a lucky accident of the new palette rather
   than a fix.
4. **Resolution.** Roughly 60 of the masters are 480px or smaller, straight off
   the old OtherPeoplesPixels site. They are served at their own width and
   never upscaled, so they look soft next to the 1080px Instagram exports.

Re-exporting originals from the "Download Your Information" archive, or
reshooting, is still the real fix for all four.

## 10. Which section is "the walk-ins welcome section"

The September instructions asked for black and white throughout with one
exception: "the walk-ins welcome section keeps the colors it already has."
Nothing on the site is headed that, so this pass read it as the two places
that carry the shop's painted-sign colours and say "walk-ins":

- the painted wooden sign in the hero, which reads WALK-INS EVERY DAY, and
- the **Walk in or book** section, which now runs the warm paper palette as a
  panel against the black page.

Everything else is black, white and red. If the intended exception was only
one of those two, or something else entirely, say which and it is a
three-line change in `assets/css/app.css`.
