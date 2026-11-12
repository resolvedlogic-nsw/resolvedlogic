# Updating the site

The pages you see at the top level of this folder (`index.html`, `designs.html`, `about.html`, `contact.html`, `terms.html`, `privacy.html`) are **generated**. Edit the files in `src/` and run the build. Do not edit the generated pages directly; the next build overwrites them.

## The one command

```
python build.py
```

Needs Python 3.11 or newer and nothing else. To preview, run `python -m http.server 8080` in this folder and open http://127.0.0.1:8080.

If you edit files on github.com instead, the workflow in `.github/workflows/build.yml` runs the build for you and commits the result. (Set up but not yet proven on this repo. Check the Actions tab after your first edit.)

## Where things live

| To change | Edit |
|---|---|
| Email, location, ABN, tagline, menu links, contact form address | `src/data/site.toml` |
| Case studies (add, remove, reorder, reword) | `src/data/projects.toml` |
| Process steps, "four rules", capabilities | `src/data/content.toml` |
| Wording on Home, About, Contact, Terms, Privacy | the matching file in `src/pages/` |
| Header or footer on every page | `src/partials/header.html`, `footer.html` |
| Colours, fonts, spacing | `style.css` (not generated) |
| Home page hero animation | `hero.js` (not generated) |

## Add a case study

1. Open `src/data/projects.toml` and copy any `[[project]]` block, including its `[[project.features]]` blocks.
2. Paste it where you want it to appear. Numbers (01, 02...) are worked out automatically.
3. Edit the text. `images` is a list of screenshots in `static/img/`. `stats` are the small pills under the text. `ledger = true` also shows its before/after on the home page.
4. Run `python build.py`.

Features are written as `"Label: description"`. The part before the colon is shown in bold.

## Add your photo to About

Save it as `static/img/portrait.jpg` (portrait orientation, roughly 4:5) and run `python build.py`. The placeholder panel is replaced.

## Notes

- Old links to `home.html` still work. They redirect to the home page.
- The Terms and Privacy pages are written as "we". Everything else is written as "I".
