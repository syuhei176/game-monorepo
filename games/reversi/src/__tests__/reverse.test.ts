import { describe, it, expect, beforeEach } from "vitest";
import { ReverseMap, ReverseMapState } from "../reverse";

describe("ReverseMap", () => {
  let reverseMap: ReverseMap;
  let changes: Array<{ x: number; y: number; color: ReverseMapState }>;

  beforeEach(() => {
    changes = [];
    reverseMap = new ReverseMap((x, y, color) => {
      changes.push({ x, y, color });
    });
  });

  describe("初期化", () => {
    it("盤面が8x8で初期化される", () => {
      expect(reverseMap.data.length).toBe(64);
    });

    it("初期配置が正しい", () => {
      expect(reverseMap.get_color(3, 3)).toBe(ReverseMapState.BLACK);
      expect(reverseMap.get_color(3, 4)).toBe(ReverseMapState.WHITE);
      expect(reverseMap.get_color(4, 3)).toBe(ReverseMapState.WHITE);
      expect(reverseMap.get_color(4, 4)).toBe(ReverseMapState.BLACK);
    });

    it("初期ターンが白", () => {
      expect(reverseMap.current_color).toBe(ReverseMapState.WHITE);
    });

    it("その他のマスが空", () => {
      expect(reverseMap.get_color(0, 0)).toBe(ReverseMapState.EMPTY);
      expect(reverseMap.get_color(7, 7)).toBe(ReverseMapState.EMPTY);
    });
  });

  describe("get_color", () => {
    it("範囲外の座標でBLOCKを返す", () => {
      expect(reverseMap.get_color(-1, 0)).toBe(ReverseMapState.BLOCK);
      expect(reverseMap.get_color(8, 0)).toBe(ReverseMapState.BLOCK);
      expect(reverseMap.get_color(0, -1)).toBe(ReverseMapState.BLOCK);
      expect(reverseMap.get_color(0, 8)).toBe(ReverseMapState.BLOCK);
    });

    it("有効な座標で正しい色を返す", () => {
      expect(reverseMap.get_color(3, 3)).toBe(ReverseMapState.BLACK);
      expect(reverseMap.get_color(3, 4)).toBe(ReverseMapState.WHITE);
    });
  });

  describe("check", () => {
    it("既に石がある場所には置けない", () => {
      expect(reverseMap.check(3, 3, ReverseMapState.WHITE)).toBe(0);
      expect(reverseMap.check(3, 4, ReverseMapState.BLACK)).toBe(0);
    });

    it("有効な手を検出できる", () => {
      const score = reverseMap.check(2, 3, ReverseMapState.WHITE);
      expect(score).toBeGreaterThan(0);
    });

    it("無効な手を検出できる", () => {
      const score = reverseMap.check(0, 0, ReverseMapState.WHITE);
      expect(score).toBe(0);
    });
  });

  describe("put", () => {
    it("有効な手を打つと石が置かれる", () => {
      const before = changes.length;
      const result = reverseMap.put(2, 3, ReverseMapState.WHITE);

      expect(result).toBe(true);
      expect(changes.length).toBeGreaterThan(before);
      expect(reverseMap.get_color(2, 3)).toBe(ReverseMapState.WHITE);
    });

    it("石をひっくり返す", () => {
      reverseMap.put(2, 3, ReverseMapState.WHITE);
      expect(reverseMap.get_color(3, 3)).toBe(ReverseMapState.WHITE);
    });

    it("無効な手は打てない", () => {
      const result = reverseMap.put(0, 0, ReverseMapState.WHITE);
      expect(result).toBe(false);
      expect(reverseMap.get_color(0, 0)).toBe(ReverseMapState.EMPTY);
    });

    it("手を打つとターンが変わる", () => {
      expect(reverseMap.current_color).toBe(ReverseMapState.WHITE);
      reverseMap.put(2, 3, ReverseMapState.WHITE);
      expect(reverseMap.current_color).toBe(ReverseMapState.BLACK);
    });
  });

  describe("turn", () => {
    it("白から黒に変わる", () => {
      reverseMap.current_color = ReverseMapState.WHITE;
      reverseMap.turn();
      expect(reverseMap.current_color).toBe(ReverseMapState.BLACK);
    });

    it("黒から白に変わる", () => {
      reverseMap.current_color = ReverseMapState.BLACK;
      reverseMap.turn();
      expect(reverseMap.current_color).toBe(ReverseMapState.WHITE);
    });
  });

  describe("checkPass", () => {
    it("初期状態では白はパスしない", () => {
      const pass = reverseMap.checkPass(ReverseMapState.WHITE);
      expect(pass).toBe(false);
    });

    it("打てる手がない場合にパスが必要", () => {
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          reverseMap.set_color(i, j, ReverseMapState.BLACK);
        }
      }
      reverseMap.set_color(0, 0, ReverseMapState.EMPTY);

      const pass = reverseMap.checkPass(ReverseMapState.WHITE);
      expect(pass).toBe(true);
    });

    it("盤面が埋まっている場合はパス不要", () => {
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          reverseMap.set_color(i, j, ReverseMapState.BLACK);
        }
      }

      const pass = reverseMap.checkPass(ReverseMapState.WHITE);
      expect(pass).toBe(false);
    });
  });

  describe("countPieces", () => {
    it("初期状態で白黒が各2個", () => {
      const counts = reverseMap.countPieces();
      expect(counts.white).toBe(2);
      expect(counts.black).toBe(2);
    });

    it("石を置いた後の数をカウント", () => {
      reverseMap.put(2, 3, ReverseMapState.WHITE);
      const counts = reverseMap.countPieces();
      expect(counts.white).toBeGreaterThan(2);
    });
  });

  describe("endGame", () => {
    it("ゲーム終了フラグが立つ", () => {
      expect(reverseMap.isGameEnded).toBe(false);
      reverseMap.endGame();
      expect(reverseMap.isGameEnded).toBe(true);
    });

    it("ゲーム終了コールバックが呼ばれる", () => {
      let called = false;
      let whiteCount = 0;
      let blackCount = 0;

      reverseMap.setGameEndCallback((white, black) => {
        called = true;
        whiteCount = white;
        blackCount = black;
      });

      reverseMap.endGame();

      expect(called).toBe(true);
      expect(whiteCount).toBe(2);
      expect(blackCount).toBe(2);
    });
  });

  describe("複数方向のひっくり返し", () => {
    it("複数方向の石を一度にひっくり返す", () => {
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          reverseMap.set_color(i, j, ReverseMapState.EMPTY);
        }
      }

      reverseMap.set_color(3, 3, ReverseMapState.WHITE);
      reverseMap.set_color(2, 3, ReverseMapState.BLACK);
      reverseMap.set_color(3, 2, ReverseMapState.BLACK);
      reverseMap.current_color = ReverseMapState.WHITE;

      changes = [];
      const result = reverseMap.put(1, 3, ReverseMapState.WHITE);

      expect(result).toBe(true);
      expect(reverseMap.get_color(2, 3)).toBe(ReverseMapState.WHITE);
    });
  });
});
