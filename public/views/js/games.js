document.addEventListener('DOMContentLoaded', () => {
    const gamesGrid = document.getElementById('gamesGrid');
    const paginationContainer = document.getElementById('paginationContainer');
    const tabs = document.querySelectorAll('.tab-btn');
    
    let currentCategory = 'trending';
    let currentPage = 1;
    let maxPage = 1;

    // Initialize
    fetchGames(currentCategory, currentPage);

    // Search Listener
    const gameSearch = document.getElementById('gameSearch');
    gameSearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const gameItems = document.querySelectorAll('.game-item');
        
        gameItems.forEach(item => {
            const title = item.querySelector('.game-title').textContent.toLowerCase();
            if (title.includes(term)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // Tab Listeners
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.category;
            currentPage = 1; 
            gameSearch.value = ''; // Reset search on tab change
            fetchGames(currentCategory, currentPage);
        });
    });

    async function fetchGames(category, page) {
        renderShimmer();
        paginationContainer.innerHTML = ''; 
        
        try {
            const response = await fetch(`/games/${category}?page=${page}`);
            if (!response.ok) throw new Error('Failed to fetch data');
            const result = await response.json();
            
            maxPage = result.next_max || 1;
            renderGames(result.data, category);
            renderPagination();
        } catch (error) {
            console.error(error);
            gamesGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: var(--error-color); padding: 3rem;">
                    <i class="fa-solid fa-circle-exclamation fa-3x mb-3"></i>
                    <h2 style="margin-top: 1rem;">Failed to load games</h2>
                    <p>Please check your connection and try again later.</p>
                </div>`;
        }
    }

    function renderShimmer() {
        gamesGrid.innerHTML = Array.from({length: 6}).map(() => `
            <div class="shimmer-item shimmer"></div>
        `).join('');
    }

    function renderGames(games, category) {
        if (!games || games.length === 0) {
            gamesGrid.innerHTML = `<div style="text-align: center; padding: 3rem; color: var(--text-secondary);">No games found.</div>`;
            return;
        }

        gamesGrid.innerHTML = games.map(game => {
            let detailLabel = '';
            let detailIcon = '';
            
            if (category === 'top-rated' && game.rating) {
                detailLabel = game.rating;
                detailIcon = 'fa-star';
            } else if (category === 'release' && game.year) {
                detailLabel = game.year;
                detailIcon = 'fa-calendar';
            } else if (category === 'trending') {
                detailLabel = 'Trending';
                detailIcon = 'fa-fire';
            } else {
                detailLabel = 'Popular';
                detailIcon = 'fa-heart';
            }

            const placeholder = `https://via.placeholder.com/264x352/1e293b/ffffff?text=No+Cover`;

            return `
                <div class="game-item">
                    <div class="game-img-wrapper">
                        <img src="${game.img || placeholder}" alt="${game.name}" class="game-img" onerror="this.src='${placeholder}'">
                    </div>
                    <div class="game-info">
                        <h3 class="game-title">${game.name}</h3>
                        <div class="hover-prompt">Hover to reveal name</div>
                        <div class="game-meta-row">
                            <span class="game-badge">
                                <i class="fa-solid ${detailIcon}"></i> ${detailLabel}
                            </span>
                            <span class="game-badge">
                                <i class="fa-solid fa-desktop"></i> PC
                            </span>
                        </div>
                    </div>
                    <a href="/check?game=${encodeURIComponent(game.name)}" class="check-btn">
                        Check Now <i class="fa-solid fa-chevron-right"></i>
                    </a>
                </div>
            `;
        }).join('');
    }

    function renderPagination() {
        if (maxPage <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let html = '';
        
        // Prev button
        html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;

        // Smart pagination range
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(maxPage, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        if (startPage > 1) {
            html += `<button class="page-btn" onclick="changePage(1)">1</button>`;
            if (startPage > 2) html += `<span class="page-ellipsis">...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        }

        if (endPage < maxPage) {
            if (endPage < maxPage - 1) html += `<span class="page-ellipsis">...</span>`;
            html += `<button class="page-btn" onclick="changePage(${maxPage})">${maxPage}</button>`;
        }

        // Next button
        html += `<button class="page-btn" ${currentPage === maxPage ? 'disabled' : ''} onclick="changePage(${currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;

        paginationContainer.innerHTML = html;
    }

    // Expose to window scope so inline onclick handles it
    window.changePage = (page) => {
        if (page < 1 || page > maxPage || page === currentPage) return;
        currentPage = page;
        fetchGames(currentCategory, currentPage);
        // Scroll back to the top of the section smoothly
        document.querySelector('.games-header').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
});
