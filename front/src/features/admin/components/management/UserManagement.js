import React from 'react';
import DataTable from '../../../../shared/ui/components/DataTable'; // Changed to DataTable component
import { Edit, Trash2, UserCheck, UserX } from 'lucide-react'; // Added icons

const UserManagement = () => {
    // Example data
    const columns = [
      { Header: 'ID', accessor: 'id' },
      {
        Header: 'Name',
        accessor: 'name',
        Cell: ({ value }) => (
          <span className="font-medium text-slate-100">{value}</span>
        ),
      },
      {
        Header: 'Email',
        accessor: 'email',
        Cell: ({ value }) => (
          <span className="text-slate-300">{value}</span>
        ),
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }) => {
          const isActive = value === 'Active';
          const bgColor = isActive ? 'bg-green-500/80' : 'bg-red-500/80';
          const icon = isActive ? <UserCheck size={14} className="mr-1.5" /> : <UserX size={14} className="mr-1.5" />;
          return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white ${bgColor}`}>
              {icon}
              {value}
            </span>
          );
        }
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        Cell: ({ row }) => (
          <div className="flex space-x-2">
            <button
              onClick={() => alert(`Editing ${row.original.name}`)}
              className="text-sky-400 hover:text-sky-300 transition-colors p-1 rounded-md hover:bg-sky-500/10"
              title="Edit User"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => alert(`Deleting ${row.original.name}`)}
              className="text-red-400 hover:text-red-300 transition-colors p-1 rounded-md hover:bg-red-500/10"
              title="Delete User"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )
      },
    ];
  
    const data = [
      { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
      // Add more data as needed
    ];
  
    return (
      <div className="animate-fadeIn p-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">User Management</h2>
        <DataTable 
          columns={columns} 
          data={data} 
          itemsPerPage={5} // Consistent with SampleTablePage, can be adjusted
        />
      </div>
    );
  };
  
  export default UserManagement;