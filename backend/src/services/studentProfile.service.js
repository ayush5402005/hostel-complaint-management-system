const PDFDocument = require('pdfkit');
const prisma = require('../config/prisma');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/AppError');
const { toPage } = require('../utils/pagination');

const STAFF_ROLES = ['ADMIN', 'WARDEN', 'CARETAKER'];
const isStaff = (role) => STAFF_ROLES.includes(role);

async function getUserByEmail(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new NotFoundError(`User not found: ${email}`);
  return user;
}

// NOTE: `hostelName` was dropped from this response — the app now serves a
// single hostel, so a per-student hostel name carried no information (it
// was always "Hostel 10", or null for legacy accounts predating the
// hostel/block fields). Confirmed unused by the frontend before removing.
// See docs/MIGRATION_NOTES.md "Hostel-10 scoping". `blockName` is kept as
// the JSON key for compatibility, now sourced from the `block` enum.
function toResponse(profile) {
  const u = profile.user;
  return {
    id: profile.id,
    userId: u.id,
    studentName: u.name,
    email: u.email,
    phoneNumber: u.phoneNumber,
    scholarNumber: u.scholarNumber,
    blockName: u.block || null,
    roomNumber: u.roomNumber,
    hostelFeeUtr: profile.hostelFeeUtr,
    hostelFeeAmount: profile.hostelFeeAmount,
    hostelFeeScreenshotUrl: profile.hostelFeeScreenshotUrl,
    messFeeUtr: profile.messFeeUtr,
    messFeeAmount: profile.messFeeAmount,
    messFeeScreenshotUrl: profile.messFeeScreenshotUrl,
    parentContact: profile.parentContact,
    homeAddress: profile.homeAddress,
    profilePhotoUrl: profile.profilePhotoUrl,
    profileComplete: profile.profileComplete,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

const profileWithUser = { include: { user: true } };

// ─── Student: submit profile ─────────────────────────────────────────────────

async function submitProfile(email, request) {
  const student = await getUserByEmail(email);
  if (student.role !== 'STUDENT') throw new ForbiddenError('Only students can submit profile');

  const existing = await prisma.studentProfile.findUnique({ where: { userId: student.id } });
  if (existing && existing.profileComplete) {
    throw new BadRequestError('Profile already submitted. Contact warden/caretaker to update UTR details.');
  }

  if (await prisma.studentProfile.findFirst({ where: { hostelFeeUtr: request.hostelFeeUtr } })) {
    throw new BadRequestError('Hostel fee UTR already registered. Contact warden if this is an error.');
  }
  if (await prisma.studentProfile.findFirst({ where: { messFeeUtr: request.messFeeUtr } })) {
    throw new BadRequestError('Mess fee UTR already registered. Contact warden if this is an error.');
  }
  if (request.hostelFeeUtr === request.messFeeUtr) {
    throw new BadRequestError('Hostel fee UTR and Mess fee UTR cannot be the same.');
  }

  const data = {
    hostelFeeUtr: request.hostelFeeUtr.trim(),
    hostelFeeAmount: request.hostelFeeAmount,
    hostelFeeScreenshotUrl: request.hostelFeeScreenshotUrl,
    messFeeUtr: request.messFeeUtr.trim(),
    messFeeAmount: request.messFeeAmount,
    messFeeScreenshotUrl: request.messFeeScreenshotUrl,
    parentContact: request.parentContact.trim(),
    homeAddress: request.homeAddress.trim(),
    profilePhotoUrl: request.profilePhotoUrl,
    profileComplete: true,
  };

  const profile = existing
    ? await prisma.studentProfile.update({ where: { id: existing.id }, data, ...profileWithUser })
    : await prisma.studentProfile.create({ data: { ...data, userId: student.id }, ...profileWithUser });

  return toResponse(profile);
}

async function getMyProfile(email) {
  const student = await getUserByEmail(email);
  const profile = await prisma.studentProfile.findUnique({ where: { userId: student.id }, ...profileWithUser });
  if (!profile) throw new NotFoundError('Profile not found. Please complete your profile.');
  return toResponse(profile);
}

async function isProfileComplete(email) {
  const student = await getUserByEmail(email);
  const profile = await prisma.studentProfile.findUnique({ where: { userId: student.id } });
  return profile ? profile.profileComplete : false;
}

// ─── Staff: update any field ─────────────────────────────────────────────────

async function updateProfileByStaff(userId, request, staffEmail) {
  const staff = await getUserByEmail(staffEmail);
  if (!isStaff(staff.role)) throw new ForbiddenError('Only warden/caretaker/admin can update student profiles');

  const student = await prisma.user.findUnique({ where: { id: BigInt(userId) } });
  if (!student) throw new NotFoundError(`User not found: ${userId}`);
  if (student.role !== 'STUDENT') throw new BadRequestError('User is not a student');

  const profile = await prisma.studentProfile.findUnique({ where: { userId: student.id } });
  if (!profile) throw new NotFoundError('Profile not found for student');

  if (
    request.hostelFeeUtr != null &&
    request.hostelFeeUtr !== profile.hostelFeeUtr &&
    (await prisma.studentProfile.findFirst({ where: { hostelFeeUtr: request.hostelFeeUtr, userId: { not: student.id } } }))
  ) {
    throw new BadRequestError('Hostel UTR already in use by another student');
  }
  if (
    request.messFeeUtr != null &&
    request.messFeeUtr !== profile.messFeeUtr &&
    (await prisma.studentProfile.findFirst({ where: { messFeeUtr: request.messFeeUtr, userId: { not: student.id } } }))
  ) {
    throw new BadRequestError('Mess UTR already in use by another student');
  }

  const data = {};
  if (request.hostelFeeUtr != null) data.hostelFeeUtr = request.hostelFeeUtr.trim();
  if (request.hostelFeeAmount != null) data.hostelFeeAmount = request.hostelFeeAmount;
  if (request.hostelFeeScreenshotUrl != null) data.hostelFeeScreenshotUrl = request.hostelFeeScreenshotUrl;
  if (request.messFeeUtr != null) data.messFeeUtr = request.messFeeUtr.trim();
  if (request.messFeeAmount != null) data.messFeeAmount = request.messFeeAmount;
  if (request.messFeeScreenshotUrl != null) data.messFeeScreenshotUrl = request.messFeeScreenshotUrl;
  if (request.parentContact != null) data.parentContact = request.parentContact.trim();
  if (request.homeAddress != null) data.homeAddress = request.homeAddress.trim();
  if (request.profilePhotoUrl != null) data.profilePhotoUrl = request.profilePhotoUrl;

  const saved = await prisma.studentProfile.update({ where: { id: profile.id }, data, ...profileWithUser });
  return toResponse(saved);
}

async function getStudentProfileByStaff(userId, staffEmail) {
  const staff = await getUserByEmail(staffEmail);
  if (!isStaff(staff.role)) throw new ForbiddenError('Access denied');

  const profile = await prisma.studentProfile.findUnique({ where: { userId: BigInt(userId) }, ...profileWithUser });
  if (!profile) throw new NotFoundError('Profile not found');
  return toResponse(profile);
}

// ─── Staff: student list with filters ────────────────────────────────────────

// `block` replaces the old `blockId` filter — a direct 'A'/'B' enum value
// instead of a Block table foreign key. See docs/MIGRATION_NOTES.md
// "Hostel-10 scoping".
function studentFilterWhere(block, roomNumber, name) {
  const where = { role: 'STUDENT', active: true };
  if (block) where.block = block;
  if (roomNumber) where.roomNumber = roomNumber;
  if (name) where.name = { contains: name };
  return where;
}

async function getStudentList(staffEmail, block, roomNumber, name, page, size) {
  const staff = await getUserByEmail(staffEmail);
  if (!isStaff(staff.role)) throw new ForbiddenError('Access denied');

  const where = studentFilterWhere(block, roomNumber, name);
  const [students, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: page * size,
      take: size,
    }),
    prisma.user.count({ where }),
  ]);

  const content = await Promise.all(
    students.map(async (u) => {
      const profile = await prisma.studentProfile.findUnique({ where: { userId: u.id } });
      if (profile) return toResponse({ ...profile, user: u });
      return {
        id: null,
        userId: u.id,
        studentName: u.name,
        email: u.email,
        phoneNumber: u.phoneNumber,
        scholarNumber: u.scholarNumber,
        blockName: u.block || null,
        roomNumber: u.roomNumber,
        profileComplete: false,
      };
    })
  );

  return toPage(content, total, page, size);
}

// ─── Staff: vacancy list ──────────────────────────────────────────────────────

async function getVacancyList(staffEmail, block) {
  const staff = await getUserByEmail(staffEmail);
  if (!isStaff(staff.role)) throw new ForbiddenError('Access denied');

  const rows = await prisma.user.groupBy({
    by: ['roomNumber'],
    where: { block, active: true },
    _count: { roomNumber: true },
    having: { roomNumber: { _count: { lt: 2 } } },
    orderBy: { roomNumber: 'asc' },
  });

  return rows
    .filter((r) => r.roomNumber != null)
    .map((r) => ({
      blockName: block,
      roomNumber: r.roomNumber,
      occupiedSeats: r._count.roomNumber,
      vacantSeats: 2 - r._count.roomNumber,
    }));
}

// ─── CSV export ────────────────────────────────────────────────────────────

function escapeCsv(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function exportAsCsv(staffEmail, block, roomNumber, name) {
  const staff = await getUserByEmail(staffEmail);
  if (!isStaff(staff.role)) throw new ForbiddenError('Access denied');

  const where = studentFilterWhere(block, roomNumber, name);
  const students = await prisma.user.findMany({
    where,
    orderBy: [{ block: 'asc' }, { roomNumber: 'asc' }, { name: 'asc' }],
  });

  const rows = [
    'Name,Email,Phone,Scholar No,Block,Room,Hostel UTR,Hostel Fee,Mess UTR,Mess Fee,Parent Contact,Home Address,Profile Complete',
  ];

  for (const u of students) {
    const p = await prisma.studentProfile.findUnique({ where: { userId: u.id } });
    rows.push(
      [
        escapeCsv(u.name),
        escapeCsv(u.email),
        escapeCsv(u.phoneNumber),
        escapeCsv(u.scholarNumber),
        escapeCsv(u.block || ''),
        escapeCsv(u.roomNumber),
        p ? escapeCsv(p.hostelFeeUtr) : '',
        p && p.hostelFeeAmount != null ? p.hostelFeeAmount : '',
        p ? escapeCsv(p.messFeeUtr) : '',
        p && p.messFeeAmount != null ? p.messFeeAmount : '',
        p ? escapeCsv(p.parentContact) : '',
        p ? escapeCsv(p.homeAddress) : '',
        p && p.profileComplete ? 'Yes' : 'No',
      ].join(',')
    );
  }

  return Buffer.from(rows.join('\n') + '\n', 'utf-8');
}

// ─── PDF export ────────────────────────────────────────────────────────────

async function exportAsPdf(staffEmail, block, roomNumber, name) {
  const staff = await getUserByEmail(staffEmail);
  if (!isStaff(staff.role)) throw new ForbiddenError('Access denied');

  const where = studentFilterWhere(block, roomNumber, name);
  const students = await prisma.user.findMany({
    where,
    orderBy: [{ block: 'asc' }, { roomNumber: 'asc' }, { name: 'asc' }],
  });

  const headers = ['Name', 'Email', 'Phone', 'Scholar No', 'Block', 'Room', 'Hostel UTR', 'Hostel Fee', 'Parent Contact', 'Profile'];
  const colWidths = [70, 100, 60, 55, 40, 35, 65, 55, 75, 45];

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(14).font('Helvetica-Bold').text('Student List', { align: 'left' });
    doc.moveDown(0.5);

    const startX = doc.x;
    let y = doc.y;
    const rowHeight = 16;

    const drawRow = (cells, opts = {}) => {
      let x = startX;
      doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7);
      if (opts.bg) {
        doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#c8dcf0');
        doc.fillColor('black');
      }
      cells.forEach((cell, i) => {
        doc.text(String(cell ?? ''), x + 2, y + 4, { width: colWidths[i] - 4, ellipsis: true });
        x += colWidths[i];
      });
      y += rowHeight;
      if (y > doc.page.height - 40) {
        doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
        y = doc.y;
      }
    };

    drawRow(headers, { bold: true, bg: true });

    (async () => {
      for (const u of students) {
        const p = await prisma.studentProfile.findUnique({ where: { userId: u.id } });
        drawRow([
          u.name || '',
          u.email || '',
          u.phoneNumber || '',
          u.scholarNumber || '',
          u.block || '',
          u.roomNumber || '',
          p ? p.hostelFeeUtr || '' : '',
          p && p.hostelFeeAmount != null ? String(p.hostelFeeAmount) : '',
          p ? p.parentContact || '' : '',
          p && p.profileComplete ? 'Yes' : 'Pending',
        ]);
      }
      doc.end();
    })().catch(reject);
  });
}

module.exports = {
  submitProfile,
  getMyProfile,
  isProfileComplete,
  updateProfileByStaff,
  getStudentProfileByStaff,
  getStudentList,
  getVacancyList,
  exportAsCsv,
  exportAsPdf,
};
