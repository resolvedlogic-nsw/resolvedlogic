# InspireU Disability Support — Website

## Folder Structure
```
project_root/
├── static/
│   ├── css/
│   │   └── style.css          ← All shared styles
│   ├── js/
│   │   └── main.js            ← Nav, scroll reveal, form handling
│   └── img/
│       ├── coast.png          ← Hero background (place your image here)
│       └── ...                ← Team photos, other images
├── templates/
│   ├── index.html             ← Home page
│   ├── about.html             ← About Us
│   ├── services.html          ← Services (all 5)
│   ├── who-we-support.html    ← Who We Support
│   ├── our-approach.html      ← Our Approach + Why Choose Us
│   ├── meet-the-team.html     ← Meet the Team (all 8 bios)
│   ├── service-area.html      ← Service Area
│   └── contact.html           ← Contact + Enquiry Form
└── README.md
```

## Setup
1. Place `coast.png` (hero photo) in `static/img/`
2. Open `templates/index.html` in a browser — works immediately as static HTML
3. Placeholder images use Unsplash URLs — replace with real team/client photos
4. To go live: upload to any web host, or point a developer to wire up the contact form

## Contact Form
- Currently shows a success message on submit (simulated)
- Wire up to **Formspree**, **Netlify Forms**, or your backend
- Job application resume upload field is included

## Images to Replace
- `static/img/coast.png` — your aerial coastline hero photo
- Team photos in `meet-the-team.html` — replace Unsplash URLs with real photos
- Content photos throughout — all currently use free Unsplash placeholder images

## Notes
- All pages are fully accessible (WCAG AA): skip links, ARIA, focus indicators
- Responsive: mobile, tablet, desktop
- Scroll-reveal animations on all key elements
- Active nav link automatically highlighted per page
- Mobile hamburger menu included
