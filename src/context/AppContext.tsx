import { createContext, useContext, useState, type ReactNode } from 'react';

// --- Types ---
export interface User {
    name: string;
    phone: string;
    department: string;
    prize: string; // The prize they will win
    isRedeemed?: boolean;
}

export interface AppConfig {
    mainVisualUrl: string;
    eventVideoUrl: string;
}

interface AppContextType {
    currentUser: User | null;
    config: AppConfig;
    allUsers: User[];
    departments: string[];

    // Actions
    login: (name: string, phone: string, department: string) => { success: boolean; message?: string };
    logout: () => void;
    updateConfig: (newConfig: Partial<AppConfig>) => void;
    importUsers: (csvContent: string) => void;
    addDepartment: (dept: string) => void;
    removeDepartment: (dept: string) => void;
}

// --- Mock Data ---
const INITIAL_USERS: User[] = [
    { name: '王小明', phone: '0912345678', department: '業務部', prize: '特獎：iPhone 16 Pro' },
    { name: '李大同', phone: '0900000000', department: '工程部', prize: '頭獎：PS5 Pro' },
    { name: '測試員', phone: '0911111111', department: '行政部', prize: '安慰獎：衛生紙一包' },
];

const INITIAL_DEPTS = ['業務部', '工程部', '人資部', '行政部', '設計部'];

const DEFAULT_CONFIG: AppConfig = {
    // Placeholder image
    mainVisualUrl: 'https://placehold.co/1920x1080/2e1065/FFF?text=Lucky+Draw+Event',
    // Placeholder video
    eventVideoUrl: 'https://cdn.pixabay.com/video/2022/12/13/142750-781033230_large.mp4',
};

// --- Context ---
const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [allUsers, setAllUsers] = useState<User[]>(INITIAL_USERS);
    const [departments, setDepartments] = useState<string[]>(INITIAL_DEPTS);

    // Login Logic
    const login = (name: string, phone: string, department: string) => {
        const user = allUsers.find(u =>
            u.name === name &&
            u.phone === phone &&
            u.department === department
        );

        if (user) {
            setCurrentUser(user);
            return { success: true };
        } else {
            return { success: false, message: '找無此人，請確認姓名電話與部門是否正確。' };
        }
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const updateConfig = (newConfig: Partial<AppConfig>) => {
        setConfig(prev => ({ ...prev, ...newConfig }));
    };

    const importUsers = (csvContent: string) => {
        // Simple CSV parser: Name,Phone,Dept,Prize
        const lines = csvContent.split('\n');
        const newUsers: User[] = [];

        lines.forEach(line => {
            const parts = line.split(',').map(s => s.trim());
            if (parts.length >= 4) {
                newUsers.push({
                    name: parts[0],
                    phone: parts[1],
                    department: parts[2],
                    prize: parts[3]
                });
            }
        });

        if (newUsers.length > 0) {
            setAllUsers(prev => [...prev, ...newUsers]); // Append or Replace? Let's Append for now
        }
    };

    const addDepartment = (dept: string) => {
        if (!departments.includes(dept)) {
            setDepartments(prev => [...prev, dept]);
        }
    };

    const removeDepartment = (dept: string) => {
        setDepartments(prev => prev.filter(d => d !== dept));
    };

    return (
        <AppContext.Provider value={{
            currentUser,
            config,
            allUsers,
            departments,
            login,
            logout,
            updateConfig,
            importUsers,
            addDepartment,
            removeDepartment
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
