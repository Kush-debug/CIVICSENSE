const db = require('./db');

function seedData() {
    console.log('--- Seeding Indian Government Civic Database ---');

    // 1. Seed Departments
    const deptCount = db.prepare('SELECT COUNT(*) as count FROM departments').get().count;
    if (deptCount === 0) {
        const insertDept = db.prepare(`
            INSERT INTO departments (id, name, name_hi, code, officer_in_charge, email, helpline)
            VALUES (@id, @name, @name_hi, @code, @officer_in_charge, @email, @helpline)
        `);

        const depts = [
            {
                id: 'DEPT-PWD',
                name: 'Public Works & Roads Department (PWD)',
                name_hi: 'लोक निर्माण एवं सड़क विभाग',
                code: 'PWD',
                officer_in_charge: 'Er. Rajesh Verma (Executive Engineer)',
                email: 'pwd.roads@knm.gov.in',
                helpline: '1800-180-0101'
            },
            {
                id: 'DEPT-SWM',
                name: 'Sanitation & Solid Waste Management (Nagar Nigam)',
                name_hi: 'नगर निगम स्वच्छता एवं ठोस अपशिष्ट प्रबंधन',
                code: 'SWM',
                officer_in_charge: 'Dr. Anita Sengupta (Chief Sanitary Officer)',
                email: 'swachh.civic@knm.gov.in',
                helpline: '1913'
            },
            {
                id: 'DEPT-JAL',
                name: 'Jal Sansthan & Water Supply Board',
                name_hi: 'जल संस्थान एवं जलापूर्ति मंडल',
                code: 'JAL',
                officer_in_charge: 'Er. Alok Tripathi (Superintending Engineer)',
                email: 'jalsansthan@up.gov.in',
                helpline: '1800-180-2233'
            },
            {
                id: 'DEPT-ELEC',
                name: 'Street Lighting & Vidyut Vitran Nigam (DISCOM)',
                name_hi: 'मार्ग प्रकाश एवं विद्युत वितरण निगम',
                code: 'ELEC',
                officer_in_charge: 'Er. Sunita Mishra (Assistant Engineer)',
                email: 'discom.lights@up.gov.in',
                helpline: '1912'
            },
            {
                id: 'DEPT-DRAIN',
                name: 'Drainage & Sewerage Board (Namami Gange Cell)',
                name_hi: 'जल निकासी एवं सीवरेज बोर्ड',
                code: 'DRAIN',
                officer_in_charge: 'Er. Manoj Bajpai (Project Director)',
                email: 'drainage.knm@gov.in',
                helpline: '0512-2550191'
            },
            {
                id: 'DEPT-HLTH',
                name: 'Public Health & Vector Control',
                name_hi: 'सार्वजनिक स्वास्थ्य एवं मलेरिया/डेंगू नियंत्रण',
                code: 'HLTH',
                officer_in_charge: 'Dr. Suresh Chandra (Municipal Health Officer)',
                email: 'health.mo@knm.gov.in',
                helpline: '1075'
            },
            {
                id: 'DEPT-GEN',
                name: 'General Municipal Administration & Encroachment',
                name_hi: 'सामान्य नगर पालिका प्रशासन एवं अतिक्रमण नियंत्रण',
                code: 'GEN',
                officer_in_charge: 'Shri Vivek Rastogi (PCS, Additional Commissioner)',
                email: 'commissioner@knm.gov.in',
                helpline: '1076'
            }
        ];

        const insertManyDepts = db.transaction((list) => {
            for (const d of list) insertDept.run(d);
        });
        insertManyDepts(depts);
        console.log('✓ Seeded ' + depts.length + ' Municipal Departments.');
    }

    // 2. Seed Users
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
        const insertUser = db.prepare(`
            INSERT INTO users (id, name, email, password, role, phone, department, designation, ward_no, city, state, aadhaar_last4)
            VALUES (@id, @name, @email, @password, @role, @phone, @department, @designation, @ward_no, @city, @state, @aadhaar_last4)
        `);

        const users = [
            {
                id: 'USR-2026-001',
                name: 'Gaurav Yadav',
                email: 'citizen@demo.com',
                password: 'citizen123',
                role: 'CITIZEN',
                phone: '+91 98765 43210',
                department: null,
                designation: 'Resident Citizen (निवासी नागरिक)',
                ward_no: 'Ward 42 - Kalyanpur',
                city: 'Kanpur',
                state: 'Uttar Pradesh',
                aadhaar_last4: '8842'
            },
            {
                id: 'USR-2026-002',
                name: 'Rameshwar Sharma',
                email: 'rameshwar.citizen@gmail.com',
                password: 'citizen123',
                role: 'CITIZEN',
                phone: '+91 94150 12345',
                department: null,
                designation: 'Citizen / RWA Secretary',
                ward_no: 'Ward 12 - Civil Lines',
                city: 'Kanpur',
                state: 'Uttar Pradesh',
                aadhaar_last4: '4190'
            },
            {
                id: 'EMP-2026-101',
                name: 'Priya Sharma',
                email: 'employee@demo.com',
                password: 'employee123',
                role: 'EMPLOYEE',
                phone: '+91 91234 56789',
                department: 'Sanitation & Solid Waste Management (Nagar Nigam)',
                designation: 'Senior Zonal Officer (वरिष्ठ जोनल अधिकारी)',
                ward_no: 'Zone-3 (Wards 30-45)',
                city: 'Kanpur',
                state: 'Uttar Pradesh',
                aadhaar_last4: '1092'
            },
            {
                id: 'EMP-2026-102',
                name: 'Er. Rajesh Verma',
                email: 'officer@demo.com',
                password: 'officer123',
                role: 'EMPLOYEE',
                phone: '+91 98390 11223',
                department: 'Public Works & Roads Department (PWD)',
                designation: 'Executive Engineer (अधिशासी अभियंता)',
                ward_no: 'All Wards (Central PWD)',
                city: 'Kanpur',
                state: 'Uttar Pradesh',
                aadhaar_last4: '7721'
            },
            {
                id: 'ADM-2026-901',
                name: 'Shri Alok Sinha, IAS',
                email: 'admin@demo.com',
                password: 'admin123',
                role: 'ADMIN',
                phone: '+91 94500 00001',
                department: 'General Municipal Administration & Encroachment',
                designation: 'Municipal Commissioner (नगर आयुक्त)',
                ward_no: 'Headquarters',
                city: 'Kanpur',
                state: 'Uttar Pradesh',
                aadhaar_last4: '9901'
            }
        ];

        const insertManyUsers = db.transaction((list) => {
            for (const u of list) insertUser.run(u);
        });
        insertManyUsers(users);
        console.log('✓ Seeded ' + users.length + ' Users (Citizens, Municipal Officers & Admins).');
    }

    // 3. Seed Complaints & History
    const complaintCount = db.prepare('SELECT COUNT(*) as count FROM complaints').get().count;
    if (complaintCount === 0) {
        const insertComplaint = db.prepare(`
            INSERT INTO complaints (
                id, user_id, reported_by, phone, title, description, category, category_hi,
                priority, status, department, ward_no, landmark, city, state, pincode,
                photo_url, geo_coords, assigned_officer_id, assigned_officer_name, sla_hours,
                resolution_remarks, resolution_photo_url, citizen_rating, citizen_feedback,
                created_at, updated_at, resolved_at
            ) VALUES (
                @id, @user_id, @reported_by, @phone, @title, @description, @category, @category_hi,
                @priority, @status, @department, @ward_no, @landmark, @city, @state, @pincode,
                @photo_url, @geo_coords, @assigned_officer_id, @assigned_officer_name, @sla_hours,
                @resolution_remarks, @resolution_photo_url, @citizen_rating, @citizen_feedback,
                @created_at, @updated_at, @resolved_at
            )
        `);

        const insertHistory = db.prepare(`
            INSERT INTO complaint_history (complaint_id, action, from_status, to_status, remarks, updated_by_name, updated_by_role, created_at)
            VALUES (@complaint_id, @action, @from_status, @to_status, @remarks, @updated_by_name, @updated_by_role, @created_at)
        `);

        const complaints = [
            {
                id: 'GOV-UP-2026-1001',
                user_id: 'USR-2026-001',
                reported_by: 'Gaurav Yadav',
                phone: '+91 98765 43210',
                title: 'Dangerous deep crater pothole causing vehicle accidents near GT Road crossing',
                description: 'A deep pothole of approx 2.5 ft diameter and 8 inches depth has formed right before the Panki railway crossing. Two motorcyclists skid yesterday night. Immediate bituminous patching required.',
                category: 'Roads & Potholes',
                category_hi: 'सड़कें एवं गड्ढे',
                priority: 'High',
                status: 'Under Review',
                department: 'Public Works & Roads Department (PWD)',
                ward_no: 'Ward 42 - Kalyanpur',
                landmark: 'Near Panki Power House Crossing, GT Road',
                city: 'Kanpur',
                state: 'Uttar Pradesh',
                pincode: '208017',
                photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
                geo_coords: '26.4952° N, 80.2829° E',
                assigned_officer_id: 'EMP-2026-102',
                assigned_officer_name: 'Er. Rajesh Verma (Executive Engineer)',
                sla_hours: 48,
                resolution_remarks: null,
                resolution_photo_url: null,
                citizen_rating: null,
                citizen_feedback: null,
                created_at: '2026-08-18 10:30:00',
                updated_at: '2026-08-18 14:15:00',
                resolved_at: null
            },
            {
                id: 'GOV-UP-2026-1002',
                user_id: 'USR-2026-001',
                reported_by: 'Gaurav Yadav',
                phone: '+91 98765 43210',
                title: 'Solid waste community bin overflowing onto main vegetable market lane',
                description: 'Municipal garbage compactor has not visited Swaroop Nagar block 4 for 3 consecutive days. Waste is spilling across the pedestrian pathway creating severe foul odor and stray cattle hazard.',
                category: 'Sanitation & Solid Waste',
                category_hi: 'स्वच्छता एवं ठोस अपशिष्ट',
                priority: 'High',
                status: 'In Progress',
                department: 'Sanitation & Solid Waste Management (Nagar Nigam)',
                ward_no: 'Ward 34 - Swaroop Nagar',
                landmark: 'Opposite Community Center, Block 4',
                city: 'Kanpur',
                state: 'Uttar Pradesh',
                pincode: '208002',
                photo_url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=600&auto=format&fit=crop&q=80',
                geo_coords: '26.4782° N, 80.3241° E',
                assigned_officer_id: 'EMP-2026-101',
                assigned_officer_name: 'Priya Sharma (Senior Zonal Officer)',
                sla_hours: 24,
                resolution_remarks: 'Sanitary Inspector Shri Arvind Kumar dispatched with 1 compactor truck and 4 safai karmcharis. Clearance ongoing.',
                resolution_photo_url: null,
                citizen_rating: null,
                citizen_feedback: null,
                created_at: '2026-08-17 08:45:00',
                updated_at: '2026-08-19 11:20:00',
                resolved_at: null
            },
            {
                id: 'GOV-UP-2026-1003',
                user_id: 'USR-2026-001',
                reported_by: 'Gaurav Yadav',
                phone: '+91 98765 43210',
                title: 'Four high-mast LED street lights defective in residential lane',
                description: 'Street lights on Pole No. KL-42/10 to KL-42/13 are not glowing since Friday. Complete dark spot causing safety concerns for women and evening walkers.',
                category: 'Street Lighting',
                category_hi: 'मार्ग प्रकाश (स्ट्रीट लाइट)',
                priority: 'Medium',
                status: 'Resolved',
                department: 'Street Lighting & Vidyut Vitran Nigam (DISCOM)',
                ward_no: 'Ward 42 - Kalyanpur',
                landmark: 'Lane 4, Near Shiv Mandir, Kalyanpur Avas Vikas',
                city: 'Kanpur',
                state: 'Uttar Pradesh',
                pincode: '208017',
                photo_url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80',
                geo_coords: '26.4910° N, 80.2790° E',
                assigned_officer_id: 'EMP-2026-101',
                assigned_officer_name: 'Er. Sunita Mishra (Assistant Engineer)',
                sla_hours: 48,
                resolution_remarks: 'Defective LED drivers and burnt fuse on transformer junction box replaced by DISCOM maintenance squad on 18th August. All 4 luminaires tested and operational.',
                resolution_photo_url: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=600&auto=format&fit=crop&q=80',
                citizen_rating: 5,
                citizen_feedback: 'Prompt action taken within 24 hours by the electrical crew. Excellent service by Nagar Nigam!',
                created_at: '2026-08-16 19:20:00',
                updated_at: '2026-08-18 16:30:00',
                resolved_at: '2026-08-18 16:30:00'
            },
            {
                id: 'GOV-UP-2026-1004',
                user_id: 'USR-2026-002',
                reported_by: 'Rameshwar Sharma',
                phone: '+91 94150 12345',
                title: 'Contaminated muddy water supply with low pressure in morning hours',
                description: 'Jal Sansthan pipeline supply at Civil Lines Sector B is delivering discolored muddy water since past two days. Likely sewer cross-leakage in the underground feeder line.',
                category: 'Water Supply & Quality',
                category_hi: 'जलापूर्ति एवं गुणवत्ता',
                priority: 'Emergency',
                status: 'In Progress',
                department: 'Jal Sansthan & Water Supply Board',
                ward_no: 'Ward 12 - Civil Lines',
                landmark: 'Sector B, Near Income Tax Colony',
                city: 'Kanpur',
                state: 'Uttar Pradesh',
                pincode: '208001',
                photo_url: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&auto=format&fit=crop&q=80',
                geo_coords: '26.4715° N, 80.3520° E',
                assigned_officer_id: 'EMP-2026-102',
                assigned_officer_name: 'Er. Alok Tripathi (Superintending Engineer)',
                sla_hours: 12,
                resolution_remarks: 'Pipeline leak detection team deployed. Water tanker provided to residents as temporary relief.',
                resolution_photo_url: null,
                citizen_rating: null,
                citizen_feedback: null,
                created_at: '2026-08-19 06:15:00',
                updated_at: '2026-08-19 09:30:00',
                resolved_at: null
            },
            {
                id: 'GOV-UP-2026-1005',
                user_id: 'USR-2026-001',
                reported_by: 'Gaurav Yadav',
                phone: '+91 98765 43210',
                title: 'Open storm water drain overflowing on pedestrian footpath',
                description: 'Heavy blockage in municipal stormwater nala causing dirty water spillover onto walkway near Kakadeo Coaching Mandi. Risk of waterborne diseases.',
                category: 'Drainage & Sewerage',
                category_hi: 'जल निकासी एवं सीवरेज',
                priority: 'High',
                status: 'Pending',
                department: 'Drainage & Sewerage Board (Namami Gange Cell)',
                ward_no: 'Ward 25 - Kakadeo',
                landmark: 'Dev Nagar road, near coaching complex',
                city: 'Kanpur',
                state: 'Uttar Pradesh',
                pincode: '208025',
                photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&auto=format&fit=crop&q=80',
                geo_coords: '26.4820° N, 80.3015° E',
                assigned_officer_id: null,
                assigned_officer_name: null,
                sla_hours: 48,
                resolution_remarks: null,
                resolution_photo_url: null,
                citizen_rating: null,
                citizen_feedback: null,
                created_at: '2026-08-19 14:00:00',
                updated_at: '2026-08-19 14:00:00',
                resolved_at: null
            }
        ];

        const historyItems = [
            // History for 1001
            {
                complaint_id: 'GOV-UP-2026-1001',
                action: 'GRIEVANCE_LODGED',
                from_status: null,
                to_status: 'Pending',
                remarks: 'Citizen grievance registered online via SCISM National Citizen Portal. Grievance Token GOV-UP-2026-1001 generated.',
                updated_by_name: 'Gaurav Yadav',
                updated_by_role: 'CITIZEN',
                created_at: '2026-08-18 10:30:00'
            },
            {
                complaint_id: 'GOV-UP-2026-1001',
                action: 'OFFICER_ASSIGNED',
                from_status: 'Pending',
                to_status: 'Under Review',
                remarks: 'Assigned to Public Works Department (PWD) Zonal Division. Executive Engineer Er. Rajesh Verma designated as Nodal Officer.',
                updated_by_name: 'Control Room Auto-Router',
                updated_by_role: 'SYSTEM',
                created_at: '2026-08-18 14:15:00'
            },

            // History for 1002
            {
                complaint_id: 'GOV-UP-2026-1002',
                action: 'GRIEVANCE_LODGED',
                from_status: null,
                to_status: 'Pending',
                remarks: 'Grievance lodged regarding solid waste accumulation.',
                updated_by_name: 'Gaurav Yadav',
                updated_by_role: 'CITIZEN',
                created_at: '2026-08-17 08:45:00'
            },
            {
                complaint_id: 'GOV-UP-2026-1002',
                action: 'STATUS_UPDATED',
                from_status: 'Pending',
                to_status: 'Under Review',
                remarks: 'Reviewed by Swachhata Control Room.',
                updated_by_name: 'Priya Sharma',
                updated_by_role: 'EMPLOYEE',
                created_at: '2026-08-17 11:00:00'
            },
            {
                complaint_id: 'GOV-UP-2026-1002',
                action: 'WORK_COMMENCED',
                from_status: 'Under Review',
                to_status: 'In Progress',
                remarks: 'Compactor vehicle and 4 safai karmcharis dispatched for site cleanup.',
                updated_by_name: 'Priya Sharma',
                updated_by_role: 'EMPLOYEE',
                created_at: '2026-08-19 11:20:00'
            },

            // History for 1003
            {
                complaint_id: 'GOV-UP-2026-1003',
                action: 'GRIEVANCE_LODGED',
                from_status: null,
                to_status: 'Pending',
                remarks: 'Grievance lodged for 4 defective streetlights.',
                updated_by_name: 'Gaurav Yadav',
                updated_by_role: 'CITIZEN',
                created_at: '2026-08-16 19:20:00'
            },
            {
                complaint_id: 'GOV-UP-2026-1003',
                action: 'WORK_COMMENCED',
                from_status: 'Pending',
                to_status: 'In Progress',
                remarks: 'DISCOM maintenance crew allocated work order #WO-891.',
                updated_by_name: 'Er. Sunita Mishra',
                updated_by_role: 'EMPLOYEE',
                created_at: '2026-08-17 10:00:00'
            },
            {
                complaint_id: 'GOV-UP-2026-1003',
                action: 'GRIEVANCE_RESOLVED',
                from_status: 'In Progress',
                to_status: 'Resolved',
                remarks: 'Replacement of defective drivers completed and verified.',
                updated_by_name: 'Er. Sunita Mishra',
                updated_by_role: 'EMPLOYEE',
                created_at: '2026-08-18 16:30:00'
            },
            {
                complaint_id: 'GOV-UP-2026-1003',
                action: 'FEEDBACK_SUBMITTED',
                from_status: 'Resolved',
                to_status: 'Resolved',
                remarks: 'Citizen rated 5 Stars: "Prompt action taken within 24 hours. Excellent service!"',
                updated_by_name: 'Gaurav Yadav',
                updated_by_role: 'CITIZEN',
                created_at: '2026-08-18 18:00:00'
            },

            // History for 1004
            {
                complaint_id: 'GOV-UP-2026-1004',
                action: 'GRIEVANCE_LODGED',
                from_status: null,
                to_status: 'Pending',
                remarks: 'Emergency water contamination report submitted.',
                updated_by_name: 'Rameshwar Sharma',
                updated_by_role: 'CITIZEN',
                created_at: '2026-08-19 06:15:00'
            },
            {
                complaint_id: 'GOV-UP-2026-1004',
                action: 'EMERGENCY_ESCALATION',
                from_status: 'Pending',
                to_status: 'In Progress',
                remarks: 'Priority marked Emergency. Superintending Engineer deployed water tanker.',
                updated_by_name: 'Er. Alok Tripathi',
                updated_by_role: 'EMPLOYEE',
                created_at: '2026-08-19 09:30:00'
            },

            // History for 1005
            {
                complaint_id: 'GOV-UP-2026-1005',
                action: 'GRIEVANCE_LODGED',
                from_status: null,
                to_status: 'Pending',
                remarks: 'Grievance lodged for stormwater drain overflow.',
                updated_by_name: 'Gaurav Yadav',
                updated_by_role: 'CITIZEN',
                created_at: '2026-08-19 14:00:00'
            }
        ];

        const insertManyComplaints = db.transaction((list, hist) => {
            for (const c of list) insertComplaint.run(c);
            for (const h of hist) insertHistory.run(h);
        });
        insertManyComplaints(complaints, historyItems);
        console.log('✓ Seeded ' + complaints.length + ' Realistic Indian Civic Complaints with History Logs.');
    }

    // 4. Seed Announcements
    const announcementCount = db.prepare('SELECT COUNT(*) as count FROM announcements').get().count;
    if (announcementCount === 0) {
        const insertAnnouncement = db.prepare(`
            INSERT INTO announcements (title, title_hi, message, message_hi, category, is_urgent, department, created_at)
            VALUES (@title, @title_hi, @message, @message_hi, @category, @is_urgent, @department, @created_at)
        `);

        const announcements = [
            {
                title: 'Special Mega Swachhata Drive across all Municipal Wards this Saturday',
                title_hi: 'इस शनिवार सभी नगर निगम वार्डों में विशेष महा स्वच्छता अभियान',
                message: 'All residents and RWAs are requested to participate in the Ward-level intensive segregation and desilting campaign starting 7:00 AM.',
                message_hi: 'सभी नागरिकों एवं आरडब्ल्यूए से अनुरोध है कि प्रातः 7:00 बजे से प्रारंभ होने वाले वार्ड स्तरीय सघन सफाई अभियान में भाग लें।',
                category: 'Sanitation',
                is_urgent: 0,
                department: 'Sanitation & Solid Waste Management',
                created_at: '2026-08-19 08:00:00'
            },
            {
                title: 'Monsoon Waterlogging Emergency Helpline 1913 Operational 24x7',
                title_hi: 'मानसून जलभराव आपातकालीन हेल्पलाइन 1913 चौबीसों घंटे सक्रिय',
                message: 'In case of severe drain clogging, tree fall, or transformer spark during rains, dial toll-free 1913 or 1076 for swift QRT deployment.',
                message_hi: 'बारिश के दौरान नाले जाम होने, पेड़ गिरने या ट्रांसफॉर्मर स्पार्क की स्थिति में त्वरित कार्रवाई हेतु 1913 डायल करें।',
                category: 'Emergency',
                is_urgent: 1,
                department: 'Disaster Management Cell',
                created_at: '2026-08-18 12:00:00'
            },
            {
                title: 'Free Anti-Larval Spray & Fogging Schedule for Dengue Prevention',
                title_hi: 'डेंगू रोकथाम हेतु निःशुल्क एंटी-लार्वा स्प्रे व फॉगिंग समय-सारणी',
                message: 'Health department mobile fogging units will cover Wards 10 to 45 between 5:30 PM to 8:30 PM this week.',
                message_hi: 'स्वास्थ्य विभाग के फॉगिंग वाहन इस सप्ताह शाम 5:30 से 8:30 के मध्य वार्ड 10 से 45 में फॉगिंग करेंगे।',
                category: 'Health',
                is_urgent: 0,
                department: 'Public Health Department',
                created_at: '2026-08-17 15:00:00'
            }
        ];

        const insertManyAnnouncements = db.transaction((list) => {
            for (const a of list) insertAnnouncement.run(a);
        });
        insertManyAnnouncements(announcements);
        console.log('✓ Seeded ' + announcements.length + ' Municipal Public Advisories.');
    }

    console.log('--- Database Seeding Complete & Verified ---');
}

seedData();

module.exports = seedData;
