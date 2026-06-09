const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Department = require('./models/Department');
const Leave = require('./models/Leave');
const Attendance = require('./models/Attendance');
const Job = require('./models/Job');
const Candidate = require('./models/Candidate');
const Performance = require('./models/Performance');
const Notification = require('./models/Notification');
const { parseResumeAndScore } = require('./utils/aiParser');
const { generatePerformanceSummary } = require('./utils/aiSummary');

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hr_management');
    console.log('Connected to database for seeding...');

    // Clear existing collections
    await User.deleteMany();
    await Department.deleteMany();
    await Leave.deleteMany();
    await Attendance.deleteMany();
    await Job.deleteMany();
    await Candidate.deleteMany();
    await Performance.deleteMany();
    await Notification.deleteMany();
    console.log('Cleared all collections.');

    // 1. Create Departments
    const engineering = await Department.create({
      name: 'Engineering',
      description: 'Software development, QA, and IT operations',
    });

    const hrDept = await Department.create({
      name: 'Human Resources',
      description: 'Employee relations, recruitment, and benefits',
    });

    const sales = await Department.create({
      name: 'Sales',
      description: 'Enterprise sales, account management, and business development',
    });

    console.log('Created departments.');

    // 2. Create Users
    // Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@hr.com',
      password: 'AdminPassword123',
      role: 'Admin',
      position: 'Director of Operations',
      salary: 120000,
    });

    // HR Manager
    const hr = await User.create({
      name: 'Jane HR Manager',
      email: 'hr@hr.com',
      password: 'HRPassword123',
      role: 'HR',
      department: hrDept._id,
      position: 'HR Manager',
      salary: 75000,
    });

    // Employee 1
    const emp1 = await User.create({
      name: 'John Employee',
      email: 'employee@hr.com',
      password: 'EmployeePassword123',
      role: 'Employee',
      department: engineering._id,
      position: 'Software Engineer',
      salary: 90000,
    });

    // Employee 2
    const emp2 = await User.create({
      name: 'Sarah Sales Rep',
      email: 'sales@hr.com',
      password: 'SalesPassword123',
      role: 'Employee',
      department: sales._id,
      position: 'Account Executive',
      salary: 60000,
    });

    console.log('Created users.');

    // 3. Create Jobs
    const job1 = await Job.create({
      title: 'Fullstack React Engineer',
      description: 'We are looking for a Software Engineer to work on our core product dashboard. You will build clean user interfaces with React and robust backend APIs with Node.js.',
      department: engineering._id,
      requirements: ['React', 'Node.js', 'MongoDB', 'Tailwind'],
      salaryRange: '$85k - $110k',
      location: 'Remote',
      type: 'Full-time'
    });

    const job2 = await Job.create({
      title: 'Senior Recruitment Specialist',
      description: 'Join our internal HR team to identify, screen, and interview applicants. You will collaborate with department heads to meet hiring metrics.',
      department: hrDept._id,
      requirements: ['ATS', 'Interviews', 'Onboarding'],
      salaryRange: '$60k - $75k',
      location: 'Hybrid',
      type: 'Full-time'
    });

    console.log('Created jobs.');

    // 4. Create Candidates (using AI parser helper)
    const cand1Info = await parseResumeAndScore('Alice Candidate', 'alice@developer.com', job1.requirements);
    await Candidate.create({
      job: job1._id,
      name: 'Alice Candidate',
      email: 'alice@developer.com',
      phone: '555-0199',
      notes: 'Strong candidate with React experience, had a great intro call.',
      status: 'Interview',
      extractedInfo: cand1Info.extractedInfo,
      aiMatch: cand1Info.aiMatch
    });

    const cand2Info = await parseResumeAndScore('Bob Recruiter', 'bob@hr.com', job2.requirements);
    await Candidate.create({
      job: job2._id,
      name: 'Bob Recruiter',
      email: 'bob@hr.com',
      phone: '555-0122',
      notes: 'Hired to start next month pending final background review.',
      status: 'Hired',
      extractedInfo: cand2Info.extractedInfo,
      aiMatch: cand2Info.aiMatch
    });

    console.log('Created candidates.');

    // 5. Create Performance Reviews (using AI summary helper)
    const reviewRatings = { quality: 4, teamwork: 5, communication: 3, productivity: 4 };
    const reviewFeedback = 'Excellent code quality and team collaborative mindset. Communication regarding blockers during sprints can be improved.';
    const reviewGoals = [
      { text: 'Complete React Native Certification course', status: 'Pending' },
      { text: 'Lead the next two core deployment cycles', status: 'Completed' }
    ];
    
    const aiSummary = generatePerformanceSummary(reviewRatings, reviewFeedback);
    await Performance.create({
      employee: emp1._id,
      reviewer: hr._id,
      goals: reviewGoals,
      ratings: reviewRatings,
      feedback: reviewFeedback,
      aiSummary
    });

    console.log('Created performance reviews.');

    // 6. Create Notifications
    await Notification.create({
      user: admin._id,
      type: 'JobApplication',
      message: 'New application received from Alice Candidate for Fullstack React Engineer (80% match)'
    });

    await Notification.create({
      user: hr._id,
      type: 'JobApplication',
      message: 'New application received from Alice Candidate for Fullstack React Engineer (80% match)'
    });

    await Notification.create({
      user: emp1._id,
      type: 'PerformanceReview',
      message: `A new performance review has been published by your manager, Jane HR Manager`
    });

    console.log('Created notifications.');

    console.log('Database seeded successfully with all advanced models!');
    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
