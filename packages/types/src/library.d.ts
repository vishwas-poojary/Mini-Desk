export interface Member {
    id: string;
    membershipNumber: string;
    name: string;
    email: string;
    phone: string;
    status: 'active' | 'suspended' | 'expired';
    joinedDate: string;
}
export interface BookItem {
    id: string;
    isbn: string;
    title: string;
    author: string;
    category: string;
    totalCopies: number;
    availableCopies: number;
    shelfLocation: string;
}
export interface Checkout {
    id: string;
    memberId: string;
    bookId: string;
    borrowDate: string;
    dueDate: string;
    returnDate?: string;
    status: 'borrowed' | 'returned' | 'overdue';
}
