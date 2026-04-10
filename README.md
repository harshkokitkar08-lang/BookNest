# BookNest

BookNest ek simple web app hai jisme aap books **search** kar sakte ho, details dekh sakte ho, aur apni **Favorites** + **Want to Read** list manage kar sakte ho.

### Tech Stack

- **HTML** (structure)
- **CSS** (UI + responsive + dark mode)
- **JavaScript (ES6)** (logic + DOM + fetch)
- **LocalStorage** (favorites / reading list save karne ke liye)

### API / Data Source (konsa API use hua hai)

Is project me **Open Library** ka public API use hua hai.

- **Search API** (title/author/general search)
  - `https://openlibrary.org/search.json?...`
- **Subjects API** (genre/subject ke through browse)
  - `https://openlibrary.org/subjects/<subject>.json`
- **Works API** (book description/details ke liye)
  - `https://openlibrary.org/works/<workId>.json`
- **Covers API** (book cover images)
  - `https://covers.openlibrary.org/b/id/<coverId>-M.jpg`
  - `https://covers.openlibrary.org/b/id/<coverId>-L.jpg`

### Features

- **Search**: title / author / normal search, aur subject (genre) browse
- **Book cards**: cover, title, author, year
- **Book details modal**: basic info + description (Works API se)
- **Favorites** aur **Want to Read** list (LocalStorage me save hota hai)
- **Dark / Light mode**
- **Loading + empty + error state**

### Project Structure

```
BookNest/
├─ index.html
├─ style.css
├─ script.js
└─ README.md
```

### How to Run

- Repo download/clone karo
- Folder open karo
- `index.html` ko browser me open karo

### Future Improvements (optional)

- Debounced search
- Pagination / Load more
- More filters
- UI polish / animations

### Author

Harsh Kokitkar
