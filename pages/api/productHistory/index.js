import dbConnect from '../../../lib/dbConnect';
import { authMiddleware } from '../../../middleware/authMiddleware';
import ProductHistory from '../../../models/ProductHistory'; // Import ProductHistory model

export default async function handler(req, res) {

  await dbConnect();
  

  if (req.method === 'GET') {
    try {
      const { year, month, startDate, endDate } = req.query;
      console.log('Request parameters:', { year, month, startDate, endDate });

      let filter = {};

      // Filter by Year only
      if (year && !month && !startDate && !endDate) {
        const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);  // Set to midnight of January 1st
        const endOfYear = new Date(`${parseInt(year) + 1}-01-01T00:00:00.000Z`); // Start of next year
        console.log('Year filter:', { startOfYear, endOfYear });
        filter.timestamp = { $gte: startOfYear, $lt: endOfYear };
      }

      // Filter by Year and Month
      if (year && month && !startDate && !endDate) {
        const startOfMonth = new Date(`${year}-${month.padStart(2, '0')}-01T00:00:00.000Z`); // Start of the selected month
        const nextMonth = new Date(startOfMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1); // Get the next month
        console.log('Year and Month filter:', { startOfMonth, nextMonth });
        filter.timestamp = { $gte: startOfMonth, $lt: nextMonth };
      }

      // Filter by Date Range (Start Date and End Date)
      if (startDate && endDate && !year && !month) {
        console.log('Date Range filter:', { startDate, endDate });
        filter.timestamp = { $gte: new Date(startDate), $lt: new Date(endDate) };
      }

      // If all filters are present, combine them logically
      if (year && month && startDate && endDate) {
        console.log('All filters present, using date range:', { startDate, endDate });
        filter.timestamp = { 
          $gte: new Date(startDate), 
          $lt: new Date(endDate) 
        };
      }

      // Debugging: check the filter object before querying the database
      console.log('Final filter:', filter);

      // Fetch the filtered history data
      const history = await ProductHistory.find(filter).populate('userId');


      // Return the filtered history data
      res.status(200).json({ history });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    console.log('Method not allowed');
    res.status(405).json({ message: 'Method not allowed' });
  }
}
