export interface Task {
    _id?: string;
    title: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    dueDate?: Date;
    lockedBy?: string | null;
}
