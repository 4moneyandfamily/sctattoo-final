/* San Clemente Tattoo — single source of truth.
 *
 * Everything the site shows lives in this one file: shop facts, hours, crew,
 * FAQ and the whole gallery. Nothing is duplicated anywhere else — if you
 * change a phone number or a caption here, the page picks it up on reload.
 *
 * Adding new work? See "Photo ops runbook" in README.md. Do not hand-edit
 * the w/h numbers; tools/add-photos.mjs prints them for you.
 */
window.SITE = {
  shop: {
    name: "San Clemente Tattoo",
    owner: "Brother Greg",
    tagline: "Traditional street shop. Downtown San Clemente since 2011.",
    established: 2011,
    phone: "(949) 498-8487",
    phoneHref: "tel:+19494988487",
    email: "brogreg777@yahoo.com",
    address: "117 Avenida Granada, San Clemente, CA 92672",
    street: "117 Avenida Granada",
    city: "San Clemente", region: "CA", postal: "92672", country: "US",
    geo: { lat: 33.4274, lng: -117.6126 },
    mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=117+Avenida+Granada,+San+Clemente,+CA+92672",
    instagram: "https://www.instagram.com/san_clemente_tattoo/",
    instagramHandle: "san_clemente_tattoo",
    facebook: "https://www.facebook.com/sanclementetattoo",
    canonical: "https://sanclementetattoo.com/"
  },

  hours: {
    timezone: "America/Los_Angeles",
    display: "Noon to 7 pm, seven days",
    weekly: [
      { day: "Sunday", open: "12:00", close: "19:00" },
      { day: "Monday", open: "12:00", close: "19:00" },
      { day: "Tuesday", open: "12:00", close: "19:00" },
      { day: "Wednesday", open: "12:00", close: "19:00" },
      { day: "Thursday", open: "12:00", close: "19:00" },
      { day: "Friday", open: "12:00", close: "19:00" },
      { day: "Saturday", open: "12:00", close: "19:00" },
    ]
  },

  // Work credit only. Call the shop for who is actually on the wall today.
  artists: [
    { id: "greg", name: "Brother Greg", handle: "brothergreg", instagram: "https://www.instagram.com/brothergreg/", role: "Owner", bio: "Tattooer, painter, and owner of San Clemente Tattoo." },
    { id: "james", name: "James Whelan", handle: "_jameswhelan", instagram: "https://www.instagram.com/_jameswhelan/", role: "Artist", bio: "Tattooer at San Clemente Tattoo. DM or swing by the shop to book." },
    { id: "brian", name: "Brian Taylor", handle: "into_the_grave", instagram: "https://www.instagram.com/into_the_grave/", role: "Artist", bio: "Tattoo maker at San Clemente Tattoo. Books always open: DM or email to book." },
    { id: "chas", name: "Chas Byassee", handle: "cebyassee", instagram: "https://www.instagram.com/cebyassee/", role: "Artist", bio: "Professional tattooer since 1997." },
    { id: "thad", name: "Thadius Gardner", handle: "thadart", instagram: "https://www.instagram.com/thadart/", role: "Artist", bio: "Tattoo artist at San Clemente Tattoo." },
  ],

  /* Only styles that actually have work behind them.

     What each one means, so the filters stop drifting:
       Paintings    — artwork on paper, board or canvas. Not on skin.
       Black & grey — tattooed in black and grey wash with NO colour ink.
                      Red or any other colour in the piece disqualifies it.
                      Colour belonging to a neighbouring tattoo does not.
       Traditional  — bold-line traditional work on skin, any palette,
                      including pieces with spot colour.
       Color        — colour-led work outside the bold traditional idiom.

     The Traditional / Color line is a genre judgement and the archive is not
     fully consistent about Japanese colour work; see AUDIT.md. Black & grey
     and Paintings are not judgement calls and npm run lint enforces the ones
     it can check.

     There is no Lettering filter. The shop's read is that its three pieces
     were colour work that happened to contain script, and three cards behind
     a filter of their own told a visitor nothing. They now sit at the end of
     Color. */
  styles: ["Black & grey","Color","Paintings","Traditional"],

  faq: [
    ["Do you take walk-ins?", "Yes. First come, first served, seven days. If the shop is slammed or the piece is a custom, we will book you instead."],
    ["How do I book an appointment?", "Call the shop or send a booking request. Appointments are held with a deposit. Ask the shop for the amount and how to pay."],
    ["How much does a tattoo cost?", "Depends on size, placement, cover-up work, and the artist. We do not publish a number here. Call or walk in and we will talk about the piece."],
    ["Can I get tattooed if I am under 18 with a parent?", "No. California has no parental exception for tattooing. You must be 18 and bring photo ID."],
    ["Do you do cover-ups?", "Yes. Bring clear photos of the old work in the booking form or walk in and show us."],
    ["Do you pierce?", "No. Tattooing only."],
    ["Where do I park?", "Street parking and a private lot are listed on the shop's Yelp page."],
  ],

  // Photos of the shop itself. Not tattoo work, so kept out of the gallery.
  shopPhotos: [
    { f: "r2-james-james-10.jpg", w: 940, h: 1609, cap: "James Whelan tattooing a client in the shop" },
    { f: "r2-greg-greg-03.jpg", w: 940, h: 1517, cap: "Shop exterior: 'World Famous San Clemente Tattoo' sign" },
    { f: "r2-greg-greg-04.jpg", w: 940, h: 1517, cap: "Shop interior: framed tattoo sign, bench, neon OPEN" },
    { f: "r2-greg-greg-05.jpg", w: 940, h: 1517, cap: "Iconic red shop door with OPEN sign" },
    { f: "r2-greg-greg-06.jpg", w: 940, h: 1517, cap: "Shop interior workstation" },
    { f: "r2-greg-greg-07.jpg", w: 940, h: 1517, cap: "Shop interior: client on chair, flash-covered walls" },
  ],

  /* ---- Front page running order ------------------------------------------
     The wall is prime real estate, so it is curated rather than left in
     archive order.

     `featured` pins these projects, in exactly this order, to the top of the
     wall. 24 entries fills the first page (12 rows on a phone, 8 on a tablet,
     6 on a desktop). Lead with the pieces that show the shop at its best:
     full backs, full sleeves, clean well-lit photographs of finished work.

     `buried` pushes these to the very end. Used for the stencil-style design
     plates and unrendered paper designs — real work, but graphic design rather
     than tattooing, so they do not belong on the front page.

     Everything not named in either list keeps its archive order in between.
     An id that appears in neither list is fine; an id in both is a mistake and
     `npm run lint` will fail on it. */
  featured: [
    // full backs and bodysuits first
    "set-james-koi-back",         // Koi full-back bodysuit
    "set-mary-back",              // Virgin Mary full back piece
    "set-james-dragon-back",      // Dragon back piece, Japanese style
    "p-r2-brian-brian-03",        // Eagle and skull full-back piece
    // full sleeves
    "p-orig-ig-193725",           // Chrysanthemum and peony sleeve
    "set-james-dragon-sleeve",    // Dragon sleeve, 10 photos
    "set-brian-dragon-flowers",   // Dragon and flowers sleeve
    "p-orig-os-5261256",          // Plague doctor back piece
    // more large work
    "p-orig-os-4503397",          // Dragon back piece
    "p-orig-os-5261258",          // Tiger back piece
    "p-orig-os-4503433",          // Rattlesnake
    "set-mahakala",               // Mahakala stomach piece
    "p-r2-brian-brian-15",        // Dragon sleeve torso tattoo
    "p-r2-brian-brian-20",        // Orange flower half sleeve
    // bold single pieces, spread across the crew
    "p-r2-brian-brian-07",        // Tiger head, black & grey
    "p-r4-chas-chas-22",          // Panther head tattoo
    "p-r2-james-james-03",        // Oni mask thigh tattoo
    "p-r4-thad-thad-08",          // Panther head and dagger
    "set-brian-tiger",            // Tiger shoulder piece
    "p-orig-ig-193916",           // Eagle and skull chest piece
    "p-orig-ig-193838",           // Eagle on the back of the head
    "set-goddess-bodysuit",       // Goddess full-back bodysuit
    "p-r4-chas-chas-11",          // Rose tattoo
    "set-greg-religious-flash",   // Religious flash painting — the owner's own work
  ],

  buried: [
    "p-orig-ig-193745",          // black-and-white graphic plate, not a painting
    "p-orig-ig-194017",          // apparel print art, not a painting
    "p-orig-os-5261262",         // engraved-style graphic panel rather than painted flash
    "p-r2-greg-greg-09",         // same engraved-style family as the panel above
    "p-orig-ig-193943",          // the shop does not read this as black and grey
    "p-orig-ig-193739",           // Don't Tread On Me design plate
    "p-orig-ig-193742",           // F-Around and Find Out design plate
    "p-orig-os-5261255",          // Skeleton and snake, line-art plate
    "p-orig-ig-193851",           // Dragon backpiece design on paper
    "p-orig-ig-193848",           // Eagle backpiece design on paper
    "p-r2-james-james-07",        // Dragon pencil drawing
    "p-r4-chas-chas-20",          // Ship linework flash
  ],

  /* One entry per tattoo (or painting). Multiple photos of the same piece go
     in the same entry's photos[] — the first photo is the card cover.
     sensitive: true puts the card behind a tap-to-view cover. */
  projects: [
    { id: "p-orig-os-5526748", style: "Black & grey", artistId: null, title: "Sacred heart, chest", photos: [{ f: "orig-os-5526748.jpg", w: 378, h: 480, cap: "Sacred heart, chest" }] },
    { id: "p-orig-ig-193725", style: "Color", artistId: "brian", title: "Chrysanthemum and peony sleeve", photos: [{ f: "orig-ig-193725.jpg", w: 1080, h: 1338, cap: "Chrysanthemum and peony sleeve" }] },
    { id: "set-chas-severed-head", style: "Color", artistId: "chas", title: "Severed samurai head with dagger",
      photos: [
        { f: "orig-ig-193732.jpg", w: 980, h: 1338, cap: "Severed samurai head with dagger, tattooed" },
        { f: "orig-ig-193735.jpg", w: 1046, h: 1339, cap: "Severed samurai head with dagger, the painted design it came from" },
      ] },
    { id: "p-orig-ig-193739", style: "Paintings", artistId: null, title: "Don’t Tread On Me eagle and ship design", photos: [{ f: "orig-ig-193739.jpg", w: 1076, h: 1226, cap: "Don’t Tread On Me eagle and ship design" }] },
    { id: "p-orig-ig-193742", style: "Paintings", artistId: null, title: "F-Around and Find Out eagle and ship design", photos: [{ f: "orig-ig-193742.jpg", w: 1031, h: 1237, cap: "F-Around and Find Out eagle and ship design" }] },
    { id: "p-orig-ig-193745", style: "Paintings", artistId: "greg", title: "Cross and serpent flash painting", photos: [{ f: "orig-ig-193745.jpg", w: 1080, h: 1266, cap: "Cross and serpent flash painting" }] },
    { id: "set-james-eagle", style: "Color", artistId: "james", title: "Eagle",
      photos: [
        { f: "orig-ig-193751.jpg", w: 1080, h: 1257, cap: "Eagle, full view" },
        { f: "orig-ig-193753.jpg", w: 1080, h: 799, cap: "Eagle, close-up" },
      ] },
    { id: "set-goddess-bodysuit", style: "Traditional", artistId: "brian", title: "Goddess full-back bodysuit",
      photos: [
        { f: "r2-brian-brian-01.jpg", w: 726, h: 1348, cap: "Goddess full-back bodysuit" },
        { f: "orig-ig-193804.jpg", w: 787, h: 1343, cap: "Full back piece, goddess and flowers" },
        { f: "orig-ig-193809.jpg", w: 770, h: 1253, cap: "Woman with headdress backpiece" },
        { f: "orig-ig-193806.jpg", w: 972, h: 1143, cap: "Back piece, color portrait" },
      ] },
    { id: "p-orig-ig-193813", style: "Black & grey", artistId: "james", title: "Lady head with rose", photos: [{ f: "orig-ig-193813.jpg", w: 1080, h: 1149, cap: "Lady head with rose" }] },
    { id: "p-orig-ig-193822", style: "Paintings", artistId: "greg", title: "Eagle and cross Memorial Day art", photos: [{ f: "orig-ig-193822.jpg", w: 1080, h: 1223, cap: "Eagle and cross Memorial Day art" }] },
    { id: "set-mary-back", style: "Traditional", artistId: "brian", title: "Virgin Mary full back piece",
      photos: [
        { f: "orig-ig-193825.jpg", w: 1080, h: 1252, cap: "Virgin Mary backpiece" },
        { f: "r2-brian-brian-21.jpg", w: 1043, h: 1158, cap: "Virgin Mary full back piece" },
        { f: "orig-ig-193830.jpg", w: 1080, h: 1252, cap: "Virgin Mary backpiece, shoulder detail" },
      ] },
    { id: "p-orig-ig-193851", style: "Paintings", artistId: "james", title: "Dragon backpiece design, up for grabs", photos: [{ f: "orig-ig-193851.jpg", w: 1080, h: 1157, cap: "Dragon backpiece design, up for grabs" }] },
    { id: "p-orig-ig-193848", style: "Paintings", artistId: "james", title: "Eagle backpiece design, up for grabs", photos: [{ f: "orig-ig-193848.jpg", w: 1080, h: 1155, cap: "Eagle backpiece design, up for grabs" }] },
    { id: "p-orig-ig-193909", style: "Color", artistId: "james", title: "Demon mask", photos: [{ f: "orig-ig-193909.jpg", w: 1080, h: 1179, cap: "Demon mask" }] },
    { id: "p-orig-ig-193916", style: "Black & grey", artistId: "brian", title: "Eagle and skull chest piece", photos: [{ f: "orig-ig-193916.jpg", w: 1080, h: 1126, cap: "Eagle and skull chest piece" }] },
    { id: "set-brian-demon-leg", style: "Traditional", artistId: "brian", title: "Demon head on the thigh",
      photos: [
        { f: "orig-ig-193930.jpg", w: 588, h: 1158, cap: "Demon leg sleeve, front view" },
        { f: "r2-brian-brian-22.jpg", w: 788, h: 1138, cap: "Demon head on the thigh" },
      ] },
    { id: "p-orig-ig-193926", style: "Traditional", artistId: "james", title: "Reaper skull with red accents", photos: [{ f: "orig-ig-193926.jpg", w: 1080, h: 1099, cap: "Reaper skull with red accents" }] },
    { id: "p-orig-ig-193943", style: "Black & grey", artistId: "james", title: "Ornamental full sleeve", photos: [{ f: "orig-ig-193943.jpg", w: 748, h: 979, cap: "Ornamental full sleeve" }] },
    { id: "p-orig-ig-193947", style: "Color", artistId: "brian", title: "Dagger, owl and dragon", photos: [{ f: "orig-ig-193947.jpg", w: 1048, h: 1044, cap: "Dagger, owl and dragon" }] },
    { id: "set-bulldog", style: "Traditional", artistId: "thad", title: "Bulldog soldier tattoo",
      photos: [
        { f: "r4-thad-thad-10.jpg", w: 1080, h: 1151, cap: "Bulldog soldier tattoo" },
        { f: "orig-ig-193954.jpg", w: 1080, h: 1079, cap: "Bulldog with helmet" },
      ] },
    { id: "p-orig-ig-193958", style: "Color", artistId: "james", title: "Severed head, Japanese style", photos: [{ f: "orig-ig-193958.jpg", w: 1080, h: 1194, cap: "Severed head, Japanese style" }] },
    { id: "set-mahakala", style: "Traditional", artistId: "brian", title: "Mahakala stomach piece",
      photos: [
        { f: "orig-ig-194002.jpg", w: 1080, h: 1289, cap: "Mahakala demon stomach piece" },
        { f: "r2-brian-brian-06.jpg", w: 1080, h: 1267, cap: "Mahakala stomach piece" },
      ] },
    { id: "p-orig-ig-194010", style: "Traditional", artistId: "thad", title: "Black panther leg piece", photos: [{ f: "orig-ig-194010.jpg", w: 1080, h: 1174, cap: "Black panther leg piece" }] },
    { id: "p-orig-ig-194017", style: "Paintings", artistId: "greg", title: "Dagger, swallows and roses shirt art", photos: [{ f: "orig-ig-194017.jpg", w: 1080, h: 1321, cap: "Dagger, swallows and roses shirt art" }] },
    { id: "set-james-dragon-sleeve", style: "Color", artistId: "james", title: "Dragon sleeve",
      photos: [
        { f: "r5-james-05.jpg", w: 729, h: 1400, cap: "Dragon sleeve, full arm" },
        { f: "orig-ig-194041.jpg", w: 1076, h: 1154, cap: "Dragon sleeve, close-up" },
        { f: "orig-ig-194039.jpg", w: 1076, h: 1254, cap: "Dragon sleeve" },
        { f: "orig-ig-194025.jpg", w: 1080, h: 1132, cap: "Dragon sleeve (another view)" },
        { f: "orig-ig-194028.jpg", w: 1076, h: 1254, cap: "Dragon sleeve, detail (another view)" },
        { f: "orig-ig-194032.jpg", w: 1076, h: 1254, cap: "Dragon sleeve" },
        { f: "orig-ig-194037.jpg", w: 1076, h: 1254, cap: "Dragon sleeve, detail" },
        { f: "orig-ig-194044.jpg", w: 1076, h: 1154, cap: "Dragon sleeve, full arm" },
        { f: "orig-ig-194049.jpg", w: 860, h: 1253, cap: "Dragon sleeve, back view (another view)" },
        { f: "orig-ig-194034.jpg", w: 1076, h: 1254, cap: "Dragon sleeve, shoulder view" },
        { f: "orig-ig-194035.jpg", w: 1076, h: 1254, cap: "Dragon sleeve, outer arm" },
      ] },
    { id: "set-brian-dragon-flowers", style: "Color", artistId: "brian", title: "Dragon and flowers sleeve",
      photos: [
        { f: "orig-ig-194109.jpg", w: 1024, h: 1154, cap: "Dragon and flowers sleeve" },
        { f: "orig-ig-194103.jpg", w: 1038, h: 1154, cap: "Dragon and flowers sleeve" },
        { f: "orig-ig-194056.jpg", w: 1080, h: 1254, cap: "Dragon and flowers sleeve (another view)" },
        { f: "orig-ig-194107.jpg", w: 642, h: 1154, cap: "Dragon and flowers sleeve, detail" },
      ] },
    { id: "p-orig-ig-194054", style: "Color", artistId: "brian", title: "Dragon head, sleeve detail", photos: [{ f: "orig-ig-194054.jpg", w: 1080, h: 1254, cap: "Dragon head, sleeve detail" }] },
    { id: "set-chas-skel-scorp", style: "Black & grey", artistId: "chas", title: "Skeleton and scorpion",
      photos: [
        { f: "orig-ig-194120.jpg", w: 1080, h: 1210, cap: "Skeleton and scorpion, side view" },
        { f: "orig-ig-194113.jpg", w: 996, h: 1254, cap: "Skeleton and scorpion" },
        { f: "orig-ig-194116.jpg", w: 963, h: 1254, cap: "Skeleton and scorpion, detail" },
        { f: "orig-ig-194118.jpg", w: 1080, h: 1254, cap: "Skeleton and scorpion triptych" },
      ] },
    { id: "set-james-dragon-back", style: "Color", artistId: "james", title: "Dragon back piece, Japanese style",
      photos: [
        { f: "orig-ig-194138.jpg", w: 1080, h: 1218, cap: "Dragon back piece with cherry blossoms" },
        { f: "orig-ig-194134.jpg", w: 946, h: 1255, cap: "Dragon back piece, Japanese style" },
        { f: "orig-ig-194140.jpg", w: 917, h: 1254, cap: "Dragon backpiece" },
      ] },
    { id: "p-orig-ig-194144", style: "Color", artistId: "chas", title: "Praying hands with rose and Family banner, rib piece", photos: [{ f: "orig-ig-194144.jpg", w: 1058, h: 1080, cap: "Praying hands with rose and Family banner, rib piece" }] },
    { id: "set-james-lady-pearls", style: "Black & grey", artistId: "james", title: "Lady head with pearls",
      photos: [
        { f: "orig-ig-194150.jpg", w: 1080, h: 1254, cap: "Lady head with pearls" },
        { f: "r5-james-21.jpg", w: 833, h: 571, cap: "Lady head with pearls, healed" },
      ] },
    { id: "p-orig-ig-194153", style: "Color", artistId: "james", title: "Lady head with flower and skull", photos: [{ f: "orig-ig-194153.jpg", w: 1080, h: 1254, cap: "Lady head with flower and skull" }] },
    { id: "p-orig-os-5261263", style: "Paintings", artistId: null, title: "Skeleton motorcycle", photos: [{ f: "orig-os-5261263.jpg", w: 640, h: 480, cap: "Skeleton motorcycle" }] },
    { id: "p-orig-os-5261262", style: "Paintings", artistId: null, title: "'Blessed' skull and heart flash panel", photos: [{ f: "orig-os-5261262.jpg", w: 334, h: 480, cap: "'Blessed' skull and heart flash panel" }] },
    { id: "p-orig-os-5261261", style: "Paintings", artistId: null, title: "Tiger and lady", photos: [{ f: "orig-os-5261261.jpg", w: 474, h: 476, cap: "Tiger and lady" }] },
    { id: "p-orig-os-5261260", style: "Black & grey", artistId: null, title: "Anchor and chainmail", photos: [{ f: "orig-os-5261260.jpg", w: 479, h: 479, cap: "Anchor and chainmail" }] },
    { id: "p-orig-os-5261259", style: "Black & grey", artistId: null, title: "Skull back piece", photos: [{ f: "orig-os-5261259.jpg", w: 477, h: 478, cap: "Skull back piece" }] },
    { id: "p-orig-os-5261258", style: "Color", artistId: null, title: "Tiger back piece", photos: [{ f: "orig-os-5261258.jpg", w: 393, h: 479, cap: "Tiger back piece" }] },
    { id: "p-orig-os-5261257", style: "Color", artistId: null, title: "Marlin", photos: [{ f: "orig-os-5261257.jpg", w: 425, h: 480, cap: "Marlin" }] },
    { id: "p-orig-os-5261256", style: "Black & grey", artistId: null, title: "Plague doctor back piece, black & grey", photos: [{ f: "orig-os-5261256.jpg", w: 450, h: 477, cap: "Plague doctor back piece, black & grey" }] },
    { id: "p-orig-os-5261255", style: "Paintings", artistId: null, title: "Skeleton and snake", photos: [{ f: "orig-os-5261255.jpg", w: 377, h: 478, cap: "Skeleton and snake" }] },
    { id: "p-orig-os-5261254", style: "Black & grey", artistId: null, title: "Sacred heart, forearm", photos: [{ f: "orig-os-5261254.jpg", w: 478, h: 478, cap: "Sacred heart, forearm" }] },
    { id: "p-orig-os-5261253", style: "Black & grey", artistId: null, title: "Three horse heads, black & grey", photos: [{ f: "orig-os-5261253.jpg", w: 380, h: 475, cap: "Three horse heads, black & grey" }] },
    { id: "p-orig-os-5261252", style: "Color", artistId: null, title: "Cross with eye", photos: [{ f: "orig-os-5261252.jpg", w: 475, h: 476, cap: "Cross with eye" }] },
    { id: "p-orig-os-5261251", style: "Color", artistId: null, title: "Dragon head", photos: [{ f: "orig-os-5261251.jpg", w: 380, h: 475, cap: "Dragon head" }] },
    { id: "p-orig-os-5261250", style: "Color", artistId: null, title: "Creation of Adam hands, forearm", photos: [{ f: "orig-os-5261250.jpg", w: 543, h: 319, cap: "Creation of Adam hands, forearm" }] },
    { id: "p-orig-os-5261249", style: "Black & grey", artistId: null, title: "Lady head with rose, black & grey", photos: [{ f: "orig-os-5261249.jpg", w: 385, h: 478, cap: "Lady head with rose, black & grey" }] },
    { id: "p-orig-os-5261248", style: "Color", artistId: null, title: "Ship back piece", photos: [{ f: "orig-os-5261248.jpg", w: 382, h: 478, cap: "Ship back piece" }] },
    { id: "p-orig-os-5261247", style: "Color", artistId: null, title: "Pinup with snake", photos: [{ f: "orig-os-5261247.jpg", w: 361, h: 445, cap: "Pinup with snake" }] },
    { id: "p-orig-os-5261246", style: "Color", artistId: null, title: "Back piece with skull and roses", photos: [{ f: "orig-os-5261246.jpg", w: 368, h: 477, cap: "Back piece with skull and roses" }] },
    { id: "p-orig-os-5261245", style: "Paintings", artistId: null, title: "Dragon panel", photos: [{ f: "orig-os-5261245.jpg", w: 257, h: 480, cap: "Dragon panel" }] },
    { id: "p-orig-os-5261244", style: "Paintings", artistId: null, title: "Dagger flash sheet", photos: [{ f: "orig-os-5261244.jpg", w: 356, h: 480, cap: "Dagger flash sheet" }] },
    { id: "p-orig-os-5261243", style: "Paintings", artistId: "brian", title: "Horse flash painting", photos: [{ f: "orig-os-5261243.jpg", w: 585, h: 480, cap: "Horse flash painting" }] },
    { id: "p-orig-os-4503447", style: "Color", artistId: "thad", title: "Revolver with lettering", photos: [{ f: "orig-os-4503447.jpg", w: 480, h: 640, cap: "Revolver with lettering" }] },
    { id: "p-orig-os-4503446", style: "Color", artistId: "thad", title: "Lady head with roses, color", photos: [{ f: "orig-os-4503446.jpg", w: 480, h: 640, cap: "Lady head with roses, color" }] },
    { id: "p-orig-os-4503444", style: "Black & grey", artistId: "thad", title: "Wings back piece", photos: [{ f: "orig-os-4503444.jpg", w: 480, h: 640, cap: "Wings back piece" }] },
    { id: "p-orig-os-4503443", style: "Color", artistId: "thad", title: "Elephant mandala", photos: [{ f: "orig-os-4503443.jpg", w: 360, h: 480, cap: "Elephant mandala" }] },
    { id: "p-orig-os-4503442", style: "Color", artistId: "thad", title: "Skull with flames and lettering", photos: [{ f: "orig-os-4503442.jpg", w: 480, h: 640, cap: "Skull with flames and lettering" }] },
    { id: "p-orig-os-4503441", style: "Color", artistId: "thad", title: "Grim reaper sleeve", photos: [{ f: "orig-os-4503441.jpg", w: 480, h: 640, cap: "Grim reaper sleeve" }] },
    { id: "p-orig-os-4503440", style: "Black & grey", artistId: "thad", title: "Tree and roots forearm piece", photos: [{ f: "orig-os-4503440.jpg", w: 480, h: 640, cap: "Tree and roots forearm piece" }] },
    { id: "p-orig-os-4503439", style: "Black & grey", artistId: "thad", title: "Tree with memorial banner", photos: [{ f: "orig-os-4503439.jpg", w: 480, h: 640, cap: "Tree with memorial banner" }] },
    { id: "p-orig-os-4503438", style: "Traditional", artistId: "thad", title: "Pinup playing card", photos: [{ f: "orig-os-4503438.jpg", w: 480, h: 640, cap: "Pinup playing card" }] },
    { id: "p-orig-os-4503434", style: "Color", artistId: null, title: "Koi shoulder", photos: [{ f: "orig-os-4503434.jpg", w: 270, h: 480, cap: "Koi shoulder" }] },
    { id: "p-orig-os-4503433", style: "Traditional", artistId: null, title: "Rattlesnake", photos: [{ f: "orig-os-4503433.jpg", w: 480, h: 480, cap: "Rattlesnake" }] },
    { id: "p-orig-os-4503432", style: "Black & grey", artistId: null, title: "Mandala thigh", photos: [{ f: "orig-os-4503432.jpg", w: 270, h: 480, cap: "Mandala thigh" }] },
    { id: "p-orig-os-4503430", style: "Traditional", artistId: null, title: "Traditional back piece with lettering", photos: [{ f: "orig-os-4503430.jpg", w: 270, h: 480, cap: "Traditional back piece with lettering" }] },
    { id: "set-brian-tiger", style: "Color", artistId: "brian", title: "Tiger shoulder piece",
      photos: [
        { f: "orig-os-4503420.jpg", w: 480, h: 640, cap: "Tiger half sleeve" },
        { f: "orig-os-4503419.jpg", w: 480, h: 640, cap: "Tiger shoulder piece" },
      ] },
    { id: "p-orig-os-4503418", style: "Color", artistId: "brian", title: "Sugar skull and mandala on the lower leg", photos: [{ f: "orig-os-4503418.jpg", w: 480, h: 640, cap: "Sugar skull and mandala on the lower leg" }] },
    { id: "p-orig-os-4503417", style: "Black & grey", artistId: "brian", title: "Mandala", photos: [{ f: "orig-os-4503417.jpg", w: 480, h: 640, cap: "Mandala" }] },
    { id: "p-orig-os-4503416", style: "Traditional", artistId: "brian", title: "Ornamental dagger and heart thigh piece", photos: [{ f: "orig-os-4503416.jpg", w: 360, h: 480, cap: "Ornamental dagger and heart thigh piece" }] },
    { id: "p-orig-os-4503399", style: "Black & grey", artistId: "brian", title: "Black and grey back piece", photos: [{ f: "orig-os-4503399.jpg", w: 480, h: 640, cap: "Black and grey back piece" }] },
    { id: "p-orig-os-4503398", style: "Traditional", artistId: "brian", title: "Rose on hand", photos: [{ f: "orig-os-4503398.jpg", w: 480, h: 640, cap: "Rose on hand" }] },
    { id: "p-orig-os-4503397", style: "Color", artistId: "brian", title: "Dragon back piece", photos: [{ f: "orig-os-4503397.jpg", w: 384, h: 480, cap: "Dragon back piece" }] },
    { id: "p-orig-ig-193838", style: "Black & grey", artistId: null, title: "Eagle head tattoo on back of head", photos: [{ f: "orig-ig-193838.jpg", w: 928, h: 1381, cap: "Eagle head tattoo on back of head" }] },
    { id: "set-brian-panther", style: "Traditional", artistId: "brian", title: "Panther head piece",
      photos: [
        { f: "orig-ig-193920.jpg", w: 1080, h: 1088, cap: "Panther head piece, whole tattoo" },
        { f: "orig-ig-193923.jpg", w: 908, h: 1080, cap: "Panther head piece, close up" },
      ] },
    { id: "set-greg-religious-flash", style: "Paintings", artistId: "greg", title: "Religious flash painting",
      photos: [
        { f: "r2-greg-greg-02.jpg", w: 1080, h: 1212, cap: "Religious flash painting, flat on the wall" },
        { f: "r2-greg-greg-01.jpg", w: 1080, h: 1108, cap: "Religious flash painting, framed and hung" },
      ] },
    { id: "p-r2-greg-greg-08", style: "Paintings", artistId: "greg", title: "Goblet/skull chalice flash painting", photos: [{ f: "r2-greg-greg-08.jpg", w: 900, h: 1283, cap: "Goblet/skull chalice flash painting" }] },
    { id: "p-r2-greg-greg-09", style: "Paintings", artistId: "greg", title: "'Blessed' skull and mermaid flash painting", photos: [{ f: "r2-greg-greg-09.jpg", w: 909, h: 1440, cap: "'Blessed' skull and mermaid flash painting" }] },
    { id: "p-r2-james-james-01", style: "Paintings", artistId: "james", title: "Eagle and dragon flash sheets", photos: [{ f: "r2-james-james-01.jpg", w: 1080, h: 1157, cap: "Eagle and dragon flash sheets" }] },
    { id: "p-r2-james-james-02", style: "Paintings", artistId: "james", title: "Tiger and dragon flash sheets", photos: [{ f: "r2-james-james-02.jpg", w: 1080, h: 1157, cap: "Tiger and dragon flash sheets" }] },
    { id: "p-r2-james-james-03", style: "Traditional", artistId: "james", title: "Oni mask thigh tattoo", photos: [{ f: "r2-james-james-03.jpg", w: 1080, h: 1158, cap: "Oni mask thigh tattoo" }] },
    { id: "p-r2-james-james-04", style: "Color", artistId: "james", title: "Colorful demon thigh tattoo", photos: [{ f: "r2-james-james-04.jpg", w: 1080, h: 1240, cap: "Colorful demon thigh tattoo" }] },
    { id: "p-r2-james-james-05", style: "Traditional", artistId: "james", title: "Horse/kirin rib tattoo", photos: [{ f: "r2-james-james-05.jpg", w: 982, h: 1240, cap: "Horse/kirin rib tattoo" }] },
    { id: "p-r2-james-james-06", style: "Paintings", artistId: "james", title: "Shark flash painting", photos: [{ f: "r2-james-james-06.jpg", w: 1080, h: 1252, cap: "Shark flash painting" }] },
    { id: "p-r2-james-james-07", style: "Paintings", artistId: "james", title: "Dragon pencil drawing", photos: [{ f: "r2-james-james-07.jpg", w: 940, h: 1591, cap: "Dragon pencil drawing" }] },
    { id: "p-r2-james-james-08", style: "Black & grey", artistId: "james", title: "Roaring panther head, black & grey", photos: [{ f: "r2-james-james-08.jpg", w: 1080, h: 1241, cap: "Roaring panther head, black & grey" }] },
    { id: "p-r2-james-james-09", style: "Traditional", artistId: "james", title: "Oni/demon face thigh tattoo", photos: [{ f: "r2-james-james-09.jpg", w: 1080, h: 1624, cap: "Oni/demon face thigh tattoo" }] },
    { id: "p-r2-james-james-11", style: "Paintings", artistId: "james", title: "Snake and dagger flash painting", photos: [{ f: "r2-james-james-11.jpg", w: 1080, h: 1072, cap: "Snake and dagger flash painting" }] },
    { id: "set-james-koi-back", style: "Traditional", artistId: "james", title: "Koi full-back bodysuit",
      photos: [
        { f: "r2-james-james-12.jpg", w: 1046, h: 1248, cap: "Koi full-back bodysuit" },
        { f: "r5-james-07.jpg", w: 1000, h: 1008, cap: "Koi full-back bodysuit, wider view" },
      ] },
    { id: "p-r2-james-james-13", style: "Traditional", artistId: "james", title: "Foo dog thigh tattoo", photos: [{ f: "r2-james-james-13.jpg", w: 1080, h: 1684, cap: "Foo dog thigh tattoo" }] },
    { id: "p-r2-james-james-14", style: "Black & grey", artistId: "james", title: "Chrysanthemum blackwork thigh tattoo", photos: [{ f: "r2-james-james-14.jpg", w: 1080, h: 1247, cap: "Chrysanthemum blackwork thigh tattoo" }] },
    { id: "p-r2-james-james-15", style: "Color", artistId: "james", title: "Panther head, color", photos: [{ f: "r2-james-james-15.jpg", w: 1080, h: 1248, cap: "Panther head, color" }] },
    { id: "p-r2-brian-brian-02", style: "Traditional", artistId: "brian", title: "Eagle forearm tattoo", photos: [{ f: "r2-brian-brian-02.jpg", w: 1080, h: 1248, cap: "Eagle forearm tattoo" }] },
    { id: "p-r2-brian-brian-03", style: "Black & grey", artistId: "brian", title: "Eagle and skull full-back piece", photos: [{ f: "r2-brian-brian-03.jpg", w: 1080, h: 1135, cap: "Eagle and skull full-back piece" }] },
    { id: "p-r2-brian-brian-04", style: "Black & grey", artistId: "brian", title: "Eagle claws, close up on skin", photos: [{ f: "r2-brian-brian-04.jpg", w: 1080, h: 1247, cap: "Eagle claws, close up on skin" }] },
    { id: "p-r2-brian-brian-05", style: "Traditional", artistId: "brian", title: "Leopard leg tattoo", photos: [{ f: "r2-brian-brian-05.jpg", w: 1080, h: 1394, cap: "Leopard leg tattoo" }] },
    { id: "p-r2-brian-brian-07", style: "Black & grey", artistId: "brian", title: "Tiger head, black & grey", photos: [{ f: "r2-brian-brian-07.jpg", w: 1080, h: 1247, cap: "Tiger head, black & grey" }] },
    { id: "set-orange-dragon", style: "Traditional", artistId: "brian", title: "Koi/dragon arm tattoo",
      photos: [
        { f: "r2-brian-brian-09.jpg", w: 1080, h: 1338, cap: "Orange dragon torso piece" },
        { f: "r2-brian-brian-08.jpg", w: 1080, h: 1248, cap: "Koi/dragon arm tattoo" },
      ] },
    { id: "set-brian-lady-head", style: "Traditional", artistId: "brian", title: "Lady head with green headscarf, thigh",
      photos: [
        { f: "r2-brian-brian-10.jpg", w: 1080, h: 1166, cap: "Lady head with green headscarf, full view" },
        { f: "r2-brian-brian-19.jpg", w: 1080, h: 1248, cap: "Lady head with green headscarf, close-up" },
      ] },
    { id: "p-r2-brian-brian-11", style: "Traditional", artistId: "brian", title: "Mermaid and ship thigh tattoo", photos: [{ f: "r2-brian-brian-11.jpg", w: 1080, h: 1218, cap: "Mermaid and ship thigh tattoo" }] },
    { id: "p-r2-brian-brian-12", style: "Black & grey", artistId: "brian", title: "Lady head calf tattoo", photos: [{ f: "r2-brian-brian-12.jpg", w: 1080, h: 1242, cap: "Lady head calf tattoo" }] },
    { id: "p-r2-brian-brian-13", style: "Paintings", artistId: "brian", title: "Tiger flash painting", photos: [{ f: "r2-brian-brian-13.jpg", w: 1080, h: 1338, cap: "Tiger flash painting" }] },
    { id: "p-r2-brian-brian-14", style: "Traditional", artistId: "brian", title: "Scorpion hand tattoo", photos: [{ f: "r2-brian-brian-14.jpg", w: 1080, h: 1247, cap: "Scorpion hand tattoo" }] },
    { id: "p-r2-brian-brian-15", style: "Traditional", artistId: "brian", title: "Dragon sleeve torso tattoo", photos: [{ f: "r2-brian-brian-15.jpg", w: 644, h: 1248, cap: "Dragon sleeve torso tattoo" }] },
    { id: "p-r2-brian-brian-16", style: "Black & grey", artistId: "brian", title: "Black and grey ornamental leg sleeve", photos: [{ f: "r2-brian-brian-16.jpg", w: 1080, h: 1247, cap: "Black and grey ornamental leg sleeve" }] },
    { id: "p-r2-brian-brian-17", style: "Traditional", artistId: "brian", title: "Panther, skull and snake thigh piece", photos: [{ f: "r2-brian-brian-17.jpg", w: 1080, h: 1248, cap: "Panther, skull and snake thigh piece" }] },
    { id: "p-r2-brian-brian-18", style: "Black & grey", artistId: "brian", title: "Black and grey scale and chainmail thigh piece", photos: [{ f: "r2-brian-brian-18.jpg", w: 860, h: 1187, cap: "Black and grey scale and chainmail thigh piece" }] },
    { id: "p-r2-brian-brian-20", style: "Traditional", artistId: "brian", title: "Orange flower half sleeve", photos: [{ f: "r2-brian-brian-20.jpg", w: 1080, h: 1248, cap: "Orange flower half sleeve" }] },
    { id: "p-r4-chas-chas-01", style: "Traditional", artistId: "chas", title: "Flame foot tattoo", photos: [{ f: "r4-chas-chas-01.jpg", w: 628, h: 973, cap: "Flame foot tattoo" }] },
    { id: "p-r4-chas-chas-02", style: "Traditional", artistId: "chas", title: "Lotus and snake sleeve, four views", photos: [{ f: "r4-chas-chas-02.jpg", w: 1066, h: 1066, cap: "Lotus and snake sleeve, four views" }] },
    { id: "p-r4-chas-chas-03", style: "Traditional", artistId: "chas", title: "Hannya sleeve", photos: [{ f: "r4-chas-chas-03.jpg", w: 1052, h: 975, cap: "Hannya sleeve, three views" }] },
    { id: "p-r4-chas-chas-04", style: "Traditional", artistId: "chas", title: "Eagle and snake sleeve", photos: [{ f: "r4-chas-chas-04.jpg", w: 1059, h: 1058, cap: "Eagle and snake sleeve, three views" }] },
    { id: "p-r4-chas-chas-05", style: "Traditional", artistId: "chas", title: "Sugar skull chest piece", photos: [{ f: "r4-chas-chas-05.jpg", w: 700, h: 973, cap: "Sugar skull chest piece" }] },
    { id: "p-r4-chas-chas-06", style: "Black & grey", artistId: "chas", title: "Sneaker tattoo", photos: [{ f: "r4-chas-chas-06.jpg", w: 691, h: 1017, cap: "Sneaker tattoo" }] },
    { id: "p-r4-chas-chas-07", style: "Traditional", artistId: "chas", title: "Pine tree and apple tattoo", photos: [{ f: "r4-chas-chas-07.jpg", w: 1049, h: 1049, cap: "Pine tree and apple tattoo" }] },
    { id: "p-r4-chas-chas-08", style: "Traditional", artistId: "chas", title: "Rose hand tattoo", photos: [{ f: "r4-chas-chas-08.jpg", w: 717, h: 979, cap: "Rose hand tattoo" }] },
    { id: "p-r4-chas-chas-09", style: "Traditional", artistId: "chas", title: "Hummingbird tattoo", photos: [{ f: "r4-chas-chas-09.jpg", w: 874, h: 979, cap: "Hummingbird tattoo" }] },
    { id: "p-r4-chas-chas-10", style: "Black & grey", artistId: "chas", title: "Reaper thigh tattoo", photos: [{ f: "r4-chas-chas-10.jpg", w: 718, h: 969, cap: "Reaper thigh tattoo" }] },
    { id: "p-r4-chas-chas-11", style: "Traditional", artistId: "chas", title: "Rose tattoo", photos: [{ f: "r4-chas-chas-11.jpg", w: 722, h: 979, cap: "Rose tattoo" }] },
    { id: "p-r4-chas-chas-12", style: "Black & grey", artistId: "chas", title: "Skull headdress chest tattoo", photos: [{ f: "r4-chas-chas-12.jpg", w: 1049, h: 1049, cap: "Skull headdress chest tattoo" }] },
    { id: "p-r4-chas-chas-13", style: "Traditional", artistId: "chas", title: "Snoopy soldier tattoo", photos: [{ f: "r4-chas-chas-13.jpg", w: 700, h: 1049, cap: "Snoopy soldier tattoo" }] },
    { id: "set-chas-eagle", style: "Black & grey", artistId: "chas", title: "Eagle, black & grey",
      photos: [
        { f: "r4-chas-chas-15.jpg", w: 712, h: 976, cap: "Eagle tattoo close-up" },
        { f: "r4-chas-chas-14.jpg", w: 840, h: 969, cap: "Eagle, black & grey" },
      ] },
    { id: "p-r4-chas-chas-16", style: "Traditional", artistId: "chas", title: "Eagle and flag sleeve panels", photos: [{ f: "r4-chas-chas-16.jpg", w: 1038, h: 1038, cap: "Eagle and flag sleeve panels, three views" }] },
    { id: "p-r4-chas-chas-17", style: "Traditional", artistId: "chas", title: "Dagger through a heart with a swallow, thigh", photos: [{ f: "r4-chas-chas-17.jpg", w: 732, h: 1064, cap: "Dagger through a heart with a swallow, thigh" }] },
    { id: "p-r4-chas-chas-18", style: "Traditional", artistId: "chas", title: "Watermelon slice and flowers", photos: [{ f: "r4-chas-chas-18.jpg", w: 1061, h: 1062, cap: "Watermelon slice and flowers" }] },
    { id: "p-r4-chas-chas-19", style: "Traditional", artistId: "chas", title: "Koi and clockwork shoulder piece", photos: [{ f: "r4-chas-chas-19.jpg", w: 557, h: 981, cap: "Koi and clockwork shoulder piece" }] },
    { id: "p-r4-chas-chas-20", style: "Paintings", artistId: "chas", title: "Ship linework flash", photos: [{ f: "r4-chas-chas-20.jpg", w: 557, h: 980, cap: "Ship linework flash" }] },
    { id: "p-r4-chas-chas-21", style: "Traditional", artistId: "chas", title: "Skull with dagger tattoo", photos: [{ f: "r4-chas-chas-21.jpg", w: 708, h: 1052, cap: "Skull with dagger tattoo" }] },
    { id: "p-r4-chas-chas-22", style: "Black & grey", artistId: "chas", title: "Panther head tattoo", photos: [{ f: "r4-chas-chas-22.jpg", w: 688, h: 975, cap: "Panther head tattoo" }] },
    { id: "p-r4-chas-chas-23", style: "Traditional", artistId: "chas", title: "Panther legs tattoo", photos: [{ f: "r4-chas-chas-23.jpg", w: 1066, h: 982, cap: "Panther legs tattoo" }] },
    { id: "p-r4-thad-thad-01", style: "Traditional", artistId: "thad", title: "Clown face tattoo", photos: [{ f: "r4-thad-thad-01.jpg", w: 678, h: 1038, cap: "Clown face tattoo" }] },
    { id: "p-r4-thad-thad-02", style: "Black & grey", artistId: "thad", title: "Blackwork sleeve", photos: [{ f: "r4-thad-thad-02.jpg", w: 1080, h: 1090, cap: "Blackwork sleeve" }] },
    { id: "p-r4-thad-thad-03", style: "Traditional", artistId: "thad", title: "Eagle back tattoo", photos: [{ f: "r4-thad-thad-03.jpg", w: 1079, h: 791, cap: "Eagle back tattoo" }] },
    { id: "p-r4-thad-thad-04", style: "Traditional", artistId: "thad", title: "Skeleton garden rib piece", photos: [{ f: "r4-thad-thad-04.jpg", w: 1080, h: 1386, cap: "Skeleton garden rib piece" }] },
    { id: "p-r4-thad-thad-05", style: "Traditional", artistId: "thad", title: "Tiger and cherry blossoms rib piece", photos: [{ f: "r4-thad-thad-05.jpg", w: 1080, h: 1248, cap: "Tiger and cherry blossoms rib piece" }] },
    { id: "p-r4-thad-thad-06", style: "Black & grey", artistId: "thad", title: "Skull cowboy thigh tattoo", photos: [{ f: "r4-thad-thad-06.jpg", w: 1080, h: 1248, cap: "Skull cowboy thigh tattoo" }] },
    { id: "p-r4-thad-thad-07", style: "Traditional", artistId: "thad", title: "Rooster head tattoo", photos: [{ f: "r4-thad-thad-07.jpg", w: 1080, h: 1348, cap: "Rooster head tattoo" }] },
    { id: "p-r4-thad-thad-08", style: "Traditional", artistId: "thad", title: "Panther head and dagger, color", photos: [{ f: "r4-thad-thad-08.jpg", w: 1080, h: 1146, cap: "Panther head and dagger, color" }] },
    { id: "p-r4-thad-thad-09", style: "Black & grey", artistId: "thad", title: "Ghostface knife tattoo", photos: [{ f: "r4-thad-thad-09.jpg", w: 1080, h: 1348, cap: "Ghostface knife tattoo" }] },
    { id: "p-r4-thad-thad-11", style: "Traditional", artistId: "thad", title: "Lady head tattoo", photos: [{ f: "r4-thad-thad-11.jpg", w: 1079, h: 886, cap: "Lady head tattoo" }] },
    { id: "set-thad-cards-sleeve", style: "Black & grey", artistId: "thad", title: "Playing cards, dice and rose sleeve",
      photos: [
        { f: "r4-thad-thad-12.jpg", w: 1080, h: 1209, cap: "Playing cards, dice and rose sleeve" },
        { f: "r4-thad-thad-13.jpg", w: 1080, h: 1310, cap: "Money rose, detail of the same sleeve" },
      ] },
    { id: "p-r4-thad-thad-14", style: "Traditional", artistId: "thad", title: "Flame and eagle arm sleeve, healing", photos: [{ f: "r4-thad-thad-14.jpg", w: 1080, h: 1157, cap: "Flame and eagle arm sleeve, healing" }] },
    { id: "p-r4-thad-thad-15", style: "Traditional", artistId: "thad", title: "Wolf with hearts tattoo", photos: [{ f: "r4-thad-thad-15.jpg", w: 1080, h: 1086, cap: "Wolf with hearts tattoo" }] },

    /* September 2026 intake: 23 photos from the shop, all credited to James
       Whelan. 04 was dropped as an identical duplicate of the existing
       "Lady head with flower and skull"; 05, 07 and 21 are different angles of
       tattoos already on the site and joined those cards instead of making new
       ones. See AUDIT.md for the dedup evidence. */
    { id: "p-r5-james-01", style: "Color", artistId: "james", title: "Namakubi severed head", photos: [{ f: "r5-james-01.jpg", w: 1125, h: 1238, cap: "Namakubi severed head" }] },
    { id: "p-r5-james-02", style: "Black & grey", artistId: "james", title: "Lady head with sombrero and rose", photos: [{ f: "r5-james-02.jpg", w: 1000, h: 1089, cap: "Lady head with sombrero and rose" }] },
    { id: "p-r5-james-03", style: "Color", artistId: "james", title: "Demon head with sword", photos: [{ f: "r5-james-03.jpg", w: 1125, h: 975, cap: "Demon head with sword" }] },
    { id: "p-r5-james-06", style: "Black & grey", artistId: "james", title: "Black and grey Japanese sleeve", photos: [{ f: "r5-james-06.jpg", w: 1000, h: 1052, cap: "Black and grey Japanese sleeve" }] },
    { id: "p-r5-james-08", style: "Color", artistId: "james", title: "Tiger head chest piece", photos: [{ f: "r5-james-08.jpg", w: 1000, h: 1121, cap: "Tiger head chest piece" }] },
    { id: "p-r5-james-09", style: "Color", artistId: "james", title: "Wolf head chest piece", photos: [{ f: "r5-james-09.jpg", w: 1125, h: 972, cap: "Wolf head chest piece" }] },
    { id: "p-r5-james-10", style: "Black & grey", artistId: "james", title: "Lady head with skull and roses, chest", photos: [{ f: "r5-james-10.jpg", w: 1125, h: 972, cap: "Lady head with skull and roses, chest" }] },
    { id: "p-r5-james-11", style: "Black & grey", artistId: "james", title: "Snake forearm piece", photos: [{ f: "r5-james-11.jpg", w: 1125, h: 1238, cap: "Snake forearm piece" }] },
    { id: "p-r5-james-12", style: "Color", artistId: "james", title: "Lady head with rose and headscarf", photos: [{ f: "r5-james-12.jpg", w: 1125, h: 1134, cap: "Lady head with rose and headscarf" }] },
    { id: "p-r5-james-13", style: "Black & grey", artistId: "james", title: "Cowboy skull", photos: [{ f: "r5-james-13.jpg", w: 1125, h: 972, cap: "Cowboy skull" }] },
    { id: "p-r5-james-14", style: "Black & grey", artistId: "james", title: "Cowgirl portrait", photos: [{ f: "r5-james-14.jpg", w: 1125, h: 1060, cap: "Cowgirl portrait" }] },
    { id: "p-r5-james-15", style: "Black & grey", artistId: "james", title: "Lady head with skull, black and grey", photos: [{ f: "r5-james-15.jpg", w: 1125, h: 1050, cap: "Lady head with skull, black and grey" }] },
    { id: "p-r5-james-16", style: "Color", artistId: "james", title: "Hannya mask", photos: [{ f: "r5-james-16.jpg", w: 1125, h: 1090, cap: "Hannya mask" }] },
    { id: "p-r5-james-17", style: "Black & grey", artistId: "james", title: "Rose, black and grey", photos: [{ f: "r5-james-17.jpg", w: 1125, h: 972, cap: "Rose, black and grey" }] },
    { id: "p-r5-james-18", style: "Black & grey", artistId: "james", title: "Sacred heart with cross", photos: [{ f: "r5-james-18.jpg", w: 1125, h: 1613, cap: "Sacred heart with cross" }] },
    { id: "p-r5-james-19", style: "Color", artistId: "james", title: "Eagle with leaves, forearm", photos: [{ f: "r5-james-19.jpg", w: 1125, h: 1238, cap: "Eagle with leaves, forearm" }] },
    { id: "p-r5-james-20", style: "Color", artistId: "james", title: "Snake on the stomach, red and black", photos: [{ f: "r5-james-20.jpg", w: 833, h: 944, cap: "Snake on the stomach, red and black" }] },
    { id: "p-r5-james-22", style: "Black & grey", artistId: "james", title: "Eagle chest piece, black and grey", photos: [{ f: "r5-james-22.jpg", w: 833, h: 660, cap: "Eagle chest piece, black and grey" }] },
    { id: "p-r5-james-23", style: "Color", artistId: "james", title: "Chrysanthemum, color", photos: [{ f: "r5-james-23.jpg", w: 826, h: 677, cap: "Chrysanthemum, color" }] },

    /* The three ex-Lettering pieces. They are colour work with script in
       them, not a category of their own, and they sit last in projects so
       they land at the end of the Color filter. All three are the shop's
       attribution to Thadius Gardner. */
    { id: "p-orig-os-4503448", style: "Color", artistId: "thad", title: "Script with bow", photos: [{ f: "orig-os-4503448.jpg", w: 480, h: 640, cap: "Script with bow" }] },
    { id: "p-orig-os-4503445", style: "Color", artistId: "thad", title: "Skull with lettering", photos: [{ f: "orig-os-4503445.jpg", w: 480, h: 640, cap: "Skull with lettering" }] },
    { id: "p-orig-os-4503431", style: "Color", artistId: "thad", title: "Horseshoe with script", photos: [{ f: "orig-os-4503431.jpg", w: 270, h: 480, cap: "Horseshoe with script" }] },

  ]
};
