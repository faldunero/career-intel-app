export const PASSWORD_RULES = [
  { id: "length", label: "Al menos 8 caracteres", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "Una mayúscula", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower", label: "Una minúscula", test: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "Un número", test: (p: string) => /[0-9]/.test(p) },
  {
    id: "symbol",
    label: "Un símbolo (ej: !@#$%)",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
];

export function isPasswordValid(password: string) {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
