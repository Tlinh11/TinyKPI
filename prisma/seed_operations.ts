import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding Operations & Workflow Suite data into Neon PostgreSQL...');

  const admin = await prisma.user.findFirst({
    where: { email: 'Thuankhanh.hust@gmail.com' },
  });

  if (!admin) {
    console.error('❌ Admin user not found. Please run base seed first.');
    return;
  }

  const deptIt = await prisma.department.findFirst({ where: { code: 'CNTT' } });
  const deptBg = await prisma.department.findFirst({ where: { code: 'BGD' } });
  const slaItem = await prisma.slaItem.findFirst();
  const objective = await prisma.strategicObjective.findFirst();
  const process = await prisma.masterProcess.findFirst();

  // 1. Seed Tasks
  const tasksData = [
    {
      title: 'Triển khai bản đồ chiến lược BSC Q3/2026',
      description: 'Phối hợp cùng Ban Giám Đốc hoàn thiện cấu hình 4 viễn cảnh và gắn kết các mục tiêu tài chính, khách hàng.',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      progress: 65,
      startDate: new Date('2026-09-01'),
      dueDate: new Date('2026-09-30'),
      assigneeId: admin.id,
      creatorId: admin.id,
      departmentId: deptBg?.id || null,
      objectiveId: objective?.id || null,
      slaItemId: slaItem?.id || null,
      checklists: {
        create: [
          { title: 'Thu thập chỉ số KPI từ phòng ban', isDone: true },
          { title: 'Tạo ma trận SWOT & chiến lược SO/WO', isDone: true },
          { title: 'Thiết lập ngưỡng Max/Min cho thẻ điểm', isDone: false },
          { title: 'Duyệt ban hành văn bản chính thức', isDone: false },
        ],
      },
      comments: {
        create: [
          {
            userId: admin.id,
            content: 'Đã hoàn tất liên kết các chỉ số tài chính, đang chờ phòng Nhân sự chốt KPI đào tạo.',
          },
        ],
      },
    },
    {
      title: 'Kiểm toán cam kết SLA nội bộ giữa các phòng ban',
      description: 'Đánh giá tỷ lệ quá hạn xử lý ticket yêu cầu kỹ thuật và duyệt hợp đồng trong tháng 8.',
      priority: 'HIGH',
      status: 'TODO',
      progress: 20,
      startDate: new Date('2026-09-15'),
      dueDate: new Date('2026-10-05'),
      assigneeId: admin.id,
      creatorId: admin.id,
      departmentId: deptIt?.id || null,
      slaItemId: slaItem?.id || null,
      checklists: {
        create: [
          { title: 'Trích xuất dữ liệu ticket từ hệ thống', isDone: true },
          { title: 'Phân loại các trường hợp vi phạm SLA > 24h', isDone: false },
          { title: 'Gửi báo cáo phân tích cho Trưởng bộ phận', isDone: false },
        ],
      },
    },
    {
      title: 'Tổ chức kỳ thi sát hạch quy trình lõi đợt 2',
      description: 'Thiết lập ngân hàng câu hỏi và mở ca thi trực tuyến cho toàn bộ nhân sự khối vận hành.',
      priority: 'MEDIUM',
      status: 'REVIEW',
      progress: 90,
      startDate: new Date('2026-09-10'),
      dueDate: new Date('2026-09-28'),
      assigneeId: admin.id,
      creatorId: admin.id,
      departmentId: deptBg?.id || null,
      checklists: {
        create: [
          { title: 'Biên soạn 20 câu hỏi trắc nghiệm quy trình', isDone: true },
          { title: 'Cấu hình thời gian làm bài 15 phút', isDone: true },
          { title: 'Chạy thử nghiệm với 5 nhân sự mẫu', isDone: true },
        ],
      },
    },
    {
      title: 'Nâng cấp hệ thống Cloud Database sang Neon PostgreSQL',
      description: 'Chuyển đổi dữ liệu và đồng bộ hóa cơ sở dữ liệu trên cloud để phục vụ triển khai production.',
      priority: 'HIGH',
      status: 'DONE',
      progress: 100,
      startDate: new Date('2026-09-20'),
      dueDate: new Date('2026-09-25'),
      completedAt: new Date(),
      assigneeId: admin.id,
      creatorId: admin.id,
      departmentId: deptIt?.id || null,
      checklists: {
        create: [
          { title: 'Cấu hình connection pooler Neon', isDone: true },
          { title: 'Chạy migration schema chuẩn', isDone: true },
          { title: 'Kiểm thử truy vấn tốc độ cao', isDone: true },
        ],
      },
    },
    {
      title: 'Cập nhật giáo trình đào tạo Văn hóa & Quy chuẩn TinyKPI',
      description: 'Soạn thảo tài liệu và bài giảng tương tác cho nhân viên mới onboarding.',
      priority: 'LOW',
      status: 'TODO',
      progress: 0,
      startDate: new Date('2026-10-01'),
      dueDate: new Date('2026-10-15'),
      assigneeId: admin.id,
      creatorId: admin.id,
      departmentId: deptBg?.id || null,
    },
  ];

  for (const t of tasksData) {
    const existing = await prisma.task.findFirst({ where: { title: t.title } });
    if (!existing) {
      await prisma.task.create({ data: t });
    }
  }
  console.log('✅ Tasks seeded successfully.');

  // 2. Seed Calendar Events
  const eventsData = [
    {
      title: 'Họp Giao ban Chiến lược BSC Quý',
      description: 'Đánh giá tiến độ hoàn thành các chỉ tiêu trọng yếu và tháo gỡ điểm nghẽn.',
      type: 'STRATEGY',
      startTime: new Date('2026-09-26T09:00:00Z'),
      endTime: new Date('2026-09-26T11:00:00Z'),
      isAllDay: false,
      location: 'Phòng họp VIP 1 & Zoom Online',
      organizerId: admin.id,
    },
    {
      title: 'Khảo sát Cam kết Dịch vụ SLA Liên phòng ban',
      description: 'Đối soát thời gian xử lý hồ sơ công việc giữa Kinh doanh và Kỹ thuật.',
      type: 'MEETING',
      startTime: new Date('2026-09-28T14:00:00Z'),
      endTime: new Date('2026-09-28T15:30:00Z'),
      isAllDay: false,
      location: 'Phòng Hội thảo Tầng 3',
      organizerId: admin.id,
    },
    {
      title: 'Kỳ thi sát hạch Quy trình Lõi SOP đợt 2',
      description: 'Kỳ thi bắt buộc đối với toàn bộ cán bộ công nhân viên.',
      type: 'WORK',
      startTime: new Date('2026-09-29T08:00:00Z'),
      endTime: new Date('2026-09-29T17:00:00Z'),
      isAllDay: true,
      location: 'Cổng thi trực tuyến TinyKPI',
      organizerId: admin.id,
    },
    {
      title: 'Hạn chót cập nhật kết quả KPI Tháng 9',
      description: 'Tất cả các bộ phận chốt số liệu thực hiện để lập Báo cáo Thẻ điểm BSC.',
      type: 'DEADLINE',
      startTime: new Date('2026-09-30T17:00:00Z'),
      endTime: new Date('2026-09-30T18:00:00Z'),
      isAllDay: false,
      location: 'Hệ thống TinyKPI',
      organizerId: admin.id,
    },
  ];

  for (const e of eventsData) {
    const existing = await prisma.calendarEvent.findFirst({ where: { title: e.title } });
    if (!existing) {
      await prisma.calendarEvent.create({ data: e });
    }
  }
  console.log('✅ Calendar events seeded successfully.');

  // 3. Seed Exam Questions
  const questionsData = [
    {
      question: 'Mục tiêu chính của Hệ thống Quản trị Chiến lược BSC (Balanced Scorecard) là gì?',
      options: JSON.stringify([
        'Chỉ tập trung tối đa hóa lợi nhuận tài chính ngắn hạn',
        'Cân bằng giữa các mục tiêu Tài chính, Khách hàng, Quy trình và Con người',
        'Thay thế toàn bộ các quy trình vận hành ISO hiện tại',
        'Theo dõi giờ làm việc hàng ngày của nhân viên',
      ]),
      correctIdx: 1,
      explanation: 'BSC giúp doanh nghiệp cân bằng giữa kết quả tài chính quá khứ và các động lực thúc đẩy giá trị tương lai.',
      processId: process?.id || null,
    },
    {
      question: 'Thời gian tiêu chuẩn cam kết SLA tối đa khi tiếp nhận yêu cầu hỗ trợ khẩn cấp là bao lâu?',
      options: JSON.stringify([
        '24 giờ làm việc',
        '4 giờ làm việc',
        '72 giờ làm việc',
        'Không quy định thời gian cụ thể',
      ]),
      correctIdx: 1,
      explanation: 'Theo quy chuẩn SLA TinyKPI, các yêu cầu mức độ khẩn cấp phải được phản hồi và xử lý trong vòng 4 giờ.',
      processId: process?.id || null,
    },
    {
      question: 'Trong quy trình quản lý KPI, khi một chỉ số bị cảnh báo ĐỎ (Failed), hành động nào cần ưu tiên thực hiện?',
      options: JSON.stringify([
        'Hạ thấp chỉ tiêu kế hoạch ngay lập tức',
        'Phân tích nguyên nhân cốt lõi (Root Cause) và lập Kế hoạch hành động khắc phục',
        'Xóa chỉ số đó ra khỏi bảng điểm BSC',
        'Trừ lương toàn bộ nhân viên trong bộ phận',
      ]),
      correctIdx: 1,
      explanation: 'Cần phân tích nguyên nhân gốc rễ và đề xuất phương án hành động cải tiến nhằm đưa chỉ số trở lại quỹ đạo.',
      processId: process?.id || null,
    },
    {
      question: 'Trong ma trận SWOT kết hợp, chiến lược SO (Strengths - Opportunities) có ý nghĩa gì?',
      options: JSON.stringify([
        'Tận dụng điểm mạnh nội bộ để nắm bắt các cơ hội từ thị trường',
        'Vượt qua điểm yếu bằng cách tận dụng cơ hội',
        'Sử dụng điểm mạnh để phòng ngừa các nguy cơ đe dọa',
        'Tối thiểu hóa điểm yếu và né tránh các nguy cơ',
      ]),
      correctIdx: 0,
      explanation: 'Chiến lược SO là chiến lược tấn công: sử dụng các thế mạnh cạnh tranh để nắm bắt thời cơ tăng trưởng.',
      processId: process?.id || null,
    },
  ];

  for (const q of questionsData) {
    const existing = await prisma.examQuestion.findFirst({ where: { question: q.question } });
    if (!existing) {
      await prisma.examQuestion.create({ data: q });
    }
  }
  console.log('✅ Exam questions seeded successfully.');

  // 4. Seed Training Courses
  const coursesData = [
    {
      title: 'Khóa học Nhập môn BSC & Xây dựng Thẻ điểm Cân bằng',
      code: 'COURSE-BSC-101',
      category: 'Quy tắc KPI',
      description: 'Trang bị kiến thức cốt lõi về 4 viễn cảnh chiến lược, cách liên kết nguyên nhân - kết quả và phân bổ KPI.',
      duration: '45 phút',
      lessonsJson: JSON.stringify([
        { title: 'Bài 1: Khái niệm & Triết lý Balanced Scorecard', duration: '10 phút' },
        { title: 'Bài 2: Bức tranh Tầm nhìn & 4 Viễn cảnh chiến lược', duration: '15 phút' },
        { title: 'Bài 3: Thiết lập Mục tiêu và Đo lường KPI', duration: '12 phút' },
        { title: 'Bài 4: Tổng kết & Bài kiểm tra thực hành', duration: '8 phút' },
      ]),
    },
    {
      title: 'Chuẩn hóa Vận hành Quy trình Lõi & Cam kết Dịch vụ SLA',
      code: 'COURSE-SLA-201',
      category: 'Quy trình Lõi',
      description: 'Hướng dẫn áp dụng Master Process và thực thi cam kết chất lượng dịch vụ nội bộ không trễ hạn.',
      duration: '60 phút',
      lessonsJson: JSON.stringify([
        { title: 'Bài 1: Tổng quan về Master Process trong doanh nghiệp', duration: '15 phút' },
        { title: 'Bài 2: Thiết lập & Theo dõi chỉ số SLA', duration: '20 phút' },
        { title: 'Bài 3: Kỹ năng phối hợp liên phòng ban', duration: '15 phút' },
        { title: 'Bài 4: Xử lý sự cố và báo cáo quá hạn', duration: '10 phút' },
      ]),
    },
  ];

  for (const c of coursesData) {
    const existing = await prisma.trainingCourse.findFirst({ where: { code: c.code } });
    if (!existing) {
      await prisma.trainingCourse.create({ data: c });
    }
  }
  console.log('✅ Training courses seeded successfully.');

  console.log('🎉 Operations & Workflow Suite seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
