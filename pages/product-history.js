import { useState, useEffect } from 'react';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import Topbar from '../components/Topbar'; // Assuming you have a Topbar component

export default function ProductHistoryPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch product history based on the filters (Year, Month, Date Range)
  const fetchProductHistory = async () => {
    setLoading(true);
    try {
      // Build the query parameters
      let query = '';
      if (year) {
        query += `year=${year}&`;
      }
      if (month) {
        query += `month=${month}&`;
      }
      if (startDate && endDate) {
        query += `startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await fetch(`/api/productHistory?${query}`);
      const data = await response.json();
      setHistoryData(data.history || []); // Ensure it's an array
    } catch (error) {
      console.error('Error fetching product history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle PDF download
  const handleDownloadPDF = async () => {
    const response = await fetch(`/api/export?startDate=${startDate}&endDate=${endDate}&type=pdf`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'product-history-report.pdf';
    link.click();
  };

  // Function to handle Excel download
  const handleDownloadExcel = async () => {
    const response = await fetch(`/api/export?startDate=${startDate}&endDate=${endDate}&type=excel`);
    const buffer = await response.arrayBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'product-history-report.xlsx';
    link.click();
  };

  // Effect to fetch data when filters change
  useEffect(() => {
    fetchProductHistory();
  }, [year, month, startDate, endDate]);

  return (
    <>
      <Topbar />
      <div className="container mx-auto p-4 w-full sm:w-3/4">
        <h1 className="text-xl font-semibold mb-4">Product History</h1>
        <div className="flex flex-col mb-4 sm:flex-row sm:items-center sm:justify-between sm:space-x-4 sm:space-y-0 space-y-4">
  {/* Year Filter */}
  <div className="mb-6 sm:mb-0 sm:w-1/4">
    <label className="block text-sm font-medium text-gray-700">Year</label>
    <input
      type="number"
      value={year}
      onChange={(e) => setYear(e.target.value)}
      className="mt-1 p-2 border rounded-md w-full"
      placeholder="Enter Year"
    />
  </div>

  {/* Month Filter */}
  <div className="mb-6 sm:mb-0 sm:w-1/4">
    <label className="block text-sm font-medium text-gray-700">Month</label>
    <input
      type="number"
      value={month}
      onChange={(e) => setMonth(e.target.value)}
      className="mt-1 p-2 border rounded-md w-full"
      placeholder="Enter Month (1-12)"
    />
  </div>

  {/* Date Range Filter - Start Date */}
  <div className="mb-6 sm:mb-0 sm:w-1/4">
    <label className="block text-sm font-medium text-gray-700">Start Date</label>
    <input
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      className="mt-1 p-2 border border-black-100 rounded-md w-full"
    />
  </div>

  {/* Date Range Filter - End Date */}
  <div className="mb-6 sm:mb-0 sm:w-1/4">
    <label className="block text-sm font-medium text-gray-700">End Date</label>
    <input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      className="mt-1 p-2 border rounded-md w-full"
    />
  </div>


</div>



        {/* Loading Spinner */}
        {loading && <div>Loading...</div>}

        {/* Product History Table */}
        <div className="overflow-x-auto bg-white shadow rounded-md">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Product Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Action</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Timestamp</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">User</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                  <div className="flex space-x-4 justify-start">
                    <FaFilePdf 
                      onClick={handleDownloadPDF} 
                      className="cursor-pointer text-blue-600 hover:text-blue-700 w-[20px] h-[20px]" 
                      title="Download PDF"
                    />
                    <FaFileExcel 
                      onClick={handleDownloadExcel} 
                      className="cursor-pointer text-green-600 hover:text-green-700 w-[20px] h-[20px]" 
                      title="Download Excel"
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {historyData.length > 0 ? (
                historyData.map((entry) => (
                  <tr key={entry._id} className="border-b">
                    <td className="px-6 py-4">{entry.productName}</td>
                    <td className="px-6 py-4">{entry.action}</td>
                    <td className="px-6 py-4">{new Date(entry.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4">{entry.userId ? entry.userId.email : 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center">No product history available for the selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
