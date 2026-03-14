const settingsController = require('./controllers/settingsController');

// Mock request and response
const req = {
    body: {
        workshop_name: "Teste Manuel",
        items_per_page: "12"
    }
};

const res = {
    json: (data) => console.log('JSON response:', data),
    status: (code) => ({
        json: (data) => console.log(`Status ${code} response:`, data)
    })
};

// We need to mock the pool as well if we were to run it, 
// but we just want to see the console logs from the controller 
// up to the query execution point.
// However, the controller is an object with methods.

console.log('--- Testing update method logic ---');
// To avoid actually hitting the DB, we'd need to mock pool.query
// But let's just see if we can import it and check the code or run it with a mock pool.

async function runTest() {
    try {
        // Mock pool
        const originalPool = require('./config/database');
        require('./config/database').query = async (query, values) => {
            console.log('Mock Pool Query Called');
            console.log('Query:', query.trim().replace(/\s+/g, ' '));
            console.log('Values:', values);
            return [{ affectedRows: 1 }];
        };

        await settingsController.update(req, res);
    } catch (err) {
        console.error('Test error:', err);
    }
}

runTest();
