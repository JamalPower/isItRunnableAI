document.addEventListener('DOMContentLoaded', () => {
    const gamesGrid          = document.getElementById('gamesGrid');
    const paginationContainer= document.getElementById('paginationContainer');
    const resultsCount       = document.getElementById('resultsCount');
    const resultsCategoryLabel = document.getElementById('resultsCategoryLabel');
    const tabs               = document.querySelectorAll('.tab-btn');

    let currentCategory = 'trending';
    let currentPage     = 1;
    let maxPage         = 1;

    const categoryLabels = {
        trending:   'Trending Now',
        popular:    'Most Popular',
        'top-rated':'Top Rated',
        release:    'New Releases'
    };

    // Initialize
    fetchGames(currentCategory, currentPage);

    // Tab Listeners
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentCategory = e.currentTarget.dataset.category;
            currentPage = 1;
            fetchGames(currentCategory, currentPage);
            if (resultsCategoryLabel) {
                resultsCategoryLabel.textContent = categoryLabels[currentCategory] || currentCategory;
            }
        });
    });

    async function fetchGames(category, page) {
        renderShimmer();
        paginationContainer.innerHTML = '';
        if (resultsCount) resultsCount.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';

        try {
            const response = await fetch(`/games/${category}?page=${page}`);
            if (!response.ok) throw new Error('Failed to fetch data');
            const result = await response.json();

            maxPage = result.next_max || 1;
            renderGames(result.data, category);
            renderPagination();

            const count = result.data ? result.data.length : 0;
            if (resultsCount) {
                resultsCount.innerHTML = `<i class="fa-solid fa-check-circle" style="color:var(--accent-color)"></i> Showing <strong>${count}</strong> games &mdash; Page ${page} of ${maxPage}`;
            }
        } catch (error) {
            console.error(error);
            if (resultsCount) resultsCount.textContent = 'Failed to load';
            gamesGrid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; color:var(--error-color); padding:3rem;">
                    <i class="fa-solid fa-circle-exclamation fa-3x"></i>
                    <h2 style="margin-top:1rem;">Failed to load games</h2>
                    <p>Please check your connection and try again.</p>
                </div>`;
        }
    }

    function renderShimmer() {
        gamesGrid.innerHTML = Array.from({length: 12}).map(() => `
            <div class="shimmer-item">
                <div class="shimmer"></div>
            </div>
        `).join('');
    }

    function getBadgeHtml(category, game) {
        switch (category) {
            case 'top-rated':
                return game.rating
                    ? `<div class="game-info-badge"><i class="fa-solid fa-star" style="color:#fbbf24"></i> ${game.rating}</div>`
                    : '';
            case 'release':
                return game.year
                    ? `<div class="game-info-badge"><i class="fa-solid fa-calendar"></i> ${game.year}</div>`
                    : '';
            default:
                return '';
        }
    }

    function renderGames(games, category) {
        if (!games || games.length === 0) {
            gamesGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-secondary);">No games found.</div>`;
            return;
        }

        const placeholder = `https://via.placeholder.com/264x352/1e293b/ffffff?text=No+Cover`;

        gamesGrid.innerHTML = games.map(game => {
            const checkUrl  = `/check?game=${encodeURIComponent(game.name)}`;
            const badgeHtml = getBadgeHtml(category, game);

            return `
                <a href="${checkUrl}" class="game-item">
                    <div class="game-img-wrapper">
                        ${badgeHtml}
                        <img
                            src="${game.img || placeholder}"
                            alt="${game.name}"
                            class="game-img"
                            loading="lazy"
                            onerror="this.src='${placeholder}'"
                        >
                        <div class="game-hover-overlay">
                            <span class="game-hover-title">${game.name}</span>
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    }

    function renderPagination() {
        if (maxPage <= 1) { paginationContainer.innerHTML = ''; return; }

        let html = '';
        html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;

        let startPage = Math.max(1, currentPage - 2);
        let endPage   = Math.min(maxPage, startPage + 4);
        if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

        if (startPage > 1) {
            html += `<button class="page-btn" onclick="changePage(1)">1</button>`;
            if (startPage > 2) html += `<span class="page-ellipsis">…</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        }

        if (endPage < maxPage) {
            if (endPage < maxPage - 1) html += `<span class="page-ellipsis">…</span>`;
            html += `<button class="page-btn" onclick="changePage(${maxPage})">${maxPage}</button>`;
        }

        html += `<button class="page-btn" ${currentPage === maxPage ? 'disabled' : ''} onclick="changePage(${currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;

        paginationContainer.innerHTML = html;
    }

    window.changePage = (page) => {
        if (page < 1 || page > maxPage || page === currentPage) return;
        currentPage = page;
        fetchGames(currentCategory, currentPage);
        document.querySelector('.games-list-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
});