import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for BSC Strategy & Performance...');

  // 1. Roles
  const rolesData = [
    { name: 'Admin', description: 'Toàn quyền quản trị hệ thống' },
    { name: 'Manager', description: 'Quản lý phòng ban và phê duyệt KPI' },
    { name: 'Staff', description: 'Nhân viên thực thi quy trình' },
    { name: 'User', description: 'Người dùng cơ bản' },
  ];

  const rolesMap = new Map<string, string>();
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
    rolesMap.set(r.name, role.id);
  }

  // 2. Permissions
  const permissionsData = [
    { name: 'users.view', module: 'users', description: 'Xem danh sách nhân viên' },
    { name: 'users.create_update', module: 'users', description: 'Thêm/sửa nhân viên' },
    { name: 'users.delete', module: 'users', description: 'Xóa nhân viên' },
    { name: 'departments.manage', module: 'departments', description: 'Quản lý phòng ban' },
    { name: 'positions.manage', module: 'positions', description: 'Quản lý chức vụ' },
    { name: 'bsc_strategy.manage', module: 'kpi', description: 'Quản lý chiến lược BSC' },
    { name: 'processes.manage', module: 'processes', description: 'Quản lý Master Process' },
    { name: 'sla.manage', module: 'sla', description: 'Quản lý cam kết SLA' },
    { name: 'audit_logs.view', module: 'audit', description: 'Xem nhật ký kiểm toán' },
  ];

  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });

    const adminRoleId = rolesMap.get('Admin');
    if (adminRoleId) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRoleId,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: adminRoleId,
          permissionId: perm.id,
        },
      });
    }
  }

  // 3. Departments
  const companyDept = await prisma.department.upsert({
    where: { code: 'CTY' },
    update: {},
    create: {
      name: 'Công ty',
      code: 'CTY',
      type: 'COMPANY',
      order: 1,
      description: 'Tổng công ty',
    },
  });

  const bqdDept = await prisma.department.upsert({
    where: { code: 'BGD' },
    update: {},
    create: {
      name: 'Ban Giám Đốc',
      code: 'BGD',
      parentId: companyDept.id,
      type: 'DEPARTMENT',
      order: 2,
      description: 'Ban điều hành chiến lược doanh nghiệp',
    },
  });

  const itDept = await prisma.department.upsert({
    where: { code: 'CNTT' },
    update: {},
    create: {
      name: 'Phòng Kỹ thuật & Công nghệ',
      code: 'CNTT',
      parentId: companyDept.id,
      type: 'DEPARTMENT',
      order: 3,
      description: 'Nghiên cứu & phát triển phần mềm TopKPI',
    },
  });

  const kdDept = await prisma.department.upsert({
    where: { code: 'KD' },
    update: {},
    create: {
      name: 'Phòng Kinh doanh & Tiếp thị',
      code: 'KD',
      parentId: companyDept.id,
      type: 'DEPARTMENT',
      order: 4,
      description: 'Phát triển thị trường và khách hàng',
    },
  });

  const hrDept = await prisma.department.upsert({
    where: { code: 'HR' },
    update: {},
    create: {
      name: 'Phòng Nhân sự & Đào tạo',
      code: 'HR',
      parentId: companyDept.id,
      type: 'DEPARTMENT',
      order: 5,
      description: 'Quản trị nhân lực và văn hóa tổ chức',
    },
  });

  // 4. Positions
  const posCeo = await prisma.position.upsert({
    where: { code: 'CEO' },
    update: {},
    create: {
      name: 'Tổng Giám Đốc',
      code: 'CEO',
      description: 'Điều hành toàn bộ hoạt động doanh nghiệp',
      status: 'ACTIVE',
    },
  });

  const posLead = await prisma.position.upsert({
    where: { code: 'TP' },
    update: {},
    create: {
      name: 'Trưởng phòng',
      code: 'TP',
      description: 'Quản lý phòng ban nghiệp vụ',
      status: 'ACTIVE',
    },
  });

  const posDev = await prisma.position.upsert({
    where: { code: 'SR_DEV' },
    update: {},
    create: {
      name: 'Chuyên viên cao cấp',
      code: 'SR_DEV',
      description: 'Phát triển chuyên môn kỹ thuật',
      status: 'ACTIVE',
    },
  });

  // 5. Admin User
  const adminPasswordHash = await bcrypt.hash('12345!', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'Thuankhanh.hust@gmail.com' },
    update: {
      passwordHash: adminPasswordHash,
      roleId: rolesMap.get('Admin')!,
    },
    create: {
      email: 'Thuankhanh.hust@gmail.com',
      username: 'Thuankhanh.hust@gmail.com',
      fullName: 'Lê Thuận Khánh',
      passwordHash: adminPasswordHash,
      employeeCode: 'TK-001',
      abbreviation: 'LTK',
      phone: '0988123456',
      gender: 'Nam',
      roleId: rolesMap.get('Admin')!,
      departmentId: bqdDept.id,
      positionId: posCeo.id,
      kpiStartDate: new Date('2024-01-01'),
      startDate: new Date('2023-01-01'),
      subsystem: 'BSC',
      status: 'ACTIVE',
      language: 'Tiếng Việt',
      description: 'Tài khoản quản trị cao cấp hệ thống TopKPI',
    },
  });

  const staffPasswordHash = await bcrypt.hash('12345!', 10);
  const staffUser = await prisma.user.upsert({
    where: { email: 'nhanvien.demo@toppion.com.vn' },
    update: {},
    create: {
      email: 'nhanvien.demo@toppion.com.vn',
      username: 'nhanvien.demo@toppion.com.vn',
      fullName: 'Nguyễn Văn An',
      passwordHash: staffPasswordHash,
      employeeCode: 'NV-002',
      abbreviation: 'NVA',
      phone: '0912345678',
      gender: 'Nam',
      roleId: rolesMap.get('Staff')!,
      departmentId: itDept.id,
      positionId: posDev.id,
      kpiStartDate: new Date('2024-03-01'),
      startDate: new Date('2024-01-15'),
      subsystem: 'BSC',
      status: 'ACTIVE',
      language: 'Tiếng Việt',
      description: 'Kỹ sư giải pháp số',
    },
  });

  // 6. Strategy Assessment (Bước 1 Đánh giá)
  await prisma.strategyAssessment.upsert({
    where: {
      organization_stage: {
        organization: 'Công ty',
        stage: 'Giai đoạn 1',
      },
    },
    update: {},
    create: {
      organization: 'Công ty',
      stage: 'Giai đoạn 1',
      vision: 'Xây dựng nền tảng quản trị chiến lược BSC và KPI số 1 Việt Nam, chuẩn hóa văn hóa đo lường hiệu suất.',
      companyStrengths: JSON.stringify([
        'Phương pháp luận TopKPI đã kiểm chứng',
        'Đội ngũ công nghệ tinh nhuệ, giàu kinh nghiệm',
        'Khả năng tùy biến và mở rộng linh hoạt'
      ]),
      competitorStrengths: JSON.stringify([
        'Nguồn lực tài chính dồi dào',
        'Thương hiệu quốc tế quen thuộc'
      ]),
      industrySuccessFactors: JSON.stringify([
        'Tốc độ cập nhật dữ liệu KPI thời gian thực',
        'Giao diện trực quan, dễ thao tác',
        'Bảo mật thông tin doanh nghiệp cấp cao'
      ]),
      competitors: JSON.stringify([
        'Tập đoàn phần mềm đa quốc gia X',
        'Nền tảng quản trị Y'
      ]),
      competitiveAdvantage: JSON.stringify([
        'Dịch vụ tư vấn đồng hành sát sao',
        'Chi phí hợp lý, thời gian triển khai dưới 3 tuần'
      ]),
    },
  });

  // 6.1 SWOT Analysis Items (Bước 2: Phân tích SWOT)
  const swotData = [
    { type: 'STRENGTH', content: 'Phương pháp luận TopKPI đã được kiểm chứng trên 100+ doanh nghiệp', order: 1 },
    { type: 'STRENGTH', content: 'Đội ngũ chuyên gia tư vấn giàu kinh nghiệm thực chiến', order: 2 },
    { type: 'STRENGTH', content: 'Hệ thống phần mềm trực quan, dễ sử dụng, đáp ứng nhanh', order: 3 },
    { type: 'WEAKNESS', content: 'Nguồn lực R&D ban đầu còn hạn chế so với các tập đoàn lớn', order: 1 },
    { type: 'WEAKNESS', content: 'Chưa có nhiều văn phòng chi nhánh tại các tỉnh thành xa', order: 2 },
    { type: 'OPPORTUNITY', content: 'Làn sóng chuyển đổi số và quản trị hiệu suất đang bùng nổ mạnh mẽ', order: 1 },
    { type: 'OPPORTUNITY', content: 'Chính phủ khuyến khích doanh nghiệp tối ưu hóa năng suất lao động', order: 2 },
    { type: 'THREAT', content: 'Các hãng phần mềm nước ngoài giảm giá để thâm nhập thị trường', order: 1 },
    { type: 'THREAT', content: 'Biến động kinh tế làm doanh nghiệp thắt chặt ngân sách đầu tư ban đầu', order: 2 },
  ];

  for (const item of swotData) {
    const existing = await prisma.swotItem.findFirst({
      where: {
        organization: 'Công ty',
        stage: 'Giai đoạn 1',
        type: item.type,
        content: item.content,
      },
    });
    if (!existing) {
      await prisma.swotItem.create({
        data: {
          organization: 'Công ty',
          stage: 'Giai đoạn 1',
          type: item.type,
          content: item.content,
          order: item.order,
        },
      });
    }
  }

  // 6.2 Strategy Formulation Matrix (Bước 3: Xây dựng chiến lược SO, WO, ST, WT)
  const strategyMatrixData = [
    {
      type: 'SO',
      title: 'Chiến lược SO-1: Tận dụng làn sóng CĐS để mở rộng thị phần với bộ công cụ TopKPI',
      description: 'Phát huy thế mạnh giải pháp số để tiếp cận nhanh các DN có nhu cầu cấp bách',
      isSelected: true,
      order: 1,
    },
    {
      type: 'SO',
      title: 'Chiến lược SO-2: Đóng gói chương trình đào tạo & tư vấn trọn gói theo ngành dọc',
      description: 'Kết hợp năng lực tư vấn chuyên sâu với nền tảng phần mềm chuẩn',
      isSelected: true,
      order: 2,
    },
    {
      type: 'WO',
      title: 'Chiến lược WO-1: Hợp tác với các đối tác địa phương để mở rộng kênh phân phối',
      description: 'Khắc phục hạn chế chi nhánh bằng mạng lưới đối tác nhượng quyền giải pháp',
      isSelected: true,
      order: 1,
    },
    {
      type: 'ST',
      title: 'Chiến lược ST-1: Tối ưu chi phí triển khai để duy trì lợi thế cạnh tranh về giá',
      description: 'Chuẩn hóa quy trình cài đặt và đào tạo tự động để giảm 50% chi phí vận hành',
      isSelected: true,
      order: 1,
    },
    {
      type: 'WT',
      title: 'Chiến lược WT-1: Tập trung phân khúc khách hàng vừa và nhỏ trước khi đối đầu trực diện',
      description: 'Tạo lập vị thế dẫn đầu trong thị trường ngách để tích lũy tài chính bền vững',
      isSelected: false,
      order: 1,
    },
  ];

  for (const item of strategyMatrixData) {
    const existing = await prisma.strategyMatrixItem.findFirst({
      where: {
        organization: 'Công ty',
        stage: 'Giai đoạn 1',
        type: item.type,
        title: item.title,
      },
    });
    if (!existing) {
      await prisma.strategyMatrixItem.create({
        data: {
          organization: 'Công ty',
          stage: 'Giai đoạn 1',
          type: item.type,
          title: item.title,
          description: item.description,
          isSelected: item.isSelected,
          order: item.order,
        },
      });
    }
  }

  // 7. BSC Strategic Objectives (4 Perspectives)
  // Perspective 1: FINANCIAL
  const objFin = await prisma.strategicObjective.upsert({
    where: { id: 'obj-fin-01' },
    update: {},
    create: {
      id: 'obj-fin-01',
      organization: 'Công ty',
      stage: 'Giai đoạn 1',
      perspective: 'FINANCIAL',
      code: 'TC-01',
      title: 'Tăng trưởng doanh thu & tối ưu hóa biên lợi nhuận',
      description: 'Đảm bảo sự phát triển tài chính bền vững và dòng tiền lành mạnh',
      order: 1,
    },
  });

  // Perspective 2: CUSTOMER
  const objCust = await prisma.strategicObjective.upsert({
    where: { id: 'obj-cust-01' },
    update: {},
    create: {
      id: 'obj-cust-01',
      organization: 'Công ty',
      stage: 'Giai đoạn 1',
      perspective: 'CUSTOMER',
      code: 'KH-01',
      title: 'Nâng cao chỉ số hài lòng và mở rộng mạng lưới khách hàng doanh nghiệp',
      description: 'Định vị TOPPION là đối tác số 1 về tư vấn và chuyển đổi số hiệu suất',
      order: 2,
    },
  });

  // Perspective 3: INTERNAL_PROCESS
  const objProc = await prisma.strategicObjective.upsert({
    where: { id: 'obj-proc-01' },
    update: {},
    create: {
      id: 'obj-proc-01',
      organization: 'Công ty',
      stage: 'Giai đoạn 1',
      perspective: 'INTERNAL_PROCESS',
      code: 'QT-01',
      title: 'Số hóa 100% quy trình vận hành và cam kết chuẩn mực SLA',
      description: 'Tối ưu hóa năng suất vận hành nội bộ, loại bỏ lãng phí thời gian',
      order: 3,
    },
  });

  // Perspective 4: LEARNING_GROWTH
  const objLearn = await prisma.strategicObjective.upsert({
    where: { id: 'obj-learn-01' },
    update: {},
    create: {
      id: 'obj-learn-01',
      organization: 'Công ty',
      stage: 'Giai đoạn 1',
      perspective: 'LEARNING_GROWTH',
      code: 'PT-01',
      title: 'Nâng cao năng lực chuyên môn và văn hóa thực thi kỷ luật',
      description: 'Đào tạo đội ngũ nhân lực kế thừa và áp dụng công nghệ số sâu rộng',
      order: 4,
    },
  });

  // 8. KPI Indicators
  // Financial KPIs
  await prisma.kpiIndicator.upsert({
    where: { code: 'KPI-TC-01' },
    update: {},
    create: {
      code: 'KPI-TC-01',
      name: 'Tăng trưởng doanh thu thuần so với cùng kỳ',
      objectiveId: objFin.id,
      unit: '%',
      frequency: 'QUARTERLY',
      weight: 50,
      targetValue: 25,
      thresholdValue: 20,
      stretchValue: 30,
      actualValue: 24,
      achievementRate: 96,
      departmentId: bqdDept.id,
      assignedToId: adminUser.id,
      status: 'ACHIEVED',
      note: 'Doanh thu Q1 đạt 96% mục tiêu kế hoạch đề ra',
    },
  });

  await prisma.kpiIndicator.upsert({
    where: { code: 'KPI-TC-02' },
    update: {},
    create: {
      code: 'KPI-TC-02',
      name: 'Tỷ suất lợi nhuận ròng trên doanh thu (ROS)',
      objectiveId: objFin.id,
      unit: '%',
      frequency: 'QUARTERLY',
      weight: 50,
      targetValue: 18,
      thresholdValue: 15,
      stretchValue: 22,
      actualValue: 19.2,
      achievementRate: 106.6,
      departmentId: bqdDept.id,
      assignedToId: adminUser.id,
      status: 'EXCEEDED',
      note: 'Vượt chỉ tiêu nhờ kiểm soát chi phí vận hành hiệu quả',
    },
  });

  // Customer KPIs
  await prisma.kpiIndicator.upsert({
    where: { code: 'KPI-KH-01' },
    update: {},
    create: {
      code: 'KPI-KH-01',
      name: 'Chỉ số đo lường sự hài lòng khách hàng (CSAT)',
      objectiveId: objCust.id,
      unit: 'Điểm',
      frequency: 'MONTHLY',
      weight: 40,
      targetValue: 90,
      thresholdValue: 85,
      stretchValue: 95,
      actualValue: 89,
      achievementRate: 98.8,
      departmentId: kdDept.id,
      assignedToId: adminUser.id,
      status: 'ACHIEVED',
    },
  });

  await prisma.kpiIndicator.upsert({
    where: { code: 'KPI-KH-02' },
    update: {},
    create: {
      code: 'KPI-KH-02',
      name: 'Số lượng hợp đồng khách hàng doanh nghiệp mới',
      objectiveId: objCust.id,
      unit: 'Hợp đồng',
      frequency: 'MONTHLY',
      weight: 60,
      targetValue: 20,
      thresholdValue: 15,
      stretchValue: 25,
      actualValue: 18,
      achievementRate: 90,
      departmentId: kdDept.id,
      assignedToId: adminUser.id,
      status: 'ACHIEVED',
    },
  });

  // Process KPIs
  await prisma.kpiIndicator.upsert({
    where: { code: 'KPI-QT-01' },
    update: {},
    create: {
      code: 'KPI-QT-01',
      name: 'Tỷ lệ giải quyết sự cố kỹ thuật đúng chuẩn cam kết SLA',
      objectiveId: objProc.id,
      unit: '%',
      frequency: 'MONTHLY',
      weight: 60,
      targetValue: 95,
      thresholdValue: 90,
      stretchValue: 98,
      actualValue: 96.5,
      achievementRate: 101.5,
      departmentId: itDept.id,
      assignedToId: staffUser.id,
      status: 'EXCEEDED',
    },
  });

  await prisma.kpiIndicator.upsert({
    where: { code: 'KPI-QT-02' },
    update: {},
    create: {
      code: 'KPI-QT-02',
      name: 'Số lượng module quy trình lõi triển khai tự động hóa',
      objectiveId: objProc.id,
      unit: 'Module',
      frequency: 'QUARTERLY',
      weight: 40,
      targetValue: 5,
      thresholdValue: 3,
      stretchValue: 7,
      actualValue: 4,
      achievementRate: 80,
      departmentId: itDept.id,
      assignedToId: staffUser.id,
      status: 'WARNING',
      note: 'Chậm 1 module do yêu cầu tinh chỉnh logic xác thực',
    },
  });

  // Learning KPIs
  await prisma.kpiIndicator.upsert({
    where: { code: 'KPI-PT-01' },
    update: {},
    create: {
      code: 'KPI-PT-01',
      name: 'Số giờ đào tạo nghiệp vụ & chuyên môn bình quân / người',
      objectiveId: objLearn.id,
      unit: 'Giờ/người',
      frequency: 'QUARTERLY',
      weight: 50,
      targetValue: 15,
      thresholdValue: 10,
      stretchValue: 20,
      actualValue: 16.5,
      achievementRate: 110,
      departmentId: hrDept.id,
      assignedToId: adminUser.id,
      status: 'EXCEEDED',
    },
  });

  // 9. BSC Reports
  await prisma.bscReport.upsert({
    where: { id: 'report-q1-2026' },
    update: {},
    create: {
      id: 'report-q1-2026',
      name: 'Báo Cáo Đánh Giá Hiệu Suất Chiến Lược Toàn Diện Quý 1/2026',
      period: 'Quý 1/2026',
      frequency: 'QUARTERLY',
      score: 97.4,
      authorId: adminUser.id,
      status: 'PUBLISHED',
      description: 'Tổng hợp đánh giá 4 viễn cảnh BSC cấp Tổng Công ty',
    },
  });

  await prisma.bscReport.upsert({
    where: { id: 'report-year-2026' },
    update: {},
    create: {
      id: 'report-year-2026',
      name: 'Kế Hoạch & Cam Kết Mục Tiêu Chiến Lược Năm 2026',
      period: 'Năm 2026',
      frequency: 'YEARLY',
      score: 95.0,
      authorId: adminUser.id,
      status: 'PUBLISHED',
      description: 'Bản đồ chiến lược và phân bổ chỉ tiêu KPI các phòng ban',
    },
  });

  console.log('✅ Seed completed successfully with full BSC Strategy, Objectives & KPIs in real database!');
}

main()
  .catch((e) => {
    console.error('❌ Error in seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
