import React from 'react';
import DataTable from '../../../../shared/ui/components/DataTable'; // Adjusted path to DataTable
import { Icons } from '../../../../shared/ui/components/Icons';

const AdminCompanyTable = ({ 
  companies, 
  onApproveCompany, 
  onSuspendCompany, 
  onDeleteCompany 
}) => {
  const columns = React.useMemo(
    () => [
      {
        Header: 'Company Name',
        accessor: 'companyName',
      },
      {
        Header: 'Owner Name',
        accessor: 'ownerId.fullName',
        Cell: ({ value }) => value || 'N/A',
      },
      {
        Header: 'Owner Email',
        accessor: 'ownerId.email',
        Cell: ({ value }) => value || 'N/A',
      },
      {
        Header: 'City',
        accessor: 'address.city',
        Cell: ({ value }) => value || 'N/A',
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }) => (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              value === 'Active'
                ? 'bg-green-100 text-green-800'
                : value === 'Pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800' // Assuming other statuses like Suspended
            }`}
          >
            {value}
          </span>
        ),
      },
      {
        Header: 'Verified',
        accessor: 'isVerified',
        Cell: ({ value }) => (value ? 
          <span className="text-green-400 font-semibold">Yes</span> : 
          <span className="text-red-400 font-semibold">No</span>
        ),
      },
      {
        Header: 'Actions',
        id: 'actions', // id is required if no accessor
        Cell: ({ row }) => {
          const company = row; // Changed from row.original to row

          // If company data is not available for this row, render nothing.
          if (!company) {
            return null; 
          }
          
          return (
            <div className="flex items-center space-x-2">
              {!company.isVerified && company.status === 'Pending' && (
                <button
                  onClick={() => onApproveCompany(company._id)}
                  className="p-1.5 text-green-400 hover:text-green-300 transition-colors duration-150 bg-slate-700 hover:bg-slate-600 rounded-md"
                  title="Approve Company"
                >
                  <Icons.CheckCircle className="w-[18px] h-[18px]" />
                </button>
              )}
              {company.isVerified && company.status === 'Active' && (
                 <button
                  onClick={() => onSuspendCompany(company._id)}
                  className="p-1.5 text-yellow-400 hover:text-yellow-300 transition-colors duration-150 bg-slate-700 hover:bg-slate-600 rounded-md"
                  title="Suspend Company"
                >
                  <Icons.XCircle className="w-[18px] h-[18px]" /> {/* Using XCircle for suspend/reject action */}
                </button>
              )}
               {/* Always show delete, or conditionally based on other logic if needed */}
              <button
                onClick={() => onDeleteCompany(company._id)}
                className="p-1.5 text-red-500 hover:text-red-400 transition-colors duration-150 bg-slate-700 hover:bg-slate-600 rounded-md"
                title="Delete Company"
              >
                <Icons.Trash2 className="w-[18px] h-[18px]" />
              </button>
            </div>
          );
        },
      },
    ],
    [onApproveCompany, onSuspendCompany, onDeleteCompany] // Add handlers to dependency array
  );

  if (!companies) {
    return <p className="text-center text-slate-400 py-10">Loading companies...</p>;
  }
  
  // DataTable itself handles the "No data available" case.
  // We can add a wrapper for the title if desired.
  return (
    <div className="bg-slate-900 pt-4"> 
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center">All Companies (Admin View)</h2>
      <DataTable data={companies} columns={columns} itemsPerPage={10} />
    </div>
  );
};

export default AdminCompanyTable;
