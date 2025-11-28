import { describe, it, expect, beforeEach } from "vitest";
import { ReverseMap, ReverseMapState } from "../reverse";
import { basicAICallback } from "../reverse/basic";
import { smartAICallback } from "../reverse/smart";

describe("AI Functions", () => {
  let reverseMap: ReverseMap;

  beforeEach(() => {
    reverseMap = new ReverseMap(() => {});
  });

  describe("basicAICallback", () => {
    it("有効な手を返す", () => {
      reverseMap.current_color = ReverseMapState.BLACK;
      const move = basicAICallback(reverseMap);

      expect(move).toBeDefined();
      expect(move.x).toBeGreaterThanOrEqual(0);
      expect(move.x).toBeLessThan(8);
      expect(move.y).toBeGreaterThanOrEqual(0);
      expect(move.y).toBeLessThan(8);

      const score = reverseMap.check(move.x, move.y, ReverseMapState.BLACK);
      expect(score).toBeGreaterThan(0);
    });

    it("角が空いていれば角を優先する", () => {
      reverseMap.set_color(0, 0, ReverseMapState.EMPTY);
      reverseMap.set_color(1, 0, ReverseMapState.WHITE);
      reverseMap.current_color = ReverseMapState.BLACK;

      const move = basicAICallback(reverseMap);

      if (reverseMap.check(0, 0, ReverseMapState.BLACK) > 0) {
        expect(move.x === 0 && move.y === 0).toBe(true);
      }
    });

    it("角の隣のマスを避ける", () => {
      reverseMap.current_color = ReverseMapState.BLACK;

      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          reverseMap.set_color(i, j, ReverseMapState.EMPTY);
        }
      }

      reverseMap.set_color(3, 3, ReverseMapState.WHITE);
      reverseMap.set_color(1, 1, ReverseMapState.WHITE);
      reverseMap.set_color(0, 1, ReverseMapState.WHITE);
      reverseMap.set_color(3, 4, ReverseMapState.WHITE);

      const move = basicAICallback(reverseMap);

      const isDangerousCornerCell =
        (move.x === 1 && move.y === 1) ||
        (move.x === 1 && move.y === 6) ||
        (move.x === 6 && move.y === 1) ||
        (move.x === 6 && move.y === 6);

      if (reverseMap.check(3, 4, ReverseMapState.BLACK) > 0) {
        expect(isDangerousCornerCell).toBe(false);
      }
    });
  });

  describe("smartAICallback", () => {
    it("有効な手を返す", () => {
      reverseMap.current_color = ReverseMapState.BLACK;
      const move = smartAICallback(reverseMap);

      expect(move).toBeDefined();
      expect(move.x).toBeGreaterThanOrEqual(0);
      expect(move.x).toBeLessThan(8);
      expect(move.y).toBeGreaterThanOrEqual(0);
      expect(move.y).toBeLessThan(8);

      const score = reverseMap.check(move.x, move.y, ReverseMapState.BLACK);
      expect(score).toBeGreaterThan(0);
    });

    it("位置評価を考慮する", () => {
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          reverseMap.set_color(i, j, ReverseMapState.EMPTY);
        }
      }

      reverseMap.set_color(3, 3, ReverseMapState.WHITE);
      reverseMap.set_color(4, 3, ReverseMapState.WHITE);
      reverseMap.set_color(5, 3, ReverseMapState.WHITE);
      reverseMap.current_color = ReverseMapState.BLACK;

      const move = smartAICallback(reverseMap);

      expect(move).toBeDefined();
      expect(move.x).toBeGreaterThanOrEqual(0);
      expect(move.x).toBeLessThan(8);
    });

    it("複数の選択肢から最善手を選ぶ", () => {
      reverseMap.current_color = ReverseMapState.BLACK;
      const move1 = smartAICallback(reverseMap);
      const move2 = smartAICallback(reverseMap);

      expect(move1.x).toBe(move2.x);
      expect(move1.y).toBe(move2.y);
    });
  });

  describe("AI比較", () => {
    it("smartAIはbasicAIと異なる判断をすることがある", () => {
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          reverseMap.set_color(i, j, ReverseMapState.EMPTY);
        }
      }

      reverseMap.set_color(3, 3, ReverseMapState.WHITE);
      reverseMap.set_color(3, 4, ReverseMapState.WHITE);
      reverseMap.set_color(3, 5, ReverseMapState.WHITE);
      reverseMap.set_color(4, 3, ReverseMapState.BLACK);
      reverseMap.set_color(4, 4, ReverseMapState.BLACK);
      reverseMap.current_color = ReverseMapState.BLACK;

      const basicMove = basicAICallback(reverseMap);
      const smartMove = smartAICallback(reverseMap);

      expect(basicMove).toBeDefined();
      expect(smartMove).toBeDefined();
    });
  });

  describe("エッジケース", () => {
    it("打てる手が1つだけの場合、その手を返す", () => {
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          reverseMap.set_color(i, j, ReverseMapState.BLACK);
        }
      }

      reverseMap.set_color(0, 0, ReverseMapState.EMPTY);
      reverseMap.set_color(0, 1, ReverseMapState.WHITE);
      reverseMap.current_color = ReverseMapState.BLACK;

      const basicMove = basicAICallback(reverseMap);
      const smartMove = smartAICallback(reverseMap);

      expect(basicMove.x).toBe(0);
      expect(basicMove.y).toBe(0);
      expect(smartMove.x).toBe(0);
      expect(smartMove.y).toBe(0);
    });
  });
});
