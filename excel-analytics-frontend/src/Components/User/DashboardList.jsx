import React from 'react'

const DashboardList = ({ dashboards }) => {
    console.log("dashboards in DashboardList:", dashboards);
  
    if (!dashboards) {
      return <div>Loading dashboards...</div>; 
    }
  
    if (!Array.isArray(dashboards)) {
      return <div>Error: Could not load dashboards.</div>; 
    }
  
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">My Dashboards</h2>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            + New Dashboard
          </button>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((dashboard) => (
            <div
              key={dashboard._id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <h3 className="font-semibold text-lg mb-1">{dashboard.title}</h3>
                <p className="text-gray-600 text-sm mb-3">
                  {dashboard.description}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>
                    Last updated:{" "}
                    {new Date(dashboard.lastUpdated).toLocaleDateString()}
                  </span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Private
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-100 px-5 py-3 bg-gray-50 flex justify-end space-x-2">
                <button className="text-sm text-indigo-600 hover:text-indigo-800">
                  Edit
                </button>
                <button className="text-sm text-red-600 hover:text-red-800">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
export default DashboardList