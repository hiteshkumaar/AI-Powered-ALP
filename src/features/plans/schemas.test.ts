import { planCreateSchema, planItemUpdateSchema } from "@/features/plans/schemas";

describe("plan schemas", () => {
  test("validates plan create payload", () => {
    expect(planCreateSchema.safeParse({ title: "My Plan" }).success).toBe(true);
    expect(planCreateSchema.safeParse({ title: "" }).success).toBe(false);
  });

  test("validates item status enum", () => {
    expect(planItemUpdateSchema.safeParse({ status: "DONE" }).success).toBe(true);
    expect(planItemUpdateSchema.safeParse({ status: "INVALID" }).success).toBe(false);
  });
});

