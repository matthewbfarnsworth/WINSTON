export interface User {
    id?: string;
    name: string;
}

export interface TripUser {
    userId: string;
    user?: User | null;
    tripId?: string;
    trip?: Trip | null;
    personalCost: number;
}

export interface Trip {
    id?: string;
    ownerId: string;
    owner?: User | null;
    name: string;
    date: string;
    total: number;
    notes?: string | null;
    receiptImageUrl?: string | null;
    tripUsers: TripUser[];
}

export interface Transaction {
    id?: string;
    senderId: string;
    sender?: User | null;
    recipientId: string;
    recipient?: User | null;
    date: string;
    cost: number;
    recipientDidNotReceive: boolean;
    notes?: string | null;
}