import dotenv from 'dotenv';
import axios from 'axios';
import { createEvents } from 'ics'; // Import createEvents from ics
import fs from 'fs';

dotenv.config();

// Access the RAWG API key from environment variable
const rawgApiKey = process.env.RAWG_API_KEY;

if (!rawgApiKey) {
  console.error('Error: RAWG API key is not set in the environment variables.');
  process.exit(1); // Exit the process if the API key is not set
}

// Get the date range starting from today to the end of the current month
function getDateRangeFromToday() {
  const today = new Date().toISOString().split('T')[0];
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
  return { start: today, end: endOfMonth };
}

// Check if the release date is today or in the future
function isDateInFuture(date) {
  const today = new Date();
  const releaseDate = new Date(date);
  return releaseDate >= today;
}

// Fetch upcoming Steam game releases from today onwards from RAWG API
async function getUpcomingSteamReleases() {
  const { start, end } = getDateRangeFromToday();
  const url = `https://api.rawg.io/api/games?key=${rawgApiKey}&platforms=4&dates=${start},${end}&ordering=released`;

  try {
    const response = await axios.get(url);
    const games = response.data.results;

    const events = []; // Create an array to hold events

    games.forEach(game => {
      if (isDateInFuture(game.released)) {
        const releaseDate = new Date(game.released);

        // Create an event object
        events.push({
          start: [releaseDate.getFullYear(), releaseDate.getMonth() + 1, releaseDate.getDate()],
          title: `Release: ${game.name}`,
          description: `${game.name} will be released on this date!`,
          location: 'Steam Store',
        });

        console.log(`Added to calendar: ${game.name}, Release Date: ${game.released}`);
      } else {
        console.log(`Skipping ${game.name} (Release Date: ${game.released})`);
      }
    });

    // Generate the .ics file
    createEvents(events, (error, value) => {
      if (error) {
        console.error('Error generating ICS file:', error);
      } else {
        fs.writeFileSync('upcoming_steam_releases.ics', value);
        console.log('Calendar file created: upcoming_steam_releases.ics');
      }
    });
  } catch (error) {
    console.error('Error fetching Steam game releases:', error);
  }
}

getUpcomingSteamReleases();