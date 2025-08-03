import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Flag, 
  AlertCircle, 
  CheckCircle,
  Users,
  Building,
  Calendar
} from 'lucide-react';
import { 
  ComplaintFormModal, 
  ComplaintFlagButton, 
  ComplaintCard,
  useComplaints 
} from '../index';
import { Button } from '../../../shared/ui/components/Button';
import { Card } from '../../../shared/ui/components/Card';

const ComplaintSystemDemo = () => {
  const { complaints, loading, fetchComplaints } = useComplaints();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock court data for demonstration
  // eslint-disable-next-line no-unused-vars
  const mockCourts = [
    {
      _id: '1',
      name: 'Elite Football Court A',
      type: 'football',
      location: { address: '123 Sport St', city: 'Tunis' },
      pricePerHour: 45,
      rating: 4.5,
      images: ['/placeholder.jpg'],
      amenities: ['Parking', 'Lighting', 'Changing Rooms']
    },
    {
      _id: '2', 
      name: 'Premium Tennis Court',
      type: 'tennis',
      location: { address: '456 Game Ave', city: 'Sfax' },
      pricePerHour: 35,
      rating: 4.8,
      images: ['/placeholder.jpg'],
      amenities: ['AC', 'Pro Shop', 'Cafe']
    }
  ];

  // Mock booking data
  // eslint-disable-next-line no-unused-vars
  const mockBookings = [
    {
      _id: 'booking1',
      courtName: 'Elite Football Court A',
      date: '2024-08-03',
      time: '14:00-16:00',
      status: 'confirmed',
      totalAmount: 90
    }
  ];

  useEffect(() => {
    // Load complaints when component mounts
    fetchComplaints().catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleComplaintCreated = () => {
    fetchComplaints();
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Complaint System Demo
          </h1>
          <p className="text-gray-400 text-lg">
            Interactive demonstration of the complete complaint management system
          </p>
        </div>

        {/* Demo Sections */}
        <div className="space-y-12">
          
          {/* Section 1: Flag Buttons Demo */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Flag className="mr-3 text-red-400" />
              1. Flag Buttons Integration
            </h2>
            <p className="text-gray-400 mb-6">
              These flag buttons can be integrated anywhere in your app where users might need to report issues.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Court Card Example */}
              <Card className="p-6">
                <h3 className="text-white font-bold mb-4 flex items-center">
                  <Building className="mr-2" size={20} />
                  Court Listing
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">Elite Football Court A</p>
                      <p className="text-gray-400 text-sm">Tunis • $45/hour</p>
                    </div>
                    <ComplaintFlagButton
                      relatedTo={{
                        type: 'court',
                        referenceId: '1',
                        referenceName: 'Elite Football Court A'
                      }}
                      variant="icon"
                      size="sm"
                    />
                  </div>
                  <div className="pt-3 border-t border-gray-700">
                    <ComplaintFlagButton
                      relatedTo={{
                        type: 'court',
                        referenceId: '1',
                        referenceName: 'Elite Football Court A'
                      }}
                      variant="button"
                      size="sm"
                      className="w-full"
                    />
                  </div>
                </div>
              </Card>

              {/* Booking Card Example */}
              <Card className="p-6">
                <h3 className="text-white font-bold mb-4 flex items-center">
                  <Calendar className="mr-2" size={20} />
                  Booking History
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">Elite Football Court A</p>
                      <p className="text-gray-400 text-sm">Aug 3, 2:00-4:00 PM</p>
                      <p className="text-green-400 text-sm">Confirmed • $90</p>
                    </div>
                    <ComplaintFlagButton
                      relatedTo={{
                        type: 'booking',
                        referenceId: 'booking1',
                        referenceName: 'Booking on Aug 3, 2024'
                      }}
                      variant="icon"
                      size="sm"
                    />
                  </div>
                  <div className="pt-3 border-t border-gray-700">
                    <ComplaintFlagButton
                      relatedTo={{
                        type: 'booking',
                        referenceId: 'booking1',
                        referenceName: 'Booking on Aug 3, 2024'
                      }}
                      variant="text"
                      size="sm"
                      className="w-full justify-center"
                    />
                  </div>
                </div>
              </Card>

              {/* General Complaint */}
              <Card className="p-6">
                <h3 className="text-white font-bold mb-4 flex items-center">
                  <MessageSquare className="mr-2" size={20} />
                  General Issues
                </h3>
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    Users can submit general complaints not related to specific items.
                  </p>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    variant="primary"
                    className="w-full"
                  >
                    Submit General Complaint
                  </Button>
                </div>
              </Card>
            </div>
          </section>

          {/* Section 2: Recent Complaints */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <MessageSquare className="mr-3 text-blue-400" />
              2. Recent Complaints
            </h2>
            <p className="text-gray-400 mb-6">
              View of submitted complaints with different statuses and categories.
            </p>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading complaints...</p>
              </div>
            ) : complaints.length > 0 ? (
              <div className="grid gap-4">
                {complaints.slice(0, 3).map((complaint) => (
                  <ComplaintCard
                    key={complaint._id}
                    complaint={complaint}
                    showSubmittedBy={false}
                    showActions={true}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-gray-300 font-medium mb-2">No complaints yet</h3>
                <p className="text-gray-500 mb-4">
                  Try submitting a test complaint using the buttons above.
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  variant="primary"
                >
                  Create Test Complaint
                </Button>
              </Card>
            )}
          </section>

          {/* Section 3: System Features */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">
              3. System Features Overview
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center">
                <div className="bg-blue-500/20 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="text-blue-400" size={24} />
                </div>
                <h3 className="text-white font-medium mb-2">Role-Based Access</h3>
                <p className="text-gray-400 text-sm">
                  Different views for Players, Managers, and Admins
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="bg-green-500/20 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-green-400" size={24} />
                </div>
                <h3 className="text-white font-medium mb-2">Real-time Updates</h3>
                <p className="text-gray-400 text-sm">
                  Status changes and replies update instantly
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="bg-yellow-500/20 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="text-yellow-400" size={24} />
                </div>
                <h3 className="text-white font-medium mb-2">Priority System</h3>
                <p className="text-gray-400 text-sm">
                  Low, Medium, High, and Urgent priority levels
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="bg-purple-500/20 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="text-purple-400" size={24} />
                </div>
                <h3 className="text-white font-medium mb-2">Comment System</h3>
                <p className="text-gray-400 text-sm">
                  Two-way communication between users and staff
                </p>
              </Card>
            </div>
          </section>

          {/* Section 4: Navigation Links */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">
              4. Navigation & Access
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6">
                <h3 className="text-white font-bold mb-4">👤 Players</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• User dropdown → "My Complaints"</li>
                  <li>• Route: <code className="text-blue-400">/my-complaints</code></li>
                  <li>• Flag buttons on courts/bookings</li>
                  <li>• View status and add comments</li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="text-white font-bold mb-4">🏢 Managers</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• User dropdown → "Complaints"</li>
                  <li>• Route: <code className="text-blue-400">/manager/complaints</code></li>
                  <li>• Handle facility-related issues</li>
                  <li>• Respond to customer complaints</li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="text-white font-bold mb-4">👑 Admins</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Dashboard → "Complaint Management"</li>
                  <li>• Route: <code className="text-blue-400">/dashboard/complaint-management</code></li>
                  <li>• Full system oversight</li>
                  <li>• Advanced response tools</li>
                </ul>
              </Card>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="text-center">
            <h2 className="text-2xl font-bold text-white mb-6">Try It Out!</h2>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => window.open('/my-complaints', '_blank')}
                variant="primary"
              >
                Open My Complaints
              </Button>
              <Button
                onClick={() => window.open('/manager/complaints', '_blank')}
                variant="secondary"
              >
                Manager View
              </Button>
              <Button
                onClick={() => window.open('/dashboard/complaint-management', '_blank')}
                variant="secondary"
              >
                Admin Dashboard
              </Button>
            </div>
          </section>
        </div>

        {/* Create Complaint Modal */}
        <ComplaintFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleComplaintCreated}
        />
      </div>
    </div>
  );
};

export default ComplaintSystemDemo;
