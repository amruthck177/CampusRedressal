const BASE_URL = 'https://campusredressal-1.onrender.com';
const API_URL = `${BASE_URL}/api`;

async function request(path, options = {}) {
  const url = `${path.startsWith('http') ? path : API_URL + path}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const config = {
    method: options.method || 'GET',
    headers,
  };
  if (options.body) {
    config.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, config);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    const error = new Error(`Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function testAll() {
  console.log('=== 🚀 STARTING FULL SYSTEM API INTEGRATION TESTS ===\n');

  try {
    // 1. Health check
    console.log('1. Testing Root API Status Endpoint...');
    const rootRes = await request(`${BASE_URL}/`);
    console.log('   ✅ Root API Response:', rootRes);

    // 2. Test Login with Admin
    console.log('\n2. Testing Admin Login...');
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@college.edu', password: 'admin123' },
    });
    console.log('   ✅ Admin Login successful:', adminLoginRes.user.name, `(${adminLoginRes.user.role})`);
    const adminToken = adminLoginRes.token;

    // 3. Test Login with Student
    console.log('\n3. Testing Student Login...');
    const studentLoginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'student@college.edu', password: 'student123' },
    });
    console.log('   ✅ Student Login successful:', studentLoginRes.user.name, `(${studentLoginRes.user.role})`);
    const studentToken = studentLoginRes.token;

    // 4. Test Auth /me with token
    console.log('\n4. Testing /api/auth/me Verification...');
    const meRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log('   ✅ /auth/me authenticated successfully as:', meRes.name, 'id:', meRes.id || meRes._id);

    // 5. Test Duplicate Detection API
    console.log('\n5. Testing Duplicate Detection Algorithm...');
    const duplicateRes = await request('/complaints/check-duplicate?title=Water%20leakage&category=Hostel', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log('   ✅ Duplicate check returned candidate list:', duplicateRes.length, 'matches found');

    // 6. Test Complaint Creation (Student)
    console.log('\n6. Testing Complaint Submission...');
    const newComplaint = {
      title: `Automated Test Issue - ${Date.now()}`,
      category: 'Hostel',
      description: 'The washroom tap is leaking on the 2nd floor block B.',
      isAnonymous: false,
    };
    const createRes = await request('/complaints', {
      method: 'POST',
      body: newComplaint,
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const complaintId = createRes._id;
    console.log('   ✅ Complaint created successfully with ID:', complaintId, 'Dept:', createRes.department, 'Priority:', createRes.priority);

    // 7. Test Get Single Complaint by ID
    console.log('\n7. Testing Single Complaint Fetch...');
    const getComplaintRes = await request(`/complaints/${complaintId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log('   ✅ Fetched complaint:', getComplaintRes.title, '| Status:', getComplaintRes.status);

    // 8. Test Upvote / Like
    console.log('\n8. Testing Upvote Toggle...');
    const upvoteRes = await request(`/complaints/${complaintId}/upvote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log('   ✅ Upvote toggled:', upvoteRes);

    // 9. Test Adding Discussion Comment
    console.log('\n9. Testing Discussion Comments...');
    const commentRes = await request(`/complaints/${complaintId}/comments`, {
      method: 'POST',
      body: { text: 'Maintenance team dispatched to assess leak.' },
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('   ✅ Comment added. Total comments on ticket:', commentRes.comments.length);

    // 10. Test Status Update (Admin) -> In Progress -> Resolved
    console.log('\n10. Testing Admin Status Update & Audit Logging...');
    const statusRes = await request(`/complaints/${complaintId}/status`, {
      method: 'PATCH',
      body: { status: 'Resolved', remark: 'Plumber replaced the faulty valve.' },
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('   ✅ Status updated to:', statusRes.status, '| Remark:', statusRes.remarks);
    console.log('   ✅ Status history timeline length:', statusRes.statusHistory.length);

    // 11. Test Student Feedback Submission on Resolved Ticket
    console.log('\n11. Testing Student Resolution Feedback Submission...');
    const feedbackRes = await request(`/complaints/${complaintId}/feedback`, {
      method: 'POST',
      body: { rating: 5, comment: 'Very fast resolution, thank you!' },
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log('   ✅ Feedback submitted with rating:', feedbackRes.feedback.rating, '/ 5');

    // 12. Test Admin Analytics & Metrics
    console.log('\n12. Testing Admin Analytics & Audit Logs...');
    const analyticsRes = await request('/complaints/analytics', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('   ✅ Analytics fetched:');
    console.log('      - Total Complaints:', analyticsRes.statusCounts.total);
    console.log('      - Resolved:', analyticsRes.statusCounts.resolved);
    console.log('      - Avg Resolution Time (hrs):', analyticsRes.averageResolutionTimeHours);
    console.log('      - Recent Audit Logs:', analyticsRes.auditLogs.length);

    console.log('\n=================================================');
    console.log('🎉 ALL 12 END-TO-END TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('=================================================\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    if (error.status) {
      console.error('Status:', error.status, 'Data:', error.data);
    } else {
      console.error(error.message);
    }
  }
}

testAll();
