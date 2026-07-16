// Shared entity -> response-DTO mappers, ported 1:1 from the Java DTO
// builders scattered across ComplaintService / UserController / AdminService.
// Requires the caller to have loaded the `department` relation — `block` is
// a plain enum column on User now (see docs/MIGRATION_NOTES.md "Hostel-10
// scoping"), so it needs no include.

// NOTE: mirrors ComplaintService.toUserSummary() / UserController's builders
// exactly — none of the original call sites ever populate `scholarNumber` on
// this DTO (only StudentProfileResponse does), so it stays null here too.
// `hostelBlock` keeps its original JSON key name for frontend compatibility,
// even though it's sourced from the simplified `block` enum, not a Hostel relation.
function toUserSummary(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phoneNumber: user.phoneNumber,
    hostelBlock: user.block || null,
    roomNumber: user.roomNumber,
    department: user.department ? user.department.name : null,
    scholarNumber: null,
  };
}

const userSummaryInclude = { department: true };

// The Java `User` entity marks `password` @JsonIgnore, so it never
// serialized into any response. Prisma has no field-level equivalent —
// anywhere a raw User record from prisma.user.create/update is handed back
// to a controller, this must be applied first or the bcrypt hash leaks into
// the JSON response.
function omitPassword(user) {
  if (!user) return user;
  // eslint-disable-next-line no-unused-vars -- destructure-to-omit idiom
  const { password, ...safe } = user;
  return safe;
}

module.exports = { toUserSummary, userSummaryInclude, omitPassword };
