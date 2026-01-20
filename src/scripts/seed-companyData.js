const Event = require("../modules/users/models/event.model.js");

const { default: mongoose } = require("mongoose");
const connectDB = require("../config/database");
const Employee = require("../modules/users/models/employee.model");
const Attendance = require("../modules/users/models/attendance.odel");
const Interview = require("../modules/users/models/interview.model");
const Application = require("../modules/users/models/application.model");
const LeaveRequest = require("../modules/users/models/leaveRequest.model");

const seedDatabase = async () => {
    try {
        connectDB();
        
        // Create a fixed company ID
        const companyId = new mongoose.Types.ObjectId('696f17bdf9a7345b2fd78c74');

        // Insert Employees (257 total)
        await Employee.deleteMany({});
        await Attendance.deleteMany({});
        await Interview.deleteMany({});
        await Application.deleteMany({});
        await LeaveRequest.deleteMany({});
        await Event.deleteMany({});

        console.log('✅ Cleared existing data');

        // ==========================================
        // INSERT EMPLOYEES
        // ==========================================
        const employees = [];
        for (let i = 1; i <= 257; i++) {
            employees.push({
                _id: new mongoose.Types.ObjectId(),
                companyId: companyId,
                name: `Employee ${i}`,
                email: `employee${i}@company.com`,
                department: ['Engineering', 'Sales', 'HR', 'Marketing', 'Finance'][Math.floor(Math.random() * 5)],
                position: `Position ${i}`,
                joinDate: new Date(2022 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                status: Math.random() > 0.1 ? 'active' : 'inactive'
            });
        }
        const insertedEmployees = await Employee.insertMany(employees);
        console.log(`✅ Inserted ${insertedEmployees.length} employees`);

        // ==========================================
        // INSERT ATTENDANCE - FIX: No Duplicates
        // ==========================================
        const attendanceRecords = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Create a Set to track (employeeId, date) combinations
        const usedCombinations = new Set();

        for (let d = 6; d >= 0; d--) {
            const date = new Date(today);
            date.setDate(date.getDate() - d);

            // For each day, ensure each employee has max 1 attendance record
            for (const employee of insertedEmployees) {
                // Create unique key: "empId-dateString"
                const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
                const key = `${employee._id.toString()}-${dateString}`;

                // Skip if already added this combination
                if (usedCombinations.has(key)) {
                    continue;
                }

                // Random status
                const randomStatus = Math.random();
                let status = 'present';
                if (randomStatus > 0.9) status = 'absent';
                else if (randomStatus > 0.8) status = 'late';
                else if (randomStatus > 0.7) status = 'half-day';

                attendanceRecords.push({
                    companyId: companyId,
                    employeeId: employee._id,
                    date: new Date(date),
                    status: status,
                    checkInTime: new Date(date.getTime() + Math.random() * 3600000),
                    checkOutTime: new Date(date.getTime() + 28800000 + Math.random() * 3600000)
                });

                // Mark this combination as used
                usedCombinations.add(key);
            }
        }

        await Attendance.insertMany(attendanceRecords);
        console.log(`✅ Inserted ${attendanceRecords.length} attendance records`);

        // ==========================================
        // INSERT INTERVIEWS
        // ==========================================
        const interviews = [];
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        for (let i = 0; i < 5; i++) {
            const randomDate = new Date(weekStart.getTime() + Math.random() * (weekEnd - weekStart));
            interviews.push({
                companyId: companyId,
                candidateName: `Candidate ${i + 1}`,
                email: `candidate${i + 1}@email.com`,
                position: `Position ${i + 1}`,
                scheduledDate: randomDate,
                interviewerName: `Interviewer ${Math.floor(Math.random() * 5) + 1}`,
                status: 'scheduled'
            });
        }
        await Interview.insertMany(interviews);
        console.log(`✅ Inserted ${interviews.length} interviews`);

        // ==========================================
        // INSERT APPLICATIONS
        // ==========================================
        const applications = [];
        for (let i = 0; i < 23; i++) {
            const randomDate = new Date(weekStart.getTime() + Math.random() * (weekEnd - weekStart));
            applications.push({
                companyId: companyId,
                candidateName: `Applicant ${i + 1}`,
                email: `applicant${i + 1}@email.com`,
                position: `Position ${(i % 5) + 1}`,
                appliedDate: randomDate,
                resume: `https://resume-bucket.s3.amazonaws.com/applicant${i + 1}-resume.pdf`,
                status: 'new',
                rating: Math.floor(Math.random() * 5) + 1
            });
        }
        await Application.insertMany(applications);
        console.log(`✅ Inserted ${applications.length} applications`);

        // ==========================================
        // INSERT LEAVE REQUESTS
        // ==========================================
        const leaveRequests = [];
        const leaveTypes = ['Annual', 'Sick', 'Personal', 'Maternity', 'Paternity'];

        for (let i = 0; i < 8; i++) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 1);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1);

            leaveRequests.push({
                companyId: companyId,
                employeeId: insertedEmployees[Math.floor(Math.random() * insertedEmployees.length)]._id,
                employeeName: `Employee ${Math.floor(Math.random() * 257) + 1}`,
                startDate: startDate,
                endDate: endDate,
                leaveType: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
                reason: `Leave request for ${Math.floor(Math.random() * 5) + 1} days`,
                status: 'Pending'
            });
        }
        await LeaveRequest.insertMany(leaveRequests);
        console.log(`✅ Inserted ${leaveRequests.length} leave requests`);

        // ==========================================
        // INSERT EVENTS
        // ==========================================
        const events = [];
        const eventTypes = ['Workshop', 'Training', 'Meeting', 'Orientation', 'Review', 'Other'];
        const eventStatuses = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

        for (let i = 0; i < 12; i++) {
            const eventDate = new Date();
            eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 60));

            events.push({
                companyId: companyId,
                organizer: insertedEmployees[Math.floor(Math.random() * insertedEmployees.length)]._id,
                title: `Event ${i + 1}`,
                description: `This is a description for event ${i + 1}`,
                eventDate: eventDate,
                eventTime: `${Math.floor(Math.random() * 24)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                location: ['Conference Room A', 'Conference Room B', 'Auditorium', 'Virtual', 'Office Cafeteria'][Math.floor(Math.random() * 5)],
                eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
                status: eventStatuses[Math.floor(Math.random() * eventStatuses.length)],
                isActive: Math.random() > 0.2
            });
        }
        await Event.insertMany(events);
        console.log(`✅ Inserted ${events.length} events`);

        console.log('\n✅ Database seeded successfully!');
        console.log(`📊 Summary:`);
        console.log(`   - Company ID: ${companyId}`);
        console.log(`   - Employees: ${insertedEmployees.length}`);
        console.log(`   - Attendance Records: ${attendanceRecords.length}`);
        console.log(`   - Interviews: ${interviews.length}`);
        console.log(`   - Applications: ${applications.length}`);
        console.log(`   - Leave Requests: ${leaveRequests.length}`);
        console.log(`   - Events: ${events.length}`);

        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Connection closed');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    }
};

// export default seedDatabase;

seedDatabase();