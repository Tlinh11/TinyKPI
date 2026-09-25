import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const db: any = prisma;

async function main() {
  console.log('🚀 Seeding Settings & Administration data into Neon PostgreSQL...');

  // 1. Resilient Admin lookup
  const admin =
    (await prisma.user.findFirst({
      where: { email: { equals: 'Thuankhanh.hust@gmail.com', mode: 'insensitive' } },
    })) ||
    (await prisma.user.findFirst({
      where: { role: { name: 'Admin' } },
    })) ||
    (await prisma.user.findFirst());

  if (!admin) {
    console.error('❌ Admin user not found. Please run base seed first.');
    return;
  }

  // 2. Roles & Permissions Matrix
  const roles = ['Admin', 'Manager', 'Staff', 'User'];
  const roleMap = new Map<string, string>();

  for (const rName of roles) {
    const r = await prisma.role.upsert({
      where: { name: rName },
      update: {},
      create: { name: rName, description: `Nhóm quyền ${rName}` },
    });
    roleMap.set(rName, r.id);
  }

  const permissionsList = [
    { name: 'users.view', module: 'users', description: 'Xem danh sách nhân sự' },
    { name: 'users.create_update', module: 'users', description: 'Thêm & sửa nhân sự' },
    { name: 'users.delete', module: 'users', description: 'Xóa nhân sự' },
    { name: 'departments.manage', module: 'departments', description: 'Quản trị sơ đồ & phòng ban' },
    { name: 'positions.manage', module: 'positions', description: 'Quản trị chức danh chức vụ' },
    { name: 'bsc_strategy.manage', module: 'bsc', description: 'Quản trị 5 bước chiến lược BSC' },
    { name: 'processes.manage', module: 'processes', description: 'Quản trị quy trình lõi SOP' },
    { name: 'sla.manage', module: 'sla', description: 'Quản trị cam kết chất lượng SLA' },
    { name: 'tasks.manage', module: 'tasks', description: 'Quản trị & giao việc hộp thư' },
    { name: 'calendar.manage', module: 'calendar', description: 'Quản trị lịch công tác & sự kiện' },
    { name: 'monitoring.view', module: 'monitoring', description: 'Giám sát tiến độ realtime' },
    { name: 'exams.manage', module: 'exams', description: 'Khảo thí & tổ chức kỳ thi quy trình' },
    { name: 'training.manage', module: 'training', description: 'Quản lý tài liệu & giáo trình' },
    { name: 'settings.manage', module: 'settings', description: 'Cấu hình hệ thống & phân quyền' },
    { name: 'audit_logs.view', module: 'audit', description: 'Xem nhật ký kiểm toán hệ thống' },
  ];

  for (const p of permissionsList) {
    const perm = await prisma.permission.upsert({
      where: { name: p.name },
      update: {
        module: p.module,
        description: p.description,
      },
      create: p,
    });

    // Admin has ALL permissions
    const adminRoleId = roleMap.get('Admin')!;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRoleId, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRoleId, permissionId: perm.id },
    });

    // Manager has view/create/manage for operational modules
    if (!['settings.manage', 'users.delete', 'audit_logs.view'].includes(p.name)) {
      const managerRoleId = roleMap.get('Manager')!;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: managerRoleId, permissionId: perm.id } },
        update: {},
        create: { roleId: managerRoleId, permissionId: perm.id },
      });
    }

    // Staff has view and tasks/exams
    if (['users.view', 'tasks.manage', 'calendar.manage', 'monitoring.view', 'training.manage'].includes(p.name)) {
      const staffRoleId = roleMap.get('Staff')!;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: staffRoleId, permissionId: perm.id } },
        update: {},
        create: { roleId: staffRoleId, permissionId: perm.id },
      });
    }
  }
  console.log('✅ Roles and Permissions Matrix seeded.');

  // 3. Employee Leave Records (Nghỉ dài hạn)
  // Ensure we do not assign maternity leave to the male CEO/Admin!
  await db.employeeLeaveRecord.deleteMany({
    where: { userId: admin.id },
  });

  // Find or create female employee for realistic Maternity leave record
  let femaleStaff = await prisma.user.findFirst({
    where: { email: 'mai.marketing@tinykpi.com' },
  });

  if (!femaleStaff) {
    const staffRole = await prisma.role.findFirst({ where: { name: 'Staff' } });
    const dept = await prisma.department.findFirst({ where: { type: 'DEPARTMENT' } });
    const pos = await prisma.position.findFirst();

    if (staffRole) {
      femaleStaff = await prisma.user.create({
        data: {
          email: 'mai.marketing@tinykpi.com',
          username: 'mai.marketing@tinykpi.com',
          fullName: 'Nguyễn Thị Mai',
          employeeCode: 'NV-003',
          gender: 'Nữ',
          phone: '0988776655',
          roleId: staffRole.id,
          departmentId: dept?.id,
          positionId: pos?.id,
          status: 'LEAVE',
          passwordHash: admin.passwordHash,
        },
      });
    }
  }

  // Find demo employee
  const demoUser = await prisma.user.findFirst({
    where: { email: 'nhanvien.demo@toppion.com.vn' },
  });

  const leaveData: Array<{
    userId: string;
    leaveType: string;
    startDate: Date;
    endDate: Date | null;
    status: string;
    reason: string;
    freezeKpi: boolean;
    approvedBy: string;
  }> = [];

  if (femaleStaff) {
    leaveData.push({
      userId: femaleStaff.id,
      leaveType: 'MATERNITY',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2027-01-01'),
      status: 'ACTIVE',
      reason: 'Nghỉ chế độ thai sản theo quy định nhà nước',
      freezeKpi: true,
      approvedBy: 'Ban Giám Đốc & Phòng Nhân Sự',
    });
  }

  if (demoUser) {
    leaveData.push({
      userId: demoUser.id,
      leaveType: 'SABBATICAL',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-08-31'),
      status: 'COMPLETED',
      reason: 'Cử đi đào tạo nâng cao kỹ thuật tại nước ngoài',
      freezeKpi: true,
      approvedBy: 'Tổng Giám Đốc',
    });
  }

  for (const l of leaveData) {
    const existing = await db.employeeLeaveRecord.findFirst({
      where: { userId: l.userId, leaveType: l.leaveType },
    });
    if (existing) {
      await db.employeeLeaveRecord.update({
        where: { id: existing.id },
        data: l,
      });
    } else {
      await db.employeeLeaveRecord.create({ data: l });
    }
  }
  console.log('✅ Employee leave records seeded.');

  // 4. Form Templates (Quản lý biểu mẫu)
  const formsData = [
    {
      code: 'FORM-KPI-REV',
      name: 'Phiếu Đánh giá & Rà soát Chỉ số KPI Quý',
      category: 'KPI',
      description: 'Mẫu biểu tự đánh giá và đối soát chỉ số hiệu suất giữa Trưởng bộ phận và Nhân viên.',
      fieldsJson: JSON.stringify([
        { id: 'f1', label: 'Tên nhân sự đánh giá', type: 'text', required: true },
        { id: 'f2', label: 'Kỳ đánh giá', type: 'select', options: ['Quý 1', 'Quý 2', 'Quý 3', 'Quý 4'], required: true },
        { id: 'f3', label: 'Tỷ lệ hoàn thành tổng hợp (%)', type: 'number', required: true },
        { id: 'f4', label: 'Đề xuất cải tiến & hành động khắc phục', type: 'textarea', required: false },
      ]),
      status: 'ACTIVE',
    },
    {
      code: 'FORM-SLA-ACC',
      name: 'Biên bản Nghiệm thu Cam kết Chất lượng SLA',
      category: 'SLA',
      description: 'Biên bản xác nhận hoàn tất dịch vụ nội bộ liên phòng ban theo đúng hạn định SLA.',
      fieldsJson: JSON.stringify([
        { id: 'f1', label: 'Mã Ticket / Yêu cầu', type: 'text', required: true },
        { id: 'f2', label: 'Bộ phận cung cấp dịch vụ', type: 'text', required: true },
        { id: 'f3', label: 'Thời gian hoàn thành thực tế (giờ)', type: 'number', required: true },
        { id: 'f4', label: 'Mức độ hài lòng của đơn vị tiếp nhận', type: 'select', options: ['Rất hài lòng', 'Hài lòng', 'Bình thường', 'Không đạt'], required: true },
      ]),
      status: 'ACTIVE',
    },
    {
      code: 'FORM-LEAVE-APP',
      name: 'Đơn Đề nghị Nghỉ Chế độ Dài hạn',
      category: 'HR',
      description: 'Mẫu đăng ký tạm hoãn tính KPI trong thời gian nghỉ thai sản hoặc điều trị y tế.',
      fieldsJson: JSON.stringify([
        { id: 'f1', label: 'Họ và tên nhân sự', type: 'text', required: true },
        { id: 'f2', label: 'Loại nghỉ chế độ', type: 'select', options: ['Thai sản', 'Nghỉ ốm dài ngày', 'Nghỉ không hưởng lương', 'Tạm hoãn hợp đồng'], required: true },
        { id: 'f3', label: 'Ngày bắt đầu nghỉ', type: 'date', required: true },
        { id: 'f4', label: 'Ngày dự kiến quay lại', type: 'date', required: true },
        { id: 'f5', label: 'Lý do & Giấy tờ kèm theo', type: 'textarea', required: true },
      ]),
      status: 'ACTIVE',
    },
  ];

  for (const f of formsData) {
    await db.formTemplate.upsert({
      where: { code: f.code },
      update: {
        name: f.name,
        category: f.category,
        description: f.description,
        fieldsJson: f.fieldsJson,
        status: f.status,
      },
      create: f,
    });
  }
  console.log('✅ Form templates seeded.');

  // 5. AI KPI Rules (Quy tắc gợi ý KPI)
  const aiRulesData = [
    {
      industry: 'TECHNOLOGY',
      position: 'DEV',
      perspective: 'INTERNAL_PROCESS',
      suggestedKpi: 'Tỷ lệ bàn giao tính năng đúng hạn (On-time Delivery Rate)',
      formula: '(Số task hoàn thành đúng deadline / Tổng task) * 100',
      unit: '%',
      weight: 25,
    },
    {
      industry: 'TECHNOLOGY',
      position: 'DEV',
      perspective: 'INTERNAL_PROCESS',
      suggestedKpi: 'Mật độ lỗi phần mềm sau triển khai (Bug Leakage Rate)',
      formula: '(Số bug phát sinh trên Production / Tổng tính năng) * 100',
      unit: '%',
      weight: 20,
    },
    {
      industry: 'GENERAL',
      position: 'SALES',
      perspective: 'FINANCIAL',
      suggestedKpi: 'Doanh thu thuần từ khách hàng mới',
      formula: 'Tổng giá trị hợp đồng ký mới trong kỳ',
      unit: 'Triệu VNĐ',
      weight: 35,
    },
    {
      industry: 'GENERAL',
      position: 'SALES',
      perspective: 'CUSTOMER',
      suggestedKpi: 'Tỷ lệ chuyển đổi khách hàng tiềm năng (Lead Conversion Rate)',
      formula: '(Số hợp đồng thành công / Tổng số leads) * 100',
      unit: '%',
      weight: 25,
    },
    {
      industry: 'GENERAL',
      position: 'HR',
      perspective: 'LEARNING_GROWTH',
      suggestedKpi: 'Tỷ lệ giữ chân nhân sự chủ chốt (Retention Rate)',
      formula: '(1 - (Số nhân sự nghỉ việc / Tổng nhân sự)) * 100',
      unit: '%',
      weight: 30,
    },
    {
      industry: 'GENERAL',
      position: 'CEO',
      perspective: 'FINANCIAL',
      suggestedKpi: 'Tỷ suất lợi nhuận trên vốn chủ sở hữu (ROE)',
      formula: '(Lợi nhuận sau thuế / Vốn chủ sở hữu) * 100',
      unit: '%',
      weight: 30,
    },
  ];

  for (const r of aiRulesData) {
    const existing = await db.aiKpiRule.findFirst({
      where: { industry: r.industry, position: r.position, suggestedKpi: r.suggestedKpi },
    });
    if (existing) {
      await db.aiKpiRule.update({
        where: { id: existing.id },
        data: {
          perspective: r.perspective,
          formula: r.formula,
          unit: r.unit,
          weight: r.weight,
        },
      });
    } else {
      await db.aiKpiRule.create({ data: r });
    }
  }
  console.log('✅ AI KPI rules seeded.');

  // 6. System Settings (Cấu hình Email & Hệ thống)
  const settingsData = [
    { key: 'SMTP_HOST', value: 'smtp.gmail.com', group: 'EMAIL' },
    { key: 'SMTP_PORT', value: '587', group: 'EMAIL' },
    { key: 'SMTP_USER', value: 'notifications@tinykpi.com', group: 'EMAIL' },
    { key: 'SMTP_PASS', value: '••••••••••••', group: 'EMAIL' },
    { key: 'SMTP_SECURE', value: 'tls', group: 'EMAIL' },
    { key: 'NOTIFY_TASK_DUE', value: 'true', group: 'NOTIFICATION' },
    { key: 'NOTIFY_SLA_ALERT', value: 'true', group: 'NOTIFICATION' },
    { key: 'NOTIFY_EXAM_SCHEDULE', value: 'true', group: 'NOTIFICATION' },
    { key: 'NOTIFY_BSC_REPORT', value: 'true', group: 'NOTIFICATION' },
    { key: 'COMPANY_NAME', value: 'TinyKPI Enterprise System', group: 'GENERAL' },
  ];

  for (const s of settingsData) {
    await db.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, group: s.group },
      create: s,
    });
  }
  console.log('✅ System settings seeded.');

  console.log('🎉 Settings & Administration Suite seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
