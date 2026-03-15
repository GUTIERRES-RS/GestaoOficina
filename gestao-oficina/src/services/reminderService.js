import api from './api';

const reminderService = {
    getReminders: async () => {
        try {
            const response = await api.get('/finances/reminders');
            return response.data;
        } catch (error) {
            console.error('Error fetching reminders:', error);
            throw error;
        }
    }
};

export default reminderService;
