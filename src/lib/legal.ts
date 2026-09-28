export function legalIdentity() {
  const name = process.env.LEGAL_CONTROLLER_NAME?.trim() ?? "";
  const email = process.env.LEGAL_CONTACT_EMAIL?.trim() ?? "";
  const law = process.env.LEGAL_APPLICABLE_LAW?.trim() ?? "";
  return {
    name: name || null,
    email: email || null,
    law: law || null,
  };
}
