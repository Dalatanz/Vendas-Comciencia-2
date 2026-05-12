import { describe, it, expect } from "vitest";
import { formatCnpj, onlyDigits, validateCnpjDigits } from "@/lib/masks";

describe("máscaras e CNPJ", () => {
  it("formata CNPJ", () => {
    expect(formatCnpj("12345678000199")).toBe("12.345.678/0001-99");
  });

  it("rejeita CNPJ inválido", () => {
    expect(validateCnpjDigits("11111111111111")).toBe(false);
  });

  it("onlyDigits remove não numéricos", () => {
    expect(onlyDigits("12.3")).toBe("123");
  });
});
