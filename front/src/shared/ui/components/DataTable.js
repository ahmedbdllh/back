import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Helper function to get nested values from an object using a dot-notation path
const getNestedValue = (obj, path) => {
  if (!path) return undefined;
  const keys = path.split('.');
  return keys.reduce((currentObject, key) => {
    return currentObject && currentObject[key] !== undefined ? currentObject[key] : undefined;
  }, obj);
};

const DataTable = ({ data, columns, itemsPerPage = 10 }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  if (!data || data.length === 0) {
    return <p className="text-center text-gray-400 py-8">No data available.</p>;
  }

  return (
    <div className="bg-[#0F172A] shadow-2xl rounded-xl overflow-hidden border border-slate-700/50">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="">
            <tr>
              {columns.map((col, colIndex) => (
                <th 
                  key={col.id || col.accessor || col.Header || colIndex} // Added more fallbacks for key
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold text-sky-300 uppercase tracking-wider whitespace-nowrap"
                >
                  {col.Header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {currentData.map((row, rowIndex) => (
              <tr key={row._id || rowIndex} className="hover:bg-slate-700/30 transition-colors duration-150">
                {columns.map((col, colIndex) => {
                  const cellValue = getNestedValue(row, col.accessor);
                  return (
                    <td 
                      key={`${col.id || col.accessor || col.Header || colIndex}-${row._id || rowIndex}`} // Composite key for td
                      className="px-6 py-4 whitespace-nowrap text-sm text-slate-300"
                    >
                      {col.Cell ? col.Cell({ value: cellValue, row }) : cellValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between bg-slate-800/50">
          <p className="text-sm text-slate-400">
            Showing <span className="font-medium text-sky-300">{startIndex + 1}</span>
            {' '}to <span className="font-medium text-sky-300">{Math.min(endIndex, data.length)}</span>
            {' '}of <span className="font-medium text-sky-300">{data.length}</span> results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 rounded-md bg-slate-700/50 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-slate-400">
              Page <span className="font-medium text-sky-300">{currentPage}</span> of <span className="font-medium text-sky-300">{totalPages}</span>
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md bg-slate-700/50 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;