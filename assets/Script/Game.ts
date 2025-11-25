import { _decorator, Component, Node, Input, instantiate, SpriteFrame, resources, Prefab, Layout, Camera, Sprite, UITransform } from "cc";
import { Box } from "./Box";

const { ccclass, property } = _decorator;

const MAX_GAME_BOARD_SIZE = 10;
const MIN_GAME_BOARD_SIZE = 2;
const MAX_BOX_GAP = 10;
const MIN_BOX_GAP = 1;
const BOX_COLOR_TYPE_COUNT = 5;

export let colorMap = [];

export type GameBoardTitle = [Node, coords: [number, number], index: [number, number], colorIndex: number, isActive: boolean];
export type GameBoard = Array<Array<GameBoardTitle>>;
@ccclass("Game")
export class Game extends Component {
  @property({
    type: Number,
    max: MAX_GAME_BOARD_SIZE,
    min: MIN_GAME_BOARD_SIZE,
  })
  private GameBoardSize: number = MAX_GAME_BOARD_SIZE;
  @property({ type: Number, max: MAX_BOX_GAP, min: MIN_BOX_GAP })
  private BoxGap: number = MAX_BOX_GAP;
  @property({ type: Prefab }) private Box: Prefab = null;
  @property({ type: Layout }) private BoxesLayout: Layout = null;
  @property({ type: Camera }) private Camera: Camera = null;
  @property({ type: Sprite }) private Background: Sprite = null;

  private boxSpriteFrames: Array<SpriteFrame> = [];
  public gameBoard: GameBoard = [];

  protected onLoad(): void {
    this.loadAssets(() => {
      const shadowBoxesLayoutNode = instantiate(this.BoxesLayout.node);
      this.BoxesLayout.node.parent.addChild(shadowBoxesLayoutNode);

      const layoutBoundingBox = this.BoxesLayout.getComponent(UITransform).getBoundingBox();
      shadowBoxesLayoutNode.setPosition(layoutBoundingBox.center.x, layoutBoundingBox.center.y - layoutBoundingBox.height - this.BoxGap);

      this.initLayoutIndexes();
      this.initGameField(shadowBoxesLayoutNode.getComponent(Layout));
      this.initGameField(this.BoxesLayout);
      for (let i = 0; i < this.gameBoard.length; i++) {
        for (let j = 0; j < this.gameBoard[0].length; j++) {
          const nodeComponent = this.gameBoard[i][j][0].getComponent(Box);
          nodeComponent.boxAnimation.play("scaleAnimation");
          // this.gameBoard[i][j][0].on(Node.EventType.NODE_DESTROYED, () => {
          // })
        }
      }
    });
  }

  protected onEnable(): void {}

  protected start(): void {}

  protected update(deltaTime: number): void {}

  protected onDisable(): void {}

  protected onDestroy(): void {}

  public shuffleGameBoard() {
    for (let i = this.gameBoard.length - 1; i >= 0; i--) {
      for (let j = this.gameBoard[0].length - 1; j >= 0; j--) {
        let k = i - 1;
        if (!this.gameBoard[i][j][4]) {
          while (true) {
            if (this.gameBoard[k] && this.gameBoard[k][j][4]) {
              let oldBox = this.gameBoard[i][j];
              let newBox = this.gameBoard[k][j];
              this.gameBoard[i][j] = null;

              this.gameBoard[i][j] = [...newBox];

              this.gameBoard[k][j][4] = false;

              this.gameBoard[i][j][0].setPosition(oldBox[1][0], oldBox[1][1]);
              this.gameBoard[i][j][0].getComponent(Box).setIndex2DMatrix([oldBox[2][0], oldBox[2][1]]);
              this.gameBoard[i][j][0].on(
                Input.EventType.MOUSE_UP,
                this.gameBoard[i][j][0].getComponent(Box).onMouseUp,
                this.gameBoard[i][j][0].getComponent(Box),
              );

              this.gameBoard[i][j][1] = [...oldBox[1]];
              this.gameBoard[i][j][2] = [...oldBox[2]];
              this.gameBoard[i][j][4] = true;
              break;
            }
            k--;
            if (k < 0) {
              break;
            }
          }
        }
      }
    }
  }

  /**
   * Загрузка ассетов
   */
  private loadAssets(callback) {
    const loadBlue = new Promise<SpriteFrame>((resolve, reject) =>
      resources.load("images/block_blue/spriteFrame", SpriteFrame, (err, data) => (err ? reject(err) : resolve(data))),
    );
    const loadRed = new Promise<SpriteFrame>((resolve, reject) =>
      resources.load("images/block_red/spriteFrame", SpriteFrame, (err, data) => (err ? reject(err) : resolve(data))),
    );
    const loadGreen = new Promise<SpriteFrame>((resolve, reject) =>
      resources.load("images/block_green/spriteFrame", SpriteFrame, (err, data) => (err ? reject(err) : resolve(data))),
    );
    const loadYellow = new Promise<SpriteFrame>((resolve, reject) =>
      resources.load("images/block_yellow/spriteFrame", SpriteFrame, (err, data) => (err ? reject(err) : resolve(data))),
    );
    const loadPurpure = new Promise<SpriteFrame>((resolve, reject) =>
      resources.load("images/block_purpure/spriteFrame", SpriteFrame, (err, data) => (err ? reject(err) : resolve(data))),
    );

    Promise.all([loadBlue, loadRed, loadGreen, loadYellow, loadPurpure]).then((sprites) => {
      this.boxSpriteFrames = sprites;
      colorMap = ["blue", "red", "green", "yellow", "purpure"];
      callback();
    });
  }

  /**
   * Инициализация игрового поля
   * 1. Установка рандомного цвета тайтла.
   * 2. Установка позиции тайтла на игровок поле.
   * 3. Создание матрицы тайтлов аналогично игровому полю.
   */
  private initGameField(layout: Layout) {
    const uiTransportLayout = layout.getComponent(UITransform);
    const cellSize = uiTransportLayout.contentSize.width / this.GameBoardSize - this.BoxGap;
    const layoutBoundingBox = uiTransportLayout.getBoundingBox();

    const startIndex = this.gameBoard.length ? this.gameBoard.length : 0;

    for (let i = startIndex, k = 0; i < startIndex + this.GameBoardSize; i++) {
      this.gameBoard.push([]);
      for (let j = 0; j < this.GameBoardSize; j++) {
        let zeroX = layoutBoundingBox.x + cellSize * 0.5;
        let zeroY = layoutBoundingBox.y + cellSize * 0.5;
        let gap = (layoutBoundingBox.width - this.GameBoardSize * cellSize) / (this.GameBoardSize - 1);
        let x = zeroX + j * (cellSize + gap);
        let y = zeroY + k * (cellSize + gap);

        const node = instantiate(this.Box);
        const nodeComponent = node.getComponent(Box);
        const colorIndex = Math.floor(Math.random() * BOX_COLOR_TYPE_COUNT);
        node.setPosition(x, y * -1);
        nodeComponent.setSpriteFrame(this.boxSpriteFrames[colorIndex]);
        nodeComponent.setContentSize(cellSize, cellSize);
        nodeComponent.setIndex2DMatrix([i, j]);

        this.gameBoard[i].push([node, [node.position.x, node.position.y], [i, j], colorIndex, true]);
        layout.node.addChild(node);
      }
      if (k < this.GameBoardSize) {
        k++;
      } else {
        k = 0;
      }
    }
  }

  /**
   * Инициализация порядка слоев.
   */
  private initLayoutIndexes() {
    this.Camera.node.setSiblingIndex(0);
    this.Background.node.setSiblingIndex(1);
    this.BoxesLayout.node.setSiblingIndex(10);
  }
}
