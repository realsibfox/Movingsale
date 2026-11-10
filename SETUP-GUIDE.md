# Moving Sale — Setup Guide

This guide is written for someone who doesn't write code. You do the setup once, which takes about 30 minutes. After that, adding items and marking them sold all happens on your phone.

**How it fits together**

```
Google Form (on your phone)  →  Google Sheet  →  Website
   title, price, photos           one row per item    reads the sheet
                                  you type "Sold" here
Photos  →  a Google Drive folder (created automatically by the Form)
```

---

## Step 1 — Create the Google Form (do this on a computer, once)

1. Go to **forms.google.com** and start a **Blank form**. Name it something like `Moving sale items`.
2. Add these questions. **Use these exact question titles**, because the website looks for them:

| Question title | Type | Notes |
|---|---|---|
| `Title` | Short answer | Required |
| `Description` | Paragraph | Optional |
| `Price` | Short answer | Numbers only, e.g. `45`. Use `0` for free items. |
| `Category` | Dropdown | Options: `Furniture`, `Kitchen`, `Clothing`, `Home & Linens`, `Electronics`, `Decor`, `Other` |
| `Photos` | File upload | Allow only **Image**, max **10** files, max size **10 MB** |

   **Choosing your own categories:** the dropdown options *are* your categories. Add, rename or remove them as you like. See "Managing categories" below.

3. Click the **Responses** tab, then **Link to Sheets**, then **Create a new spreadsheet**.

## Step 2 — Set up the Google Sheet (once)

The sheet will have these columns: **A** Timestamp, **B** Title, **C** Description, **D** Price, **E** Category, **F** Photos.

Type these headers in row 1 of the next empty columns:

| Column | Row 1 (paste this exactly) |
|---|---|
| **G** | `Status` |
| **H** | `={"Title ES"; MAP(B2:B, LAMBDA(x, IF(x="", "", GOOGLETRANSLATE(x, "en", "es"))))}` |
| **I** | `={"Description ES"; MAP(C2:C, LAMBDA(x, IF(x="", "", GOOGLETRANSLATE(x, "en", "es"))))}` |

The formulas go in **row 1**: each one writes its own header and then fills the column below it. Leave everything under H1 and I1 empty. (A formula in row 2 breaks when the Form adds a new row, and shows `#REF!`.)

Columns H and I now fill with a Spanish translation automatically for every new item.

**Fixing a bad translation (optional).** Don't type over column H or I, because that breaks the formula. Instead, add a column **J** called `Title ES fix` and a column **K** called `Description ES fix`. Anything you type there is used instead of the automatic translation.

## Step 3 — Let the website show the photos (once)

1. Open **drive.google.com**. The Form created a folder named something like `Moving sale items (File responses)`.
2. Right-click that folder, choose **Share**, and under *General access* pick **Anyone with the link** → **Viewer**. Then click **Done**.

**Privacy:** phone photos can store the GPS location where they were taken, and anyone who opens a photo file could see it. Before you start taking photos, turn off location tagging in your camera:
- iPhone: *Settings → Privacy & Security → Location Services → Camera → Never*
- Android: open the Camera app *settings* and turn off *Location tags* (or *Save location*)

## Step 4 — Connect the sheet to the website (once)

1. In the Google Sheet: **File → Share → Publish to web**.
2. In the first dropdown pick **Form Responses 1**, and in the second pick **Comma-separated values (.csv)**. Click **Publish**.
3. Copy the link it shows you (it ends in `output=csv`) and send it to Claude. Claude puts it in `config.js`.

Also send Claude:
- your **WhatsApp number** with country code (for Mexico it usually starts with `52`, for the US with `1`)
- the **2–3 meet-up areas** in English (the Spanish version is filled in for you)
- the **last day of the sale** (optional)

## Step 5 — Put the website online (once)

1. Open the repository on GitHub: **github.com/realsibfox/Movingsale**.
2. If the repository is **Private**: go to **Settings → General → Danger Zone → Change visibility → Public**. Free GitHub Pages needs a public repository. Only the website files go in it, not your sheet.
3. Go to **Settings → Pages**. Under *Build and deployment* choose **Deploy from a branch**. Pick the branch `claude/moving-sale-website-wcn0dw` (or `main` if it has been merged there) and the folder **/ (root)**, then click **Save**.
4. After a minute or two the page shows your address, for example `https://realsibfox.github.io/Movingsale/`. That's the link you share.

---

## Everyday use (on your phone)

- **Add an item:** open the Form link (bookmark it), fill it in, take or choose photos, and submit. It appears on the site within about **5 minutes**.
- **Mark as sold:** open the sheet in the Google Sheets app and type `Sold` in the **Status** column for that row.
- **Take an item down without deleting it:** type `Hide` in **Status**.
- **Change a price or description:** edit the cell in the sheet.
- **Share one item:** open it on the site and tap **Share**. Buyers who tap "I'm interested" send you a WhatsApp message that already includes the item name, price and link.

## Managing categories

The site builds its category buttons from whatever categories your items use. There's no separate list to keep up to date.

- **Add a category:** in the Form, edit the *Category* question and add an option. Write it in both languages with a slash: `Toys / Juguetes` (spaces around the slash are optional). English shows the left side and Spanish the right.
- **Common categories don't need the slash.** These already have Spanish names: Furniture, Kitchen, Clothing, Home & Linens, Electronics, Appliances, Decor, Books, Toys, Kids, Tools, Sports, Shoes, Bathroom, Office, Garden, Other.
- **A button appears** once at least one item uses that category, and **disappears** when none do.
- **Renaming** a category in the Form only changes *new* items. To move existing items, edit their *Category* cells in the sheet (column E).
- **Button order:** Furniture, Kitchen, Clothing, Home & Linens, Electronics, Decor, then any others alphabetically, with *Other* always last. To change the order, tell Claude, or edit `categoryOrder` in `config.js`.

## If something looks wrong

- **Photos don't show:** check Step 3 (the folder must be shared as *Anyone with the link*).
- **Changes don't appear:** wait 5 minutes and refresh. Google only refreshes the published sheet every few minutes.
- **Spanish shows English text:** the translation formula may still be loading. Check columns H and I in the sheet.
