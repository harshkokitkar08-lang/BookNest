// ================================
//   BookNest — script.js
//   Open Library API integration
// ================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('BookNest is ready!');

    // ---- DARK MODE ----
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('bn_theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
    }
    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            themeToggle.textContent = '🌙';
            localStorage.setItem('bn_theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '☀️';
            localStorage.setItem('bn_theme', 'dark');
        }
    });

    // ---- STATE ----
    let searchType = 'q';   // q | title | author | subject
    let favorites = JSON.parse(localStorage.getItem('bn_fav') || '[]');
    let readList = JSON.parse(localStorage.getItem('bn_read') || '[]');

    // ---- DOM ----
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const resultsDiv = document.getElementById('results');
    const loader = document.getElementById('loader');
    const statusEl = document.getElementById('status');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body');
    const modalClose = document.getElementById('modal-close');
    const toast = document.getElementById('toast');
    const favBadge = document.getElementById('fav-badge');
    const readBadge = document.getElementById('read-badge');
    const favGrid = document.getElementById('fav-grid');
    const readGrid = document.getElementById('read-grid');
    const favEmpty = document.getElementById('fav-empty');
    const readEmpty = document.getElementById('read-empty');

    // ---- UPDATE BADGES ----
    function updateBadges() {
        favBadge.textContent = favorites.length;
        readBadge.textContent = readList.length;
    }
    updateBadges();

    // ==========================
    //   TAB SWITCHING
    // ==========================
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // active class
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // hide all tabs
            document.getElementById('tab-discover').classList.add('hidden');
            document.getElementById('tab-favorites').classList.add('hidden');
            document.getElementById('tab-readlist').classList.add('hidden');

            // show selected tab
            const tab = btn.dataset.tab;
            document.getElementById('tab-' + tab).classList.remove('hidden');

            if (tab === 'favorites') renderSavedTab(favGrid, favorites, favEmpty);
            if (tab === 'readlist') renderSavedTab(readGrid, readList, readEmpty);
        });
    });

    // ==========================
    //   FILTER CHIPS
    // ==========================
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            searchType = chip.dataset.type;
        });
    });

    // ==========================
    //   SEARCH
    // ==========================
    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') doSearch();
    });

    async function doSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            showStatus('Please enter something to search!');
            return;
        }

        // Show loader
        loader.classList.remove('hidden');
        statusEl.classList.add('hidden');
        resultsDiv.innerHTML = '';

        // Build API URL based on filter
        let url = '';
        if (searchType === 'subject') {
            // Subjects API — browse by genre
            url = `https://openlibrary.org/subjects/${encodeURIComponent(query.toLowerCase())}.json?limit=24`;
        } else {
            // Search API — title / author / general
            url = `https://openlibrary.org/search.json?${searchType}=${encodeURIComponent(query)}&limit=24`;
        }

        try {
            const res = await fetch(url);
            const data = await res.json();
            loader.classList.add('hidden');

            // Subject API returns "works", Search API returns "docs"
            const books = data.docs || data.works || [];

            if (books.length === 0) {
                showStatus(`No books found for "${query}". Try a different search.`);
                return;
            }

            renderGrid(books, resultsDiv);

        } catch (err) {
            loader.classList.add('hidden');
            showStatus('Network error. Please check your connection.');
            console.error(err);
        }
    }

    // ==========================
    //   RENDER GRID
    // ==========================
    function renderGrid(books, container) {
        container.innerHTML = '';
        books.forEach((book, i) => {
            const card = makeCard(book, i);
            container.appendChild(card);
        });
    }

    // ==========================
    //   MAKE BOOK CARD
    // ==========================
    function makeCard(book, delay = 0) {
        // Normalize fields — Search API & Subject API use different structures
        const title = book.title || 'Unknown Title';
        const authors = book.author_name || (book.authors ? book.authors.map(a => a.name) : []);
        const author = authors[0] || 'Unknown Author';
        const year = book.first_publish_year || '';
        const coverId = book.cover_i || book.cover_id || null;
        const workKey = book.key || '';                        // e.g. /works/OL82563W
        const bookId = workKey.replace('/works/', '') || (title + author);

        const isFav = favorites.some(b => b.id === bookId);
        const isRead = readList.some(b => b.id === bookId);

        const card = document.createElement('div');
        card.className = 'book-card';
        card.style.animationDelay = `${delay * 0.04}s`;

        card.innerHTML = `
            <div class="card-cover">
                ${coverId
                ? `<img src="https://covers.openlibrary.org/b/id/${coverId}-M.jpg" alt="${esc(title)}" loading="lazy">`
                : `<div class="no-cover">📖<span>${esc(title)}</span></div>`
            }
                <div class="card-actions">
                    <button class="act-btn fav-btn ${isFav ? 'on' : ''}" title="Favorite">${isFav ? '♥' : '♡'}</button>
                    <button class="act-btn read-btn ${isRead ? 'on' : ''}" title="Reading List">${isRead ? '📚' : '🔖'}</button>
                </div>
            </div>
            <div class="card-info">
                <div class="card-title">${esc(title)}</div>
                <div class="card-author">${esc(author)}</div>
                ${year ? `<div class="card-year">${year}</div>` : ''}
            </div>
        `;

        const bookData = { id: bookId, title, author, year, coverId, workKey };

        // Open modal on card click
        card.addEventListener('click', e => {
            if (!e.target.closest('.act-btn')) openModal(book, bookData);
        });

        // Favorite button
        card.querySelector('.fav-btn').addEventListener('click', e => {
            e.stopPropagation();
            toggleList(bookData, 'fav');
            const btn = card.querySelector('.fav-btn');
            const on = favorites.some(b => b.id === bookId);
            btn.classList.toggle('on', on);
            btn.textContent = on ? '♥' : '♡';
        });

        // Reading list button
        card.querySelector('.read-btn').addEventListener('click', e => {
            e.stopPropagation();
            toggleList(bookData, 'read');
            const btn = card.querySelector('.read-btn');
            const on = readList.some(b => b.id === bookId);
            btn.classList.toggle('on', on);
            btn.textContent = on ? '📚' : '🔖';
        });

        return card;
    }

    // ==========================
    //   SAVED TABS (Fav / Read)
    // ==========================
    function renderSavedTab(container, list, emptyEl) {
        container.innerHTML = '';
        if (list.length === 0) {
            emptyEl.classList.remove('hidden');
            return;
        }
        emptyEl.classList.add('hidden');
        // Convert saved data back to book-like object for makeCard
        list.forEach((saved, i) => {
            const fakeBook = {
                title: saved.title,
                author_name: [saved.author],
                first_publish_year: saved.year,
                cover_i: saved.coverId,
                key: saved.workKey
            };
            container.appendChild(makeCard(fakeBook, i));
        });
    }

    // ==========================
    //   MODAL
    // ==========================
    async function openModal(rawBook, bookData) {
        // Build modal HTML
        const subjects = (rawBook.subject || rawBook.subjects || []).slice(0, 6);
        const lang = rawBook.language ? rawBook.language[0]?.toUpperCase() : null;
        const pages = rawBook.number_of_pages_median || null;

        const isFav = favorites.some(b => b.id === bookData.id);
        const isRead = readList.some(b => b.id === bookData.id);

        modalBody.innerHTML = `
            <div class="modal-layout">
                <div class="modal-cover">
                    ${bookData.coverId
                ? `<img src="https://covers.openlibrary.org/b/id/${bookData.coverId}-L.jpg" alt="${esc(bookData.title)}">`
                : '📖'
            }
                </div>
                <div class="modal-info">
                    <div class="modal-title">${esc(bookData.title)}</div>
                    <div class="modal-author">by ${esc(bookData.author)}</div>
                    ${bookData.year ? `<div class="modal-year">${bookData.year}</div>` : ''}
                    <div class="modal-tags">
                        ${subjects.map(s => `<span class="tag">${esc(s)}</span>`).join('')}
                        ${lang ? `<span class="tag">${lang}</span>` : ''}
                        ${pages ? `<span class="tag">${pages} pages</span>` : ''}
                    </div>
                    <div class="modal-btns" id="modal-btns">
                        ${modalBtnsHTML(bookData, isFav, isRead)}
                    </div>
                </div>
            </div>
            <div class="modal-desc">
                <h3>About this book</h3>
                <p id="modal-desc-text">Loading description...</p>
            </div>
        `;

        // Show modal
        modalOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Attach button listeners
        attachModalBtns(bookData);

        // Fetch description from Works API
        if (bookData.workKey) {
            fetchDescription(bookData.workKey);
        } else {
            document.getElementById('modal-desc-text').textContent = 'No description available.';
        }
    }

    function modalBtnsHTML(bookData, isFav, isRead) {
        const workUrl = bookData.workKey
            ? `https://openlibrary.org${bookData.workKey}`
            : null;

        return `
            <button class="m-btn ${isFav ? 'saved' : 'primary'}" id="m-fav-btn">
                ${isFav ? '♥ Saved' : '♡ Favorite'}
            </button>
            <button class="m-btn ${isRead ? 'saved' : ''}" id="m-read-btn">
                ${isRead ? '📚 In List' : '🔖 Want to Read'}
            </button>
            ${workUrl ? `<a class="m-btn" href="${workUrl}" target="_blank" rel="noopener">View on Open Library ↗</a>` : ''}
        `;
    }

    function attachModalBtns(bookData) {
        document.getElementById('m-fav-btn')?.addEventListener('click', () => {
            toggleList(bookData, 'fav');
            const isFav = favorites.some(b => b.id === bookData.id);
            const isRead = readList.some(b => b.id === bookData.id);
            document.getElementById('modal-btns').innerHTML = modalBtnsHTML(bookData, isFav, isRead);
            attachModalBtns(bookData);
        });
        document.getElementById('m-read-btn')?.addEventListener('click', () => {
            toggleList(bookData, 'read');
            const isFav = favorites.some(b => b.id === bookData.id);
            const isRead = readList.some(b => b.id === bookData.id);
            document.getElementById('modal-btns').innerHTML = modalBtnsHTML(bookData, isFav, isRead);
            attachModalBtns(bookData);
        });
    }

    async function fetchDescription(workKey) {
        const descEl = document.getElementById('modal-desc-text');
        if (!descEl) return;
        try {
            // Works API — e.g. https://openlibrary.org/works/OL82563W.json
            const res = await fetch(`https://openlibrary.org${workKey}.json`);
            const data = await res.json();

            // description can be string OR { value: "..." }
            let desc = data.description;
            if (typeof desc === 'object') desc = desc.value;

            descEl.textContent = desc || 'No description available for this book.';
        } catch {
            descEl.textContent = 'Could not load description.';
        }
    }

    // Close modal
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', e => {
        if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });

    function closeModal() {
        modalOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // ==========================
    //   FAVORITES & READING LIST
    // ==========================
    function toggleList(bookData, type) {
        const list = type === 'fav' ? favorites : readList;
        const key = type === 'fav' ? 'bn_fav' : 'bn_read';
        const idx = list.findIndex(b => b.id === bookData.id);

        if (idx === -1) {
            list.push(bookData);
            showToast(type === 'fav'
                ? `"${bookData.title}" added to Favorites ♥`
                : `"${bookData.title}" added to Reading List 📚`
            );
        } else {
            list.splice(idx, 1);
            showToast('Removed successfully');
        }

        localStorage.setItem(key, JSON.stringify(list));
        updateBadges();
    }

    // ==========================
    //   TOAST
    // ==========================
    let toastTimer;
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.remove('hidden');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.add('hidden'), 2800);
    }

    // ==========================
    //   STATUS MESSAGE
    // ==========================
    function showStatus(msg) {
        statusEl.textContent = msg;
        statusEl.classList.remove('hidden');
    }

    // ==========================
    //   HELPER — escape HTML
    // ==========================
    function esc(str = '') {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

});