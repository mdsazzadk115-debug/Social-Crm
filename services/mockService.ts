
    addCampaignRecord: async (fishId: string, record: Omit<CampaignRecord, 'id' | 'created_at'>): Promise<BigFish | undefined> => { 
        const id = uuid();
        try {
            const data = await safeFetch(`${API_BASE}/big_fish.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'add_campaign_record', 
                    id, 
                    big_fish_id: fishId, 
                    ...record 
                })
            });
            
            // FIX: Return the fresh data from PHP directly. 
            // PHP now returns the full object with updated balance and records.
            if (data && data.id) {
                return data as BigFish;
            }

            // Fallback if data is null (should not happen with new PHP code)
            return await mockService.getBigFishById(fishId);
        } catch (e) { console.error("API Campaign Error", e); }
        return undefined;
    },
