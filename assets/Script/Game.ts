import { _decorator, Component, Node, Input, instantiate, SpriteFrame, resources, Prefab, Layout, Camera, Sprite, UITransform, Animation, Vec2 } from "cc";
import { Box } from "./Box";

const { ccclass, property } = _decorator;

const MAX_GAME_BOARD_SIZE = 10;
const MIN_GAME_BOARD_SIZE = 2;
const MAX_BOX_GAP = 10;
const MIN_BOX_GAP = 1;
const BOX_COLOR_TYPE_COUNT = 5;

const BOARDS_GAP = 120;

export let colorMap = [];

export type GameBoardTile = [Node, coords: [number, number], index: [number, number], colorIndex: number, isActive: boolean];
export type GameBoard = Array<Array<GameBoardTile>>;
@ccclass("Game")
export class Game extends Component {
  @property({
    type: Number,
    max: MAX_GAME_BOARD_SIZE,
    min: MIN_GAME_BOARD_SIZE,
  }) private gameBoardSize: number = MAX_GAME_BOARD_SIZE
  @property({ type: Number, max: MAX_BOX_GAP, min: MIN_BOX_GAP }) private BoxGap: number = MAX_BOX_GAP;
  @property({ type: Prefab }) private Box: Prefab = null;
  @property({ type: Layout }) private BoxesLayout: Layout = null;
  @property({ type: Camera }) private Camera: Camera = null;
  @property({ type: Sprite }) private Background: Sprite = null;

  private boxSpriteFrames: Array<SpriteFrame> = [];
  public gameBoard: GameBoard = [];
  public gameBoardMap = new Map<[number, number], GameBoardTile>


  protected onLoad(): void {
    this.loadAssets(() => {
      const layoutBoundingBox = this.BoxesLayout.getComponent(UITransform).getBoundingBox();

      this.initLayoutIndexes();
      this.initGameField(this.BoxesLayout);
      this.initGameField(this.BoxesLayout);

      this.BoxesLayout.node.setPosition(layoutBoundingBox.center.x, layoutBoundingBox.center.y + layoutBoundingBox.height + this.BoxGap + BOARDS_GAP)

      for (let i = 0; i < this.gameBoard.length; i++) {
        for (let j = 0; j < this.gameBoard[0].length; j++) {
          // this.gameBoard[i][j][0].getComponent(Box).boxAnimation.play("scaleAnimation");
        }
      }
    });
  }

  protected onEnable(): void { }

  protected start(): void { }

  protected update(deltaTime: number): void { }

  protected onDisable(): void { }

  protected onDestroy(): void { }

  /**
   * Перемещение соседних блоков, после удаления
   */
  public shuffleGameBoard() {
    for (let i = this.gameBoard.length - 1; i >= 0; i--) {
      for (let j = this.gameBoard[0].length - 1; j >= 0; j--) {
        let k = i - 1;
        if (!this.gameBoard[i][j][4]) {
          while (true) {
            if (this.gameBoard[k] && this.gameBoard[k][j][4]) {
              let oldBox = this.gameBoardMap.get([i, j]);
              let newBox = this.gameBoardMap.get([k, j]);
              this.gameBoard[i][j] = null;
              this.gameBoard[k][j] = null

              this.gameBoard[i][j] = [...newBox];


              this.gameBoard[i][j][0].getComponent(Box).setPosition(oldBox[1][0], oldBox[1][1]);
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

  private createTile(position: Vec2, size: number, index: [number, number], colorIndex: number): Node {
    const node = instantiate(this.Box);
    const nodeComponent = node.getComponent(Box);
    node.setPosition(position.x, position.y);
    nodeComponent.setSpriteFrame(this.boxSpriteFrames[colorIndex]);
    nodeComponent.setContentSize(size, size);
    nodeComponent.setIndex2DMatrix(index);
    return node;
  }

  /**
   * Инициализация игрового поля
   * 1. Установка рандомного цвета тайтла.
   * 2. Установка позиции тайтла на игровок поле.
   * 3. Создание матрицы тайтлов аналогично игровому полю.
   */
  private initGameField(layout: Layout) {
    const uiTransportLayout = layout.getComponent(UITransform);
    const cellSize = uiTransportLayout.contentSize.width / this.gameBoardSize - this.BoxGap;
    const layoutBoundingBox = uiTransportLayout.getBoundingBox();

    const startIndex = this.gameBoard.length ? this.gameBoard.length : 0;

    const zeroXPostion = layoutBoundingBox.x + cellSize * 0.5;
    const zeroYPosition = layoutBoundingBox.y + cellSize * 0.5;
    const gap = (layoutBoundingBox.width - this.gameBoardSize * cellSize) / (this.gameBoardSize - 1);

    const rowsLength = this.gameBoard.length + this.gameBoardSize;
    const colLength = this.gameBoardSize

    for (let i = startIndex; i < rowsLength; i++) {
      this.gameBoard.push([]);
      for (let j = 0; j < colLength; j++) {
        let x = zeroXPostion + j * (cellSize + gap);
        let y = (zeroYPosition + i * (cellSize + gap) + (i >= this.gameBoardSize ? BOARDS_GAP : 0)) * -1;

        const colorIndex = Math.floor(Math.random() * BOX_COLOR_TYPE_COUNT);
        const node = this.createTile(new Vec2(x, y), cellSize, [i, j], colorIndex)

        const tile: GameBoardTile = [node, [node.position.x, node.position.y], [i, j], colorIndex, true]

        this.gameBoardMap.set([i, j], tile);
        this.gameBoard[i].push(tile);

        setTimeout(() => {
          layout.node.addChild(node);
        }, 100 * i)
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
