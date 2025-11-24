import {
  _decorator,
  Component,
  Node,
  Size,
  Sprite,
  SpriteFrame,
  UITransform,
  Input,
  find,
  director,
  Animation,
  AnimationClip,
  animation,
  Vec2,
  Vec3,
  RealCurve,
  js,
  isValid,
  Label,
  instantiate,
  Color,
} from "cc";
import { Game, type GameBoard, type GameBoardTitle, colorMap } from "./Game";

const { ccclass, property } = _decorator;

type Colors = "blue" | "red" | "green" | "yellow" | "perple";
type ColorsId = 1 | 2 | 3 | 4 | 5;

type Position = [number, number];

const DIRECTIONS = {
  top: [-1, 0],
  bottom: [1, 0],
  left: [0, -1],
  right: [0, 1],
};

@ccclass("Box")
export class Box extends Component {
  public uiTransport: UITransform = null;
  private gameBoard: GameBoard = null;
  private originIndex: Position = [0, 0];
  private gameBoardSize: number = 0;
  public boxAnimation: Animation = null;

  start() {}

  onLoad(): void {
    this.node.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);

    this.uiTransport = this.node.getComponent(UITransform);
    this.gameBoard = director.getScene().getChildByName("Canvas").getComponent(Game).gameBoard;
    this.gameBoardSize = this.gameBoard[0].length;
    this.boxAnimation = this.defineAnimation();

    const boxInBoard = this.getBoxFromBoard(this.originIndex[0], this.originIndex[1]);
  }

  update(deltaTime: number) {}

  protected onDestroy(): void {}

  public setSpriteFrame(spriteFrame: SpriteFrame): void {
    this.node.getComponent(Sprite).spriteFrame = spriteFrame;
  }

  public setContentSize(width: number, height: number) {
    this.node.getComponent(UITransform).setContentSize(width, height);
  }

  public setIndex2DMatrix(originIndex: Position) {
    this.originIndex = originIndex;
  }

  public onMouseUp() {
    console.log("MouseUp box");
    console.log("Position: " + this.node.position);
    console.log("Id: " + this.node.uuid);
    console.log("Origin Index: " + this.originIndex);
    console.log("Color: " + colorMap[this.gameBoard[this.originIndex[0]][this.originIndex[1]][4]]);

    const startIndex = this.gameBoard.length > this.gameBoardSize ? this.gameBoard.length - this.gameBoardSize : 0;

    const copyBoard = getCopyArrayByVerticalBoundary(this.gameBoard, startIndex, (item) => {
      if (item) {
        return item[4];
      }
    }); // Создание упрощенной копии массива с границами текущего поля

    const destroyedTitle = getSiblingTitle(copyBoard, getNormalizedIndex(this.originIndex, this.gameBoardSize));
    if (destroyedTitle === null) {
      console.log("Нет соседей");
      return;
    }

    // Поиск удаляемого тайтла по копии
    for (let i = 0; i < destroyedTitle.length; i++) {
      for (let j = 0; j < destroyedTitle[i].length; j++) {
        if (copyBoard[i][j] === null) {
          const boxDenormalizedIndex = getDenormalizedIndex([i, j], this.gameBoardSize); // Индексы тайтла в оригинальном игровок поле
          this.deleteNode(boxDenormalizedIndex);
        }
      }
    }

    director.getScene().getChildByName("Canvas").getComponent(Game).shuffleGameBoard();
    this.gameBoard = director.getScene().getChildByName("Canvas").getComponent(Game).gameBoard;
  }

  private onMouseDown() {
    console.log("MouseUp box");
    console.log("Position: " + this.node.position);
    console.log("Size: " + this.node.getComponent(UITransform).contentSize);
    console.log("Id: " + this.node.uuid);
    console.log("Id: " + this.originIndex);
  }

  private deleteNode([rIndex, cIndex]: Position) {
    this.gameBoard[rIndex][cIndex][0].destroy();
    this.gameBoard[rIndex][cIndex][5] = false;
    // this.gameBoard[rIndex][cIndex] = null
  }

  private defineAnimation(): Animation {
    const animationClip = new AnimationClip("scaleAnimation");
    const track = new animation.VectorTrack();

    animationClip.duration = 1.0;
    animationClip.wrapMode = 2;
    animationClip.keys = [[0.0, 0.5, 1.0]];

    track.path = new animation.TrackPath().toProperty("scale");

    const [x, y] = track.channels();

    const vec2KeyFrames: [number, Vec2][] = [
      [0.0, new Vec2(1.0, 1.0)],
      [0.5, new Vec2(1.05, 1.05)],
      [1.0, new Vec2(1.0, 1.0)],
    ];

    x.curve.assignSorted(vec2KeyFrames.map(([time, vec2]) => [time, { value: vec2.x }]));
    y.curve.assignSorted(vec2KeyFrames.map(([time, vec2]) => [time, { value: vec2.y }]));
    // x.curve.clear()
    // y.curve.clear()

    animationClip.addTrack(track);

    let animationComponent = this.node.getComponent(Animation);

    if (!animationComponent) {
      animationComponent = this.node.addComponent(Animation);
    }
    animationComponent.addClip(animationClip, animationClip.name);
    // animationComponent.defaultClip = animationClip
    return animationComponent;
  }

  private getBoxFromBoard(i: number, j: number): GameBoardTitle {
    return this.gameBoard[i][j];
  }
}

function getSiblingTitle<T>(board: Array<Array<T>>, position: Position): Array<Array<T>> | null {
  const [rIndex, cIndex] = position;
  const startedTitle = board[rIndex][cIndex];
  const siblings = getSiblingTitleByPosition(board, position, startedTitle);
  if (!siblings.length) {
    return null;
  }
  // markTitle(board, [rIndex, cIndex])
  while (siblings.length) {
    const [rIndex, cIndex] = siblings.shift();
    markTitle(board, [rIndex, cIndex]); // new line
    const newSiblings = getSiblingTitleByPosition(board, [rIndex, cIndex], startedTitle);
    siblings.push(...newSiblings);
  }
  return board;
}

function getSiblingTitleByPosition<T>(board: Array<Array<T>>, position: Position, targetTitle: T): Array<Position> {
  const siblings: Array<Position> = [];
  const [rIndex, cIndex] = position;

  for (let direction in DIRECTIONS) {
    const newRowIndex = rIndex + DIRECTIONS[direction][0];
    const newColumnIndex = cIndex + DIRECTIONS[direction][1];
    const siblingTitle = isValidSibling(board, newRowIndex, newColumnIndex) ? board[newRowIndex][newColumnIndex] : null;

    if (siblingTitle !== null && siblingTitle === targetTitle) {
      siblings.push([newRowIndex, newColumnIndex]);
      // markTitle(board, [newRowIndex, newColumnIndex])
    }
  }

  return siblings;
}

function markTitle(board: Array<Array<unknown>>, [rIndex, cIndex]: Position): void {
  board[rIndex][cIndex] = null;
}

function isValidSibling(board: Array<Array<unknown>>, row: number, col: number): boolean {
  return row >= 0 && row < board.length && col >= 0 && col < board[0].length;
}

function getCopyArrayByVerticalBoundary<T>(originBoard: Array<Array<T>>, startIndex: number, callback: (value: T) => any): Array<Array<number>> {
  const result = [];
  const arrLength = originBoard[0].length;
  for (let i = 0; i < arrLength; i++) {
    result.push([]);
    for (let j = 0; j < arrLength; j++) {
      result[i].push(callback(originBoard[i + startIndex][j]));
    }
  }
  return result;
}

function getNormalizedIndex(index: Position, arrayBoundaryLength: number): Position {
  return index[0] >= arrayBoundaryLength ? [index[0] - arrayBoundaryLength, index[1]] : index;
}
function getDenormalizedIndex(index: Position, arrayBoundaryLength: number): Position {
  return index[0] <= arrayBoundaryLength ? [index[0] + arrayBoundaryLength, index[1]] : index;
}
