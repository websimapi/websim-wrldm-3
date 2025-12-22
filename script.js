import { SidebarManager } from './modules/sidebar.js';
import { ProjectDescriptionManager } from './modules/project-description.js';
import { ProjectHistoryManager } from './modules/project-history.js';
import { CreatorProjectsManager } from './modules/creator-projects.js';
import { ProjectFeedManager } from './modules/project-feed.js';
import { MenuManager } from './modules/menu-manager.js';
import { SidebarLoader } from './modules/sidebar-loader.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Load sidebar component first
    await SidebarLoader.loadSidebar();
    
    let currentProject = null;
    let creator = null;

    // Initialize managers after sidebar is loaded
    const sidebarManager = new SidebarManager();
    const projectDescriptionManager = new ProjectDescriptionManager();
    const projectHistoryManager = new ProjectHistoryManager();
    const creatorProjectsManager = new CreatorProjectsManager();
    const projectFeedManager = new ProjectFeedManager();
    const menuManager = new MenuManager();

    // Handle URL input
    const urlInput = document.querySelector('.url-input');
    const refreshBtn = document.querySelector('.refresh-btn'); 
    
    function handleUrlSubmit() {
        const prompt = urlInput.value.trim();
        if (prompt) {
            console.log('Generating simulation for:', prompt);
            // TODO: Implement simulation generation
        }
    }
    
    if (refreshBtn) { 
        refreshBtn.addEventListener('click', handleUrlSubmit);
    }
    
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            handleUrlSubmit();
        }
    });
    
    // Add click handlers for sim cards
    const simCards = document.querySelectorAll('.sim-card');
    simCards.forEach(card => {
        card.addEventListener('click', function() {
            const title = card.querySelector('.card-title').textContent;
            console.log('Opening simulation:', title);
            // TODO: Implement simulation opening
        });
    });
    
    // Add click handlers for sidebar items (now history items)
    const historyItems = document.querySelectorAll('.sidebar-history-item');
    historyItems.forEach(item => {
        item.addEventListener('click', function() {
            const text = item.querySelector('.history-text').textContent;
            console.log('Opening history item:', text);
            // TODO: Implement history item opening
        });
    });

    async function main() {
        const isPuppeteer = navigator.webdriver;
        let userForFeed = null;
    
        const addressAvatarImg = document.getElementById('userAvatarAddressBar');
        const sidebarAvatarImg = document.getElementById('sidebarUserAvatarIcon');
    
        if (isPuppeteer) {
            console.log("Puppeteer environment detected.");
            userForFeed = { username: 'api', id: null };
            
            if (addressAvatarImg) {
                addressAvatarImg.src = '/image.png';
                addressAvatarImg.alt = "@api's avatar";
            }
    
            try {
                const creatorInfo = await window.websim.getCreator();
                creator = creatorInfo;
                creatorProjectsManager.setCreator(creator);
                if (creator && creator.username) {
                    if (sidebarAvatarImg) {
                        sidebarAvatarImg.src = `https://images.websim.com/avatar/${creator.username}`;
                        sidebarAvatarImg.alt = `${creator.username}'s avatar`;
                    }
                } else {
                    if (sidebarAvatarImg) sidebarAvatarImg.alt = 'Creator Avatar';
                }
            } catch (error) {
                console.error('Error fetching creator data for puppeteer mode:', error);
                if (sidebarAvatarImg) sidebarAvatarImg.alt = 'Creator Avatar';
            }
    
        } else {
            // Real user logic
            try {
                const user = await window.websim.getUser();
                userForFeed = user;

                const creatorInfo = await window.websim.getCreator();
                creator = creatorInfo;
                creatorProjectsManager.setCreator(creator);
    
                if (user && user.username) {
                    const avatarSrc = `https://images.websim.com/avatar/${user.username}`;
                    const avatarAlt = `${user.username}'s avatar`;
    
                    if (addressAvatarImg) {
                        addressAvatarImg.src = avatarSrc;
                        addressAvatarImg.alt = avatarAlt;
                    }
                } else {
                    console.warn('WebSim user not found. Using default avatars.');
                    if (addressAvatarImg) addressAvatarImg.alt = 'User Avatar';
                }

                if (creator && creator.username) {
                    if (sidebarAvatarImg) {
                        sidebarAvatarImg.src = `https://images.websim.com/avatar/${creator.username}`;
                        sidebarAvatarImg.alt = `${creator.username}'s avatar`;
                    }
                } else {
                     if (sidebarAvatarImg) sidebarAvatarImg.alt = 'Creator Avatar';
                }

            } catch (error) {
                console.error('Error loading user data:', error);
                if (addressAvatarImg) addressAvatarImg.alt = 'User Avatar';
                if (sidebarAvatarImg) sidebarAvatarImg.alt = 'User Avatar';
            }
        }
    
        // Load project-specific data (common to both modes)
        try {
            const projectSummary = await window.websim.getCurrentProject();
            
            if (projectSummary && projectSummary.id) {
                // Fetch full project data to get current_version for bookmarking
                try {
                    const response = await fetch(`/api/v1/projects/${projectSummary.id}`);
                    if (response.ok) {
                        const { project } = await response.json();
                        currentProject = project;
                        projectHistoryManager.setCurrentProject(currentProject);
                    } else {
                        console.error(`Failed to fetch full project details: ${response.status}. Using summary.`);
                        currentProject = { ...projectSummary, current_version: null };
                        projectHistoryManager.setCurrentProject(currentProject);
                    }
                } catch (e) {
                    console.error('Error fetching full project details. Using summary.', e);
                    currentProject = { ...projectSummary, current_version: null };
                    projectHistoryManager.setCurrentProject(currentProject);
                }
                
                const sidebarProjectTitle = document.getElementById('sidebarProjectTitle');
                if (currentProject.title && sidebarProjectTitle) {
                    sidebarProjectTitle.textContent = currentProject.title;
                }

                const likeCountEl = document.getElementById('like-count');
                if (likeCountEl && currentProject.stats && currentProject.stats.likes != null) {
                    likeCountEl.textContent = currentProject.stats.likes;
                }

                const branchStatValue = document.getElementById('branch-stat-value');
                if (branchStatValue && currentProject && currentProject.current_version != null) {
                    branchStatValue.textContent = currentProject.current_version;
                }

                const description = currentProject.description;
                if (description) {
                    projectDescriptionManager.updateDescription(description);
                }

                projectHistoryManager.loadProjectHistory(currentProject.id);

            } else {
                const sidebarProjectTitle = document.getElementById('sidebarProjectTitle');
                if (sidebarProjectTitle) {
                    sidebarProjectTitle.textContent = document.title || "Project Details";
                }
            }
        } catch (error) {
            console.error('Error loading project data:', error);
            const sidebarProjectTitle = document.getElementById('sidebarProjectTitle');
            if (sidebarProjectTitle) {
                sidebarProjectTitle.textContent = document.title || "Project Details";
            }
        }
    
        projectFeedManager.init(userForFeed);
    }

    main();
});