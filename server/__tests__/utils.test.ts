import { describe, it, expect } from "vitest";
import { getSample } from "../src/utils";

describe("utils", () => {
    it("should get sample", () => {
        expect(getSample()).toEqual("hi");
    })
})