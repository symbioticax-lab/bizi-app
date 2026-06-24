export type MockOpportunity = {
  title: string;
  description: string;
  offering_title: string;
  offering_desc: string;
  offering_tags: string[];
  want_title: string;
  want_desc: string;
  want_tags: string[];
  category: string;
};

export type MockAccount = {
  email: string;
  displayName: string;
  bio: string;
  skills: string[];
  location: string;
  category: string;
  opportunities: MockOpportunity[];
};

export const MOCK_ACCOUNTS: MockAccount[] = [
  // ── Photography (4) ──────────────────────────────────────────────────────────
  {
    email: "maya.chen@seed.bizi.app",
    displayName: "Maya Chen",
    bio: "NYC-based editorial and portrait photographer with 8 years of experience. I specialize in authentic storytelling for brands, artists, and editorial clients. My work has appeared in Vogue, Harper's Bazaar, and various ad campaigns.",
    skills: ["Portrait Photography", "Editorial", "Brand Campaigns", "Photo Editing", "Art Direction"],
    location: "New York, NY",
    category: "Photography",
    opportunities: [
      {
        title: "Editorial Photographer for Fashion Brand Lookbook",
        description: "Looking to collaborate on a seasonal lookbook for an emerging fashion label. I'll shoot 2 days on location in NYC, delivering 40 fully edited hero images plus selects.",
        offering_title: "2-day editorial shoot + full editing",
        offering_desc: "Professional lighting, styling support, and 40 fully retouched images delivered in 2 weeks.",
        offering_tags: ["Editorial", "Fashion", "Lookbook", "NYC"],
        want_title: "$1,500–$2,500 creative fee",
        want_desc: "Creative fee plus co-branding rights for portfolio use.",
        want_tags: ["Paid", "Creative Fee"],
        category: "Photography",
      },
      {
        title: "Seeking Videographer to Trade Content Creation",
        description: "I'd love to swap skills with a talented videographer — I'll shoot portraits or product photography in exchange for BTS video content of my shoots.",
        offering_title: "1-day portrait or product shoot (25 final images)",
        offering_desc: "Full day photography session with professional editing. 25 final images delivered.",
        offering_tags: ["Portrait", "Product", "Trade"],
        want_title: "BTS video reel (1–3 min)",
        want_desc: "Polished behind-the-scenes reel for Instagram and portfolio use.",
        want_tags: ["Video", "Reel", "Exchange"],
        category: "Photography",
      },
    ],
  },
  {
    email: "jordan.reyes@seed.bizi.app",
    displayName: "Jordan Reyes",
    bio: "Los Angeles-based commercial and lifestyle photographer. I work with fitness brands, wellness companies, and athletes to create scroll-stopping imagery. Comfortable shooting both in studio and on location across Southern California.",
    skills: ["Commercial Photography", "Lifestyle", "Fitness & Sports", "Drone", "Retouching"],
    location: "Los Angeles, CA",
    category: "Photography",
    opportunities: [
      {
        title: "Fitness Brand Content Package — Photos + Drone",
        description: "Offering a full-day commercial shoot for fitness brands including ground photography and licensed drone footage. Perfect for supplement companies, gyms, and athleisure brands.",
        offering_title: "Full-day shoot: 50 edited photos + 5 drone clips",
        offering_desc: "8-hour shoot day with ground and aerial content. 50 edited photos and 5 drone clips delivered.",
        offering_tags: ["Commercial", "Fitness", "Drone", "LA"],
        want_title: "$2,000 flat or product equity deal",
        want_desc: "Flat rate or equity arrangement for early-stage brands.",
        want_tags: ["Paid", "Equity"],
        category: "Photography",
      },
    ],
  },
  {
    email: "elena.vasquez@seed.bizi.app",
    displayName: "Elena Vasquez",
    bio: "Miami-based food and hospitality photographer with a rich, saturated aesthetic. I've worked with James Beard-nominated restaurants, luxury hotels, and beverage brands. My images make people hungry.",
    skills: ["Food Photography", "Hospitality", "Product Styling", "Color Grading", "Social Content"],
    location: "Miami, FL",
    category: "Photography",
    opportunities: [
      {
        title: "Food Photography Session — Trade for Catering",
        description: "Offering a 4-hour food photography session in exchange for catering for a private event. Win-win for any restaurant wanting stunning content.",
        offering_title: "4-hour food photography session (30 final images)",
        offering_desc: "In-restaurant or studio shoot. 30 final edited images. Social and print ready.",
        offering_tags: ["Food", "Restaurant", "Social Content"],
        want_title: "Catering for 30-person private dinner",
        want_desc: "Looking for catering (appetizers + main) for a private dinner in Miami.",
        want_tags: ["Catering", "Event", "Exchange"],
        category: "Photography",
      },
    ],
  },
  {
    email: "marcus.johnson@seed.bizi.app",
    displayName: "Marcus Johnson",
    bio: "Chicago-based music and event photographer who's captured artists from underground shows to arena stages. I bring the energy of the room into every frame.",
    skills: ["Concert Photography", "Event Coverage", "Low-light", "Post-Processing", "Press Kits"],
    location: "Chicago, IL",
    category: "Photography",
    opportunities: [
      {
        title: "Tour / Event Photographer for Music Artists",
        description: "Available to travel for concert and tour photography. I deliver fast turnarounds for press and social use. Past clients include artists on Atlantic, Columbia, and indie labels.",
        offering_title: "Full event coverage + 24hr delivery (20 press images)",
        offering_desc: "100+ selects delivered, 20 fully retouched press-ready images within 24 hours.",
        offering_tags: ["Concert", "Music", "Events", "Press"],
        want_title: "$800/show + travel covered",
        want_desc: "Day rate of $800 plus hotel and flights for out-of-city shows.",
        want_tags: ["Paid", "Travel Included"],
        category: "Photography",
      },
    ],
  },

  // ── Design (3) ───────────────────────────────────────────────────────────────
  {
    email: "priya.nair@seed.bizi.app",
    displayName: "Priya Nair",
    bio: "Brand strategist and visual identity designer based in Austin. I help early-stage startups and creative businesses build memorable brands from scratch — logo, color system, typography, and brand guidelines.",
    skills: ["Brand Identity", "Logo Design", "Typography", "Figma", "Brand Strategy"],
    location: "Austin, TX",
    category: "Design",
    opportunities: [
      {
        title: "Full Brand Identity Package for Early-Stage Startup",
        description: "Offering a complete brand identity package including logo, color palette, typography system, and a 20-page brand guidelines PDF. Perfect for pre-seed or bootstrapped companies.",
        offering_title: "Logo + color system + typography + Figma brand kit",
        offering_desc: "3-week project. Primary logo + variations, color system, type system, and shareable Figma brand kit.",
        offering_tags: ["Brand", "Logo", "Identity", "Figma"],
        want_title: "$3,500 or equity + monthly retainer",
        want_desc: "Flat fee of $3,500 or a small equity stake plus a 3-month retainer for ongoing design work.",
        want_tags: ["Paid", "Equity Option"],
        category: "Design",
      },
    ],
  },
  {
    email: "soren.alves@seed.bizi.app",
    displayName: "Soren Alves",
    bio: "Motion designer and animator in San Francisco. I create brand animations, explainer videos, and social-first motion content. My work blends clean minimalism with kinetic energy.",
    skills: ["Motion Design", "After Effects", "Cinema 4D", "Animation", "Social Content"],
    location: "San Francisco, CA",
    category: "Design",
    opportunities: [
      {
        title: "Brand Motion Package — Logo Animation + Social Templates",
        description: "Offering a complete motion brand package: animated logo reveal, 10 social templates, and a brand intro for video content. Ideal for brands launching on social.",
        offering_title: "Animated logo + 10 social motion templates",
        offering_desc: "2-week turnaround. Delivered in After Effects + exported MP4/GIF for immediate use.",
        offering_tags: ["Motion", "Animation", "Social", "Branding"],
        want_title: "$2,200 flat or content collab",
        want_desc: "Flat rate or open to trading for brand photography / copywriting.",
        want_tags: ["Paid", "Exchange Option"],
        category: "Design",
      },
    ],
  },
  {
    email: "kemi.okafor@seed.bizi.app",
    displayName: "Kemi Okafor",
    bio: "UI/UX designer based in NYC specializing in consumer apps and e-commerce experiences. I've shipped products at both funded startups and Fortune 500 companies. I love working with founders to turn messy ideas into clean, intuitive interfaces.",
    skills: ["UI Design", "UX Research", "Figma", "Prototyping", "Design Systems"],
    location: "New York, NY",
    category: "Design",
    opportunities: [
      {
        title: "MVP App Design — 5 Screens to Investor-Ready",
        description: "Helping early-stage founders get their app to investor-ready design in 2 weeks. I'll take your wireframes or rough idea and deliver polished Figma screens with a clickable prototype.",
        offering_title: "5-screen app design + clickable Figma prototype",
        offering_desc: "2-week sprint. UX audit, redesigned screens, and shareable Figma prototype.",
        offering_tags: ["UI/UX", "App Design", "MVP", "Figma"],
        want_title: "$4,000 or 2% rev-share (first 12 months)",
        want_desc: "Flat rate of $4,000 or a 2% revenue share for the first 12 months post-launch.",
        want_tags: ["Paid", "Revenue Share"],
        category: "Design",
      },
    ],
  },

  // ── Music / Audio (3) ────────────────────────────────────────────────────────
  {
    email: "darius.cole@seed.bizi.app",
    displayName: "Darius Cole",
    bio: "Nashville-based music producer and songwriter with credits across R&B, hip-hop, and pop. I've worked with independent artists, sync licensing deals, and produced two tracks that charted on Billboard's Hot 100.",
    skills: ["Music Production", "Songwriting", "Mixing", "Mastering", "Studio Recording"],
    location: "Nashville, TN",
    category: "Music",
    opportunities: [
      {
        title: "Full EP Production for Independent Artist",
        description: "Offering full production for a 5-7 track EP. I handle beats, arrangement, recording direction, mixing, and mastering. Let's make something that could get you signed.",
        offering_title: "Full EP production: beats, mixing & mastering (5–7 tracks)",
        offering_desc: "6-8 week process. Full creative collaboration. Delivered radio-ready WAVs and stems.",
        offering_tags: ["Production", "EP", "R&B", "Hip-Hop"],
        want_title: "20% royalty split or $8,000 flat",
        want_desc: "Industry-standard 20% producer points or a flat creative fee.",
        want_tags: ["Royalties", "Paid Option"],
        category: "Music",
      },
    ],
  },
  {
    email: "leila.hamid@seed.bizi.app",
    displayName: "Leila Hamid",
    bio: "Los Angeles-based singer-songwriter and vocal producer. I write and perform across indie-pop, dream-pop, and alternative R&B. My voice has been licensed in TV, podcasts, and advertising campaigns.",
    skills: ["Songwriting", "Vocal Production", "Sync Licensing", "Indie Pop", "Session Vocals"],
    location: "Los Angeles, CA",
    category: "Music",
    opportunities: [
      {
        title: "Original Song + Vocal for Brand or Podcast",
        description: "Offering an original composed and performed song for brand campaigns, podcast intros, or short-form content. Fully licensed and production-ready.",
        offering_title: "Custom original song with full vocal performance",
        offering_desc: "2-3 week turnaround. 2 revision rounds. Delivered as WAV with sync license.",
        offering_tags: ["Songwriting", "Vocals", "Sync", "Brand"],
        want_title: "$1,500 flat + sync license fee",
        want_desc: "Flat creative fee plus a one-time sync license for the agreed media use.",
        want_tags: ["Paid", "Sync License"],
        category: "Music",
      },
    ],
  },
  {
    email: "andre.brooks@seed.bizi.app",
    displayName: "Andre Brooks",
    bio: "Atlanta-based audio engineer and podcast producer. I specialize in making voices sound broadcast-quality — from celebrity podcasts to brand audio content. My studio has hosted Grammy-nominated artists and top-ranked podcasters.",
    skills: ["Audio Engineering", "Podcast Production", "Mixing", "Sound Design", "Voiceover Direction"],
    location: "Atlanta, GA",
    category: "Music",
    opportunities: [
      {
        title: "Podcast Audio Production — Full Service",
        description: "Offering full podcast production: recording direction, editing, mixing, music licensing, and episode publishing. From raw conversation to publish-ready in 48 hours.",
        offering_title: "Full podcast production: record, edit, mix & publish",
        offering_desc: "Per-episode or monthly retainer. 48hr turnaround. Includes music beds and sound design.",
        offering_tags: ["Podcast", "Audio", "Editing", "Production"],
        want_title: "$300/episode or $1,200/month retainer",
        want_desc: "Per-episode pricing or a monthly retainer for up to 6 episodes.",
        want_tags: ["Paid", "Retainer"],
        category: "Music",
      },
    ],
  },

  // ── Development (2) ──────────────────────────────────────────────────────────
  {
    email: "alex.park@seed.bizi.app",
    displayName: "Alex Park",
    bio: "Full-stack developer (TypeScript, Next.js, Supabase) open to product collaborations. I've built and shipped 3 SaaS products as a solo founder and love partnering with designers who need a technical co-founder.",
    skills: ["TypeScript", "Next.js", "Supabase", "React", "Node.js"],
    location: "Remote",
    category: "Development",
    opportunities: [
      {
        title: "Technical Co-Founder / CTO for Creative Tech Startup",
        description: "Open to joining a creative or media startup as technical co-founder or fractional CTO. I'll build the MVP, set up infrastructure, and lead engineering for equity.",
        offering_title: "Full-stack MVP build + technical leadership (3 months)",
        offering_desc: "Full MVP build, CI/CD setup, database architecture, and weekly stakeholder updates.",
        offering_tags: ["Full-Stack", "CTO", "MVP", "Co-Founder"],
        want_title: "5–10% equity + advisory role",
        want_desc: "Meaningful equity stake plus a board advisory seat.",
        want_tags: ["Equity", "Co-Founder"],
        category: "Development",
      },
    ],
  },
  {
    email: "jamie.torres@seed.bizi.app",
    displayName: "Jamie Torres",
    bio: "Mobile developer (iOS + React Native) based in NYC. I build polished consumer apps for creators, artists, and small businesses. I specialize in turning Figma designs into pixel-perfect, performant apps.",
    skills: ["React Native", "iOS", "Swift", "Mobile UI", "App Store Optimization"],
    location: "New York, NY",
    category: "Development",
    opportunities: [
      {
        title: "Mobile App Build — Figma to App Store in 8 Weeks",
        description: "If you have a Figma design and a clear product spec, I'll build your iOS/Android app and get it to the App Store. No hand-waving — I ship.",
        offering_title: "React Native app: Figma → App Store (iOS + Android)",
        offering_desc: "8-week timeline. Includes App Store submission and 30 days post-launch support.",
        offering_tags: ["Mobile", "React Native", "iOS", "Android"],
        want_title: "$15,000 or milestone-based + 3% equity",
        want_desc: "Flat rate or milestone-based payments with a 3% equity kicker.",
        want_tags: ["Paid", "Equity Option"],
        category: "Development",
      },
    ],
  },

  // ── Writing (2) ──────────────────────────────────────────────────────────────
  {
    email: "camille.osei@seed.bizi.app",
    displayName: "Camille Osei",
    bio: "Boston-based copywriter and brand strategist. I help brands find their voice and tell stories that convert. I've written for tech startups, DTC brands, and editorial outlets including Fast Company and TechCrunch.",
    skills: ["Copywriting", "Brand Voice", "Content Strategy", "SEO", "Editorial Writing"],
    location: "Boston, MA",
    category: "Writing",
    opportunities: [
      {
        title: "Brand Copywriting Package — Website + Email Sequences",
        description: "Offering a full brand copy package: homepage, about page, 5-email welcome sequence, and brand voice guide. Everything a DTC or SaaS brand needs to launch with confidence.",
        offering_title: "Website copy + 5-email welcome sequence + brand voice guide",
        offering_desc: "3-week project. 2 rounds of revisions. Final Google Docs delivery.",
        offering_tags: ["Copywriting", "Website", "Email", "Brand Voice"],
        want_title: "$3,800 or 6-month content retainer",
        want_desc: "One-time flat rate or a 6-month monthly retainer for ongoing content.",
        want_tags: ["Paid", "Retainer"],
        category: "Writing",
      },
    ],
  },
  {
    email: "nadia.voss@seed.bizi.app",
    displayName: "Nadia Voss",
    bio: "LA-based ghostwriter and content strategist for thought leaders, executives, and creative professionals. I've ghostwritten two books, 200+ LinkedIn posts, and a newsletter that grew to 40K subscribers.",
    skills: ["Ghostwriting", "LinkedIn Content", "Newsletters", "Long-form Writing", "Personal Branding"],
    location: "Los Angeles, CA",
    category: "Writing",
    opportunities: [
      {
        title: "Thought Leadership Ghostwriting — LinkedIn + Newsletter",
        description: "Offering a monthly ghostwriting package: 8 LinkedIn posts, 4 newsletter issues, and a content calendar. I capture your voice and amplify your expertise.",
        offering_title: "8 LinkedIn posts + 4 newsletters + content calendar/month",
        offering_desc: "Monthly rolling engagement. Interview sessions to capture voice. Published under your name.",
        offering_tags: ["Ghostwriting", "LinkedIn", "Newsletter", "Thought Leadership"],
        want_title: "$2,500/month retainer (3-month min)",
        want_desc: "Monthly retainer of $2,500 with a minimum 3-month commitment.",
        want_tags: ["Paid", "Retainer"],
        category: "Writing",
      },
    ],
  },

  // ── Marketing (3) ────────────────────────────────────────────────────────────
  {
    email: "tyler.marsh@seed.bizi.app",
    displayName: "Tyler Marsh",
    bio: "Performance marketing specialist in NYC with 7 years running paid media for DTC and e-commerce brands. I've managed $2M+ in ad spend across Meta, TikTok, and Google. ROI-obsessed.",
    skills: ["Paid Media", "Meta Ads", "TikTok Ads", "Google Ads", "Analytics"],
    location: "New York, NY",
    category: "Marketing",
    opportunities: [
      {
        title: "Paid Ads Management for E-Commerce Brand — Full Service",
        description: "Offering full paid media management for an e-commerce or DTC brand. Includes creative brief, ad setup, weekly optimization, and monthly reporting.",
        offering_title: "Full paid media management: Meta + TikTok + Google",
        offering_desc: "Monthly engagement. Setup + ongoing optimization. Weekly reporting and strategy calls.",
        offering_tags: ["Paid Ads", "Meta", "TikTok", "E-Commerce"],
        want_title: "$3,500/month + 10% of ad spend",
        want_desc: "Management fee plus 10% of monthly ad spend managed.",
        want_tags: ["Paid", "Retainer"],
        category: "Marketing",
      },
    ],
  },
  {
    email: "sofia.reyes@seed.bizi.app",
    displayName: "Sofia Reyes",
    bio: "Miami-based influencer manager and UGC content creator. I manage brand deals for nano and micro-influencers and create authentic UGC content for brands that want to feel real on TikTok and Instagram.",
    skills: ["Influencer Management", "UGC Creation", "TikTok", "Instagram", "Brand Deals"],
    location: "Miami, FL",
    category: "Marketing",
    opportunities: [
      {
        title: "UGC Content Package — 10 Videos for TikTok or Reels",
        description: "Creating 10 authentic UGC-style videos for a brand's TikTok or Instagram Reels. No scripts — natural storytelling that converts. I handle scripting, filming, and editing.",
        offering_title: "10 UGC-style videos (raw + edited, 30–60 sec each)",
        offering_desc: "2-week delivery. 10 vertical videos. Scripted but natural. Includes 2 revisions.",
        offering_tags: ["UGC", "TikTok", "Reels", "Content"],
        want_title: "$1,800 flat or gifting + reduced fee",
        want_desc: "Flat rate or product gifting plus a reduced fee for new brands.",
        want_tags: ["Paid", "Gifting Option"],
        category: "Marketing",
      },
    ],
  },
  {
    email: "devon.walsh@seed.bizi.app",
    displayName: "Devon Walsh",
    bio: "Growth marketer and SEO strategist in Chicago. I've helped 15+ B2B SaaS companies grow from 0 to 50K monthly organic visitors. I combine technical SEO with content strategy that actually ranks.",
    skills: ["SEO", "Content Marketing", "Growth Strategy", "Technical SEO", "Analytics"],
    location: "Chicago, IL",
    category: "Marketing",
    opportunities: [
      {
        title: "SEO & Content Strategy Audit + 90-Day Roadmap",
        description: "Offering a comprehensive SEO audit and 90-day content strategy roadmap. I'll show you exactly what to fix and what to build to double your organic traffic.",
        offering_title: "SEO audit + keyword gap analysis + 90-day content roadmap",
        offering_desc: "2-week delivery. Technical audit, keyword gap analysis, content calendar, and priority action list.",
        offering_tags: ["SEO", "Content Strategy", "Audit", "B2B"],
        want_title: "$2,500 project fee",
        want_desc: "One-time project fee. Ongoing implementation retainer available after delivery.",
        want_tags: ["Paid"],
        category: "Marketing",
      },
    ],
  },

  // ── Business & Consulting (2) ─────────────────────────────────────────────────
  {
    email: "marcus.webb@seed.bizi.app",
    displayName: "Marcus Webb",
    bio: "NYC-based business consultant and former Goldman Sachs analyst. I help creative entrepreneurs and early-stage founders turn their ideas into fundable businesses — pitch decks, financial models, and go-to-market strategy.",
    skills: ["Business Strategy", "Pitch Decks", "Financial Modeling", "Fundraising", "Go-to-Market"],
    location: "New York, NY",
    category: "Business & Consulting",
    opportunities: [
      {
        title: "Investor-Ready Pitch Deck + Financial Model",
        description: "Offering a complete pitch deck (12 slides) and financial model (3-year projection) for early-stage founders raising their first round. Designed to impress VCs and angels.",
        offering_title: "12-slide pitch deck + 3-year financial model",
        offering_desc: "2-week project. 2 rounds of revision and a 1-hour pitch coaching session.",
        offering_tags: ["Pitch Deck", "Financial Model", "Fundraising", "Startup"],
        want_title: "$4,500 or 0.5–1% advisory equity",
        want_desc: "Flat rate of $4,500 or advisory equity for pre-seed companies.",
        want_tags: ["Paid", "Equity Option"],
        category: "Business & Consulting",
      },
    ],
  },
  {
    email: "ana.souza@seed.bizi.app",
    displayName: "Ana Souza",
    bio: "San Francisco-based operations consultant and fractional COO. I help scaling startups build the systems, processes, and teams they need to grow without breaking. Background in ops at two unicorns.",
    skills: ["Operations Strategy", "Process Design", "Team Building", "OKRs", "Fractional COO"],
    location: "San Francisco, CA",
    category: "Business & Consulting",
    opportunities: [
      {
        title: "Fractional COO — 20 Hours/Month",
        description: "Available as a fractional COO for Series A or growth-stage startups. I'll own operations: hiring processes, vendor management, OKR setting, and cross-functional alignment.",
        offering_title: "Fractional COO: 20 hrs/month operations leadership",
        offering_desc: "Monthly rolling engagement. Weekly ops calls, process documentation, and executive reporting.",
        offering_tags: ["COO", "Operations", "Fractional", "Startup"],
        want_title: "$6,000/month + 0.25% equity",
        want_desc: "Monthly retainer plus a 0.25% equity stake vesting over 2 years.",
        want_tags: ["Paid", "Equity"],
        category: "Business & Consulting",
      },
    ],
  },

  // ── Health & Wellness (1) ────────────────────────────────────────────────────
  {
    email: "zara.patel@seed.bizi.app",
    displayName: "Zara Patel",
    bio: "Austin-based certified wellness coach, yoga instructor, and content creator. I help entrepreneurs and creative professionals build sustainable wellness practices that support their work — not compete with it.",
    skills: ["Wellness Coaching", "Yoga", "Breathwork", "Content Creation", "Mindfulness"],
    location: "Austin, TX",
    category: "Health & Wellness",
    opportunities: [
      {
        title: "Corporate Wellness Program for Remote Teams",
        description: "Offering a 4-week virtual wellness program for remote teams: daily breathwork sessions, weekly yoga classes, and a wellness challenge framework.",
        offering_title: "4-week virtual wellness program (daily breathwork + weekly yoga)",
        offering_desc: "Daily 10-min breathwork + weekly 60-min yoga class + wellness resources PDF. Up to 20 participants.",
        offering_tags: ["Wellness", "Remote Teams", "Yoga", "Mindfulness"],
        want_title: "$1,200 per team cohort",
        want_desc: "Flat rate per cohort of up to 20 participants.",
        want_tags: ["Paid"],
        category: "Health & Wellness",
      },
      {
        title: "1:1 Executive Wellness Coaching — Trade for Brand Work",
        description: "Offering 4 sessions of 1:1 executive wellness coaching in exchange for brand design or content work to grow my wellness practice.",
        offering_title: "4 × 60-min 1:1 wellness coaching sessions",
        offering_desc: "Personalized wellness plan, stress management techniques, and accountability check-ins.",
        offering_tags: ["Coaching", "1:1", "Executive", "Wellness"],
        want_title: "Brand design or social content (exchange)",
        want_desc: "Logo refresh OR 4 weeks of social content (8 posts) for my Instagram wellness account.",
        want_tags: ["Exchange", "Design", "Content"],
        category: "Health & Wellness",
      },
    ],
  },
];
