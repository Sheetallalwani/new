# Suruchi's Birthday Surprise 🌻

A 5-page interactive birthday site. Plain HTML/CSS/JS, so there is no build step and it works on GitHub Pages as it is.

**Page flow:** balloons → ORS reminder → chocolate #1 → chocolate #2 → "Happy Birthday" + message

## Change any text
Open `config.js`. Every message on the site is in there (the name, the chocolate messages, the final line, the button labels). Save, refresh, done.

## Put it online with GitHub Pages (free)

**Option A - no command line (easiest)**
1. On github.com click **New repository**, name it e.g. `suruchi-birthday`, keep it **Public**, create it.
2. Click **uploading an existing file**, drag in **everything inside this folder** (all the `.html` files, `style.css`, `app.js`, `config.js` and the `assets` folder), then **Commit changes**.
3. Go to **Settings → Pages**. Under *Build and deployment* choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
4. Wait about a minute. Your link will be:
   `https://<your-github-username>.github.io/suruchi-birthday/`

**Option B - command line**
```bash
cd suruchi-birthday
git init
git add .
git commit -m "Birthday surprise"
git branch -M main
git remote add origin https://github.com/<your-username>/suruchi-birthday.git
git push -u origin main
```
Then do step 3 above.

## Test it before sending
Open `index.html` by double-clicking it. Everything works offline except the two Google fonts (it falls back to a normal font without internet).
Best on a phone. Do a full run-through yourself first, and keep the sound on 🔊.

## Files
| File | What it is |
|---|---|
| `index.html` | Page 1 - Happy Birthday + balloons |
| `ors.html` | Page 2 - ORS reminder |
| `shot1.html`, `shot2.html` | Pages 3 and 4 - the two chocolate blasts |
| `happy.html` | Page 5 - finale and message |
| `config.js` | All the text |
| `style.css`, `app.js` | Look and animations |
| `assets/` | Your Cadbury Shots and ORS photos |
