import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import ProductHistory from '../../../models/ProductHistory'; // Import ProductHistory model
import dbConnect from '../../../lib/dbConnect'; // Import dbConnect

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      // Get the filter params (e.g., startDate, endDate)
      const { startDate, endDate, type } = req.query;

      // Build filter for ProductHistory based on the query params
      let filter = {};
      if (startDate && endDate) {
        filter.timestamp = { $gte: new Date(startDate), $lt: new Date(endDate) };
      }

      // Fetch filtered product history
      const history = await ProductHistory.find(filter).populate('userId');

      // If the 'type' is PDF, generate the PDF
      if (type === 'pdf') {
        const doc = new jsPDF();
        doc.text('Product History Report', 20, 20);
        let yOffset = 30;
  
        // Loop through history and add it to the PDF
        history.forEach((entry, index) => {
          doc.text(
            `${index + 1}. ${entry.productName} - ${entry.action} - ${new Date(entry.timestamp).toLocaleString()}`,
            20,
            yOffset
          );
          yOffset += 10;
        });
  
        // Generate the PDF as a Blob
        const pdfOutput = doc.output('arraybuffer');

  
        // Debug: log the size of the PDF (just to check if it's being created)
        console.log("Generated PDF size:", pdfOutput.size);
  
        // Set headers for downloading the file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="product-history-report.pdf"');
        doc.save("test-product-history-report.pdf");
  
        // Send the PDF as a binary stream
        res.status(200).send(pdfOutput);  
      }

      // If the 'type' is Excel, generate the Excel file
      else if (type === 'excel') {
        const data = history.map((entry) => ({
          'Product Name': entry.productName,
          Action: entry.action,
          Timestamp: entry.timestamp.toISOString(),
          User: entry.userId ? entry.userId.email : 'N/A', // Assuming user data is populated
        }));

        // Create the worksheet and workbook
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Product History');

        // Send the Excel file as a response
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="product-history-report.xlsx"');
        res.status(200).send(excelBuffer);
      } else {
        // If the 'type' is not recognized, return an error
        return res.status(400).json({ message: 'Invalid export type. Use "pdf" or "excel".' });
      }

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
