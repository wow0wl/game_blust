import { _decorator, Component, Sprite, SpriteFrame, UITransform, Input, director, Animation, animation, Vec2, AnimationState, AnimationClip } from "cc";
import { Game, type GameBoard, type GameBoardTile, colorMap } from "./Game";

import { BoxAnimation } from "./BoxAnimation";

import { getCopyArrayByVerticalBoundary, getDenormalizedIndex, getNormalizedIndex, getSiblingItem, type IndexInMatrix } from './utils/helpers'

const { ccclass } = _decorator;


@ccclass("Box")
export class Box extends Component {
  public uiTransport: UITransform = null;
  private gameBoard: GameBoard = null;
  private gameBoardMap: Map<[number, number], GameBoardTile> = new Map();
  private originIndex: IndexInMatrix = [0, 0];
  private gameBoardSize: number = 0;
  public boxAnimation: Animation = null;

  protectedstart() { }

  protected onLoad(): void {
    this.node.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);

    this.uiTransport = this.node.getComponent(UITransform);
    this.gameBoard = director.getScene().getChildByName("Canvas").getComponent(Game).gameBoard;
    this.gameBoardMap = director.getScene().getChildByName("Canvas").getComponent(Game).gameBoardMap;
    this.gameBoardSize = this.gameBoard[0].length;

    const boxAnimation = this.node.getComponent(BoxAnimation);
    const { track: scaleAnimationTrack, clip: scaleAnimationClip } = boxAnimation.createBaseAnimation("scaleAnimation", animation.VectorTrack, {
      duration: 1,
      keys: [[0.0, 0.5, 1.0]],
      wrapMode: 2,
    });
    const { track: destroyAnimationTrack, clip: destroyAnimationClip } = boxAnimation.createBaseAnimation("destroyAnimation", animation.VectorTrack, {
      duration: 0.5,
      keys: [[0.0, 0.2, 0.3, 0.4, 0.5]],
      wrapMode: 0,
    });
    const scaleClip = boxAnimation.createVectorAnimation(scaleAnimationTrack, scaleAnimationClip, [
      new Vec2(1.0, 1.0),
      new Vec2(1.05, 1.05),
      new Vec2(1.0, 1.0),
    ], 'scale');

    const destoryClip = boxAnimation.createVectorAnimation(destroyAnimationTrack, destroyAnimationClip, [
      new Vec2(1.0, 1.0),
      new Vec2(1.1, 1.1),
      new Vec2(0.6, 0.6),
      new Vec2(0.3, 0.3),
      new Vec2(0, 0),
    ], 'scale');
    boxAnimation.addAnimationClip(scaleClip);
    boxAnimation.addAnimationClip(destoryClip);

    this.boxAnimation = boxAnimation.getAnimation();
  }

  protected update(deltaTime: number) { }

  protected onDestroy(): void { }

  public setSpriteFrame(spriteFrame: SpriteFrame): void {
    this.node.getComponent(Sprite).spriteFrame = spriteFrame;
  }

  public setContentSize(width: number, height: number) {
    this.node.getComponent(UITransform).setContentSize(width, height);
  }

  public setIndex2DMatrix(originIndex: IndexInMatrix) {
    this.originIndex = originIndex;
  }

  public setPosition(x: number, y: number) {
    const oldPosition = this.node.getPosition().toVec2()
    const boxAnimation = this.node.getComponent(BoxAnimation)
    const boxAnimationComponent = boxAnimation.getAnimation();

    const { track: moveAnimationTrack, clip: moveAnimationClip } = boxAnimation.createBaseAnimation("moveAnimation", animation.VectorTrack, {
      duration: 0.1,
      keys: [[0.0, 0.1]],
      wrapMode: 0,
    });

    const moveClip = boxAnimation.createVectorAnimation(moveAnimationTrack, moveAnimationClip, [
      oldPosition,
      new Vec2(x, y),
    ], 'position');

    boxAnimation.addAnimationClip(moveClip);
    boxAnimationComponent.play("moveAnimation")
    boxAnimationComponent.once(Animation.EventType.FINISHED,
      (type, state) => {
        boxAnimation.removeAnimationClip(moveAnimationClip)
        this.node.setPosition(x, y);
      },
      this)

  }

  public onMouseUp() {
    console.log("MouseUp box");
    console.log("Position: " + this.node.position);
    console.log("Id: " + this.node.uuid);
    console.log("Origin Index: " + this.originIndex);
    console.log("Color: " + colorMap[this.gameBoard[this.originIndex[0]][this.originIndex[1]][3]]);

    const startIndex = this.gameBoard.length > this.gameBoardSize ? this.gameBoard.length - this.gameBoardSize : 0;

    /**
     *Создание упрощенной копии массива с границами текущего поля
     */
    const copyBoard = getCopyArrayByVerticalBoundary(this.gameBoard, startIndex, (item) => {
      if (item) {
        return item[3];
      }
    });

    const destroyedTile = getSiblingItem(copyBoard, getNormalizedIndex(this.originIndex, this.gameBoardSize));
    if (destroyedTile === null) {
      console.log("Нет соседей");
      return;
    }

    let removePromise: Promise<any>[] = [];
    /**
     * Поиск удаляемого тайтла по копии
     */
    for (let i = 0; i < destroyedTile.length; i++) {
      for (let j = 0; j < destroyedTile[i].length; j++) {
        if (copyBoard[i][j] === null) {
          const boxDenormalizedIndex = getDenormalizedIndex([i, j], this.gameBoardSize); // Индексы тайтла в оригинальном игровок поле
          const _this = this;
          this.gameBoard[boxDenormalizedIndex[0]][boxDenormalizedIndex[1]][0].getComponent(Animation).play("destroyAnimation");

          removePromise.push(
            new Promise((resolve, reject) => {
              this.boxAnimation.on(
                Animation.EventType.FINISHED,
                (type, state) => {
                  _this.onDestroyAnimationFinished(type, state, () => {
                    _this.deleteNode(boxDenormalizedIndex);
                    resolve(1);
                  });
                },
                this,
              );
            }),
          );
        }
      }
    }

    Promise.all(removePromise).then(() => {
      director.getScene().getChildByName("Canvas").getComponent(Game).shuffleGameBoard();
      this.gameBoard = director.getScene().getChildByName("Canvas").getComponent(Game).gameBoard;
    });
  }

  private onDestroyAnimationFinished(type: Animation.EventType, state: AnimationState, callback: () => void) {
    callback();
  }

  private deleteNode([rIndex, cIndex]: IndexInMatrix) {
    this.gameBoard[rIndex][cIndex][0].destroy();
    this.gameBoard[rIndex][cIndex][4] = false;
    // this.gameBoard[rIndex][cIndex] = null
  }
}
