// Mock data for development and testing
// This file contains fake users for testing the application

export const mockUsers = [
  // Admin user
  {
    _id: 'admin001',
    name: 'Admin User',
    email: 'admin@olympiad.com',
    password: 'admin123', // In production, this should be hashed
    role: 'admin',
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString()
  },
  
  // Owner user
  {
    _id: 'owner001',
    name: 'Owner User',
    email: 'owner@olympiad.com',
    password: 'owner123', // In production, this should be hashed
    role: 'owner',
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString()
  },
  
  // Student users (3 users)
  {
    _id: 'student001',
    name: 'John Doe',
    email: 'john.doe@student.com',
    password: 'student123', // In production, this should be hashed
    role: 'student',
    createdAt: new Date('2024-01-20').toISOString(),
    updatedAt: new Date('2024-01-20').toISOString()
  },
  {
    _id: 'student002',
    name: 'Jane Smith',
    email: 'jane.smith@student.com',
    password: 'student123', // In production, this should be hashed
    role: 'student',
    createdAt: new Date('2024-01-21').toISOString(),
    updatedAt: new Date('2024-01-21').toISOString()
  },
  {
    _id: 'student003',
    name: 'Mike Johnson',
    email: 'mike.johnson@student.com',
    password: 'student123', // In production, this should be hashed
    role: 'student',
    createdAt: new Date('2024-01-22').toISOString(),
    updatedAt: new Date('2024-01-22').toISOString()
  }
];

// Helper function to get user by email (for mock authentication)
export const getUserByEmail = (email) => {
  return mockUsers.find(user => user.email === email);
};

// Helper function to get user by ID
export const getUserById = (id) => {
  return mockUsers.find(user => user._id === id);
};

// Helper function to get users by role
export const getUsersByRole = (role) => {
  return mockUsers.filter(user => user.role === role);
};

// Export individual users for easy access
export const adminUser = mockUsers.find(u => u.role === 'admin');
export const ownerUser = mockUsers.find(u => u.role === 'owner');
export const studentUsers = mockUsers.filter(u => u.role === 'student');

