const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');

const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

const filePath = path.join(__dirname, 'data.json');

app.use(cors());


app.get('/api/seed/:count', async (req, res) => {
    try {
        const count = parseInt(req.params.count, 10) || 1000;
        let existingData = [];

        try {
            const fileData = await fsPromises.readFile(filePath, 'utf-8');
            existingData = JSON.parse(fileData);
        } catch (e) {
            existingData = [];
        }

        const currentLength = existingData.length;
        const newEvents = [];

        for (let i = 1; i <= count; i++) {
            const id = `evt_${String(currentLength + i).padStart(3, '0')}`;
            newEvents.push({
                id,
                title: `Mock Event ${currentLength + i}`,
                capacity: Math.floor(Math.random() * 80) + 20,
                joinedCount: Math.floor(Math.random() * 20),
            });
        }

        const finalData = [...existingData, ...newEvents];
        await fsPromises.writeFile(filePath, JSON.stringify(finalData, null, 2), 'utf-8');

        return res.status(200).json({
            message: `Successfully seeded ${count} events.`,
            totalEvents: finalData.length
        });
    } catch (err) {
        console.error("Error seeding data:", err);
        return res.status(500).json({ error: 'Failed to seed data' });
    }
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/api/data', async (req, res) => {
    try {
        const fileContent = await fsPromises.readFile(filePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);

        // Implement pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const paginatedEvents = jsonData.slice(startIndex, endIndex);

        const data = {
            message: 'This is some sample data from the API.',
            timestamp: new Date(),
            totalEvents: jsonData.length,
            page,
            limit,
            totalPages: Math.ceil(jsonData.length / limit),
            events: paginatedEvents
        };
        return res.status(200).json(data);
    } catch (error) {
        console.error("Error reading data:", error);
        return res.status(500).json({ error: 'Failed to read data' });
    }
});

app.get('/api/join/:id', async (req, res) => {
    const id = req.params.id;
    console.log(`Received request to join event with id: ${id}`);

    try {
        const fileContent = await fsPromises.readFile(filePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);

        const eventIndex = jsonData.findIndex(e => e.id === id);

        if (eventIndex === -1) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const event = jsonData[eventIndex];

        if (event.joinedCount >= event.capacity) {
            return res.status(400).json({ error: 'Event is full' });
        }

        jsonData[eventIndex].joinedCount += 1;

        // Save back to file
        await fsPromises.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');

        return res.status(200).json({
            message: `Successfully joined event ${id}`,
            currentCount: jsonData[eventIndex].joinedCount
        });
    } catch (err) {
        console.error("Error updating event:", err);
        return res.status(500).json({ error: 'Internal server error saving data' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
