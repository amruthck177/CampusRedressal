const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config(); // Fallback for root .env if present
const mongoose = require('mongoose');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const AuditLog = require('../models/AuditLog');

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Complaint.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('Seeding: Cleared old DB entries.');

    // Create users
    const student = new User({
      name: 'Demo Student',
      email: 'student@college.edu',
      password: 'student123', // Will be hashed by user pre-save hook
      role: 'student',
    });

    const admin = new User({
      name: 'System Admin',
      email: 'admin@college.edu',
      password: 'admin123', // Will be hashed by user pre-save hook
      role: 'admin',
    });

    const staff = new User({
      name: 'Warden Staff',
      email: 'staff@college.edu',
      password: 'staff123',
      role: 'staff',
      department: 'Hostel Warden',
    });

    await student.save();
    await admin.save();
    await staff.save();

    console.log('Seeding: Created accounts.');
    console.log('  Student: student@college.edu / student123');
    console.log('  Admin: admin@college.edu / admin123');
    console.log('  Staff: staff@college.edu / staff123');

    // Create mock complaints
    const c1 = new Complaint({
      studentId: student._id,
      studentName: student.name,
      title: 'Poor Wi-Fi Connectivity in Library Study Area',
      category: 'IT/Library',
      description: 'The Wi-Fi speed in the library reading room is extremely slow (less than 1 Mbps) and keeps disconnecting every 5 minutes. This makes it impossible to access online academic research papers or carry out digital study.',
      status: 'Pending',
      priority: 'High',
      isAnonymous: false,
      department: 'IT & Library Administration',
      upvotes: [student._id],
    });
    c1.statusHistory.push({
      status: 'Pending',
      changedBy: student._id,
      changedByName: student.name,
      remark: 'Initial complaint filed.',
    });
    await c1.save();

    const c2 = new Complaint({
      studentId: student._id,
      studentName: student.name,
      title: 'Broken Lights in Hostel Block B Third Floor Corridor',
      category: 'Infrastructure',
      description: 'Three tube lights are completely broken in the third-floor corridor of Block B near Room 304. The corridor is completely dark after 6 PM, which is a major safety hazard for students walking at night.',
      status: 'In Progress',
      priority: 'Medium',
      isAnonymous: false,
      department: 'Maintenance Desk',
    });
    c2.statusHistory.push(
      {
        status: 'Pending',
        changedBy: student._id,
        changedByName: student.name,
        remark: 'Initial complaint filed.',
      },
      {
        status: 'In Progress',
        changedBy: admin._id,
        changedByName: admin.name,
        remark: 'Assigned to the electrician team. Spares have been ordered.',
      }
    );
    await c2.save();

    const c3 = new Complaint({
      studentId: student._id,
      studentName: 'Anonymous',
      title: 'Verbal Harassment by Senior Students in Parking Lot',
      category: 'Ragging/Harassment',
      description: 'A group of 3-4 senior students were verbally abusing and ragging freshers in the main parking lot yesterday around 5 PM. They forced students to clean their bikes and used offensive language. We feel unsafe going to the parking area alone.',
      status: 'Pending',
      priority: 'Urgent', // Auto-priority flagged due to Ragging/Harassment
      isAnonymous: true,
      department: 'Anti-Ragging Committee',
    });
    c3.statusHistory.push({
      status: 'Pending',
      changedBy: student._id,
      changedByName: student.name,
      remark: 'Complaint filed anonymously. Priority automatically flagged Urgent.',
    });
    await c3.save();

    const c4 = new Complaint({
      studentId: student._id,
      studentName: student.name,
      title: 'Unhygienic Food Serving Conditions in Canteen',
      category: 'Canteen',
      description: 'The kitchen staff serving food in the main canteen do not wear hairnets or gloves. Yesterday, I found a hair in the rice served. Flies are also swarming around the open buffet dishes.',
      status: 'Resolved',
      priority: 'Medium',
      isAnonymous: false,
      department: 'Canteen Management',
      remarks: 'Conducted inspection of canteen premises. Issued a warnings notice to the caterer and mandated hairnets + gloves for all kitchen staff starting tomorrow.',
    });
    c4.statusHistory.push(
      {
        status: 'Pending',
        changedBy: student._id,
        changedByName: student.name,
        remark: 'Filed.',
      },
      {
        status: 'Resolved',
        changedBy: admin._id,
        changedByName: admin.name,
        remark: 'Caterer warned, new sanitary measures implemented and inspected.',
      }
    );
    c4.feedback = {
      rating: 4,
      comment: 'The canteen staff are now wearing gloves. Thanks for the quick response!',
    };
    await c4.save();

    // Add audit logs
    const a1 = new AuditLog({
      complaintId: c1._id,
      action: 'Complaint Created',
      performedBy: student._id,
      performedByName: student.name,
      performedByRole: student.role,
      details: `Created complaint: "${c1.title}"`,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    });
    await a1.save();

    const a2 = new AuditLog({
      complaintId: c2._id,
      action: 'Status Change',
      performedBy: admin._id,
      performedByName: admin.name,
      performedByRole: admin.role,
      details: `Changed status of "${c2.title}" to In Progress. Remarks: "Assigned to the electrician team."`,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1), // 1 hour ago
    });
    await a2.save();

    console.log('Seeding: Created 4 mock complaints with logs.');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
};

// Check if run directly from command line
if (require.main === module) {
  const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/campus-redressal';
  console.log(`Connecting to ${mongoUri} for standalone seeding...`);
  mongoose.connect(mongoUri)
    .then(async () => {
      await seedData();
      mongoose.connection.close();
      console.log('Standalone seeding complete.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Standalone seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedData };
