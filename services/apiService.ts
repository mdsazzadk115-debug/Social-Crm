
import axios from 'axios';
import { Lead, BigFish, Transaction } from '../types';

// আপনার লাইভ ডোমেইন এর API URL এখানে দিন
// উদাহরণ: https://api.yourdomain.com অথবা একই ডোমেইন হলে '/api'
const API_URL = 'http://localhost:5000/api'; 

class ApiService {
    
    // --- LEADS ---
    async getLeads(): Promise<Lead[]> {
        const response = await axios.get(`${API_URL}/leads`);
        return response.data;
    }

    async createLead(data: Partial<Lead>): Promise<void> {
        // ID জেনারেশন ফ্রন্টএন্ড অথবা ব্যাকএন্ডে হতে পারে
        const id = Math.random().toString(36).substr(2, 9);
        await axios.post(`${API_URL}/leads`, { ...data, id });
    }

    async updateLeadStatus(id: string, status: string): Promise<void> {
        await axios.put(`${API_URL}/leads/${id}/status`, { status });
    }

    // --- BIG FISH ---
    async getBigFish(): Promise<BigFish[]> {
        const response = await axios.get(`${API_URL}/big-fish`);
        return response.data;
    }

    async addTransaction(fishId: string, data: Transaction): Promise<void> {
        await axios.post(`${API_URL}/big-fish/${fishId}/transactions`, data);
    }

    // --- OTHER ---
    // বাকি ফাংশনগুলো একইভাবে ব্যাকএন্ডের রাউট অনুযায়ী লিখতে হবে...
}

export const apiService = new ApiService();
