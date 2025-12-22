export class SidebarLoader {
    static async loadSidebar() {
        try {
            const response = await fetch('/components/sidebar.html');
            if (!response.ok) {
                throw new Error(`Failed to load sidebar: ${response.status}`);
            }
            const sidebarHTML = await response.text();
            const sidebarContainer = document.getElementById('sidebar-container');
            if (sidebarContainer) {
                sidebarContainer.innerHTML = sidebarHTML;
            } else {
                console.error('Sidebar container not found');
            }
        } catch (error) {
            console.error('Error loading sidebar component:', error);
            // Fallback: create sidebar container manually if needed
            this.createFallbackSidebar();
        }
    }

    static createFallbackSidebar() {
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            sidebarContainer.innerHTML = `
                <aside class="sidebar hidden" id="sidebar">
                    <div class="sidebar-top-nav">
                        <div class="sidebar-nav-controls-left">
                            <button id="remixViewBtn" class="nav-btn sidebar-action-btn active" title="Branch/Remix">
                                <i class="fas fa-random"></i>
                            </button>
                            <div class="nav-divider"></div>
                            <button id="projectsViewBtn" class="nav-btn sidebar-action-btn" title="Projects">
                                <i class="far fa-user"></i>
                            </button>
                        </div>
                    </div>
                    <div id="remix-view">
                        <div class="sidebar-header">
                            <h3 id="sidebarProjectTitle">Loading...</h3>
                        </div>
                        <div class="sidebar-content">
                            <p>Sidebar component failed to load</p>
                        </div>
                    </div>
                </aside>
            `;
        }
    }
}