export function timeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return `just now`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

export function getIconForPromptType(type) {
    switch (type) {
        case 'get':
        case 'plaintext':
        case 'continue':
            return 'fas fa-magic'; // Generation
        case 'fix':
            return 'fas fa-wrench'; // Fixing
        case 'refactor':
            return 'fas fa-palette'; // Styling, refactoring
        case 'edit':
        case 'tweak-edit':
            return 'fas fa-mouse-pointer'; // Direct interaction
        case 'manual-edit':
            return 'fas fa-keyboard'; // Manual code editing
        default:
            return 'fas fa-code-branch'; // Default/unknown
    }
}

export function getRelativeDateGroup(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (targetDate.getTime() === today.getTime()) return 'Today';
    if (targetDate.getTime() === yesterday.getTime()) return 'Yesterday';
    
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    if(targetDate > oneWeekAgo) return 'This Week';

    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}